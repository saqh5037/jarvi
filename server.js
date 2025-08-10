import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

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
 * Sistema de respuestas de JARVI
 * Procesa comandos y genera respuestas inteligentes
 */
class JarviSystem {
  constructor() {
    this.responses = {
      'HOLA': 'Hola, Comandante. Sistema JARVI operativo y listo para asistir.',
      'HOLA JARVI': 'Hola IA. ¿En qué puedo asistirle hoy?',
      'STATUS': 'Todos los sistemas operativos. 5 GEMS activas. Sin amenazas detectadas.',
      'HELP': 'Comandos disponibles: HOLA, STATUS, ANALYZE, REPORT, SCAN, EMERGENCY',
      'ANALYZE': 'Iniciando análisis profundo del sistema... Análisis completado. Sin anomalías detectadas.',
      'REPORT': 'Generando reporte... CPU: 72%, Memoria: 68%, Red: Estable, Seguridad: Óptima',
      'SCAN': 'Escaneando sistemas... 100% completado. Todos los sistemas seguros.',
      'EMERGENCY': '🚨 Protocolo de emergencia activado. Todos los sistemas en alerta máxima.',
      'QUIEN ERES': 'Soy JARVI, su asistente de Inteligencia Artificial. Centro de Comando Multi-IA a su servicio.',
      'QUE PUEDES HACER': 'Puedo analizar datos, monitorear sistemas, ejecutar comandos, coordinar GEMS y asistir en la toma de decisiones.',
    };
  }

  processCommand(command) {
    const cmd = command.toUpperCase().trim();
    
    // Buscar respuesta exacta
    if (this.responses[cmd]) {
      return {
        response: this.responses[cmd],
        type: 'success',
        timestamp: new Date().toISOString()
      };
    }

    // Respuestas contextuales
    if (cmd.includes('HOLA')) {
      return {
        response: 'Saludos, Comandante. ¿Cómo puedo asistirle?',
        type: 'success',
        timestamp: new Date().toISOString()
      };
    }

    if (cmd.includes('GRACIAS')) {
      return {
        response: 'Es un placer servir, Comandante.',
        type: 'success',
        timestamp: new Date().toISOString()
      };
    }

    if (cmd.includes('ADIOS') || cmd.includes('SALIR')) {
      return {
        response: 'Hasta luego, Comandante. JARVI permanecerá en modo de espera.',
        type: 'info',
        timestamp: new Date().toISOString()
      };
    }

    // Comando no reconocido
    return {
      response: `Comando "${command}" no reconocido. Use HELP para ver comandos disponibles.`,
      type: 'warning',
      timestamp: new Date().toISOString()
    };
  }
}

const jarvi = new JarviSystem();

// Manejo de conexiones WebSocket
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Mensaje de bienvenida
  socket.emit('jarvi-message', {
    response: 'Sistema JARVI conectado. Bienvenido al Centro de Comando.',
    type: 'system',
    timestamp: new Date().toISOString()
  });

  // Recibir comandos del cliente
  socket.on('user-command', (command) => {
    console.log('Comando recibido:', command);
    
    // Procesar comando
    const result = jarvi.processCommand(command);
    
    // Enviar respuesta
    socket.emit('jarvi-response', result);
    
    // Broadcast a todos los clientes (para múltiples ventanas)
    socket.broadcast.emit('jarvi-broadcast', {
      command,
      ...result
    });
  });

  // Manejo de desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Endpoint REST como alternativa
app.post('/api/command', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Comando requerido' });
  }
  
  const result = jarvi.processCommand(command);
  res.json(result);
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    system: 'JARVI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       JARVI SERVER - SISTEMA ACTIVO      ║
╠══════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  WebSocket: ws://localhost:${PORT}          ║
║  API REST: http://localhost:${PORT}/api     ║
║                                          ║
║  Sistema listo para recibir comandos     ║
╚══════════════════════════════════════════╝
  `);
});