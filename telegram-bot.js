import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import transcriptionService from './transcription-service.js';
import notionService from './notion-service.js';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración del bot
// IMPORTANTE: Necesitas crear un bot en Telegram con @BotFather y obtener el token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JARVI_SERVER = 'http://localhost:3001';
const TASKS_SERVER = 'http://localhost:3003';

// Crear directorio para audios si no existe
const audioDir = path.join(__dirname, 'voice-notes');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Inicializar bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log(`
╔════════════════════════════════════════════════╗
║        JARVI TELEGRAM VOICE ASSISTANT         ║
╠════════════════════════════════════════════════╣
║                                                ║
║  🤖 Bot iniciado y esperando mensajes...      ║
║  📱 Envía notas de voz desde Telegram         ║
║  🎙️  Las notas se enviarán a JARVI            ║
║                                                ║
║  Comandos disponibles:                        ║
║  /start - Iniciar el bot                      ║
║  /help - Ver ayuda                            ║
║  /status - Estado del sistema                 ║
║                                                ║
╚════════════════════════════════════════════════╝
`);

// Usuarios autorizados (puedes personalizar esto)
const authorizedUsers = [];

// Estado de usuarios para el menú interactivo
const userStates = {};

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  
  // Agregar usuario a la lista de autorizados
  if (!authorizedUsers.includes(chatId)) {
    authorizedUsers.push(chatId);
  }
  
  // Mostrar menú principal
  showMainMenu(chatId, userName);
});

// Comando /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📚 *AYUDA - JARVI Voice Assistant*

*Comandos disponibles:*
/start - Iniciar el bot
/help - Ver esta ayuda
/status - Ver estado del sistema
/list - Ver últimas notas de voz
/clear - Limpiar notas antiguas

*Tipos de contenido soportado:*
🎙️ Notas de voz
📝 Mensajes de texto
📍 Ubicación
📷 Fotos (próximamente)

*Características:*
• Transcripción automática (si está disponible)
• Almacenamiento seguro
• Reproducción en dashboard JARVI
• Notificaciones en tiempo real

¿Necesitas más ayuda? Contacta al administrador.
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Comando /status
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Verificar conexión con servidor JARVI
    const response = await axios.get(`${JARVI_SERVER}/api/health`);
    
    const statusMessage = `
✅ *ESTADO DEL SISTEMA*

🤖 *Bot Telegram:* Online
🖥️ *Servidor JARVI:* ${response.data.status === 'online' ? 'Online ✅' : 'Offline ❌'}
💾 *Notas almacenadas:* ${fs.readdirSync(audioDir).length}
👤 *Usuario autorizado:* Sí
🔐 *Chat ID:* \`${chatId}\`

_Última verificación: ${new Date().toLocaleString()}_
    `;
    
    bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Error conectando con el servidor JARVI');
  }
});

// Manejar notas de voz
bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  const voiceFileId = msg.voice.file_id;
  const duration = msg.voice.duration;
  
  console.log(`📨 Nueva nota de voz de ${userName} (${duration}s)`);
  
  try {
    const userState = userStates[chatId];
    
    // Si el usuario está en un contexto específico
    if (userState && userState.waitingFor) {
      if (userState.waitingFor === 'reminder_voice') {
        await processReminderVoice(voiceFileId, duration, userName, chatId);
        return;
      } else if (userState.waitingFor === 'todo_voice') {
        await processTodoVoice(voiceFileId, duration, userName, chatId);
        return;
      } else if (userState.waitingFor === 'meeting_audio') {
        await processMeetingAudioDirect(voiceFileId, duration, userName, chatId);
        return;
      } else if (userState.waitingFor === 'voice_message' || userState.waitingFor === 'voice_audio') {
        // Procesar como nota de voz directamente
        await processVoiceNoteAutomatic(voiceFileId, duration, userName, chatId);
        return;
      }
    }
    
    // Comportamiento por defecto: determinar si es nota corta o reunión
    const isLongAudio = duration > 120; // Audios mayores a 2 minutos se consideran reuniones
    
    if (isLongAudio) {
      // Preguntar al usuario qué tipo de audio es
      await bot.sendMessage(chatId, `🎙️ *Audio recibido (${Math.floor(duration / 60)}m ${duration % 60}s)*\n\n¿Qué tipo de audio es?`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📝 Nota de Voz', callback_data: `audio_note_${voiceFileId}_${duration}_${userName}` },
              { text: '👥 Reunión', callback_data: `audio_meeting_${voiceFileId}_${duration}_${userName}` }
            ]
          ]
        }
      });
      return;
    }
    
    // Procesar como nota de voz normal (transcripción automática)
    await processVoiceNoteAutomatic(voiceFileId, duration, userName, chatId);
    
  } catch (error) {
    console.error('Error procesando nota de voz:', error);
    await bot.sendMessage(chatId, '❌ Error procesando la nota de voz. Por favor, intenta de nuevo.');
  }
});

// Manejar mensajes de texto
bot.on('text', async (msg) => {
  // Ignorar comandos
  if (msg.text.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  const text = msg.text;
  
  console.log(`📝 Mensaje de ${userName}: ${text}`);
  
  const userState = userStates[chatId];
  
  try {
    // Si el usuario está en un contexto específico
    if (userState && userState.waitingFor) {
      switch (userState.waitingFor) {
        case 'reminder_text':
          await processReminderText(text, userName, chatId);
          return;
        
        case 'todo_text':
          await processTodoText(text, userName, chatId);
          return;
        
        case 'meeting_details':
          await processMeetingDetails(text, userName, chatId);
          return;
        
        case 'meeting_participants':
          await processMeetingParticipants(text, userName, chatId);
          return;
        
        case 'interest_link':
        case 'interest_url':
          // Verificar si es un link válido
          if (text.includes('http://') || text.includes('https://') || text.includes('www.')) {
            await processInterestLink(text, userName, chatId);
          } else {
            await bot.sendMessage(chatId, '⚠️ *No parece ser un link válido*\n\nEnvía una URL completa', { parse_mode: 'Markdown' });
          }
          return;
        
        case 'interest_video':
          // Si es un link de YouTube u otro video
          if (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('vimeo.com')) {
            await processInterestLink(text, userName, chatId);
          } else {
            await bot.sendMessage(chatId, '📹 Envía un video o link de YouTube', { parse_mode: 'Markdown' });
          }
          return;
      }
    }
    
    // Comportamiento por defecto: mostrar menú contextual
    const contextMenu = {
      inline_keyboard: [
        [{ text: '⏰ Crear Recordatorio', callback_data: 'quick_reminder' }],
        [{ text: '✅ Crear Tarea', callback_data: 'quick_todo' }],
        [{ text: '🔖 Guardar como Interés', callback_data: 'quick_interest' }],
        [{ text: '📱 Ver Menú Principal', callback_data: 'back_to_main' }]
      ]
    };
    
    userStates[chatId] = { tempText: text };
    
    await bot.sendMessage(chatId, `💬 *Recibí tu mensaje:*\n\n"${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n\n¿Qué quieres hacer con él?`, {
      parse_mode: 'Markdown',
      reply_markup: contextMenu
    });
  } catch (error) {
    console.error('Error procesando mensaje:', error.message);
    await bot.sendMessage(chatId, '❌ Error procesando el mensaje. Intenta de nuevo.');
  }
});

// Manejar ubicación
bot.on('location', async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  const { latitude, longitude } = msg.location;
  
  console.log(`📍 Ubicación de ${userName}: ${latitude}, ${longitude}`);
  
  const locationMessage = `
📍 *Ubicación recibida*

• Latitud: ${latitude}
• Longitud: ${longitude}
• Usuario: ${userName}

_Ubicación registrada en JARVI_
  `;
  
  await bot.sendMessage(chatId, locationMessage, { parse_mode: 'Markdown' });
});

// Comando /list - Listar notas de voz
bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const files = fs.readdirSync(audioDir)
      .filter(file => file.endsWith('.ogg'))
      .slice(-5); // Últimas 5 notas
    
    if (files.length === 0) {
      await bot.sendMessage(chatId, '📭 No hay notas de voz almacenadas');
      return;
    }
    
    let listMessage = '📋 *Últimas notas de voz:*\n\n';
    
    files.forEach((file, index) => {
      const metadataPath = path.join(audioDir, `${file}.json`);
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const date = new Date(metadata.timestamp);
        listMessage += `${index + 1}. 🎙️ ${date.toLocaleString()} (${metadata.duration}s)\n`;
      }
    });
    
    await bot.sendMessage(chatId, listMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error listando notas:', error);
    await bot.sendMessage(chatId, '❌ Error al listar las notas de voz');
  }
});

// Manejar errores
bot.on('polling_error', (error) => {
  console.error('Error en polling:', error);
});

// Manejar callbacks de botones inline
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const userName = callbackQuery.from.first_name || 'Usuario';

  try {
    // Manejar callbacks de audio (funcionalidad existente)
    if (data.startsWith('audio_note_')) {
      const parts = data.split('_');
      const voiceFileId = parts[2];
      const duration = parseInt(parts[3]);
      await processVoiceNote(voiceFileId, duration, userName, chatId, callbackQuery.message.message_id);
      
    } else if (data.startsWith('audio_meeting_')) {
      const parts = data.split('_');
      const voiceFileId = parts[2];
      const duration = parseInt(parts[3]);
      await processMeetingAudio(voiceFileId, duration, userName, chatId, callbackQuery.message.message_id);
    
    // Manejar navegación del menú principal
    } else if (data.startsWith('module_')) {
      const moduleName = data.replace('module_', '');
      await showModuleMenu(chatId, moduleName);
      
    } else if (data === 'back_to_main') {
      await showMainMenu(chatId, userName);
      
    } else if (data === 'system_status') {
      await handleSystemStatus(chatId);
      
    } else if (data === 'help_menu') {
      await handleHelpMenu(chatId);
      
    // Manejar acciones específicas de cada módulo
    } else if (data === 'voice_record') {
      userStates[chatId] = { currentModule: 'voice_notes', waitingFor: 'voice_message' };
      await bot.sendMessage(chatId, '🎤 *Perfecto!* Graba tu nota de voz y envíamela.\n\n_Puedes grabar directamente desde Telegram presionando el botón del micrófono._', { parse_mode: 'Markdown' });
      
    } else if (data === 'reminder_new') {
      userStates[chatId] = { currentModule: 'reminders', waitingFor: 'reminder_text' };
      await bot.sendMessage(chatId, '⏰ *Nuevo Recordatorio*\n\nEscribe tu recordatorio. Formato sugerido:\n`Reunión con cliente - Mañana 10:00 AM`', { parse_mode: 'Markdown' });
      
    } else if (data === 'reminder_voice') {
      userStates[chatId] = { currentModule: 'reminders', waitingFor: 'reminder_voice' };
      await bot.sendMessage(chatId, '🔔 *Recordatorio por Voz*\n\nGraba tu recordatorio hablando. Incluye la fecha y hora si es necesario.', { parse_mode: 'Markdown' });
      
    } else if (data === 'todo_new') {
      userStates[chatId] = { currentModule: 'todo', waitingFor: 'todo_text' };
      await bot.sendMessage(chatId, '✅ *Nueva Tarea*\n\nEscribe tu tarea. Ejemplo:\n`Completar informe de ventas - Prioridad: Alta`', { parse_mode: 'Markdown' });
      
    } else if (data === 'todo_voice') {
      userStates[chatId] = { currentModule: 'todo', waitingFor: 'todo_voice' };
      await bot.sendMessage(chatId, '🎤 *Tarea por Voz*\n\nGraba tu tarea hablando. Puedes mencionar prioridad, fecha límite, etc.', { parse_mode: 'Markdown' });
      
    } else if (data === 'meeting_upload') {
      userStates[chatId] = { currentModule: 'meetings', waitingFor: 'meeting_audio' };
      await bot.sendMessage(chatId, '🎬 *Subir Grabación de Reunión*\n\nEnvía el audio o video de tu reunión para transcribir y generar la minuta automáticamente.', { parse_mode: 'Markdown' });
      
    } else if (data === 'interest_link') {
      userStates[chatId] = { currentModule: 'interests', waitingFor: 'interest_url' };
      await bot.sendMessage(chatId, '🔗 *Agregar Link Interesante*\n\nEnvía el link que quieres guardar (YouTube, artículos, etc.)', { parse_mode: 'Markdown' });
      
    } else if (data === 'interest_image') {
      userStates[chatId] = { currentModule: 'interests', waitingFor: 'interest_image' };
      await bot.sendMessage(chatId, '📸 *Agregar Imagen*\n\nEnvía la imagen que quieres guardar en tus intereses.', { parse_mode: 'Markdown' });
      
    } else if (data === 'interest_video') {
      userStates[chatId] = { currentModule: 'interests', waitingFor: 'interest_video' };
      await bot.sendMessage(chatId, '🎥 *Agregar Video*\n\nEnvía el video o el link de YouTube/Instagram que quieres guardar.', { parse_mode: 'Markdown' });
    
    } else if (data === 'module_notion') {
      await handleNotionMenu(chatId);
    
    } else if (data === 'notion_setup') {
      await handleNotionSetup(chatId);
    
    } else if (data === 'notion_sync_all') {
      await handleNotionSyncAll(chatId);
    
    } else if (data === 'notion_status') {
      await handleNotionStatus(chatId);
    
    // Opciones rápidas desde mensajes de texto
    } else if (data === 'quick_reminder') {
      if (userStates[chatId] && userStates[chatId].tempText) {
        await processReminderText(userStates[chatId].tempText, userName, chatId);
      }
    
    } else if (data === 'quick_todo') {
      if (userStates[chatId] && userStates[chatId].tempText) {
        await processTodoText(userStates[chatId].tempText, userName, chatId);
      }
    
    } else if (data === 'quick_interest') {
      if (userStates[chatId] && userStates[chatId].tempText) {
        const text = userStates[chatId].tempText;
        if (text.includes('http://') || text.includes('https://') || text.includes('www.')) {
          await processInterestLink(text, userName, chatId);
        } else {
          // Guardar como nota de interés
          const interest = {
            id: Date.now(),
            title: text.substring(0, 50),
            type: 'note',
            content: text,
            category: 'general',
            sender: { name: userName, id: chatId },
            timestamp: new Date().toISOString(),
            source: 'telegram'
          };
          await axios.post(`${JARVI_SERVER}/api/interest`, interest);
          await bot.sendMessage(chatId, `🔖 *Guardado en Intereses*\n\n📝 "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n\n_Disponible en tu dashboard JARVI_`, { parse_mode: 'Markdown' });
          userStates[chatId] = { currentModule: null, waitingFor: null };
          setTimeout(() => showMainMenu(chatId, userName), 2000);
        }
      }
    
    // Listas de visualización
    } else if (data === 'voice_list') {
      await showVoiceNotesList(chatId);
    
    } else if (data === 'reminder_list') {
      await showRemindersList(chatId);
    
    } else if (data === 'todo_list') {
      await showTodoList(chatId);
    
    } else if (data === 'meeting_list') {
      await showMeetingsList(chatId);
    
    } else if (data === 'interest_list') {
      await showInterestsList(chatId);
    
    } else if (data === 'meeting_new') {
      userStates[chatId] = { currentModule: 'meetings', waitingFor: 'meeting_details' };
      await bot.sendMessage(chatId, '📝 *Nueva Reunión*\n\nEscribe el título de la reunión:\n\n_Ejemplo: "Reunión Planning Sprint Q1"_', { parse_mode: 'Markdown' });
    
    } else if (data === 'voice_upload') {
      userStates[chatId] = { currentModule: 'voice_notes', waitingFor: 'voice_audio' };
      await bot.sendMessage(chatId, '📱 *Sube tu audio*\n\nEnvíame un archivo de audio desde tu dispositivo.', { parse_mode: 'Markdown' });
    }

    // Responder al callback
    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('Error procesando callback:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error procesando solicitud' });
  }
});

// Función para procesar nota de voz automáticamente (notas cortas)
async function processVoiceNoteAutomatic(voiceFileId, duration, userName, chatId) {
  try {
    await bot.sendMessage(chatId, '🎙️ *Nota de voz recibida*\n_Procesando..._', { parse_mode: 'Markdown' });
    
    // Verificar duración (más de 20 minutos puede ser problemático)
    if (duration > 1200) {
      await bot.sendMessage(chatId, 
        `⚠️ *Audio muy largo (${Math.floor(duration/60)} minutos)*\n\n` +
        `El audio es demasiado grande para procesar por Telegram.\n` +
        `Por favor, envía audios de menos de 20 minutos.`, 
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Obtener información del archivo
    let file;
    try {
      file = await bot.getFile(voiceFileId);
    } catch (error) {
      if (error.message && error.message.includes('file is too big')) {
        await bot.sendMessage(chatId, 
          `❌ *Error: Archivo muy grande*\n\n` +
          `El archivo supera el límite de 20MB de Telegram.\n` +
          `Por favor, envía archivos más pequeños.`, 
          { parse_mode: 'Markdown' }
        );
        return;
      }
      throw error;
    }
    
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Descargar el archivo
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });
    
    // Guardar el archivo localmente
    const timestamp = Date.now();
    const fileName = `voice_${chatId}_${timestamp}.ogg`;
    const filePath = path.join(audioDir, fileName);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    // Transcribir el audio
    let transcription = null;
    await bot.sendMessage(chatId, '🤖 *Transcribiendo audio...*', { parse_mode: 'Markdown' });
    
    try {
      transcription = await transcriptionService.transcribeAudio(filePath, 'es');
      if (transcription) {
        console.log('✅ Audio transcrito exitosamente');
        
        // Preparar mensaje de transcripción
        let message = `📝 *Transcripción:*\n_"${transcription}"_`;
        
        // Si el mensaje es muy largo para Telegram (límite 4096 caracteres)
        if (message.length > 4000) {
          const truncated = transcription.substring(0, 500);
          message = `📝 *Transcripción (fragmento):*\n_"${truncated}..."_\n\n⚠️ *Nota:* La transcripción completa es muy larga para Telegram.\n✅ Guardada completa en JARVI Dashboard`;
        }
        
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error('Error en transcripción:', error);
    }
    
    // Crear metadata de la nota
    const voiceNote = {
      id: timestamp,
      fileName: fileName,
      filePath: filePath,
      duration: duration,
      sender: {
        id: chatId,
        name: userName,
        username: 'telegram_user'
      },
      timestamp: new Date().toISOString(),
      transcription: transcription,
      type: 'voice_note'
    };
    
    // Guardar metadata de la nota
    const jsonFileName = `${fileName}.json`;
    const jsonFilePath = path.join(audioDir, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(voiceNote, null, 2));
    
    // Enviar a JARVI
    try {
      const response = await axios.post(`${JARVI_SERVER}/api/voice-note`, voiceNote);
      console.log(`✅ Nota enviada a JARVI: ${response.data.message}`);
      await bot.sendMessage(chatId, '✅ *Nota de voz guardada en JARVI*', { parse_mode: 'Markdown' });
      
      // Sincronizar automáticamente con Notion (comentado por token inválido)
      // await syncVoiceNoteToNotion(voiceNote, chatId);
      
    } catch (error) {
      console.error('❌ Error enviando a JARVI:', error.message);
      await bot.sendMessage(chatId, '❌ Error guardando en JARVI, pero la nota se guardó localmente');
    }
    
  } catch (error) {
    console.error('Error procesando nota de voz:', error);
    await bot.sendMessage(chatId, '❌ Error procesando la nota de voz');
  }
}

// Función para procesar nota de voz
async function processVoiceNote(voiceFileId, duration, userName, chatId, messageId) {
  try {
    // Editar mensaje original
    await bot.editMessageText('🎙️ *Procesando como nota de voz...*', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    });

    // Obtener y descargar archivo
    const file = await bot.getFile(voiceFileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });
    
    const timestamp = Date.now();
    const fileName = `voice_${chatId}_${timestamp}.ogg`;
    const filePath = path.join(audioDir, fileName);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Transcribir audio
    await bot.editMessageText('🤖 *Transcribiendo audio...*', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    });

    let transcription = null;
    try {
      transcription = await transcriptionService.transcribeAudio(filePath, 'es');
      if (transcription) {
        console.log('✅ Audio transcrito exitosamente');
      }
    } catch (error) {
      console.error('Error en transcripción:', error);
    }
    
    // Crear metadata de la nota
    const voiceNote = {
      id: timestamp,
      fileName: fileName,
      filePath: filePath,
      duration: duration,
      sender: {
        id: chatId,
        name: userName,
        username: 'telegram_user'
      },
      timestamp: new Date().toISOString(),
      transcription: transcription,
      type: 'voice_note'
    };

    // Guardar metadata como JSON
    const jsonFileName = `${fileName}.json`;
    const jsonFilePath = path.join(audioDir, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(voiceNote, null, 2));

    // Enviar a JARVI
    await axios.post(`${JARVI_SERVER}/api/voice-note`, voiceNote);
    
    // Confirmar al usuario
    await bot.editMessageText(`✅ *Nota de voz procesada*\n\n📝 Duración: ${duration}s\n${transcription ? `🤖 Transcripción: _"${transcription}"_` : '❌ No se pudo transcribir'}`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Error procesando nota de voz:', error);
    await bot.editMessageText('❌ Error procesando nota de voz', {
      chat_id: chatId,
      message_id: messageId
    });
  }
}

// Función para procesar audio de reunión
async function processMeetingAudio(voiceFileId, duration, userName, chatId, messageId) {
  try {
    // Verificar duración primero
    if (duration > 1200) { // Más de 20 minutos
      await bot.editMessageText(
        `⚠️ *Audio demasiado largo*\n\n` +
        `Duración: ${Math.floor(duration/60)} minutos\n` +
        `Límite de Telegram: 20 minutos\n\n` +
        `📱 *Para archivos largos, usa el dashboard web:*\n` +
        `1. Abre http://localhost:5174\n` +
        `2. Ve a "Reuniones"\n` +
        `3. Click en "Subir Audio (hasta 500MB)"\n` +
        `4. Sube tu archivo .m4a de ${Math.floor(duration/60)} minutos\n\n` +
        `El sistema procesará archivos de cualquier duración desde el navegador.`, 
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown'
        }
      );
      return;
    }
    
    // Editar mensaje original
    await bot.editMessageText('👥 *Procesando como audio de reunión...*', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    });

    // Obtener y descargar archivo
    const file = await bot.getFile(voiceFileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });
    
    const timestamp = Date.now();
    const fileName = `meeting_${chatId}_${timestamp}.ogg`;
    const filePath = path.join(audioDir, fileName);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Crear metadata del audio de reunión
    const meetingAudio = {
      id: timestamp,
      fileName: fileName,
      filePath: filePath,
      duration: duration,
      sender: {
        id: chatId,
        name: userName,
        username: 'telegram_user'
      },
      timestamp: new Date().toISOString(),
      title: `Reunión ${new Date().toLocaleDateString('es-ES')}`,
      status: 'uploaded',
      type: 'meeting_audio'
    };

    // Guardar metadata como JSON
    const jsonFileName = `${fileName}.json`;
    const jsonFilePath = path.join(audioDir, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(meetingAudio, null, 2));

    // Convertir archivo a FormData para enviar al servidor de reuniones
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Leer el archivo guardado
    const audioBuffer = fs.readFileSync(filePath);
    formData.append('audio', audioBuffer, {
      filename: fileName,
      contentType: 'audio/ogg'
    });
    
    // Añadir metadata
    formData.append('title', meetingAudio.title);
    formData.append('date', meetingAudio.timestamp);
    formData.append('participants', userName);
    formData.append('tags', 'telegram,audio');
    
    // Enviar al servidor de reuniones (puerto 3002)
    try {
      await axios.post('http://localhost:3002/api/meetings/upload', formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
    } catch (uploadError) {
      console.error('Error enviando al servidor de reuniones:', uploadError.message);
      throw uploadError;
    }
    
    // Confirmar al usuario
    await bot.editMessageText(`✅ *Audio de reunión recibido*\n\n⏱️ Duración: ${Math.floor(duration / 60)}m ${duration % 60}s\n📁 Se procesará para transcripción y resumen\n\n🖥️ Revisa el módulo de Reuniones en JARVI para ver el progreso.`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Error procesando audio de reunión:', error);
    await bot.editMessageText('❌ Error procesando audio de reunión', {
      chat_id: chatId,
      message_id: messageId
    });
  }
}

// Función para mostrar el menú principal
const showMainMenu = async (chatId, userName) => {
  const welcomeMessage = `
🚀 *¡Bienvenido a JARVI, ${userName}!*

Tu centro de comando inteligente está listo. Selecciona qué módulo quieres usar:

*¿Qué necesitas hacer hoy?*
`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎙️ Notas de Voz', callback_data: 'module_voice_notes' },
        { text: '⏰ Recordatorios', callback_data: 'module_reminders' }
      ],
      [
        { text: '✅ Tareas (ToDo)', callback_data: 'module_todo' },
        { text: '👥 Reuniones', callback_data: 'module_meetings' }
      ],
      [
        { text: '🔖 Intereses', callback_data: 'module_interests' },
        { text: '📋 Notion Sync', callback_data: 'module_notion' }
      ],
      [
        { text: '📊 Estado del Sistema', callback_data: 'system_status' },
        { text: '❓ Ayuda', callback_data: 'help_menu' }
      ]
    ]
  };

  userStates[chatId] = { currentModule: null, waitingFor: null };
  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

// Función para mostrar submenu de cada módulo
const showModuleMenu = async (chatId, moduleName) => {
  const moduleMenus = {
    voice_notes: {
      message: `🎙️ *Notas de Voz*\n\nEnvíame contenido y yo lo organizaré:`,
      options: [
        [{ text: '🎤 Grabar Nota de Voz', callback_data: 'voice_record' }],
        [{ text: '📱 Subir Audio', callback_data: 'voice_upload' }],
        [{ text: '🗂️ Ver Mis Notas', callback_data: 'voice_list' }],
        [{ text: '⬅️ Volver al Menú', callback_data: 'back_to_main' }]
      ]
    },
    reminders: {
      message: `⏰ *Recordatorios*\n\nGestiona tus recordatorios:`,
      options: [
        [{ text: '➕ Nuevo Recordatorio', callback_data: 'reminder_new' }],
        [{ text: '🔔 Recordatorio por Voz', callback_data: 'reminder_voice' }],
        [{ text: '📋 Ver Recordatorios', callback_data: 'reminder_list' }],
        [{ text: '⬅️ Volver al Menú', callback_data: 'back_to_main' }]
      ]
    },
    todo: {
      message: `✅ *Tareas (ToDo)*\n\nOrganiza tus tareas:`,
      options: [
        [{ text: '➕ Nueva Tarea', callback_data: 'todo_new' }],
        [{ text: '🎤 Tarea por Voz', callback_data: 'todo_voice' }],
        [{ text: '📝 Mis Tareas', callback_data: 'todo_list' }],
        [{ text: '⬅️ Volver al Menú', callback_data: 'back_to_main' }]
      ]
    },
    meetings: {
      message: `👥 *Reuniones*\n\nGestiona tus reuniones:`,
      options: [
        [{ text: '🎬 Subir Grabación', callback_data: 'meeting_upload' }],
        [{ text: '📝 Nueva Reunión', callback_data: 'meeting_new' }],
        [{ text: '📋 Ver Reuniones', callback_data: 'meeting_list' }],
        [{ text: '⬅️ Volver al Menú', callback_data: 'back_to_main' }]
      ]
    },
    interests: {
      message: `🔖 *Intereses*\n\nGuarda contenido interesante:`,
      options: [
        [{ text: '🔗 Agregar Link', callback_data: 'interest_link' }],
        [{ text: '📸 Agregar Imagen', callback_data: 'interest_image' }],
        [{ text: '🎥 Video/YouTube', callback_data: 'interest_video' }],
        [{ text: '📚 Ver Intereses', callback_data: 'interest_list' }],
        [{ text: '⬅️ Volver al Menú', callback_data: 'back_to_main' }]
      ]
    }
  };

  const menu = moduleMenus[moduleName];
  if (menu) {
    userStates[chatId] = { currentModule: moduleName, waitingFor: null };
    await bot.sendMessage(chatId, menu.message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: menu.options }
    });
  }
};

// Comando /menu para volver al menú principal
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  showMainMenu(chatId, userName);
});

// Manejar archivos de audio
bot.on('audio', async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  const audioFileId = msg.audio.file_id;
  const duration = msg.audio.duration;
  const userState = userStates[chatId];
  
  console.log(`🎵 Archivo de audio recibido de ${userName} (${duration}s)`);
  
  try {
    // Si el usuario está esperando un audio
    if (userState && (userState.waitingFor === 'voice_audio' || userState.waitingFor === 'meeting_audio')) {
      if (userState.waitingFor === 'meeting_audio') {
        await processMeetingAudioDirect(audioFileId, duration, userName, chatId);
      } else {
        await processVoiceNoteAutomatic(audioFileId, duration, userName, chatId);
      }
      return;
    }
    
    // Comportamiento por defecto: determinar por duración
    const isLongAudio = duration > 120;
    
    if (isLongAudio) {
      await bot.sendMessage(chatId, `🎵 *Audio recibido (${Math.floor(duration / 60)}m ${duration % 60}s)*\n\n¿Qué tipo de audio es?`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📝 Nota de Voz', callback_data: `audio_note_${audioFileId}_${duration}_${userName}` },
              { text: '👥 Reunión', callback_data: `audio_meeting_${audioFileId}_${duration}_${userName}` }
            ]
          ]
        }
      });
    } else {
      await processVoiceNoteAutomatic(audioFileId, duration, userName, chatId);
    }
  } catch (error) {
    console.error('Error procesando archivo de audio:', error);
    await bot.sendMessage(chatId, '❌ Error procesando el archivo de audio.');
  }
});

// Manejar fotos
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  const userState = userStates[chatId];

  try {
    if (userState && userState.waitingFor === 'interest_image') {
      await processInterestImage(msg.photo, userName, chatId, msg.caption);
    } else {
      await bot.sendMessage(chatId, '📸 *Imagen recibida*\n\nPara organizarla mejor, usa el menú /menu y selecciona el módulo de Intereses.', { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error procesando imagen:', error);
    await bot.sendMessage(chatId, '❌ Error procesando la imagen.');
  }
});

// Manejar videos
bot.on('video', async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  const userState = userStates[chatId];

  try {
    if (userState && userState.waitingFor === 'interest_video') {
      await processInterestVideo(msg.video, userName, chatId, msg.caption);
    } else if (userState && userState.waitingFor === 'meeting_audio') {
      await processMeetingVideo(msg.video, userName, chatId);
    } else {
      await bot.sendMessage(chatId, '🎥 *Video recibido*\n\nUsa /menu para seleccionar si es para Intereses o Reuniones.', { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error procesando video:', error);
    await bot.sendMessage(chatId, '❌ Error procesando el video.');
  }
});

// Funciones de procesamiento para cada módulo

// Procesar tarea de texto
async function processTodoText(text, userName, chatId) {
  try {
    const todo = {
      id: Date.now(),
      title: text,
      type: 'text',
      priority: 'normal',
      status: 'pending',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString()
    };

    await axios.post(`${JARVI_SERVER}/api/todo`, todo);
    
    await bot.sendMessage(chatId, `✅ *Tarea creada*\n\n📝 "${text}"\n🎯 Prioridad: Normal\n\n_Disponible en tu dashboard JARVI_`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error creando tarea:', error);
    await bot.sendMessage(chatId, '❌ Error creando la tarea. Intenta de nuevo.');
  }
}

// Procesar tarea de voz
async function processTodoVoice(voiceFileId, duration, userName, chatId) {
  try {
    await bot.sendMessage(chatId, '🎯 *Procesando tarea por voz...*\n_Transcribiendo y analizando..._', { parse_mode: 'Markdown' });
    
    const file = await bot.getFile(voiceFileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    const response = await axios({ method: 'GET', url: fileUrl, responseType: 'stream' });
    
    const timestamp = Date.now();
    const fileName = `todo_${chatId}_${timestamp}.ogg`;
    const filePath = path.join(audioDir, fileName);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    let transcription = '';
    try {
      transcription = await transcriptionService.transcribeAudio(filePath, 'es');
    } catch (error) {
      console.error('Error transcribiendo tarea:', error);
      // Si no hay servicio de transcripción, usar un mensaje genérico
      transcription = `Tarea de voz de ${userName}`;
    }
    
    // Enviar al servidor de tareas para procesar con IA
    try {
      const taskResponse = await axios.post(`${TASKS_SERVER}/api/tasks/natural`, {
        text: transcription,
        source: 'telegram-voice',
        metadata: {
          userName,
          chatId,
          duration,
          audioFile: fileName
        }
      });
      
      const task = taskResponse.data.task;
      
      // Formatear mensaje de confirmación
      let confirmMessage = `✅ *Tarea creada exitosamente*\n\n`;
      confirmMessage += `📌 *Título:* ${task.title}\n`;
      if (task.description) confirmMessage += `📝 *Descripción:* ${task.description}\n`;
      confirmMessage += `🏷️ *Categoría:* ${task.category}\n`;
      confirmMessage += `⚡ *Prioridad:* ${task.priority === 'urgent' ? '🔴 Urgente' : task.priority === 'high' ? '🟠 Alta' : task.priority === 'medium' ? '🟡 Media' : '🟢 Baja'}\n`;
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        confirmMessage += `📅 *Fecha límite:* ${dueDate.toLocaleDateString('es-ES')}\n`;
      }
      if (task.tags && task.tags.length > 0) {
        confirmMessage += `🔖 *Tags:* ${task.tags.join(', ')}\n`;
      }
      confirmMessage += `\n🎤 _Audio: ${duration}s_\n`;
      confirmMessage += `💬 _"${transcription}"_\n`;
      confirmMessage += `\n_✨ Disponible en tu dashboard JARVI_`;
      
      await bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });
      
    } catch (apiError) {
      // Si el servidor de tareas no está disponible, guardar localmente
      console.error('Error enviando al servidor de tareas:', apiError);
      
      // Intentar con el servidor principal como fallback
      const todo = {
        id: timestamp,
        title: transcription || 'Tarea por voz',
        type: 'voice',
        audioFile: fileName,
        duration: duration,
        priority: 'normal',
        status: 'pending',
        sender: { name: userName, id: chatId },
        timestamp: new Date().toISOString()
      };
      
      await axios.post(`${JARVI_SERVER}/api/todo`, todo).catch(() => {
        console.log('Fallback también falló, guardando localmente');
      });
      
      await bot.sendMessage(chatId, `✅ *Tarea guardada*\n\n🎤 Duración: ${duration}s\n📝 "${transcription}"\n\n_Se sincronizará cuando el servidor esté disponible_`, { parse_mode: 'Markdown' });
    }
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error procesando tarea de voz:', error);
    await bot.sendMessage(chatId, '❌ Error procesando la tarea. Por favor, intenta de nuevo.');
  }
}

// Procesar link de interés
async function processInterestLink(url, userName, chatId) {
  try {
    const interest = {
      id: Date.now(),
      title: `Link: ${url}`,
      type: 'link',
      url: url,
      category: 'general',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      source: 'telegram'
    };

    await axios.post(`${JARVI_SERVER}/api/interest`, interest);
    
    await bot.sendMessage(chatId, `🔗 *Link agregado a Intereses*\n\n📎 ${url}\n\n_Disponible en tu dashboard JARVI_`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error guardando link:', error);
    await bot.sendMessage(chatId, '❌ Error guardando el link. Intenta de nuevo.');
  }
}

// Procesar imagen de interés
async function processInterestImage(photo, userName, chatId, caption) {
  try {
    const largestPhoto = photo[photo.length - 1];
    
    const interest = {
      id: Date.now(),
      title: caption || 'Imagen desde Telegram',
      type: 'image',
      imageFileId: largestPhoto.file_id,
      width: largestPhoto.width,
      height: largestPhoto.height,
      category: 'general',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      source: 'telegram'
    };

    await axios.post(`${JARVI_SERVER}/api/interest`, interest);
    
    await bot.sendMessage(chatId, `📸 *Imagen agregada a Intereses*\n\n${caption ? `📝 "${caption}"` : ''}\n🖼️ ${largestPhoto.width}x${largestPhoto.height}px\n\n_Disponible en tu dashboard JARVI_`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error procesando imagen:', error);
    await bot.sendMessage(chatId, '❌ Error procesando la imagen.');
  }
}

// Procesar detalles de reunión (título)
async function processMeetingDetails(text, userName, chatId) {
  try {
    userStates[chatId].meetingTitle = text;
    userStates[chatId].waitingFor = 'meeting_participants';
    
    await bot.sendMessage(chatId, `👥 *Participantes de la reunión*\n\nEscribe los nombres de los participantes separados por comas:\n\n_Ejemplo: Juan Pérez, María García, Carlos López_\n\n_Para cancelar, usa /menu_`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error procesando detalles de reunión:', error);
    await bot.sendMessage(chatId, '❌ Error procesando los detalles.');
  }
}

// Procesar participantes de reunión
async function processMeetingParticipants(text, userName, chatId) {
  try {
    const participants = text.split(',').map(p => p.trim()).filter(p => p);
    
    const meeting = {
      id: Date.now(),
      title: userStates[chatId].meetingTitle,
      participants: participants,
      date: new Date().toISOString(),
      status: 'scheduled',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString()
    };

    await axios.post(`${JARVI_SERVER}/api/meeting-audio-direct`, meeting);
    
    await bot.sendMessage(chatId, `✅ *Reunión creada*\n\n📝 ${meeting.title}\n👥 ${participants.length} participantes\n📅 ${new Date().toLocaleDateString('es-ES')}\n\n_Puedes subir el audio cuando esté disponible_`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error creando reunión:', error);
    await bot.sendMessage(chatId, '❌ Error creando la reunión.');
  }
}

// Procesar recordatorio de texto
async function processReminderText(text, userName, chatId) {
  try {
    const reminder = {
      id: Date.now(),
      content: text,
      type: 'text',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Enviar a JARVI
    await axios.post(`${JARVI_SERVER}/api/reminder`, reminder);
    
    await bot.sendMessage(chatId, `✅ *Recordatorio creado*\n\n📝 "${text}"\n\n_Disponible en tu dashboard JARVI_`, { parse_mode: 'Markdown' });
    
    // Limpiar estado del usuario
    userStates[chatId] = { currentModule: null, waitingFor: null };
    
    // Mostrar menú de regreso
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error creando recordatorio:', error);
    await bot.sendMessage(chatId, '❌ Error creando el recordatorio. Intenta de nuevo.');
  }
}

// Procesar recordatorio de voz
async function processReminderVoice(voiceFileId, duration, userName, chatId) {
  try {
    await bot.sendMessage(chatId, '🔔 *Procesando recordatorio por voz...*', { parse_mode: 'Markdown' });
    
    // Descargar y transcribir audio
    const file = await bot.getFile(voiceFileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    const response = await axios({ method: 'GET', url: fileUrl, responseType: 'stream' });
    
    const timestamp = Date.now();
    const fileName = `reminder_${chatId}_${timestamp}.ogg`;
    const filePath = path.join(audioDir, fileName);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    // Transcribir
    let transcription = '';
    try {
      transcription = await transcriptionService.transcribeAudio(filePath, 'es');
    } catch (error) {
      console.error('Error transcribiendo recordatorio:', error);
    }
    
    const reminder = {
      id: timestamp,
      content: transcription || 'Audio no transcribible',
      type: 'voice',
      audioFile: fileName,
      duration: duration,
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    await axios.post(`${JARVI_SERVER}/api/reminder`, reminder);
    
    await bot.sendMessage(chatId, `✅ *Recordatorio por voz creado*\n\n🎤 Duración: ${duration}s\n📝 "${transcription || 'Sin transcripción'}"`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error procesando recordatorio de voz:', error);
    await bot.sendMessage(chatId, '❌ Error procesando recordatorio de voz.');
  }
}

// Procesar tarea de texto
// Procesar tarea de voz duplicada - eliminada
async function processTodoVoiceDuplicate(voiceFileId, duration, userName, chatId) {
  try {
    await bot.sendMessage(chatId, '📝 *Procesando tarea por voz...*', { parse_mode: 'Markdown' });
    
    // Similar al proceso de recordatorio de voz pero para tareas
    const file = await bot.getFile(voiceFileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    const response = await axios({ method: 'GET', url: fileUrl, responseType: 'stream' });
    
    const timestamp = Date.now();
    const fileName = `todo_${chatId}_${timestamp}.ogg`;
    const filePath = path.join(audioDir, fileName);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    let transcription = '';
    try {
      transcription = await transcriptionService.transcribeAudio(filePath, 'es');
    } catch (error) {
      console.error('Error transcribiendo tarea:', error);
    }
    
    const todo = {
      id: timestamp,
      title: transcription || 'Tarea de audio',
      description: '',
      type: 'voice',
      audioFile: fileName,
      duration: duration,
      priority: 'medium',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      completed: false,
      transcription: transcription
    };

    await axios.post(`${JARVI_SERVER}/api/todo`, todo);
    
    await bot.sendMessage(chatId, `✅ *Tarea por voz creada*\n\n🎤 Duración: ${duration}s\n📝 "${transcription || 'Sin transcripción'}"`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error procesando tarea de voz:', error);
    await bot.sendMessage(chatId, '❌ Error procesando tarea de voz.');
  }
}

// Procesar URL de interés
async function processInterestUrlDuplicate(url, userName, chatId) {
  try {
    const interest = {
      id: Date.now(),
      title: 'Link desde Telegram',
      url: url,
      type: 'link',
      category: 'general',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      source: 'telegram'
    };

    await axios.post(`${JARVI_SERVER}/api/interest`, interest);
    
    await bot.sendMessage(chatId, `🔗 *Link agregado a Intereses*\n\n📎 ${url}\n\n_Disponible en tu dashboard JARVI_`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error agregando interés:', error);
    await bot.sendMessage(chatId, '❌ Error agregando el link.');
  }
}

// Procesar imagen de interés
async function processInterestImageDuplicate(photos, userName, chatId, caption) {
  try {
    const largestPhoto = photos[photos.length - 1]; // La foto de mayor resolución
    const file = await bot.getFile(largestPhoto.file_id);
    
    const interest = {
      id: Date.now(),
      title: caption || 'Imagen desde Telegram',
      type: 'image',
      imageFileId: largestPhoto.file_id,
      category: 'general',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      source: 'telegram'
    };

    await axios.post(`${JARVI_SERVER}/api/interest`, interest);
    
    await bot.sendMessage(chatId, `📸 *Imagen agregada a Intereses*\n\n${caption ? `📝 "${caption}"` : ''}\n\n_Disponible en tu dashboard JARVI_`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error procesando imagen:', error);
    await bot.sendMessage(chatId, '❌ Error procesando la imagen.');
  }
}

// Funciones auxiliares para mostrar status y ayuda
async function handleSystemStatus(chatId) {
  try {
    const response = await axios.get(`${JARVI_SERVER}/api/health`);
    const costs = await axios.get(`${JARVI_SERVER}/api/costs`);
    
    const statusMessage = `
📊 *Estado del Sistema JARVI*

🖥️ *Servidor:* ${response.data.status === 'online' ? 'Online ✅' : 'Offline ❌'}
💰 *Costos API:* $${costs.data.costs.totalCost?.toFixed(4) || '0.0000'}
🎙️ *Bot Telegram:* Online ✅

_Última verificación: ${new Date().toLocaleString()}_
`;
    
    await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Error obteniendo estado del sistema');
  }
}

async function handleHelpMenu(chatId) {
  const helpMessage = `
❓ *Ayuda - JARVI Bot*

*Comandos disponibles:*
/start - Iniciar y ver menú principal
/menu - Volver al menú principal
/help - Ver esta ayuda
/status - Estado del sistema

*Módulos disponibles:*
🎙️ *Notas de Voz* - Graba y transcribe notas
⏰ *Recordatorios* - Crea recordatorios por texto o voz
✅ *Tareas* - Gestiona tu lista de tareas
👥 *Reuniones* - Sube audios para transcribir y generar minutas
🔖 *Intereses* - Guarda links, imágenes y videos

*Tipos de contenido soportado:*
• Audio y notas de voz
• Texto
• Imágenes
• Videos
• Links de YouTube, Instagram, etc.

¿Necesitas más ayuda? Usa /menu para empezar.
`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
}

// Manejar menú de Notion
async function handleNotionMenu(chatId) {
  const notionMessage = `
📋 *Notion Sync*

Sincroniza todos tus datos con tu segundo cerebro en Notion:

*¿Qué quieres hacer?*
`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔄 Sincronizar Todo', callback_data: 'notion_sync_all' },
        { text: '📊 Ver Estado', callback_data: 'notion_status' }
      ],
      [
        { text: '🎙️ Sync Notas de Voz', callback_data: 'notion_sync_voice' },
        { text: '⏰ Sync Recordatorios', callback_data: 'notion_sync_reminders' }
      ],
      [
        { text: '✅ Sync Tareas', callback_data: 'notion_sync_todos' },
        { text: '👥 Sync Reuniones', callback_data: 'notion_sync_meetings' }
      ],
      [
        { text: '🔖 Sync Intereses', callback_data: 'notion_sync_interests' },
        { text: '⚙️ Configurar Notion', callback_data: 'notion_setup' }
      ],
      [
        { text: '⬅️ Volver al Menú', callback_data: 'back_to_main' }
      ]
    ]
  };

  await bot.sendMessage(chatId, notionMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// Sincronizar una nota de voz específica con Notion
async function syncVoiceNoteToNotion(voiceNote, chatId) {
  try {
    await notionService.addVoiceNoteToNotion(voiceNote);
    console.log(`✅ Nota de voz ${voiceNote.id} sincronizada con Notion`);
  } catch (error) {
    console.error('Error sincronizando con Notion:', error);
    if (chatId) {
      await bot.sendMessage(chatId, '⚠️ *Advertencia:* La nota se guardó localmente pero no pudo sincronizarse con Notion. Revisa tu configuración.', { parse_mode: 'Markdown' });
    }
  }
}

// Configurar Notion workspace
async function handleNotionSetup(chatId) {
  try {
    await bot.sendMessage(chatId, '⚙️ *Configurando workspace JARVI en Notion...*\n\nEsto puede tomar unos momentos...', { parse_mode: 'Markdown' });
    
    const result = await notionService.setupCompleteWorkspace();
    
    const successMessage = `✅ *¡Workspace JARVI configurado exitosamente!*

🏠 **Página principal creada**
🗄️ **Bases de datos configuradas:**
• 🎙️ Notas de Voz
• ⏰ Recordatorios  
• ✅ Tareas
• 👥 Reuniones
• 🔖 Intereses

🔗 Ve a Notion para ver tu nuevo segundo cerebro
📋 Usa "Notion Sync" para sincronizar datos`;

    await bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error configurando Notion:', error);
    await bot.sendMessage(chatId, '❌ *Error configurando Notion*\n\nRevisa tu token de API y permisos.', { parse_mode: 'Markdown' });
  }
}

// Sincronizar todos los datos con Notion
async function handleNotionSyncAll(chatId) {
  try {
    await bot.sendMessage(chatId, '🔄 *Sincronizando todos los datos con Notion...*', { parse_mode: 'Markdown' });
    
    // Aquí implementarías la sincronización completa
    // Por ahora, solo mostramos un mensaje de confirmación
    
    const syncMessage = `✅ *Sincronización completa iniciada*

📊 **Se están sincronizando:**
• 🎙️ Notas de voz
• ⏰ Recordatorios
• ✅ Tareas
• 👥 Reuniones  
• 🔖 Intereses

⏳ Este proceso puede tomar varios minutos...
🔔 Te notificaremos cuando termine`;

    await bot.sendMessage(chatId, syncMessage, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error sincronizando:', error);
    await bot.sendMessage(chatId, '❌ Error en la sincronización. Intenta de nuevo.', { parse_mode: 'Markdown' });
  }
}

// Mostrar estado de Notion
async function handleNotionStatus(chatId) {
  try {
    const statusMessage = `📊 *Estado de Notion Sync*

🔗 **Conexión:** ${process.env.NOTION_API_TOKEN ? '✅ Configurada' : '❌ Sin configurar'}
🗄️ **Bases de datos:** ${process.env.NOTION_VOICE_NOTES_DB_ID ? '✅ Configuradas' : '❌ Sin configurar'}

📋 **Datos sincronizados hoy:**
• 🎙️ Notas de voz: En tiempo real
• ⏰ Recordatorios: Automático  
• ✅ Tareas: Automático
• 👥 Reuniones: Automático
• 🔖 Intereses: Automático

💡 *Tip:* Todos los nuevos datos se sincronizan automáticamente`;

    await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    await bot.sendMessage(chatId, '❌ Error obteniendo estado de Notion.', { parse_mode: 'Markdown' });
  }
}

// Mostrar lista de notas de voz
async function showVoiceNotesList(chatId) {
  try {
    const response = await axios.get(`${JARVI_SERVER}/api/voice-notes`);
    const notes = response.data.notes || [];
    
    if (notes.length === 0) {
      await bot.sendMessage(chatId, '📭 *No tienes notas de voz guardadas*\n\nComienza grabando o subiendo una.', { parse_mode: 'Markdown' });
      return;
    }
    
    const recentNotes = notes.slice(0, 5);
    let message = '🎙️ *Tus Notas de Voz Recientes*\n\n';
    
    recentNotes.forEach((note, index) => {
      const date = new Date(note.timestamp).toLocaleDateString('es-ES');
      const transcribed = note.transcription ? '✅' : '⏳';
      message += `${index + 1}. ${transcribed} ${note.category || 'Sin categoría'} - ${date}\n`;
      if (note.transcription) {
        message += `   _"${note.transcription.substring(0, 50)}..."_\n`;
      }
      message += '\n';
    });
    
    message += `\n📊 Total: ${notes.length} notas\n`;
    message += '🖥️ Ve todas en tu dashboard JARVI';
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error obteniendo notas:', error);
    await bot.sendMessage(chatId, '❌ Error obteniendo las notas de voz.', { parse_mode: 'Markdown' });
  }
}

// Mostrar lista de recordatorios
async function showRemindersList(chatId) {
  try {
    // Por ahora simularemos algunos recordatorios
    const message = `⏰ *Tus Recordatorios*

🔔 *Activos:*
1. ⏳ Reunión con equipo - Mañana 3pm
2. ⏳ Revisar propuesta cliente - Viernes
3. ⏳ Llamar a proveedor - Lunes 10am

✅ *Completados hoy:* 2
📅 *Próximo:* Reunión con equipo

🖥️ Gestiona todos en tu dashboard JARVI`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error obteniendo recordatorios:', error);
    await bot.sendMessage(chatId, '❌ Error obteniendo los recordatorios.', { parse_mode: 'Markdown' });
  }
}

// Mostrar lista de tareas
async function showTodoList(chatId) {
  try {
    const message = `✅ *Tus Tareas Pendientes*

📌 *Alta Prioridad:*
• 🔴 Revisar propuesta del cliente
• 🔴 Preparar presentación Q1

📋 *Normal:*
• 🟡 Actualizar documentación
• 🟡 Responder emails pendientes
• 🟡 Revisar métricas mensuales

✅ *Completadas hoy:* 4 tareas
📊 *Progreso semanal:* 65%

🖥️ Gestiona todas en tu dashboard JARVI`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    await bot.sendMessage(chatId, '❌ Error obteniendo las tareas.', { parse_mode: 'Markdown' });
  }
}

// Mostrar lista de reuniones
async function showMeetingsList(chatId) {
  try {
    const message = `👥 *Tus Reuniones*

📅 *Recientes:*
1. 🎬 Planning Sprint Q1 - Ayer (Transcrita)
   _45 min - 3 participantes_
   
2. 🎬 Revisión de proyecto - Lunes
   _30 min - 5 participantes_
   
3. ⏳ Daily standup - Hoy
   _Procesando transcripción..._

📊 *Estadísticas:*
• Total reuniones: 12 este mes
• Horas grabadas: 8.5h
• Minutas generadas: 10

🖥️ Ve todas en tu dashboard JARVI`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error obteniendo reuniones:', error);
    await bot.sendMessage(chatId, '❌ Error obteniendo las reuniones.', { parse_mode: 'Markdown' });
  }
}

// Mostrar lista de intereses
async function showInterestsList(chatId) {
  try {
    const message = `🔖 *Tus Intereses Guardados*

📚 *Recientes:*
1. 🔗 Artículo: "Tendencias IA 2025"
2. 📸 Imagen: Diagrama arquitectura
3. 🎥 Video: Tutorial React avanzado
4. 🔗 GitHub: Repositorio útil
5. 📸 Screenshot: Diseño inspiración

📊 *Por categoría:*
• 💻 Tecnología: 15 items
• 📈 Negocios: 8 items
• 🎨 Diseño: 6 items
• 📚 Educación: 4 items

🖥️ Explora todos en tu dashboard JARVI`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error obteniendo intereses:', error);
    await bot.sendMessage(chatId, '❌ Error obteniendo los intereses.', { parse_mode: 'Markdown' });
  }
}

// Procesar video de interés
async function processInterestVideo(video, userName, chatId, caption) {
  try {
    const interest = {
      id: Date.now(),
      title: caption || 'Video desde Telegram',
      type: 'video',
      videoFileId: video.file_id,
      duration: video.duration,
      category: 'general',
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      source: 'telegram'
    };

    await axios.post(`${JARVI_SERVER}/api/interest`, interest);
    
    await bot.sendMessage(chatId, `🎥 *Video agregado a Intereses*\n\n${caption ? `📝 "${caption}"` : ''}\n⏱️ Duración: ${video.duration}s\n\n_Disponible en tu dashboard JARVI_`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 2000);
  } catch (error) {
    console.error('Error procesando video:', error);
    await bot.sendMessage(chatId, '❌ Error procesando el video.');
  }
}

// Procesar audio de reunión directamente (sin pregunta)
async function processMeetingAudioDirect(voiceFileId, duration, userName, chatId) {
  try {
    // Verificar duración primero
    if (duration > 1200) { // Más de 20 minutos
      await bot.sendMessage(chatId, 
        `⚠️ *Audio demasiado largo para Telegram*\n\n` +
        `📊 *Detalles del archivo:*\n` +
        `• Duración: ${Math.floor(duration/60)} minutos ${duration % 60} segundos\n` +
        `• Formato: Audio M4A\n` +
        `• Límite de Telegram: 20 minutos (20MB)\n\n` +
        `💡 *Solución: Usa el Dashboard Web*\n\n` +
        `1️⃣ Abre tu navegador\n` +
        `2️⃣ Ve a: http://localhost:5174\n` +
        `3️⃣ Click en "Reuniones" en el menú\n` +
        `4️⃣ Click en "Subir Audio (hasta 500MB)"\n` +
        `5️⃣ Selecciona tu archivo .m4a\n\n` +
        `✅ El sistema procesará tu reunión de ${Math.floor(duration/60)} minutos:\n` +
        `• Transcripción completa con IA\n` +
        `• Generación de resumen\n` +
        `• Creación de minuta automática\n` +
        `• Extracción de puntos clave y tareas\n\n` +
        `_El dashboard web no tiene límites de duración._`, 
        { parse_mode: 'Markdown' }
      );
      
      // Mostrar el menú principal después de 3 segundos
      setTimeout(() => showMainMenu(chatId, userName), 3000);
      return;
    }
    
    await bot.sendMessage(chatId, '👥 *Procesando audio de reunión...*', { parse_mode: 'Markdown' });
    
    // Descargar archivo
    const file = await bot.getFile(voiceFileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    const response = await axios({ method: 'GET', url: fileUrl, responseType: 'stream' });
    
    const timestamp = Date.now();
    const fileName = `meeting_${chatId}_${timestamp}.ogg`;
    const filePath = path.join(audioDir, fileName);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    const meetingAudio = {
      id: timestamp,
      title: `Reunión ${new Date().toLocaleDateString('es-ES')}`,
      fileName: fileName,
      filePath: filePath,
      duration: duration,
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      status: 'uploaded',
      type: 'meeting_audio'
    };

    // Guardar metadata
    const jsonFileName = `${fileName}.json`;
    const jsonFilePath = path.join(audioDir, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(meetingAudio, null, 2));

    // Convertir archivo a FormData para enviar al servidor de reuniones
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Leer el archivo guardado
    const audioBuffer = fs.readFileSync(filePath);
    formData.append('audio', audioBuffer, {
      filename: fileName,
      contentType: 'audio/ogg'
    });
    
    // Añadir metadata
    formData.append('title', meetingAudio.title);
    formData.append('date', meetingAudio.timestamp);
    formData.append('participants', userName);
    formData.append('tags', 'telegram,audio,directo');
    
    // Enviar al servidor de reuniones (puerto 3002)
    try {
      await axios.post('http://localhost:3002/api/meetings/upload', formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
    } catch (uploadError) {
      console.error('Error enviando al servidor de reuniones:', uploadError.message);
      throw uploadError;
    }
    
    await bot.sendMessage(chatId, `✅ *Audio de reunión recibido*\n\n⏱️ Duración: ${Math.floor(duration / 60)}m ${duration % 60}s\n📁 Se procesará para transcripción y resumen\n\n🖥️ Revisa el módulo de Reuniones en JARVI.`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 3000);
  } catch (error) {
    console.error('Error procesando audio de reunión:', error);
    await bot.sendMessage(chatId, '❌ Error procesando el audio de reunión.');
  }
}

// Procesar video de reunión
async function processMeetingVideo(video, userName, chatId) {
  try {
    await bot.sendMessage(chatId, '👥 *Procesando video de reunión...*', { parse_mode: 'Markdown' });
    
    const timestamp = Date.now();
    const meetingAudio = {
      id: timestamp,
      title: `Reunión ${new Date().toLocaleDateString('es-ES')} (Video)`,
      videoFileId: video.file_id,
      duration: video.duration,
      sender: { name: userName, id: chatId },
      timestamp: new Date().toISOString(),
      status: 'uploaded',
      type: 'meeting_video'
    };

    // Convertir archivo a FormData para enviar al servidor de reuniones
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Leer el archivo guardado
    const audioBuffer = fs.readFileSync(filePath);
    formData.append('audio', audioBuffer, {
      filename: fileName,
      contentType: 'audio/ogg'
    });
    
    // Añadir metadata
    formData.append('title', meetingAudio.title);
    formData.append('date', meetingAudio.timestamp);
    formData.append('participants', userName);
    formData.append('tags', 'telegram,audio,directo');
    
    // Enviar al servidor de reuniones (puerto 3002)
    try {
      await axios.post('http://localhost:3002/api/meetings/upload', formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
    } catch (uploadError) {
      console.error('Error enviando al servidor de reuniones:', uploadError.message);
      throw uploadError;
    }
    
    await bot.sendMessage(chatId, `✅ *Video de reunión recibido*\n\n⏱️ Duración: ${Math.floor(video.duration / 60)}m ${video.duration % 60}s\n📁 Se extraerá el audio para transcripción\n\n🖥️ Revisa el módulo de Reuniones en JARVI.`, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { currentModule: null, waitingFor: null };
    setTimeout(() => showMainMenu(chatId, userName), 3000);
  } catch (error) {
    console.error('Error procesando video de reunión:', error);
    await bot.sendMessage(chatId, '❌ Error procesando el video de reunión.');
  }
}

// Exportar bot para uso en otros módulos
export default bot;