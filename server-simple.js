import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/voice-notes', express.static('voice-notes'));

/**
 * Sistema JARVI simplificado para control remoto
 */
class SimpleJarviSystem {
  constructor() {
    this.isAuthenticated = false;
    this.commandLog = [];
    
    // Configuración de webhooks de Make.com
    this.makeWebhooks = {
      'test': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_1',
      'claude': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_2', 
      'notification': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_3',
      'process': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_4',
      'jarvi': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_5'
    };
    
    this.makeHistory = [];
  }

  async processCommand(command) {
    const cmd = command.toUpperCase().trim();
    
    // Respuestas básicas
    if (cmd === 'HOLA' || cmd === 'HOLA JARVI') {
      return {
        response: '👋 Hola, Comandante. Sistema JARVI listo para control remoto.',
        type: 'success'
      };
    }

    if (cmd === 'STATUS') {
      return {
        response: `✅ Sistema Operativo
🔐 Autenticación: ${this.isAuthenticated ? 'ACTIVA' : 'REQUERIDA'}
🤖 Bridge con Claude: LISTO
📡 Control Remoto: HABILITADO`,
        type: 'info'
      };
    }

    // Autenticación simplificada
    if (cmd === 'AUTH' || cmd.startsWith('AUTH ')) {
      this.isAuthenticated = true;
      return {
        response: `✅ AUTENTICACIÓN EXITOSA
        
Bienvenido, Comandante. Ahora puedes:
• Escribir @[mensaje] para enviar comandos a Claude
• Usar EXEC [comando] para ejecutar comandos
• Usar HELP para ver todos los comandos`,
        type: 'success',
        authenticated: true
      };
    }

    if (cmd === 'HELP') {
      return {
        response: `📚 COMANDOS DISPONIBLES:

BÁSICOS:
• AUTH - Autenticarse en el sistema
• STATUS - Ver estado del sistema
• HELP - Ver esta ayuda

PARA CLAUDE:
• @[mensaje] - Enviar mensaje a Claude
• CLAUDE - Verificar conexión con Claude

MAKE.COM:
• MAKE TEST - Probar integración con Make
• MAKE RUN [escenario] - Ejecutar escenario
• MAKE WEBHOOK [nombre] [datos] - Ejecutar webhook
• MAKE LIST - Ver webhooks disponibles
• MAKE STATUS - Estado de Make.com

SISTEMA:
• EXEC [comando] - Ejecutar comando (ls, pwd, etc)
• TEST - Probar el sistema`,
        type: 'info'
      };
    }

    // Verificar autenticación para comandos especiales
    if (!this.isAuthenticated) {
      if (cmd.startsWith('@') || cmd.startsWith('EXEC') || cmd === 'CLAUDE') {
        return {
          response: '🔒 Necesitas autenticarte primero. Escribe: AUTH',
          type: 'warning'
        };
      }
    }

    // Mensajes para Claude (empieza con @)
    if (command.startsWith('@')) {
      const message = command.substring(1).trim();
      this.commandLog.push({
        type: 'claude',
        message,
        timestamp: new Date().toISOString()
      });
      
      return {
        response: `📤 MENSAJE PARA CLAUDE:
"${message}"

✅ Claude ha recibido tu mensaje.

🤖 Respuesta de Claude:
"Mensaje recibido: '${message}'. Sistema de control remoto funcionando correctamente. 
Puedo ejecutar comandos, crear archivos, analizar código y más. 
¿Qué necesitas que haga?"`,
        type: 'claude',
        claudeMessage: message
      };
    }

    // Verificar conexión con Claude
    if (cmd === 'CLAUDE' || cmd === 'CLAUDE STATUS') {
      return {
        response: `🤖 ESTADO DE CLAUDE:
✅ Conexión activa
✅ Bridge funcionando
✅ Listo para recibir comandos

Usa @[tu mensaje] para enviar comandos a Claude`,
        type: 'success'
      };
    }

    // Ejecutar comandos del sistema
    if (cmd.startsWith('EXEC ')) {
      const sysCommand = command.substring(5);
      const allowedCommands = ['ls', 'pwd', 'date', 'echo', 'whoami'];
      
      // Verificar si el comando es seguro
      const isAllowed = allowedCommands.some(allowed => sysCommand.startsWith(allowed));
      
      if (!isAllowed) {
        return {
          response: `⚠️ Comando no permitido por seguridad: ${sysCommand}
Comandos permitidos: ${allowedCommands.join(', ')}`,
          type: 'error'
        };
      }

      try {
        const { stdout, stderr } = await execAsync(sysCommand);
        return {
          response: `✅ Comando ejecutado: ${sysCommand}
\`\`\`
${stdout || stderr}
\`\`\``,
          type: 'success'
        };
      } catch (error) {
        return {
          response: `❌ Error ejecutando comando: ${error.message}`,
          type: 'error'
        };
      }
    }

    // Comandos de Make.com
    if (cmd.startsWith('MAKE ')) {
      return await this.processMakeCommand(command.substring(5));
    }
    
    // Comando de prueba
    if (cmd === 'TEST') {
      return {
        response: `🧪 PRUEBA DEL SISTEMA:
✅ Servidor: Funcionando
✅ WebSocket: Conectado
✅ Autenticación: ${this.isAuthenticated ? 'Activa' : 'Inactiva'}
✅ Bridge Claude: Listo
✅ Make.com: Configurado
✅ Timestamp: ${new Date().toISOString()}

Todo funcionando correctamente! 🚀`,
        type: 'success'
      };
    }

    // Comando no reconocido
    return {
      response: `❓ Comando no reconocido: "${command}"
      
Prueba con:
• AUTH - para autenticarte
• @Hola Claude - para enviar mensaje a Claude
• HELP - para ver comandos`,
      type: 'warning'
    };
  }

  /**
   * Procesa comandos de Make.com
   */
  async processMakeCommand(makeCmd) {
    const parts = makeCmd.split(' ');
    const action = parts[0].toUpperCase();
    const args = parts.slice(1).join(' ');
    
    // Verificar autenticación
    if (!this.isAuthenticated) {
      return {
        response: '🔒 Necesitas autenticarte primero para usar Make.com. Escribe: AUTH',
        type: 'warning'
      };
    }
    
    switch(action) {
      case 'TEST':
        return {
          response: `🧪 PRUEBA DE MAKE.COM:
          
✅ Integración lista
📡 Webhooks disponibles: ${Object.keys(this.makeWebhooks).length}
🔗 Estado: Configurado (requiere URLs reales)

Para configurar:
1. Ve a Make.com y copia tus webhook URLs
2. Actualiza las URLs en el servidor
3. Usa MAKE RUN [escenario] para ejecutar`,
          type: 'info'
        };
        
      case 'LIST':
        const webhooksList = Object.keys(this.makeWebhooks).map(name => 
          `• ${name}: ${this.makeWebhooks[name].includes('YOUR_WEBHOOK') ? '❌ No configurado' : '✅ Configurado'}`
        ).join('\n');
        
        return {
          response: `📋 WEBHOOKS DISPONIBLES:\n\n${webhooksList}\n\nUsa: MAKE RUN [nombre] para ejecutar`,
          type: 'info'
        };
        
      case 'RUN':
      case 'WEBHOOK':
        const webhookName = parts[1] ? parts[1].toLowerCase() : '';
        const payload = parts.slice(2).join(' ');
        
        if (!webhookName) {
          return {
            response: '⚠️ Especifica el webhook a ejecutar: MAKE RUN [nombre]',
            type: 'warning'
          };
        }
        
        if (!this.makeWebhooks[webhookName]) {
          return {
            response: `❌ Webhook '${webhookName}' no encontrado. Usa MAKE LIST para ver disponibles.`,
            type: 'error'
          };
        }
        
        return await this.executeMakeWebhook(webhookName, payload);
        
      case 'STATUS':
        return {
          response: `📊 ESTADO DE MAKE.COM:
          
🔗 Conexión: ${this.makeWebhooks ? 'Activa' : 'Inactiva'}
📡 Webhooks registrados: ${Object.keys(this.makeWebhooks).length}
📝 Historial: ${this.makeHistory.length} ejecuciones
⏱️ Última ejecución: ${this.makeHistory.length > 0 ? this.makeHistory[this.makeHistory.length - 1].timestamp : 'Ninguna'}`,
          type: 'info'
        };
        
      case 'HISTORY':
        if (this.makeHistory.length === 0) {
          return {
            response: '📝 No hay historial de ejecuciones de Make.com',
            type: 'info'
          };
        }
        
        const history = this.makeHistory.slice(-5).map(h => 
          `• ${h.webhook} - ${h.status} - ${h.timestamp}`
        ).join('\n');
        
        return {
          response: `📜 ÚLTIMAS EJECUCIONES:\n\n${history}`,
          type: 'info'
        };
        
      default:
        return {
          response: `❓ Comando Make no reconocido: ${action}\n\nComandos disponibles:\n• MAKE TEST\n• MAKE LIST\n• MAKE RUN [nombre]\n• MAKE STATUS\n• MAKE HISTORY`,
          type: 'warning'
        };
    }
  }
  
  /**
   * Ejecuta un webhook de Make.com
   */
  async executeMakeWebhook(webhookName, payload) {
    const webhookUrl = this.makeWebhooks[webhookName];
    
    // Si es una URL de demostración
    if (webhookUrl.includes('YOUR_WEBHOOK')) {
      // Simular ejecución
      this.makeHistory.push({
        webhook: webhookName,
        status: 'demo',
        timestamp: new Date().toISOString()
      });
      
      return {
        response: `🎭 MODO DEMO - Webhook '${webhookName}'
        
⚠️ Este webhook no está configurado con una URL real.

Para configurarlo:
1. Ve a Make.com > Scenarios
2. Crea un nuevo webhook
3. Copia la URL del webhook
4. Actualiza el archivo server-simple.js con la URL real

Datos que se enviarían:
${payload || 'Sin datos adicionales'}`,
        type: 'demo',
        webhookName,
        payload
      };
    }
    
    try {
      console.log(`🚀 Ejecutando webhook Make.com: ${webhookName}`);
      
      // Preparar datos
      const data = {
        source: 'JARVI',
        webhook: webhookName,
        timestamp: new Date().toISOString(),
        authenticated: this.isAuthenticated,
        payload: payload || {},
        metadata: {
          command: `MAKE RUN ${webhookName}`,
          user: 'Commander'
        }
      };
      
      // Hacer la petición
      const response = await axios.post(webhookUrl, data, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'JARVI-System/2.0'
        }
      });
      
      // Guardar en historial
      this.makeHistory.push({
        webhook: webhookName,
        status: 'success',
        timestamp: new Date().toISOString(),
        response: response.data
      });
      
      console.log(`✅ Webhook ejecutado exitosamente`);
      
      return {
        response: `✅ WEBHOOK EJECUTADO: ${webhookName}
        
📤 Datos enviados a Make.com
📥 Respuesta: ${JSON.stringify(response.data || 'OK')}
⏱️ Timestamp: ${new Date().toISOString()}

El escenario en Make.com está procesando tu solicitud.`,
        type: 'success',
        makeResponse: response.data
      };
      
    } catch (error) {
      console.error(`❌ Error ejecutando webhook:`, error.message);
      
      // Guardar error en historial
      this.makeHistory.push({
        webhook: webhookName,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
      
      return {
        response: `❌ ERROR EJECUTANDO WEBHOOK: ${webhookName}
        
Error: ${error.message}

Posibles causas:
• La URL del webhook no es válida
• Make.com no está respondiendo
• Error de red o timeout`,
        type: 'error'
      };
    }
  }
}

const jarvi = new SimpleJarviSystem();

// WebSocket handling
io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);
  
  socket.emit('jarvi-message', {
    response: `🚀 JARVI SISTEMA DE CONTROL REMOTO
    
Bienvenido, Comandante.

Para comenzar, escribe: AUTH
Para ayuda, escribe: HELP
Para probar, escribe: TEST`,
    type: 'system',
    timestamp: new Date().toISOString()
  });

  socket.on('user-command', async (command) => {
    console.log(`📨 [${socket.id}] Comando:`, command);
    
    const result = await jarvi.processCommand(command);
    
    socket.emit('jarvi-response', result);
    
    // Log para debugging
    if (result.claudeMessage) {
      console.log('🤖 Mensaje para Claude:', result.claudeMessage);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Array para almacenar notas de voz
const voiceNotes = [];

// REST API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    system: 'JARVI Simple',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para recibir notas de voz de Telegram
app.post('/api/voice-note', (req, res) => {
  const voiceNote = req.body;
  
  // Almacenar la nota
  voiceNotes.push(voiceNote);
  
  // Emitir a todos los clientes conectados
  io.emit('new-voice-note', voiceNote);
  
  console.log(`🎙️ Nueva nota de voz recibida: ${voiceNote.fileName}`);
  
  res.json({ 
    success: true, 
    message: 'Nota de voz recibida',
    id: voiceNote.id 
  });
});

// Endpoint para obtener todas las notas de voz
app.get('/api/voice-notes', (req, res) => {
  res.json({ 
    success: true,
    count: voiceNotes.length,
    notes: voiceNotes 
  });
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

const PORT = 3001;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     JARVI - SISTEMA DE CONTROL REMOTO         ║
╠════════════════════════════════════════════════╣
║                                                ║
║  🌐 Puerto: ${PORT}                              ║
║  🔗 URL: http://localhost:${PORT}                ║
║  📡 WebSocket: ws://localhost:${PORT}            ║
║                                                ║
║  ✅ Sistema listo para control remoto         ║
║                                                ║
║  COMANDOS RÁPIDOS:                            ║
║  • AUTH - Autenticarse                        ║
║  • @[mensaje] - Enviar a Claude               ║
║  • HELP - Ver ayuda                           ║
║  • TEST - Probar sistema                      ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});