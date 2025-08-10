import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Configuración
const PORT = 3004;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Directorio de datos
const dataDir = path.join(__dirname, 'voice-notes', 'data');
const notesFile = path.join(dataDir, 'notes.json');
const promptsFile = path.join(dataDir, 'prompts.json');
const processedFile = path.join(dataDir, 'processed.json');

// Asegurar que existe el directorio
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(__dirname, 'voice-notes'), { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
    
    // Inicializar archivos si no existen
    try {
      await fs.access(notesFile);
    } catch {
      await fs.writeFile(notesFile, JSON.stringify([]), 'utf8');
    }
    
    try {
      await fs.access(promptsFile);
    } catch {
      const defaultPrompts = [
        {
          id: 'summary',
          name: 'Resumen ejecutivo',
          prompt: 'Resume esta nota de voz en puntos clave, destacando las ideas principales y acciones requeridas.',
          icon: '📝'
        },
        {
          id: 'tasks',
          name: 'Extraer tareas',
          prompt: 'Identifica y lista todas las tareas, acciones o compromisos mencionados en esta nota de voz. Incluye fechas límite si se mencionan.',
          icon: '✅'
        },
        {
          id: 'meeting',
          name: 'Minuta de reunión',
          prompt: 'Convierte esta nota en una minuta formal de reunión con: participantes, temas discutidos, decisiones tomadas, tareas asignadas y próximos pasos.',
          icon: '👥'
        },
        {
          id: 'ideas',
          name: 'Capturar ideas',
          prompt: 'Extrae todas las ideas, sugerencias y propuestas creativas mencionadas. Organízalas por temas y evalúa su potencial.',
          icon: '💡'
        },
        {
          id: 'improve',
          name: 'Mejorar instrucciones',
          prompt: 'Toma estas instrucciones de voz y conviértelas en un prompt claro, estructurado y preciso para una IA. Mejora la claridad, añade contexto relevante y estructura la solicitud de manera óptima.',
          icon: '🎯'
        },
        {
          id: 'code',
          name: 'Generar código',
          prompt: 'Basándote en las especificaciones de esta nota de voz, genera el código necesario con comentarios explicativos. Incluye manejo de errores y documentación.',
          icon: '💻'
        },
        {
          id: 'code-python',
          name: 'Código Python',
          prompt: 'Genera código Python limpio y funcional basado en esta descripción. Incluye: 1) Docstrings para funciones, 2) Type hints cuando sea apropiado, 3) Manejo de errores, 4) Ejemplo de uso al final.',
          icon: '🐍'
        },
        {
          id: 'code-javascript',
          name: 'Código JavaScript',
          prompt: 'Genera código JavaScript moderno (ES6+) basado en esta descripción. Incluye: 1) JSDoc comments, 2) Manejo de errores con try-catch, 3) Uso de async/await si es necesario, 4) Ejemplo de uso.',
          icon: '🟨'
        },
        {
          id: 'code-react',
          name: 'Componente React',
          prompt: 'Genera un componente React funcional basado en esta descripción. Incluye: 1) Hooks apropiados, 2) PropTypes o TypeScript types, 3) Estilos con Tailwind CSS, 4) Manejo de estado y eventos.',
          icon: '⚛️'
        }
      ];
      await fs.writeFile(promptsFile, JSON.stringify(defaultPrompts), 'utf8');
    }
    
    try {
      await fs.access(processedFile);
    } catch {
      await fs.writeFile(processedFile, JSON.stringify([]), 'utf8');
    }
  } catch (error) {
    console.error('Error creando directorios:', error);
  }
}

// ==================== FUNCIONES DE PROCESAMIENTO ====================

// Procesar nota de voz con prompt mejorado
async function processVoiceNoteWithPrompt(transcription, promptType, customPrompt = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Cargar prompts predefinidos
    const prompts = JSON.parse(await fs.readFile(promptsFile, 'utf8'));
    let basePrompt = '';
    
    if (customPrompt) {
      basePrompt = customPrompt;
    } else if (promptType) {
      const promptTemplate = prompts.find(p => p.id === promptType);
      if (promptTemplate) {
        basePrompt = promptTemplate.prompt;
      }
    }
    
    // Detectar si es un prompt de generación de código
    const isCodeGeneration = promptType && promptType.startsWith('code');
    
    // Mejorar el prompt con contexto adicional
    const enhancedPrompt = isCodeGeneration ? `
CONTEXTO: Eres un experto programador. Tu objetivo es generar código limpio, eficiente y bien documentado basado en las especificaciones proporcionadas.

ESPECIFICACIÓN (desde nota de voz):
"""
${transcription}
"""

INSTRUCCIONES DE GENERACIÓN:
${basePrompt}

REQUISITOS DEL CÓDIGO:
- El código debe ser completamente funcional
- Incluir comentarios explicativos en partes complejas
- Seguir las mejores prácticas del lenguaje
- Incluir manejo de errores apropiado
- Proporcionar al menos un ejemplo de uso
- Usar nombres descriptivos para variables y funciones
- Optimizar para legibilidad y mantenibilidad

FORMATO DE SALIDA:
\`\`\`[lenguaje]
// Código aquí
\`\`\`

CÓDIGO GENERADO:` : `
CONTEXTO: Estás procesando una nota de voz transcrita. Tu objetivo es extraer información valiosa y procesarla según las instrucciones.

TRANSCRIPCIÓN DE LA NOTA DE VOZ:
"""
${transcription}
"""

INSTRUCCIONES DE PROCESAMIENTO:
${basePrompt}

FORMATO DE RESPUESTA:
- Sé claro y conciso
- Usa formato markdown cuando sea apropiado
- Resalta los puntos más importantes
- Si identificas acciones, incluye prioridad y fechas sugeridas
- Mantén un tono profesional pero accesible

RESPUESTA:`;
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const processedText = response.text();
    
    return {
      original: transcription,
      processed: processedText,
      promptUsed: basePrompt,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error procesando con Gemini:', error);
    throw error;
  }
}

// Mejorar prompt para Claude
async function improvePromptForClaude(userInstructions, context = '') {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const improvePrompt = `
Eres un experto en crear prompts para Claude (Anthropic). Tu tarea es tomar instrucciones de voz del usuario y convertirlas en un prompt optimizado.

INSTRUCCIONES ORIGINALES DEL USUARIO:
"""
${userInstructions}
"""

${context ? `CONTEXTO ADICIONAL:\n${context}\n` : ''}

GENERA UN PROMPT MEJORADO QUE:
1. Sea claro, específico y bien estructurado
2. Incluya contexto relevante
3. Defina claramente el objetivo
4. Especifique el formato de salida deseado
5. Incluya ejemplos si es útil
6. Use las mejores prácticas para prompts de Claude
7. Mantenga la intención original del usuario
8. Añada restricciones o consideraciones importantes

FORMATO DEL PROMPT MEJORADO:
- Usa formato markdown
- Separa claramente las secciones
- Incluye instrucciones paso a paso si es necesario
- Hazlo copiable y listo para usar

PROMPT MEJORADO:`;
    
    const result = await model.generateContent(improvePrompt);
    const response = await result.response;
    const improvedPrompt = response.text();
    
    return {
      original: userInstructions,
      improved: improvedPrompt,
      timestamp: new Date().toISOString(),
      readyForClaude: true
    };
  } catch (error) {
    console.error('Error mejorando prompt:', error);
    throw error;
  }
}

// ==================== RUTAS API ====================

// Obtener todas las notas de voz
app.get('/api/voice-notes', async (req, res) => {
  try {
    const notes = JSON.parse(await fs.readFile(notesFile, 'utf8'));
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error obteniendo notas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Procesar nota de voz con prompt
app.post('/api/voice-notes/process', async (req, res) => {
  try {
    const { noteId, transcription, promptType, customPrompt } = req.body;
    
    if (!transcription) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere transcripción' 
      });
    }
    
    const result = await processVoiceNoteWithPrompt(transcription, promptType, customPrompt);
    
    // Guardar resultado procesado
    const processed = JSON.parse(await fs.readFile(processedFile, 'utf8'));
    processed.push({
      id: Date.now().toString(),
      noteId,
      ...result
    });
    await fs.writeFile(processedFile, JSON.stringify(processed, null, 2));
    
    // Emitir actualización
    io.emit('note-processed', {
      noteId,
      result
    });
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error procesando nota:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mejorar prompt para Claude
app.post('/api/voice-notes/improve-prompt', async (req, res) => {
  try {
    const { instructions, context } = req.body;
    
    if (!instructions) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requieren instrucciones' 
      });
    }
    
    const result = await improvePromptForClaude(instructions, context);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error mejorando prompt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener prompts disponibles
app.get('/api/voice-notes/prompts', async (req, res) => {
  try {
    const prompts = JSON.parse(await fs.readFile(promptsFile, 'utf8'));
    res.json({ success: true, prompts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Guardar prompt personalizado
app.post('/api/voice-notes/prompts', async (req, res) => {
  try {
    const { name, prompt, icon = '📋' } = req.body;
    
    if (!name || !prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere nombre y prompt' 
      });
    }
    
    const prompts = JSON.parse(await fs.readFile(promptsFile, 'utf8'));
    const newPrompt = {
      id: Date.now().toString(),
      name,
      prompt,
      icon,
      custom: true,
      createdAt: new Date().toISOString()
    };
    
    prompts.push(newPrompt);
    await fs.writeFile(promptsFile, JSON.stringify(prompts, null, 2));
    
    io.emit('prompt-created', newPrompt);
    
    res.json({ success: true, prompt: newPrompt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compartir con Claude (preparar el prompt)
app.post('/api/voice-notes/share-claude', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    // Formatear para Claude
    const claudeReady = {
      prompt: prompt,
      context: context || '',
      timestamp: new Date().toISOString(),
      instructions: `
Para usar este prompt en Claude:
1. Copia el texto completo del prompt
2. Pégalo en Claude
3. Añade cualquier contexto adicional necesario
4. Claude procesará según estas instrucciones optimizadas
      `.trim(),
      formatted: `
# Prompt para Claude

${prompt}

${context ? `## Contexto adicional\n${context}` : ''}

---
*Generado por JARVI Voice Notes - ${new Date().toLocaleString('es-ES')}*
      `.trim()
    };
    
    res.json({ success: true, claudeReady });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener historial procesado
app.get('/api/voice-notes/processed', async (req, res) => {
  try {
    const processed = JSON.parse(await fs.readFile(processedFile, 'utf8'));
    res.json({ success: true, processed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('process-note', async (data) => {
    try {
      const result = await processVoiceNoteWithPrompt(
        data.transcription, 
        data.promptType, 
        data.customPrompt
      );
      socket.emit('processing-complete', result);
    } catch (error) {
      socket.emit('processing-error', error.message);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// ==================== INICIALIZACIÓN ====================

async function init() {
  await ensureDataDir();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════╗
║     JARVI VOICE NOTES PROCESSOR           ║
║     Servidor de Procesamiento Inteligente ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                              ║
║  WebSocket: Activo                        ║
║  Gemini AI: Integrado                     ║
║  Prompts inteligentes: Activos            ║
╚════════════════════════════════════════════╝
    `);
  });
}

init().catch(console.error);

export { app, io };