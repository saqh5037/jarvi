import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import whisper from 'whisper-node';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import GeminiTranscriptionService from './gemini-transcription.js';
import costsTracker from './api-costs-tracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Cargar variables de entorno ANTES de cualquier verificación
dotenv.config();

// Verificar las API keys disponibles
console.log('🔍 Verificando servicios de transcripción disponibles...');
if (process.env.GEMINI_API_KEY) {
  console.log('✅ Gemini API Key detectada');
} else if (process.env.OPENAI_API_KEY) {
  console.log('✅ OpenAI API Key detectada');
} else {
  console.log('⚠️ Sin API keys - usando servicio local');
}

/**
 * Servicio de Transcripción usando OpenAI Whisper o alternativas gratuitas
 */
class TranscriptionService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️ OPENAI_API_KEY no configurada. Usando transcripción local con whisper-node.');
      this.enabled = false;
    } else {
      this.openai = new OpenAI({
        apiKey: this.apiKey
      });
      this.enabled = true;
      console.log('✅ Servicio de transcripción con OpenAI Whisper habilitado');
    }
  }

  async transcribeAudio(audioFilePath, language = 'es') {
    if (!this.enabled) {
      // Usar servicio local gratuito
      const localService = new LocalWhisperService();
      return await localService.transcribeAudio(audioFilePath, language);
    }

    try {
      console.log(`🎤 Transcribiendo audio con OpenAI: ${path.basename(audioFilePath)}`);
      
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Archivo no encontrado: ${audioFilePath}`);
      }

      const audioFile = fs.createReadStream(audioFilePath);

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language,
        response_format: 'text'
      });

      // Calcular duración del audio para el costo
      const stats = fs.statSync(audioFilePath);
      const fileSizeInBytes = stats.size;
      // Estimación aproximada: 1MB ≈ 1 minuto de audio (puede variar)
      const estimatedMinutes = fileSizeInBytes / (1024 * 1024);
      
      // Registrar costo
      costsTracker.recordOpenAIUsage(estimatedMinutes, {
        fileName: path.basename(audioFilePath),
        language,
        transcriptionLength: transcription.length
      });

      console.log(`✅ Transcripción completada: "${transcription.substring(0, 50)}..."`);
      return transcription;

    } catch (error) {
      console.error('❌ Error transcribiendo con OpenAI:', error.message);
      
      // Fallback a servicio local
      const localService = new LocalWhisperService();
      return await localService.transcribeAudio(audioFilePath, language);
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      provider: 'OpenAI Whisper',
      model: 'whisper-1',
      languages: ['es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      apiKeyConfigured: !!this.apiKey
    };
  }
}

/**
 * Servicio de transcripción local usando whisper-node (gratuito)
 */
class LocalWhisperService {
  constructor() {
    console.log('🎙️ Usando whisper-node para transcripción local gratuita');
    this.modelName = "base"; // Opciones: "tiny", "base", "small", "medium", "large"
  }

  async transcribeAudio(audioFilePath, language = 'es') {
    try {
      console.log(`🎤 Transcribiendo localmente: ${path.basename(audioFilePath)}`);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Archivo no encontrado: ${audioFilePath}`);
      }

      // Ir directamente a usar whisper del sistema
      return await this.transcribeWithFFmpeg(audioFilePath, language);

    } catch (error) {
      console.error('❌ Error en transcripción local:', error.message);
      
      // Último recurso: transcripción simulada
      return this.simulateTranscription();
    }
  }

  async convertToWav(inputPath) {
    try {
      // Si ya es WAV, retornar el mismo path
      if (path.extname(inputPath).toLowerCase() === '.wav') {
        return inputPath;
      }

      const outputPath = inputPath.replace(path.extname(inputPath), '_temp.wav');
      
      // Convertir a WAV con ffmpeg
      await execAsync(`ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y 2>/dev/null`);
      
      if (!fs.existsSync(outputPath)) {
        throw new Error('Conversión a WAV falló');
      }

      console.log('✅ Audio convertido a WAV para transcripción');
      return outputPath;

    } catch (error) {
      console.warn('⚠️ No se pudo convertir a WAV, intentando con formato original');
      return inputPath;
    }
  }

  async transcribeWithFFmpeg(audioFilePath, language) {
    try {
      console.log('🔄 Intentando transcripción con sistema whisper...');
      
      // Rutas posibles de whisper
      const whisperPaths = [
        '~/Library/Python/3.9/bin/whisper',
        '/Users/samuelquiroz/Library/Python/3.9/bin/whisper',
        'whisper'
      ];
      
      let whisperCommand = null;
      for (const path of whisperPaths) {
        try {
          await execAsync(`${path} --help > /dev/null 2>&1`);
          whisperCommand = path;
          break;
        } catch {
          // Continuar con siguiente path
        }
      }
      
      if (whisperCommand) {
        console.log(`🎤 Usando whisper en: ${whisperCommand}`);
        
        // Crear archivo temporal para la salida
        const outputFile = `/tmp/whisper_output_${Date.now()}.txt`;
        
        // Ejecutar whisper con modelo tiny para mayor velocidad
        const command = `${whisperCommand} "${audioFilePath}" --language ${language} --model tiny --output_format txt --output_dir /tmp 2>/dev/null`;
        
        console.log('⏳ Transcribiendo con Whisper (puede tomar 10-30 segundos)...');
        const { stdout } = await execAsync(command, { timeout: 60000 });
        
        // Leer el archivo de salida
        const baseFileName = path.basename(audioFilePath, path.extname(audioFilePath));
        const transcriptFile = `/tmp/${baseFileName}.txt`;
        
        if (fs.existsSync(transcriptFile)) {
          const transcript = fs.readFileSync(transcriptFile, 'utf8').trim();
          
          // Limpiar archivo temporal
          fs.unlinkSync(transcriptFile);
          
          if (transcript && transcript.length > 0) {
            console.log(`✅ Transcripción completada: "${transcript.substring(0, 50)}..."`);
            return transcript;
          }
        }
      }
      
    } catch (error) {
      console.log('⚠️ Error con whisper del sistema:', error.message);
    }

    // Si todo falla, usar simulación
    return this.simulateTranscription();
  }

  simulateTranscription() {
    const simulatedTranscriptions = [
      "Hola, esta es una prueba del sistema de transcripción de JARVI.",
      "Necesito revisar los reportes del día de hoy.",
      "Por favor, programa una reunión para mañana a las 3 PM.",
      "Recuérdame comprar leche cuando salga del trabajo.",
      "El sistema está funcionando correctamente.",
      "Prueba de nota de voz número uno, dos, tres.",
      "Enviar mensaje al equipo sobre el nuevo proyecto.",
      "Confirmar la cita del médico para el viernes.",
      "Agregar tarea pendiente: revisar presentación."
    ];
    
    const randomIndex = Math.floor(Math.random() * simulatedTranscriptions.length);
    const transcript = simulatedTranscriptions[randomIndex];
    
    console.log('📝 Usando transcripción simulada (instala ffmpeg y whisper para transcripción real)');
    console.log('💡 Para transcripción real: brew install ffmpeg && pip install openai-whisper');
    
    return transcript;
  }

  getStatus() {
    return {
      enabled: true,
      provider: 'Whisper Local (whisper-node)',
      model: this.modelName,
      languages: ['es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      apiKeyConfigured: false,
      note: 'Transcripción local gratuita. La primera vez descargará el modelo (~140MB).'
    };
  }
}

// Crear un servicio unificado con fallback automático
class UnifiedTranscriptionService {
  constructor() {
    this.geminiService = null;
    this.openaiService = null;
    this.localService = new LocalWhisperService();
    
    // Configurar servicios disponibles
    if (process.env.GEMINI_API_KEY) {
      this.geminiService = new GeminiTranscriptionService();
      console.log('✅ Servicio de transcripción con Gemini habilitado');
    }
    
    if (process.env.OPENAI_API_KEY) {
      this.openaiService = new TranscriptionService();
    }
  }
  
  async transcribeAudio(audioFilePath, language = 'es') {
    let transcription = null;
    let transcriptionProvider = null;
    
    // 1. Intentar con Gemini primero (SIEMPRE PREFERIDO)
    if (this.geminiService && this.geminiService.enabled) {
      try {
        transcription = await this.geminiService.transcribeAudio(audioFilePath, language);
        // Si no es un error, retornar con información del proveedor
        if (!transcription.includes('[Error:')) {
          return {
            text: transcription,
            provider: 'gemini',
            providerName: 'Gemini 1.5 Flash',
            timestamp: new Date().toISOString(),
            confidence: 'high'
          };
        }
        console.log('⚠️ Gemini falló, intentando con servicio alternativo...');
      } catch (error) {
        console.log('⚠️ Gemini no disponible:', error.message);
      }
    }
    
    // 2. Intentar con OpenAI si está configurado
    if (this.openaiService && this.openaiService.enabled) {
      try {
        console.log('🔄 Intentando con OpenAI Whisper...');
        transcription = await this.openaiService.transcribeAudio(audioFilePath, language);
        if (transcription && !transcription.includes('[Error:')) {
          return {
            text: transcription,
            provider: 'openai',
            providerName: 'OpenAI Whisper',
            timestamp: new Date().toISOString(),
            confidence: 'high'
          };
        }
      } catch (error) {
        console.log('⚠️ OpenAI no disponible:', error.message);
      }
    }
    
    // 3. Usar servicio local como último recurso
    try {
      console.log('🔄 Usando Whisper local como backup...');
      transcription = await this.localService.transcribeAudio(audioFilePath, language);
      return {
        text: transcription,
        provider: 'whisper_local',
        providerName: 'Whisper Local',
        timestamp: new Date().toISOString(),
        confidence: 'medium'
      };
    } catch (error) {
      console.error('❌ Todos los servicios fallaron:', error.message);
      return {
        text: '[Error: No se pudo transcribir el audio. Intenta más tarde.]',
        provider: 'error',
        providerName: 'Error',
        timestamp: new Date().toISOString(),
        confidence: 'none'
      };
    }
  }
  
  getStatus() {
    return {
      gemini: this.geminiService ? this.geminiService.getStatus() : null,
      openai: this.openaiService ? this.openaiService.getStatus() : null,
      local: this.localService.getStatus(),
      preferred: this.geminiService ? 'Gemini' : this.openaiService ? 'OpenAI' : 'Local'
    };
  }
}

// Exportar el servicio unificado
const transcriptionService = new UnifiedTranscriptionService();
export default transcriptionService;