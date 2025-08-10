#!/usr/bin/env node

import { io as ioClient } from 'socket.io-client';
import axios from 'axios';

const JARVI_SERVER = 'http://localhost:3001';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
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

async function simulateModifications() {
  log('\n🔄 SIMULANDO MODIFICACIONES DE DATOS', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const socket = ioClient(JARVI_SERVER);
  
  // Esperar conexión
  await new Promise((resolve) => {
    socket.on('connect', () => {
      log('✅ Conectado al servidor WebSocket', 'green');
      resolve();
    });
  });
  
  // 1. MODIFICAR RECORDATORIO (marcar como completado)
  log('\n📝 Simulando completar un recordatorio...', 'yellow');
  socket.emit('reminder-updated', {
    id: 1754725953,
    completed: true,
    updatedAt: new Date().toISOString()
  });
  await delay(500);
  log('✅ Recordatorio marcado como completado', 'green');
  
  // 2. MODIFICAR TAREA TODO (cambiar prioridad y agregar notas)
  log('\n📝 Simulando actualización de tarea...', 'yellow');
  socket.emit('todo-updated', {
    id: 1754726057,
    priority: 'high',
    notes: 'URGENTE: El cliente lo necesita para mañana',
    updatedAt: new Date().toISOString()
  });
  await delay(500);
  log('✅ Tarea actualizada con nueva prioridad', 'green');
  
  // 3. MARCAR INTERÉS COMO LEÍDO
  log('\n📝 Simulando marcar interés como leído...', 'yellow');
  socket.emit('interest-updated', {
    id: 1754726057,
    dateRead: new Date().toISOString(),
    rating: 5,
    notes: 'Excelente artículo, muy útil para el proyecto'
  });
  await delay(500);
  log('✅ Interés marcado como leído con calificación', 'green');
  
  // 4. ELIMINAR UNA NOTA DE VOZ
  log('\n📝 Simulando eliminación de nota de voz...', 'yellow');
  const voiceNotes = await axios.get(`${JARVI_SERVER}/api/voice-notes`);
  if (voiceNotes.data.notes.length > 0) {
    const noteToDelete = voiceNotes.data.notes[voiceNotes.data.notes.length - 1];
    await axios.delete(`${JARVI_SERVER}/api/voice-notes/${noteToDelete.id}`);
    log(`✅ Nota de voz ${noteToDelete.id} eliminada`, 'green');
  }
  
  // 5. AGREGAR MÁS DATOS EN TIEMPO REAL
  log('\n📝 Enviando datos en tiempo real...', 'yellow');
  
  // Enviar múltiples actualizaciones rápidas
  for (let i = 1; i <= 3; i++) {
    socket.emit('telegram-message', {
      id: Date.now() + i,
      content: `Mensaje de prueba #${i} desde simulación`,
      sender: {
        id: 123456,
        name: 'Bot Simulator',
        username: 'simulator'
      },
      timestamp: new Date().toISOString()
    });
    await delay(200);
  }
  log('✅ Mensajes enviados en tiempo real', 'green');
  
  // 6. SIMULAR TRANSCRIPCIÓN COMPLETADA
  log('\n📝 Simulando transcripción completada...', 'yellow');
  socket.emit('transcription-complete', {
    noteId: 1754724817526,
    transcription: 'TRANSCRIPCIÓN ACTUALIZADA: Este es el nuevo texto transcrito con mayor precisión usando un modelo mejorado.'
  });
  await delay(500);
  log('✅ Transcripción actualizada', 'green');
  
  // 7. VERIFICAR CAMBIOS
  log('\n📊 VERIFICANDO MODIFICACIONES', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  // Verificar estadísticas actualizadas
  const stats = await axios.get(`${JARVI_SERVER}/api/stats`);
  log(`\n📈 Estadísticas actualizadas:`, 'blue');
  log(`  - Total notas: ${stats.data.stats.total}`, 'blue');
  log(`  - Transcritas: ${stats.data.stats.transcribed}`, 'blue');
  log(`  - Hoy: ${stats.data.stats.today}`, 'blue');
  
  // Desconectar
  socket.disconnect();
  log('\n✅ Simulación completada exitosamente', 'green');
  
  process.exit(0);
}

// Manejo de errores
process.on('unhandledRejection', (error) => {
  log(`\n❌ ERROR: ${error.message}`, 'red');
  process.exit(1);
});

// Ejecutar simulación
simulateModifications().catch(console.error);