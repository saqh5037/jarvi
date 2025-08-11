import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import costsTracker from './api-costs-tracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Cargar variables de entorno
dotenv.config();

/**
 * Servicio de Transcripción usando Google Gemini
 * Gemini 1.5 Flash es gratuito hasta 15 RPM / 1 millón TPM / 1500 RPD
 */
class GeminiTranscriptionService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY no configurada.');
      console.warn('Para obtener una API key gratuita:');
      console.warn('1. Ve a https://makersuite.google.com/app/apikey');
      console.warn('2. Crea una API key');
      console.warn('3. Añade GEMINI_API_KEY=tu_key al archivo .env');
      this.enabled = false;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });
      this.enabled = true;
      console.log('✅ Servicio de transcripción con Gemini habilitado');
    }
  }

  /**
   * Convierte audio OGG a formato compatible (MP3/WAV)
   */
  async convertAudio(inputPath) {
    try {
      const outputPath = inputPath.replace(path.extname(inputPath), '.mp3');
      
      // Verificar si ffmpeg está instalado
      try {
        await execAsync('which ffmpeg');
      } catch {
        console.error('❌ ffmpeg no está instalado. Instálalo con: brew install ffmpeg');
        return null;
      }
      
      // Convertir a MP3
      const command = `ffmpeg -i "${inputPath}" -acodec libmp3lame -ar 44100 -ab 128k "${outputPath}" -y 2>/dev/null`;
      await execAsync(command);
      
      if (!fs.existsSync(outputPath)) {
        throw new Error('Conversión de audio falló');
      }
      
      console.log('✅ Audio convertido a MP3 para Gemini');
      return outputPath;
      
    } catch (error) {
      console.error('Error convirtiendo audio:', error.message);
      return null;
    }
  }

  /**
   * Transcribe audio usando Gemini 1.5 Flash con reintentos
   */
  async transcribeAudio(audioFilePath, language = 'es', retryCount = 0) {
    if (!this.enabled) {
      console.log('⚠️ Gemini no configurado - usando transcripción de respaldo');
      return this.fallbackTranscription();
    }

    try {
      console.log(`🎤 Transcribiendo con Gemini: ${path.basename(audioFilePath)}`);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Archivo no encontrado: ${audioFilePath}`);
      }

      // Convertir audio a formato compatible
      const mp3Path = await this.convertAudio(audioFilePath);
      if (!mp3Path) {
        throw new Error('No se pudo convertir el audio');
      }

      // Leer el archivo de audio
      const audioData = fs.readFileSync(mp3Path);
      const base64Audio = audioData.toString('base64');
      
      // Preparar el prompt para Gemini
      const prompt = `Transcribe exactamente el siguiente audio en ${language === 'es' ? 'español' : 'el idioma detectado'}. 
Solo devuelve la transcripción del texto hablado, sin añadir comentarios, explicaciones o formato adicional.
Si no hay audio claro o no se puede transcribir, responde con "Audio no claro".`;

      // Enviar a Gemini para transcripción
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: base64Audio
          }
        }
      ]);

      const response = await result.response;
      const transcription = response.text().trim();
      
      // Estimar tokens usados (aproximadamente)
      const estimatedTokens = Math.max(prompt.length + transcription.length, 100);
      
      // Registrar uso de Gemini
      costsTracker.recordGeminiUsage(estimatedTokens, {
        fileName: path.basename(audioFilePath),
        language,
        transcriptionLength: transcription.length
      });
      
      // Limpiar archivo temporal
      if (fs.existsSync(mp3Path) && mp3Path !== audioFilePath) {
        fs.unlinkSync(mp3Path);
      }
      
      console.log(`✅ Transcripción Gemini completada: "${transcription.substring(0, 50)}..."`);
      return transcription;

    } catch (error) {
      console.error('❌ Error transcribiendo con Gemini:', error);
      
      // Si es error 503 (servicio sobrecargado) y no hemos reintentado mucho
      if (error.message && error.message.includes('503') && retryCount < 3) {
        console.log(`⏳ Reintentando transcripción en 2 segundos... (intento ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.transcribeAudio(audioFilePath, language, retryCount + 1);
      }
      
      if (error.message && error.message.includes('API key')) {
        console.error('Verifica tu GEMINI_API_KEY en el archivo .env');
      }
      
      if (error.message && error.message.includes('quota')) {
        console.error('Has excedido tu cuota gratuita de Gemini (15 RPM)');
      }
      
      return this.fallbackTranscription();
    }
  }

  /**
   * Transcripción de respaldo cuando Gemini no está disponible
   */
  fallbackTranscription() {
    console.log('⚠️ Transcripción no disponible - Gemini temporalmente sobrecargado');
    return "[Error: No se pudo transcribir el audio. El servicio de Gemini está temporalmente sobrecargado. Por favor, intenta nuevamente en unos momentos.]";
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus() {
    return {
      enabled: this.enabled,
      provider: 'Google Gemini 1.5 Flash',
      model: 'gemini-1.5-flash',
      languages: ['es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      apiKeyConfigured: !!this.apiKey,
      limits: {
        rpm: '15 requests per minute',
        tpm: '1 million tokens per minute',
        rpd: '1500 requests per day'
      },
      note: this.enabled 
        ? 'Transcripción con Gemini activa (gratuita hasta límites)' 
        : 'Configura GEMINI_API_KEY para transcripción real'
    };
  }
}

export default GeminiTranscriptionService;