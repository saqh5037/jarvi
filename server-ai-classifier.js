import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { corsOptions } from './cors-config.mjs';

dotenv.config();

const app = express();
const PORT = 3005;

// Configuración de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Proyectos y configuración predefinida
const defaultProjects = {
  'jarvi': {
    keywords: ['jarvi', 'asistente', 'dashboard', 'módulo', 'componente', 'sistema'],
    description: 'Sistema principal de asistente personal'
  },
  'frontend': {
    keywords: ['react', 'vue', 'angular', 'componente', 'ui', 'interfaz', 'diseño', 'css', 'tailwind'],
    description: 'Desarrollo de interfaces de usuario'
  },
  'backend': {
    keywords: ['api', 'servidor', 'base de datos', 'endpoint', 'node', 'express', 'database'],
    description: 'Desarrollo de servicios backend'
  },
  'ia': {
    keywords: ['ia', 'inteligencia artificial', 'machine learning', 'gemini', 'claude', 'openai', 'prompt'],
    description: 'Proyectos de inteligencia artificial'
  }
};

// Niveles de prioridad
const priorityIndicators = {
  'critical': ['urgente', 'crítico', 'inmediato', 'ahora', 'asap', 'bloqueante', 'error crítico'],
  'high': ['importante', 'prioridad', 'necesario', 'debe', 'tienen que', 'requerido'],
  'medium': ['mejorar', 'optimizar', 'actualizar', 'cambiar', 'modificar'],
  'low': ['podría', 'sería bueno', 'opcional', 'cuando puedas', 'futuro', 'algún día']
};

// Categorías de trabajo
const workCategories = {
  'bugfix': ['bug', 'error', 'fix', 'arreglar', 'problema', 'fallo', 'no funciona', 'roto'],
  'feature': ['nueva función', 'añadir', 'implementar', 'crear', 'desarrollar', 'funcionalidad'],
  'refactor': ['refactorizar', 'mejorar código', 'optimizar', 'limpiar', 'reorganizar', 'reestructurar'],
  'documentation': ['documentar', 'documentación', 'readme', 'comentarios', 'explicar'],
  'testing': ['test', 'prueba', 'testing', 'verificar', 'validar', 'comprobar'],
  'design': ['diseño', 'ui', 'ux', 'interfaz', 'mockup', 'wireframe', 'prototipo'],
  'research': ['investigar', 'analizar', 'estudiar', 'explorar', 'buscar', 'entender']
};

// Función principal de clasificación con IA
async function classifyWithAI(content, context = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Analiza el siguiente contenido y proporciona una clasificación detallada en formato JSON.
    
    CONTENIDO A ANALIZAR:
    "${content}"
    
    CONTEXTO ADICIONAL:
    - Proyectos disponibles: ${JSON.stringify(Object.keys(defaultProjects))}
    - Fecha actual: ${new Date().toISOString()}
    ${context.currentProject ? `- Proyecto actual: ${context.currentProject}` : ''}
    
    INSTRUCCIONES:
    Debes responder ÚNICAMENTE con un objeto JSON válido (sin markdown, sin explicaciones) con la siguiente estructura:
    
    {
      "project": {
        "detected": "nombre del proyecto detectado o null",
        "confidence": número entre 0 y 100,
        "reasoning": "breve explicación de por qué"
      },
      "priority": {
        "level": "critical|high|medium|low",
        "confidence": número entre 0 y 100,
        "indicators": ["palabras clave encontradas"]
      },
      "category": {
        "main": "bugfix|feature|refactor|documentation|testing|design|research|other",
        "confidence": número entre 0 y 100
      },
      "tags": ["lista", "de", "tags", "relevantes", "máximo", "10"],
      "suggestedTitle": "título corto y descriptivo para este prompt",
      "complexity": {
        "level": "simple|medium|complex",
        "estimatedTime": "estimación en minutos u horas"
      },
      "technologies": ["tecnologías", "detectadas"],
      "sentiment": {
        "tone": "neutral|positive|negative|urgent",
        "emotion": "descripción breve"
      },
      "actionItems": ["lista", "de", "acciones", "concretas", "detectadas"],
      "risks": ["posibles", "riesgos", "o", "complicaciones"],
      "dependencies": ["dependencias", "detectadas"],
      "suggestedExperts": ["tipos", "de", "expertos", "necesarios"]
    }
    
    IMPORTANTE: 
    - Sé preciso y específico
    - Basa tus decisiones en el contenido real
    - Si no estás seguro, usa confidence bajo
    - Los tags deben ser palabras simples y relevantes
    - Responde SOLO con JSON válido, sin texto adicional
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpiar la respuesta para obtener solo el JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Intentar parsear el JSON
    try {
      const classification = JSON.parse(text);
      
      // Validar y completar campos faltantes
      return validateAndCompleteClassification(classification, content);
    } catch (parseError) {
      console.error('Error parseando respuesta de IA:', parseError);
      // Fallback a clasificación básica
      return basicClassification(content);
    }
  } catch (error) {
    console.error('Error en clasificación con IA:', error);
    // Fallback a clasificación básica
    return basicClassification(content);
  }
}

// Validar y completar la clasificación
function validateAndCompleteClassification(classification, content) {
  const validated = {
    project: classification.project || { detected: null, confidence: 0 },
    priority: classification.priority || { level: 'medium', confidence: 50 },
    category: classification.category || { main: 'other', confidence: 50 },
    tags: classification.tags || extractBasicTags(content),
    suggestedTitle: classification.suggestedTitle || content.substring(0, 50) + '...',
    complexity: classification.complexity || { level: 'medium', estimatedTime: '1-2 horas' },
    technologies: classification.technologies || [],
    sentiment: classification.sentiment || { tone: 'neutral', emotion: 'normal' },
    actionItems: classification.actionItems || [],
    risks: classification.risks || [],
    dependencies: classification.dependencies || [],
    suggestedExperts: classification.suggestedExperts || [],
    timestamp: new Date().toISOString(),
    aiModel: 'gemini-1.5-flash'
  };
  
  // Asegurar que los valores de confianza están en el rango correcto
  if (validated.project.confidence) {
    validated.project.confidence = Math.min(100, Math.max(0, validated.project.confidence));
  }
  if (validated.priority.confidence) {
    validated.priority.confidence = Math.min(100, Math.max(0, validated.priority.confidence));
  }
  if (validated.category.confidence) {
    validated.category.confidence = Math.min(100, Math.max(0, validated.category.confidence));
  }
  
  return validated;
}

// Clasificación básica sin IA (fallback)
function basicClassification(content) {
  const lowerContent = content.toLowerCase();
  
  // Detectar proyecto
  let detectedProject = null;
  let projectConfidence = 0;
  
  for (const [project, data] of Object.entries(defaultProjects)) {
    const matches = data.keywords.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    ).length;
    
    if (matches > 0) {
      const confidence = Math.min(95, matches * 20);
      if (confidence > projectConfidence) {
        detectedProject = project;
        projectConfidence = confidence;
      }
    }
  }
  
  // Detectar prioridad
  let priority = 'medium';
  let priorityConfidence = 50;
  
  for (const [level, indicators] of Object.entries(priorityIndicators)) {
    if (indicators.some(indicator => lowerContent.includes(indicator))) {
      priority = level;
      priorityConfidence = 80;
      break;
    }
  }
  
  // Detectar categoría
  let category = 'other';
  let categoryConfidence = 50;
  
  for (const [cat, keywords] of Object.entries(workCategories)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      category = cat;
      categoryConfidence = 75;
      break;
    }
  }
  
  // Extraer tags básicos
  const tags = extractBasicTags(content);
  
  return {
    project: {
      detected: detectedProject,
      confidence: projectConfidence,
      reasoning: 'Detección basada en palabras clave'
    },
    priority: {
      level: priority,
      confidence: priorityConfidence,
      indicators: []
    },
    category: {
      main: category,
      confidence: categoryConfidence
    },
    tags,
    suggestedTitle: content.substring(0, 50) + '...',
    complexity: {
      level: 'medium',
      estimatedTime: 'Por determinar'
    },
    technologies: extractTechnologies(content),
    sentiment: {
      tone: 'neutral',
      emotion: 'normal'
    },
    actionItems: [],
    risks: [],
    dependencies: [],
    suggestedExperts: [],
    timestamp: new Date().toISOString(),
    aiModel: 'fallback'
  };
}

// Extraer tags básicos del contenido
function extractBasicTags(content) {
  const tags = new Set();
  const lowerContent = content.toLowerCase();
  
  // Tecnologías comunes
  const techs = ['react', 'node', 'python', 'javascript', 'typescript', 'vue', 'angular', 
                 'docker', 'kubernetes', 'aws', 'api', 'database', 'sql', 'mongodb'];
  
  techs.forEach(tech => {
    if (lowerContent.includes(tech)) {
      tags.add(tech);
    }
  });
  
  // Acciones comunes
  const actions = ['crear', 'modificar', 'eliminar', 'actualizar', 'implementar', 
                   'diseñar', 'optimizar', 'corregir', 'mejorar'];
  
  actions.forEach(action => {
    if (lowerContent.includes(action)) {
      tags.add(action);
    }
  });
  
  // Limitar a 10 tags
  return Array.from(tags).slice(0, 10);
}

// Extraer tecnologías mencionadas
function extractTechnologies(content) {
  const technologies = [];
  const lowerContent = content.toLowerCase();
  
  const techList = [
    'react', 'vue', 'angular', 'node', 'express', 'python', 'django', 'flask',
    'javascript', 'typescript', 'html', 'css', 'tailwind', 'bootstrap',
    'mongodb', 'mysql', 'postgresql', 'redis', 'docker', 'kubernetes',
    'aws', 'gcp', 'azure', 'git', 'github', 'gitlab'
  ];
  
  techList.forEach(tech => {
    if (lowerContent.includes(tech)) {
      technologies.push(tech);
    }
  });
  
  return technologies;
}

// ==================== ENDPOINTS ====================

// Clasificar contenido
app.post('/api/classify', async (req, res) => {
  try {
    const { content, context } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contenido requerido' 
      });
    }
    
    const classification = await classifyWithAI(content, context || {});
    
    res.json({
      success: true,
      classification
    });
  } catch (error) {
    console.error('Error en clasificación:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Clasificación rápida (sin IA, solo reglas)
app.post('/api/classify/quick', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contenido requerido' 
      });
    }
    
    const classification = basicClassification(content);
    
    res.json({
      success: true,
      classification
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obtener sugerencias de tags
app.post('/api/suggest-tags', async (req, res) => {
  try {
    const { content, limit = 10 } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Extrae y sugiere tags relevantes del siguiente contenido.
    Responde SOLO con una lista de tags separados por comas, máximo ${limit} tags.
    Los tags deben ser palabras simples, en español, relevantes y útiles para categorización.
    
    Contenido: "${content}"
    
    Tags:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tags = response.text().split(',').map(tag => tag.trim()).filter(Boolean);
    
    res.json({
      success: true,
      tags: tags.slice(0, limit)
    });
  } catch (error) {
    // Fallback a extracción básica
    const tags = extractBasicTags(req.body.content);
    res.json({
      success: true,
      tags,
      fallback: true
    });
  }
});

// Detectar prioridad
app.post('/api/detect-priority', (req, res) => {
  try {
    const { content } = req.body;
    const lowerContent = content.toLowerCase();
    
    let priority = 'medium';
    let confidence = 50;
    let indicators = [];
    
    for (const [level, keywords] of Object.entries(priorityIndicators)) {
      const found = keywords.filter(keyword => lowerContent.includes(keyword));
      if (found.length > 0) {
        priority = level;
        confidence = Math.min(95, found.length * 30);
        indicators = found;
        break;
      }
    }
    
    res.json({
      success: true,
      priority: {
        level: priority,
        confidence,
        indicators
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generar prompts automáticamente
app.post('/api/generate-prompts', async (req, res) => {
  try {
    const { transcription, modules, maxLength = 200, themes = [] } = req.body;
    
    if (!transcription || !modules || modules.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transcripción y módulos requeridos' 
      });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Basándote en la siguiente transcripción, genera prompts específicos para cada módulo.
    
    TRANSCRIPCIÓN:
    "${transcription}"
    
    TEMAS IDENTIFICADOS:
    ${themes.join(', ')}
    
    MÓDULOS Y SUS TEMPLATES:
    ${modules.map(m => `- ${m.name}: ${m.promptTemplate}`).join('\n')}
    
    INSTRUCCIONES:
    1. Genera un prompt específico para cada módulo
    2. Cada prompt debe ser conciso y claro (máximo ${maxLength} caracteres)
    3. Adapta el contenido de la transcripción al formato del módulo
    4. Mantén la información más relevante
    5. Si detectas fechas, nombres o datos específicos, inclúyelos
    
    Responde ÚNICAMENTE con un array JSON con esta estructura:
    [
      {
        "module": "nombre del módulo",
        "moduleId": "id del módulo",
        "icon": "icono del módulo",
        "prompt": "el prompt generado",
        "confidence": número entre 0 y 100,
        "themes": ["temas", "relevantes"]
      }
    ]`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpiar respuesta
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const prompts = JSON.parse(text);
      
      // Validar y ajustar longitud si es necesario
      const validatedPrompts = prompts.map(p => ({
        ...p,
        prompt: p.prompt.length > maxLength 
          ? p.prompt.substring(0, maxLength - 3) + '...' 
          : p.prompt,
        confidence: Math.min(100, Math.max(0, p.confidence || 75))
      }));
      
      res.json({
        success: true,
        prompts: validatedPrompts
      });
    } catch (parseError) {
      // Fallback: generar prompts básicos
      const fallbackPrompts = modules.map(module => ({
        module: module.name,
        moduleId: module.id,
        icon: module.icon,
        prompt: `${module.name}: ${transcription.substring(0, maxLength - module.name.length - 2)}`,
        confidence: 65,
        themes: themes.slice(0, 3)
      }));
      
      res.json({
        success: true,
        prompts: fallbackPrompts,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error generando prompts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Analizar complejidad
app.post('/api/analyze-complexity', async (req, res) => {
  try {
    const { content } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Analiza la complejidad de la siguiente tarea y responde SOLO con JSON:
    
    "${content}"
    
    {
      "level": "simple|medium|complex",
      "estimatedTime": "X minutos/horas/días",
      "reasoning": "breve explicación",
      "subtasks": ["lista", "de", "subtareas", "si", "aplica"]
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const complexity = JSON.parse(text);
      res.json({
        success: true,
        complexity
      });
    } catch {
      res.json({
        success: true,
        complexity: {
          level: 'medium',
          estimatedTime: 'Por determinar',
          reasoning: 'Análisis automático no disponible'
        }
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== INICIALIZACIÓN ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════╗
║     JARVI AI CLASSIFIER                   ║
║     Sistema de Clasificación con IA       ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                             ║
║  IA: Gemini 1.5 Flash                     ║
║  Estado: Activo                           ║
║                                            ║
║  Características:                          ║
║  • Clasificación automática con IA        ║
║  • Detección de proyecto                  ║
║  • Análisis de prioridad                  ║
║  • Extracción de tags                     ║
║  • Categorización inteligente             ║
║  • Análisis de complejidad                ║
║  • Detección de sentimiento               ║
╚════════════════════════════════════════════╝
  `);
});