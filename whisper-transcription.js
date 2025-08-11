import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

/**
 * Servicio de Transcripción usando Whisper Local
 * Requiere: pip install openai-whisper
 */
class WhisperTranscriptionService {
  constructor() {
    this.whisperPath = null;
    this.enabled = false;
    this.checkWhisperInstallation();
  }

  /**
   * Verifica si Whisper está instalado
   */
  async checkWhisperInstallation() {
    try {
      // Buscar whisper en diferentes ubicaciones
      const possiblePaths = [
        'whisper',
        '/usr/local/bin/whisper',
        '/opt/homebrew/bin/whisper',
        `${process.env.HOME}/.local/bin/whisper`,
        `${process.env.HOME}/Library/Python/3.9/bin/whisper`,
        `${process.env.HOME}/Library/Python/3.10/bin/whisper`,
        `${process.env.HOME}/Library/Python/3.11/bin/whisper`,
        `${process.env.HOME}/Library/Python/3.12/bin/whisper`
      ];

      for (const path of possiblePaths) {
        try {
          await execAsync(`${path} --help`);
          this.whisperPath = path;
          this.enabled = true;
          console.log(`✅ Whisper local encontrado en: ${path}`);
          return;
        } catch (e) {
          // Continuar buscando
        }
      }

      if (!this.enabled) {
        console.log('⚠️ Whisper no está instalado. Para instalarlo:');
        console.log('1. pip install openai-whisper');
        console.log('2. brew install ffmpeg (si no lo tienes)');
      }
    } catch (error) {
      console.error('Error verificando Whisper:', error.message);
    }
  }

  /**
   * Transcribe audio usando Whisper local
   */
  async transcribeAudio(audioFilePath, language = 'es') {
    if (!this.enabled) {
      throw new Error('Whisper no está instalado');
    }

    try {
      console.log(`🎙️ Transcribiendo con Whisper local: ${path.basename(audioFilePath)}`);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Archivo no encontrado: ${audioFilePath}`);
      }

      // Comando de Whisper
      // --model tiny es el más rápido (39MB)
      // Otros modelos: base (74MB), small (244MB), medium (769MB), large (1550MB)
      const command = `${this.whisperPath} "${audioFilePath}" --model tiny --language ${language} --output_format txt --output_dir /tmp`;
      
      console.log('⏳ Procesando audio con Whisper (puede tomar 10-30 segundos)...');
      const { stdout, stderr } = await execAsync(command);
      
      // Leer el archivo de transcripción generado
      const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
      const transcriptionFile = `/tmp/${baseName}.txt`;
      
      if (fs.existsSync(transcriptionFile)) {
        const transcription = fs.readFileSync(transcriptionFile, 'utf8').trim();
        
        // Limpiar archivo temporal
        fs.unlinkSync(transcriptionFile);
        
        console.log(`✅ Transcripción Whisper completada: "${transcription.substring(0, 50)}..."`);
        return transcription;
      } else {
        throw new Error('No se generó archivo de transcripción');
      }

    } catch (error) {
      console.error('❌ Error con Whisper local:', error.message);
      throw error;
    }
  }

  /**
   * Instala Whisper automáticamente
   */
  async installWhisper() {
    try {
      console.log('📦 Instalando Whisper...');
      console.log('Esto puede tomar varios minutos la primera vez...');
      
      // Verificar pip
      await execAsync('pip --version');
      
      // Instalar whisper
      const { stdout, stderr } = await execAsync('pip install openai-whisper', {
        timeout: 300000 // 5 minutos timeout
      });
      
      console.log('✅ Whisper instalado exitosamente');
      await this.checkWhisperInstallation();
      return true;
    } catch (error) {
      console.error('❌ Error instalando Whisper:', error.message);
      console.log('Instálalo manualmente con: pip install openai-whisper');
      return false;
    }
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus() {
    return {
      enabled: this.enabled,
      provider: 'OpenAI Whisper (Local)',
      model: 'whisper-tiny',
      languages: ['es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      whisperPath: this.whisperPath,
      note: this.enabled 
        ? 'Whisper local activo (procesamiento offline)' 
        : 'Instala con: pip install openai-whisper'
    };
  }
}

export default WhisperTranscriptionService;