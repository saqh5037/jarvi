import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import costsTracker from './api-costs-tracker.js';
import emailService from './email-service.js';
import { corsOptions } from './cors-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());
app.use('/voice-notes', express.static('voice-notes'));

// Ruta específica para servir archivos .txt de transcripciones
app.get('/voice-notes/:filename.txt', (req, res) => {
  const fileName = req.params.filename + '.txt';
  const filePath = path.join(voiceNotesDir, fileName);
  
  console.log(`📄 Solicitando archivo .txt: ${fileName}`);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(path.resolve(filePath));
  } else {
    console.log(`❌ Archivo no encontrado: ${filePath}`);
    res.status(404).send('Archivo de transcripción no encontrado');
  }
});

// Directorios para almacenar todos los datos
const voiceNotesDir = path.join(__dirname, 'voice-notes');
const dataDir = path.join(__dirname, 'data');
const remindersDir = path.join(dataDir, 'reminders');
const todosDir = path.join(dataDir, 'todos');
const meetingsDir = path.join(dataDir, 'meetings');
const interestsDir = path.join(dataDir, 'interests');

// Crear todos los directorios necesarios
[voiceNotesDir, dataDir, remindersDir, todosDir, meetingsDir, interestsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// REST API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    system: 'JARVI Enhanced',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Obtener todas las notas de voz
app.get('/api/voice-notes', (req, res) => {
  try {
    const files = fs.readdirSync(voiceNotesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = fs.readFileSync(path.join(voiceNotesDir, file), 'utf8');
        return JSON.parse(data);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ success: true, notes: files });
  } catch (error) {
    console.error('Error leyendo notas de voz:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recibir nota de voz de Telegram
app.post('/api/voice-note', (req, res) => {
  const voiceNote = req.body;
  
  // Emitir a todos los clientes conectados
  io.emit('new-voice-note', voiceNote);
  
  console.log(`🎙️ Nueva nota de voz recibida: ${voiceNote.fileName}`);
  
  res.json({ 
    success: true, 
    message: 'Nota de voz recibida',
    id: voiceNote.id 
  });
});

// Transcribir una nota específica
app.post('/api/transcribe', async (req, res) => {
  try {
    const { noteId, fileName } = req.body;
    const filePath = path.join(voiceNotesDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
    }
    
    console.log(`🎙️ Transcribiendo archivo: ${fileName}`);
    
    // Emitir progreso de transcripción
    io.emit('transcription-progress', { 
      noteId, 
      progress: 10, 
      tokens: 0,
      status: 'Conectando con Gemini AI...'
    });
    
    let transcription = '';
    let tokens = 0;
    let cost = 0;
    
    try {
      // Importar el servicio de transcripción
      const { default: transcriptionService } = await import('./transcription-service.js');
      
      io.emit('transcription-progress', { 
        noteId, 
        progress: 30, 
        tokens: 0,
        status: 'Procesando audio con Gemini...'
      });
      
      // Transcribir con Gemini
      transcription = await transcriptionService.transcribeAudio(filePath, 'es');
      
      io.emit('transcription-progress', { 
        noteId, 
        progress: 90, 
        tokens: 0,
        status: 'Finalizando transcripción...'
      });
      
      // Calcular tokens y costo aproximados
      tokens = Math.ceil(transcription.length / 4);
      cost = tokens * 0.00001;
      
      console.log(`✅ Transcripción completada con Gemini: ${transcription.substring(0, 50)}...`);
      
    } catch (error) {
      console.log('⚠️ Error con Gemini, usando transcripción de respaldo');
      
      // Si falla Gemini, usar transcripción de respaldo
      const backupTranscriptions = [
        "No se pudo transcribir el audio con Gemini. Por favor, verifica la configuración.",
        "Error al procesar el audio. Intenta nuevamente más tarde.",
        "Transcripción temporal: El audio fue recibido correctamente."
      ];
      
      transcription = backupTranscriptions[0] + ` (Error: ${error.message})`;
      tokens = Math.ceil(transcription.length / 4);
      cost = 0;
    }
    
    
    // Actualizar el archivo JSON de la nota
    const jsonPath = path.join(voiceNotesDir, `${fileName}.json`);
    if (fs.existsSync(jsonPath)) {
      const noteData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      noteData.transcription = transcription;
      noteData.tokens = tokens;
      noteData.cost = cost;
      noteData.transcribedAt = new Date().toISOString();
      fs.writeFileSync(jsonPath, JSON.stringify(noteData, null, 2));
    }
    
    // Crear archivo .txt con la transcripción
    const txtPath = path.join(voiceNotesDir, `${fileName}.txt`);
    const txtContent = `TRANSCRIPCIÓN DE NOTA DE VOZ
=============================
Archivo: ${fileName}
Fecha: ${new Date().toLocaleString()}
Tokens: ${tokens}
Costo: $${cost.toFixed(4)}
=============================

${transcription}
`;
    fs.writeFileSync(txtPath, txtContent, 'utf8');
    console.log(`📝 Archivo de transcripción creado: ${txtPath}`);
    
    // Emitir evento de transcripción completada con tokens y costo
    io.emit('transcription-complete', { 
      noteId, 
      transcription,
      tokens,
      cost
    });
    
    console.log(`✅ Transcripción completada: ${noteId} - ${tokens} tokens - $${cost.toFixed(4)}`);
    
    res.json({ 
      success: true, 
      transcription,
      tokens,
      cost
    });
  } catch (error) {
    console.error('Error transcribiendo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar una nota de voz
app.delete('/api/voice-notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar y eliminar los archivos
    const files = fs.readdirSync(voiceNotesDir);
    const audioFile = files.find(f => f.includes(id) && (f.endsWith('.ogg') || f.endsWith('.mp3')));
    const jsonFile = files.find(f => f.includes(id) && f.endsWith('.json'));
    
    if (audioFile) {
      fs.unlinkSync(path.join(voiceNotesDir, audioFile));
      console.log(`🗑️ Audio eliminado: ${audioFile}`);
    }
    if (jsonFile) {
      fs.unlinkSync(path.join(voiceNotesDir, jsonFile));
      console.log(`🗑️ Metadata eliminada: ${jsonFile}`);
    }
    
    // Emitir evento de eliminación
    io.emit('voice-note-deleted', { id });
    
    res.json({ success: true, message: 'Nota eliminada' });
  } catch (error) {
    console.error('Error eliminando nota:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar categoría de una nota
app.patch('/api/voice-notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { category, subcategory } = req.body;
    
    // Buscar el archivo JSON
    const files = fs.readdirSync(voiceNotesDir);
    const jsonFile = files.find(f => f.includes(id) && f.endsWith('.json'));
    
    if (!jsonFile) {
      return res.status(404).json({ success: false, error: 'Nota no encontrada' });
    }
    
    const jsonPath = path.join(voiceNotesDir, jsonFile);
    const noteData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Actualizar categorías
    noteData.category = category;
    noteData.subcategory = subcategory;
    noteData.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(jsonPath, JSON.stringify(noteData, null, 2));
    
    // Emitir evento de actualización
    io.emit('voice-note-updated', { 
      id, 
      category, 
      subcategory 
    });
    
    console.log(`📝 Nota ${id} categorizada como: ${category}${subcategory ? `/${subcategory}` : ''}`);
    
    res.json({ success: true, message: 'Categoría actualizada' });
  } catch (error) {
    console.error('Error actualizando nota:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para recibir mensajes de texto de Telegram
app.post('/api/telegram-message', (req, res) => {
  const message = req.body;
  
  // Emitir a todos los clientes conectados
  io.emit('telegram-message', message);
  
  console.log(`📝 Mensaje de Telegram: ${message.content}`);
  
  res.json({ 
    success: true, 
    message: 'Mensaje recibido' 
  });
});

// Endpoint para recibir audios largos de reuniones de Telegram
app.post('/api/meeting-audio', (req, res) => {
  const meetingAudio = req.body;
  
  // Emitir a todos los clientes conectados
  io.emit('new-meeting-audio', meetingAudio);
  
  console.log(`🎤 Audio de reunión recibido: ${meetingAudio.fileName}`);
  
  res.json({ 
    success: true, 
    message: 'Audio de reunión recibido',
    id: meetingAudio.id 
  });
});

// Estadísticas
app.get('/api/stats', (req, res) => {
  try {
    const files = fs.readdirSync(voiceNotesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = fs.readFileSync(path.join(voiceNotesDir, file), 'utf8');
        return JSON.parse(data);
      });
    
    const stats = {
      total: files.length,
      transcribed: files.filter(n => n.transcription).length,
      categorized: files.filter(n => n.category).length,
      today: files.filter(n => {
        const date = new Date(n.timestamp);
        const now = new Date();
        return now - date < 86400000;
      }).length,
      categories: {}
    };
    
    // Contar por categorías
    files.forEach(note => {
      if (note.category) {
        stats.categories[note.category] = (stats.categories[note.category] || 0) + 1;
      }
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todos los recordatorios
app.get('/api/reminders', (req, res) => {
  try {
    const files = fs.readdirSync(remindersDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = fs.readFileSync(path.join(remindersDir, file), 'utf8');
        return JSON.parse(data);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ success: true, reminders: files, total: files.length });
  } catch (error) {
    res.json({ success: true, reminders: [], total: 0 });
  }
});

// Obtener todas las tareas
app.get('/api/todos', (req, res) => {
  try {
    const files = fs.readdirSync(todosDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = fs.readFileSync(path.join(todosDir, file), 'utf8');
        return JSON.parse(data);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ success: true, todos: files, total: files.length });
  } catch (error) {
    res.json({ success: true, todos: [], total: 0 });
  }
});

// Obtener todas las reuniones
app.get('/api/meetings', (req, res) => {
  try {
    const files = fs.readdirSync(meetingsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = fs.readFileSync(path.join(meetingsDir, file), 'utf8');
        return JSON.parse(data);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ success: true, meetings: files, total: files.length });
  } catch (error) {
    res.json({ success: true, meetings: [], total: 0 });
  }
});

// Obtener todos los intereses
app.get('/api/interests', (req, res) => {
  try {
    const files = fs.readdirSync(interestsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = fs.readFileSync(path.join(interestsDir, file), 'utf8');
        return JSON.parse(data);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ success: true, interests: files, total: files.length });
  } catch (error) {
    res.json({ success: true, interests: [], total: 0 });
  }
});

// Endpoint para costos de APIs
app.get('/api/costs', (req, res) => {
  try {
    const costStats = costsTracker.getCostStats();
    const weeklyCosts = costsTracker.getWeeklyCosts();
    
    res.json({ 
      success: true, 
      costs: costStats,
      weekly: weeklyCosts
    });
  } catch (error) {
    console.error('Error obteniendo costos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para resetear costos (solo para testing)
app.post('/api/costs/reset', (req, res) => {
  try {
    costsTracker.resetMonthlyCounters();
    res.json({ success: true, message: 'Costos reiniciados' });
  } catch (error) {
    console.error('Error reiniciando costos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoints para Recordatorios
app.post('/api/reminder', (req, res) => {
  const reminder = req.body;
  
  // Guardar en archivo JSON
  const reminderFile = path.join(remindersDir, `reminder_${reminder.id}.json`);
  fs.writeFileSync(reminderFile, JSON.stringify(reminder, null, 2));
  
  // Emitir a todos los clientes conectados
  io.emit('new-reminder', reminder);
  
  console.log(`⏰ Recordatorio guardado: ${reminder.title || reminder.content}`);
  
  res.json({ 
    success: true, 
    message: 'Recordatorio recibido y guardado',
    id: reminder.id,
    saved: true
  });
});

// Endpoints para ToDo
app.post('/api/todo', (req, res) => {
  const todo = req.body;
  
  // Guardar en archivo JSON
  const todoFile = path.join(todosDir, `todo_${todo.id}.json`);
  fs.writeFileSync(todoFile, JSON.stringify(todo, null, 2));
  
  // Emitir a todos los clientes conectados
  io.emit('new-todo', todo);
  
  console.log(`✅ Tarea guardada: ${todo.title}`);
  
  res.json({ 
    success: true, 
    message: 'Tarea recibida y guardada',
    id: todo.id,
    saved: true
  });
});

// Endpoints para Intereses
app.post('/api/interest', (req, res) => {
  const interest = req.body;
  
  // Guardar en archivo JSON
  const interestFile = path.join(interestsDir, `interest_${interest.id}.json`);
  fs.writeFileSync(interestFile, JSON.stringify(interest, null, 2));
  
  // Emitir a todos los clientes conectados
  io.emit('new-interest', interest);
  
  console.log(`🔖 Interés guardado: ${interest.title}`);
  
  res.json({ 
    success: true, 
    message: 'Interés recibido y guardado',
    id: interest.id,
    saved: true
  });
});

// Endpoint para procesar audios de reunión directamente
app.post('/api/meeting-audio-direct', (req, res) => {
  const meetingAudio = req.body;
  
  // Guardar en archivo JSON
  const meetingFile = path.join(meetingsDir, `meeting_${meetingAudio.id}.json`);
  fs.writeFileSync(meetingFile, JSON.stringify(meetingAudio, null, 2));
  
  // Emitir a todos los clientes conectados
  io.emit('new-meeting-audio', meetingAudio);
  
  console.log(`🎤 Reunión guardada: ${meetingAudio.fileName || meetingAudio.title}`);
  
  res.json({ 
    success: true, 
    message: 'Audio de reunión procesado y guardado',
    id: meetingAudio.id,
    saved: true
  });
});

// Endpoint para enviar minuta por email
app.post('/api/send-meeting-email', async (req, res) => {
  try {
    const { meetingId, recipients, meetingData } = req.body;
    
    if (!recipients || !meetingData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan recipients o meetingData' 
      });
    }

    const result = await emailService.sendMeetingMinutes(meetingData, recipients);
    
    console.log(`📧 Minuta enviada para reunión ${meetingId}`);
    
    res.json({
      success: true,
      message: 'Minuta enviada por email exitosamente',
      messageId: result.messageId,
      recipients: result.recipients
    });

  } catch (error) {
    console.error('Error enviando minuta por email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint para probar configuración de email
app.post('/api/test-email', async (req, res) => {
  try {
    await emailService.sendTestEmail();
    res.json({
      success: true,
      message: 'Email de prueba enviado exitosamente'
    });
  } catch (error) {
    console.error('Error enviando email de prueba:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     JARVI - SISTEMA MEJORADO DE NOTAS         ║
╠════════════════════════════════════════════════╣
║                                                ║
║  🌐 Puerto: ${PORT}                              ║
║  🔗 URL: http://localhost:${PORT}                ║
║  📡 WebSocket: ws://localhost:${PORT}            ║
║                                                ║
║  ✅ Sistema listo con funciones mejoradas     ║
║                                                ║
║  CARACTERÍSTICAS:                              ║
║  • Transcripción bajo demanda                 ║
║  • Categorización de notas                    ║
║  • Eliminación funcional                      ║
║  • Descarga de audios                         ║
║  • Estadísticas en tiempo real                ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});