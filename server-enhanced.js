import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jarviBridge from './jarvi-bridge.js';

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

/**
 * Sistema JARVI mejorado con bridge a Claude
 */
class EnhancedJarviSystem {
  constructor() {
    this.authenticatedSessions = new Set();
    
    this.responses = {
      'HOLA': 'Hola, Comandante. Sistema JARVI con bridge a Claude activo.',
      'HOLA JARVI': 'Hola. Sistema de control remoto listo. Use AUTH para autenticarse.',
      'STATUS': 'Sistema operativo. Bridge con Claude: ACTIVO. Modo: Control Remoto.',
      'HELP': `Comandos disponibles:
        - AUTH [contraseña] - Autenticarse en el sistema
        - CLAUDE [comando] - Enviar comando a Claude
        - EXEC [comando] - Ejecutar comando del sistema
        - CODE [código] - Ejecutar código
        - HISTORY - Ver historial
        - CLEAR - Limpiar historial`,
    };
  }

  async processCommand(command, sessionId) {
    const parts = command.split(' ');
    const cmd = parts[0].toUpperCase();
    const args = parts.slice(1).join(' ');

    // Comandos básicos
    if (this.responses[command.toUpperCase()]) {
      return {
        response: this.responses[command.toUpperCase()],
        type: 'info',
        timestamp: new Date().toISOString()
      };
    }

    // Autenticación
    if (cmd === 'AUTH') {
      const result = jarviBridge.authenticate(args || 'JARVI-COMMANDER-2024-SECURE');
      
      if (result.success) {
        this.authenticatedSessions.add(sessionId);
      }
      
      return {
        response: result.message,
        type: result.success ? 'success' : 'error',
        authenticated: result.success
      };
    }

    // Verificar autenticación para comandos sensibles
    if (!this.authenticatedSessions.has(sessionId)) {
      if (cmd === 'CLAUDE' || cmd === 'EXEC' || cmd === 'CODE') {
        return {
          response: '🔒 Necesitas autenticarte primero. Use: AUTH [contraseña]',
          type: 'warning',
          requiresAuth: true
        };
      }
    }

    // Comandos de Claude
    if (cmd === 'CLAUDE') {
      const claudeCommand = args.split(' ')[0];
      const claudeParams = args.split(' ').slice(1).join(' ');
      
      const result = await jarviBridge.processClaudeCommand(
        claudeCommand || 'STATUS',
        { params: claudeParams }
      );
      
      return {
        response: this.formatClaudeResponse(result),
        type: result.success ? 'success' : 'error',
        data: result.data
      };
    }

    // Ejecutar comando del sistema
    if (cmd === 'EXEC') {
      const result = await jarviBridge.executeSystemCommand(args);
      
      return {
        response: result.success 
          ? `✅ Comando ejecutado:\n${result.output}`
          : `❌ Error: ${result.error || result.message}`,
        type: result.success ? 'success' : 'error',
        output: result.output
      };
    }

    // Ejecutar código
    if (cmd === 'CODE') {
      const language = args.startsWith('python') ? 'python' : 'javascript';
      const code = args.replace(/^(python|javascript)\s+/, '');
      
      const result = await jarviBridge.executeCode(code, language);
      
      return {
        response: result.success 
          ? `✅ Código ejecutado:\n${result.output}`
          : `❌ Error: ${result.error}`,
        type: result.success ? 'success' : 'error'
      };
    }

    // Historial
    if (cmd === 'HISTORY') {
      const history = jarviBridge.getHistory(10);
      return {
        response: history.length > 0 
          ? `📜 Últimos comandos:\n${history.map(h => `• ${h.message}`).join('\n')}`
          : 'No hay historial',
        type: 'info'
      };
    }

    // Limpiar historial
    if (cmd === 'CLEAR') {
      jarviBridge.clearHistory();
      return {
        response: '🗑️ Historial limpiado',
        type: 'success'
      };
    }

    // Si empieza con @ es un comando directo para Claude
    if (command.startsWith('@')) {
      const claudeMessage = command.substring(1);
      return {
        response: `📤 Mensaje enviado a Claude: "${claudeMessage}"
        
🤖 Para que Claude responda, necesitas:
1. Copiar este mensaje
2. Pegarlo en el chat de Claude
3. Claude ejecutará la acción solicitada`,
        type: 'claude',
        claudeMessage
      };
    }

    // Comando no reconocido
    return {
      response: `❓ Comando no reconocido: ${command}
Use HELP para ver comandos disponibles.
Use @ seguido de tu mensaje para enviar directamente a Claude.`,
      type: 'warning'
    };
  }

  formatClaudeResponse(result) {
    if (result.data) {
      if (typeof result.data === 'object') {
        return `${result.message}\n\n${JSON.stringify(result.data, null, 2)}`;
      }
      return `${result.message}\n\n${result.data}`;
    }
    return result.message;
  }
}

const jarviSystem = new EnhancedJarviSystem();

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.emit('jarvi-message', {
    response: `🚀 Sistema JARVI con Bridge a Claude conectado.
    
🔐 Para control remoto use: AUTH [contraseña]
📡 Para comandos a Claude use: CLAUDE [comando] o @[mensaje]
💻 Para ejecutar comandos use: EXEC [comando]
❓ Use HELP para más información`,
    type: 'system',
    timestamp: new Date().toISOString()
  });

  socket.on('user-command', async (command) => {
    console.log(`[${socket.id}] Comando:`, command);
    
    const result = await jarviSystem.processCommand(command, socket.id);
    
    socket.emit('jarvi-response', result);
    
    // Si es un comando para Claude, guardarlo para referencia
    if (result.claudeMessage) {
      jarviBridge.log('claude', `Mensaje para Claude: ${result.claudeMessage}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    jarviSystem.authenticatedSessions.delete(socket.id);
  });
});

// REST API endpoints
app.post('/api/command', async (req, res) => {
  const { command, sessionId } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Comando requerido' });
  }
  
  const result = await jarviSystem.processCommand(
    command, 
    sessionId || 'api-' + Date.now()
  );
  
  res.json(result);
});

app.post('/api/claude', async (req, res) => {
  const { message, auth } = req.body;
  
  // Verificar autenticación
  if (auth !== 'JARVI-COMMANDER-2024-SECURE') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  // Este endpoint puede ser usado para enviar mensajes directos a Claude
  res.json({
    success: true,
    message: 'Mensaje recibido para Claude',
    instruction: 'Copia el siguiente comando en Claude:',
    command: message
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    system: 'JARVI Enhanced',
    version: '2.0.0',
    bridge: 'active',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║     JARVI ENHANCED SERVER - SISTEMA ACTIVO           ║
╠══════════════════════════════════════════════════════╣
║  Puerto: ${PORT}                                        ║
║  WebSocket: ws://localhost:${PORT}                      ║
║  API REST: http://localhost:${PORT}/api                 ║
║                                                       ║
║  🔗 Bridge con Claude: ACTIVO                        ║
║  🔐 Autenticación: REQUERIDA                         ║
║  📡 Control Remoto: HABILITADO                       ║
║                                                       ║
║  Contraseña por defecto: JARVI-COMMANDER-2024-SECURE ║
╚══════════════════════════════════════════════════════╝
  `);
});