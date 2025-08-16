/**
 * Servidor Edge TTS - Sistema de Text-to-Speech con voces neurales de Microsoft
 * Proporciona conversión de texto a voz usando Edge TTS (gratuito)
 * 
 * @module server-edge-tts
 * @requires express
 * @requires edge-tts
 */

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsOptions } from './cors-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3007;
const execAsync = promisify(exec);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Directorio temporal para archivos de audio
const TEMP_DIR = path.join(__dirname, 'temp', 'tts');

// Crear directorio temporal si no existe
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creando directorio temporal:', error);
  }
}

// Voces disponibles en Edge TTS (español)
const SPANISH_VOICES = [
  { id: 'es-ES-AlvaroNeural', name: 'Álvaro', gender: 'Male', locale: 'es-ES' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'Female', locale: 'es-ES' },
  { id: 'es-MX-DaliaNeural', name: 'Dalia', gender: 'Female', locale: 'es-MX' },
  { id: 'es-MX-JorgeNeural', name: 'Jorge', gender: 'Male', locale: 'es-MX' },
  { id: 'es-AR-ElenaNeural', name: 'Elena', gender: 'Female', locale: 'es-AR' },
  { id: 'es-AR-TomasNeural', name: 'Tomás', gender: 'Male', locale: 'es-AR' },
  { id: 'es-CO-GonzaloNeural', name: 'Gonzalo', gender: 'Male', locale: 'es-CO' },
  { id: 'es-CO-SalomeNeural', name: 'Salomé', gender: 'Female', locale: 'es-CO' }
];

// Endpoint para obtener voces disponibles
app.get('/api/voices', async (req, res) => {
  try {
    // Ejecutar comando edge-tts para obtener voces
    const { stdout } = await execAsync('/Users/samuelquiroz/Library/Python/3.9/bin/edge-tts --list-voices');
    
    // Parsear salida y filtrar voces en español
    const voices = stdout
      .split('\n')
      .filter(line => line.includes('es-'))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          id: parts[0],
          name: parts[1] || parts[0],
          locale: parts[0].split('-').slice(0, 2).join('-')
        };
      })
      .filter(v => v.id);
    
    res.json({
      success: true,
      voices: voices.length > 0 ? voices : SPANISH_VOICES
    });
  } catch (error) {
    // Si falla, devolver lista predefinida
    res.json({
      success: true,
      voices: SPANISH_VOICES
    });
  }
});

// Endpoint principal para síntesis de voz
app.post('/api/synthesize', async (req, res) => {
  try {
    const { 
      text, 
      voice = 'es-ES-AlvaroNeural',
      rate = '+0%',
      pitch = '+0Hz',
      volume = '+0%',
      format = 'mp3'
    } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere texto para sintetizar' 
      });
    }
    
    // Generar nombre de archivo único
    const timestamp = Date.now();
    const outputFile = path.join(TEMP_DIR, `speech_${timestamp}.${format}`);
    
    // Construir comando edge-tts
    const command = `/Users/samuelquiroz/Library/Python/3.9/bin/edge-tts --voice "${voice}" --rate="${rate}" --pitch="${pitch}" --volume="${volume}" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputFile}"`;
    
    // Log para debugging
    console.log('Sintetizando con voz:', voice);
    
    // Ejecutar síntesis
    await execAsync(command);
    
    // Leer archivo generado
    const audioBuffer = await fs.readFile(outputFile);
    
    // Eliminar archivo temporal
    fs.unlink(outputFile).catch(err => console.error('Error eliminando temporal:', err));
    
    // Enviar audio como respuesta
    res.set({
      'Content-Type': `audio/${format === 'mp3' ? 'mpeg' : 'wav'}`,
      'Content-Length': audioBuffer.length
    });
    
    res.send(audioBuffer);
    
  } catch (error) {
    console.error('Error en síntesis de voz:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al sintetizar voz',
      details: error.message 
    });
  }
});

// Endpoint para síntesis con SSML (Speech Synthesis Markup Language)
app.post('/api/synthesize-ssml', async (req, res) => {
  try {
    const { 
      ssml, 
      voice = 'es-ES-AlvaroNeural',
      format = 'mp3'
    } = req.body;
    
    if (!ssml) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere SSML para sintetizar' 
      });
    }
    
    // Generar nombre de archivo único
    const timestamp = Date.now();
    const ssmlFile = path.join(TEMP_DIR, `ssml_${timestamp}.xml`);
    const outputFile = path.join(TEMP_DIR, `speech_${timestamp}.${format}`);
    
    // Guardar SSML en archivo temporal
    await fs.writeFile(ssmlFile, ssml);
    
    // Construir comando edge-tts con SSML
    const command = `/Users/samuelquiroz/Library/Python/3.9/bin/edge-tts --voice "${voice}" --write-media "${outputFile}" < "${ssmlFile}"`;
    
    // Ejecutar síntesis
    await execAsync(command, { shell: true });
    
    // Leer archivo generado
    const audioBuffer = await fs.readFile(outputFile);
    
    // Eliminar archivos temporales
    fs.unlink(ssmlFile).catch(err => console.error('Error eliminando SSML:', err));
    fs.unlink(outputFile).catch(err => console.error('Error eliminando audio:', err));
    
    // Enviar audio como respuesta
    res.set({
      'Content-Type': `audio/${format === 'mp3' ? 'mpeg' : 'wav'}`,
      'Content-Length': audioBuffer.length
    });
    
    res.send(audioBuffer);
    
  } catch (error) {
    console.error('Error en síntesis SSML:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al sintetizar voz con SSML',
      details: error.message 
    });
  }
});

// Endpoint para generar audio y devolver URL
app.post('/api/synthesize-url', async (req, res) => {
  try {
    const { 
      text, 
      voice = 'es-ES-AlvaroNeural',
      rate = '+0%',
      pitch = '+0Hz',
      volume = '+0%'
    } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere texto para sintetizar' 
      });
    }
    
    // Generar nombre de archivo único
    const timestamp = Date.now();
    const filename = `speech_${timestamp}.mp3`;
    const outputFile = path.join(TEMP_DIR, filename);
    
    // Construir comando edge-tts
    const command = `/Users/samuelquiroz/Library/Python/3.9/bin/edge-tts --voice "${voice}" --rate="${rate}" --pitch="${pitch}" --volume="${volume}" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputFile}"`;
    
    // Log para debugging
    console.log('Sintetizando con voz:', voice);
    
    // Ejecutar síntesis
    await execAsync(command);
    
    // Devolver URL del archivo
    res.json({
      success: true,
      url: `/api/audio/${filename}`,
      filename: filename
    });
    
    // Eliminar archivo después de 5 minutos
    setTimeout(() => {
      fs.unlink(outputFile).catch(err => console.error('Error eliminando temporal:', err));
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('Error en síntesis de voz:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al sintetizar voz',
      details: error.message 
    });
  }
});

// Servir archivos de audio temporales
app.get('/api/audio/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(TEMP_DIR, filename);
    
    // Verificar que el archivo existe
    await fs.access(filepath);
    
    // Enviar archivo
    res.sendFile(filepath);
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: 'Archivo no encontrado' 
    });
  }
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'edge-tts',
    port: PORT 
  });
});

// Inicializar servidor
async function initialize() {
  await ensureTempDir();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════╗
║     JARVI Edge TTS Service                ║
║     Voces Premium Microsoft Gratuitas     ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                             ║
║  Estado: Activo                           ║
║                                            ║
║  Características:                          ║
║  • Voces neurales de alta calidad         ║
║  • Soporte para SSML                      ║
║  • Control de velocidad, tono y volumen   ║
║  • 8+ voces en español                    ║
║  • Sin límites de uso                     ║
║  • Completamente gratuito                 ║
╚════════════════════════════════════════════╝
    `);
  });
}

initialize();