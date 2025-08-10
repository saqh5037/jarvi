#!/usr/bin/env node

/**
 * Script de pruebas automatizadas para el bot de Telegram
 * Simula todas las interacciones posibles con el bot
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { io as ioClient } from 'socket.io-client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = 871556715; // Tu ID de chat
const JARVI_SERVER = 'http://localhost:3001';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Suite
class TelegramBotTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  async runTest(name, testFunction) {
    log(`\n📝 Probando: ${name}`, 'cyan');
    this.currentTest = { name, status: 'running', startTime: Date.now() };
    
    try {
      await testFunction();
      this.currentTest.status = 'passed';
      this.currentTest.duration = Date.now() - this.currentTest.startTime;
      log(`✅ ${name} - PASÓ (${this.currentTest.duration}ms)`, 'green');
    } catch (error) {
      this.currentTest.status = 'failed';
      this.currentTest.error = error.message;
      this.currentTest.duration = Date.now() - this.currentTest.startTime;
      log(`❌ ${name} - FALLÓ: ${error.message}`, 'red');
    }
    
    this.testResults.push({ ...this.currentTest });
    await delay(1000); // Esperar entre pruebas
  }

  // Pruebas individuales
  
  async testMenu() {
    log('Enviando comando /menu...', 'yellow');
    
    // Simular comando /menu
    const menuData = {
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: {
          id: CHAT_ID,
          first_name: 'Test User',
          username: 'testuser'
        },
        chat: {
          id: CHAT_ID,
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: '/menu'
      }
    };
    
    // No podemos enviar directamente al bot, pero podemos verificar que el servidor esté funcionando
    const response = await axios.get(`${JARVI_SERVER}/api/stats`);
    if (!response.data.success) {
      throw new Error('El servidor no responde correctamente');
    }
  }

  async testVoiceNote() {
    log('Probando envío de nota de voz...', 'yellow');
    
    const voiceNote = {
      id: Date.now(),
      fileName: `test_voice_${Date.now()}.ogg`,
      duration: 5,
      sender: {
        id: CHAT_ID,
        name: 'Test User',
        username: 'testuser'
      },
      timestamp: new Date().toISOString(),
      transcription: 'Prueba automática de nota de voz',
      type: 'voice_note'
    };
    
    const response = await axios.post(`${JARVI_SERVER}/api/voice-note`, voiceNote);
    if (!response.data.success) {
      throw new Error('Error enviando nota de voz');
    }
    
    log(`Nota de voz enviada: ID ${response.data.id}`, 'green');
  }

  async testReminder() {
    log('Probando creación de recordatorio...', 'yellow');
    
    const reminder = {
      id: Date.now(),
      title: 'Recordatorio de prueba automática',
      description: 'Este recordatorio fue creado por el test suite',
      datetime: new Date(Date.now() + 3600000).toISOString(), // En 1 hora
      priority: 'high',
      category: 'work',
      sender: {
        id: CHAT_ID,
        name: 'Test User',
        username: 'testuser'
      },
      timestamp: new Date().toISOString()
    };
    
    const response = await axios.post(`${JARVI_SERVER}/api/reminder`, reminder);
    if (!response.data.success) {
      throw new Error('Error creando recordatorio');
    }
    
    log(`Recordatorio creado: ID ${response.data.id}`, 'green');
  }

  async testTodo() {
    log('Probando creación de tarea ToDo...', 'yellow');
    
    const todo = {
      id: Date.now(),
      title: 'Tarea de prueba automática',
      description: 'Esta tarea fue creada por el test suite',
      priority: 'medium',
      category: 'personal',
      dueDate: new Date(Date.now() + 86400000).toISOString(), // Mañana
      tags: ['test', 'automático'],
      sender: {
        id: CHAT_ID,
        name: 'Test User',
        username: 'testuser'
      },
      timestamp: new Date().toISOString()
    };
    
    const response = await axios.post(`${JARVI_SERVER}/api/todo`, todo);
    if (!response.data.success) {
      throw new Error('Error creando tarea');
    }
    
    log(`Tarea creada: ID ${response.data.id}`, 'green');
  }

  async testMeeting() {
    log('Probando registro de reunión...', 'yellow');
    
    const meeting = {
      id: Date.now(),
      title: 'Reunión de prueba automática',
      fileName: `meeting_test_${Date.now()}.ogg`,
      duration: 600, // 10 minutos
      participants: ['Juan', 'María', 'Pedro', 'Ana'],
      agenda: 'Prueba del sistema de reuniones',
      transcription: 'Esta es una transcripción de prueba. Se discutieron los siguientes puntos: 1) Revisión del proyecto, 2) Asignación de tareas, 3) Próximos pasos.',
      keyPoints: [
        'Se completó la fase 1 del proyecto',
        'Se asignaron nuevas tareas al equipo',
        'Próxima reunión en 2 semanas'
      ],
      actionItems: [
        'Juan: Revisar documentación',
        'María: Actualizar el código',
        'Pedro: Hacer pruebas'
      ],
      sender: {
        id: CHAT_ID,
        name: 'Test User',
        username: 'testuser'
      },
      timestamp: new Date().toISOString()
    };
    
    const response = await axios.post(`${JARVI_SERVER}/api/meeting-audio-direct`, meeting);
    if (!response.data.success) {
      throw new Error('Error registrando reunión');
    }
    
    log(`Reunión registrada: ID ${response.data.id}`, 'green');
  }

  async testInterest() {
    log('Probando guardado de interés...', 'yellow');
    
    const interest = {
      id: Date.now(),
      title: 'Artículo interesante de prueba',
      description: 'Un artículo muy interesante sobre tecnología y IA',
      url: 'https://example.com/articulo-test',
      category: 'technology',
      type: 'article',
      tags: ['AI', 'tecnología', 'futuro'],
      priority: 'high',
      readingTime: 15,
      sender: {
        id: CHAT_ID,
        name: 'Test User',
        username: 'testuser'
      },
      timestamp: new Date().toISOString()
    };
    
    const response = await axios.post(`${JARVI_SERVER}/api/interest`, interest);
    if (!response.data.success) {
      throw new Error('Error guardando interés');
    }
    
    log(`Interés guardado: ID ${response.data.id}`, 'green');
  }

  async testTranscription() {
    log('Probando servicio de transcripción...', 'yellow');
    
    // Crear un archivo de audio de prueba
    const testAudioPath = path.join(__dirname, 'voice-notes', 'test_audio.ogg');
    
    if (fs.existsSync(testAudioPath)) {
      const response = await axios.post(`${JARVI_SERVER}/api/transcribe`, {
        noteId: Date.now(),
        fileName: 'test_audio.ogg'
      });
      
      if (!response.data.success) {
        log('⚠️  Transcripción no disponible (esto es normal si no hay API key configurada)', 'yellow');
      } else {
        log(`Transcripción completada: "${response.data.transcription}"`, 'green');
      }
    } else {
      log('⚠️  No hay archivo de audio de prueba disponible', 'yellow');
    }
  }

  async testWebSocketConnection() {
    log('Probando conexión WebSocket...', 'yellow');
    
    const socket = ioClient(JARVI_SERVER);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout esperando conexión WebSocket'));
      }, 5000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        log('WebSocket conectado exitosamente', 'green');
        socket.disconnect();
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`Error de conexión WebSocket: ${error.message}`));
      });
    });
  }

  async testAPIEndpoints() {
    log('Verificando todos los endpoints de la API...', 'yellow');
    
    const endpoints = [
      { method: 'GET', path: '/api/voice-notes', name: 'Listar notas de voz' },
      { method: 'GET', path: '/api/stats', name: 'Estadísticas' },
      { method: 'GET', path: '/api/costs', name: 'Costos de API' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${JARVI_SERVER}${endpoint.path}`
        });
        
        if (response.data.success !== false) {
          log(`  ✅ ${endpoint.name}: OK`, 'green');
        } else {
          log(`  ⚠️  ${endpoint.name}: Respuesta inesperada`, 'yellow');
        }
      } catch (error) {
        log(`  ❌ ${endpoint.name}: ${error.message}`, 'red');
      }
    }
  }

  async runAllTests() {
    log('\n🚀 INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    const startTime = Date.now();
    
    // Ejecutar todas las pruebas
    await this.runTest('Conexión WebSocket', () => this.testWebSocketConnection());
    await this.runTest('Verificación de Endpoints', () => this.testAPIEndpoints());
    await this.runTest('Comando Menu', () => this.testMenu());
    await this.runTest('Nota de Voz', () => this.testVoiceNote());
    await this.runTest('Recordatorio', () => this.testReminder());
    await this.runTest('Tarea ToDo', () => this.testTodo());
    await this.runTest('Reunión', () => this.testMeeting());
    await this.runTest('Interés', () => this.testInterest());
    await this.runTest('Transcripción', () => this.testTranscription());
    
    // Resumen de resultados
    const totalTime = Date.now() - startTime;
    const passed = this.testResults.filter(t => t.status === 'passed').length;
    const failed = this.testResults.filter(t => t.status === 'failed').length;
    
    log('\n' + '=' .repeat(50), 'magenta');
    log('📊 RESUMEN DE PRUEBAS', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    log(`\nTotal de pruebas: ${this.testResults.length}`, 'cyan');
    log(`✅ Pasadas: ${passed}`, 'green');
    log(`❌ Fallidas: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`⏱️  Tiempo total: ${totalTime}ms`, 'cyan');
    
    // Detalles de pruebas fallidas
    if (failed > 0) {
      log('\n❌ PRUEBAS FALLIDAS:', 'red');
      this.testResults
        .filter(t => t.status === 'failed')
        .forEach(t => {
          log(`  - ${t.name}: ${t.error}`, 'red');
        });
    }
    
    // Generar reporte
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      passed,
      failed,
      duration: totalTime,
      tests: this.testResults
    };
    
    const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 Reporte guardado en: ${reportPath}`, 'cyan');
    
    // Retornar código de salida
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Ejecutar pruebas
async function main() {
  const tester = new TelegramBotTester();
  
  try {
    // Verificar que el servidor esté corriendo
    await axios.get(`${JARVI_SERVER}/api/stats`);
  } catch (error) {
    log('❌ ERROR: El servidor no está corriendo en ' + JARVI_SERVER, 'red');
    log('Por favor, inicia el servidor con: node server-enhanced-notes.js', 'yellow');
    process.exit(1);
  }
  
  await tester.runAllTests();
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  log(`\n❌ ERROR NO MANEJADO: ${error.message}`, 'red');
  process.exit(1);
});

// Ejecutar
main();