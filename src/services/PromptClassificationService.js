// Servicio de Clasificación Automática de Prompts
export class PromptClassificationService {
  constructor() {
    this.globalConfig = null;
    this.loadGlobalConfig();
  }

  loadGlobalConfig() {
    const config = localStorage.getItem('jarvi-global-config');
    if (config) {
      this.globalConfig = JSON.parse(config);
    }
  }

  // Clasificación automática basada en análisis del contenido
  async classifyPrompt(promptContent, context = {}) {
    // Recargar configuración global por si cambió
    this.loadGlobalConfig();
    
    const promptLower = promptContent.toLowerCase();
    const classification = {
      rating: 0,
      projects: [],
      tags: [],
      category: '',
      priority: 'medium',
      status: 'pending',
      complexity: 'medium',
      effectiveness: 'pending',
      confidence: 0,
      classifiedAt: new Date().toISOString(),
      method: 'automatic'
    };

    // Detectar proyectos basándose en palabras clave
    classification.projects = this.detectProjects(promptLower, context);
    
    // Detectar tags relevantes
    classification.tags = this.detectTags(promptLower);
    
    // Determinar categoría
    classification.category = this.detectCategory(promptLower);
    
    // Determinar prioridad
    classification.priority = this.detectPriority(promptLower);
    
    // Determinar complejidad
    classification.complexity = this.detectComplexity(promptContent);
    
    // Calcular rating automático
    classification.rating = this.calculateRating(classification, promptContent);
    
    // Calcular confianza de la clasificación
    classification.confidence = this.calculateConfidence(classification);
    
    return classification;
  }

  detectProjects(promptLower, context) {
    const detectedProjects = [];
    
    // Proyecto por defecto si hay contexto
    if (context.currentProject) {
      detectedProjects.push(context.currentProject);
    }
    
    // Usar proyectos de la configuración global si está disponible
    if (this.globalConfig?.globalProjects) {
      this.globalConfig.globalProjects.forEach(project => {
        // Detectar por nombre del proyecto
        if (promptLower.includes(project.name.toLowerCase())) {
          if (!detectedProjects.includes(project.name)) {
            detectedProjects.push(project.name);
          }
        }
        
        // Detectar por tags del proyecto
        if (project.tags) {
          project.tags.forEach(tag => {
            if (promptLower.includes(tag.toLowerCase())) {
              if (!detectedProjects.includes(project.name)) {
                detectedProjects.push(project.name);
              }
            }
          });
        }
      });
    } else {
      // Fallback: Detectar proyectos basándose en palabras clave por defecto
      const projectKeywords = {
        'JARVI': ['jarvi', 'asistente', 'voz', 'notas de voz', 'transcripción'],
        'Dashboard': ['dashboard', 'panel', 'métricas', 'estadísticas'],
        'API Backend': ['api', 'backend', 'servidor', 'endpoint', 'rest'],
        'Frontend': ['react', 'componente', 'interfaz', 'ui', 'ux'],
        'Mobile': ['móvil', 'mobile', 'app', 'android', 'ios'],
        'DevOps': ['docker', 'kubernetes', 'deploy', 'despliegue', 'ci/cd'],
        'Database': ['base de datos', 'database', 'sql', 'mongodb', 'postgres']
      };
      
      for (const [project, keywords] of Object.entries(projectKeywords)) {
        if (keywords.some(keyword => promptLower.includes(keyword))) {
          if (!detectedProjects.includes(project)) {
            detectedProjects.push(project);
          }
        }
      }
    }
    
    return detectedProjects;
  }

  detectTags(promptLower) {
    const detectedTags = [];
    
    // Usar tags de la configuración global si está disponible
    if (this.globalConfig?.globalTags) {
      this.globalConfig.globalTags.forEach(tag => {
        const tagName = tag.name || tag.id;
        if (promptLower.includes(tagName.toLowerCase())) {
          if (!detectedTags.includes(tagName)) {
            detectedTags.push(tagName);
          }
        }
      });
    }
    
    // Tags basados en tecnologías (fallback si no hay suficientes tags detectados)
    if (detectedTags.length < 2) {
      const techTags = {
        'React': ['react', 'jsx', 'componente', 'hooks', 'usestate', 'useeffect'],
        'NodeJS': ['node', 'nodejs', 'express', 'npm'],
        'Python': ['python', 'pip', 'django', 'flask'],
        'Database': ['database', 'db', 'sql', 'query', 'tabla', 'schema'],
        'API': ['api', 'rest', 'graphql', 'endpoint'],
        'UI/UX': ['ui', 'ux', 'interfaz', 'diseño', 'mockup', 'wireframe'],
        'Testing': ['test', 'prueba', 'jest', 'cypress', 'unittest'],
        'Security': ['seguridad', 'security', 'autenticación', 'autorización', 'token'],
        'Performance': ['rendimiento', 'performance', 'optimización', 'velocidad'],
        'Documentation': ['documentación', 'readme', 'docs', 'comentarios']
      };
      
      // Tags basados en tipo de tarea
      const taskTags = {
        'Feature': ['nueva funcionalidad', 'feature', 'implementar', 'agregar'],
        'Bugfix': ['bug', 'error', 'fix', 'arreglar', 'problema'],
        'Refactor': ['refactor', 'refactorizar', 'mejorar código', 'limpiar'],
        'Optimization': ['optimizar', 'mejorar rendimiento', 'acelerar'],
        'Configuration': ['configurar', 'config', 'setup', 'instalar'],
        'Integration': ['integrar', 'integración', 'conectar', 'api externa']
      };
      
      // Detectar tags de tecnología
      for (const [tag, keywords] of Object.entries(techTags)) {
        if (keywords.some(keyword => promptLower.includes(keyword))) {
          if (!detectedTags.includes(tag)) {
            detectedTags.push(tag);
          }
        }
      }
      
      // Detectar tags de tipo de tarea
      for (const [tag, keywords] of Object.entries(taskTags)) {
        if (keywords.some(keyword => promptLower.includes(keyword))) {
          if (!detectedTags.includes(tag)) {
            detectedTags.push(tag);
          }
        }
      }
    }
    
    return [...new Set(detectedTags)]; // Eliminar duplicados
  }

  detectCategory(promptLower) {
    // Usar categorías de la configuración global si está disponible
    const categories = this.globalConfig?.globalCategories || [
      { id: 'development', keywords: ['código', 'desarrollar', 'implementar', 'función', 'componente'] },
      { id: 'design', keywords: ['diseño', 'mockup', 'ui', 'ux', 'interfaz', 'colores'] },
      { id: 'documentation', keywords: ['documentar', 'readme', 'docs', 'explicar', 'describir'] },
      { id: 'testing', keywords: ['test', 'prueba', 'validar', 'verificar', 'qa'] },
      { id: 'optimization', keywords: ['optimizar', 'mejorar', 'performance', 'rendimiento', 'acelerar'] },
      { id: 'configuration', keywords: ['configurar', 'setup', 'instalar', 'deployment', 'ambiente'] },
      { id: 'analysis', keywords: ['analizar', 'revisar', 'evaluar', 'investigar', 'estudiar'] },
      { id: 'planning', keywords: ['planificar', 'plan', 'estrategia', 'roadmap', 'timeline'] }
    ];
    
    for (const category of categories) {
      const keywords = category.keywords || [];
      if (keywords.some(keyword => promptLower.includes(keyword))) {
        return category.id;
      }
    }
    
    return 'general';
  }

  detectPriority(promptLower) {
    // Usar prioridades de la configuración global
    const priorities = this.globalConfig?.globalPriorities || [
      { id: 'critical', keywords: ['urgente', 'crítico', 'inmediato', 'asap', 'emergencia'] },
      { id: 'high', keywords: ['importante', 'prioritario', 'pronto', 'necesario'] },
      { id: 'medium', keywords: ['normal', 'estándar', 'regular'] },
      { id: 'low', keywords: ['cuando puedas', 'no urgente', 'opcional', 'nice to have'] }
    ];
    
    for (const priority of priorities) {
      const keywords = priority.keywords || [];
      if (keywords.some(keyword => promptLower.includes(keyword))) {
        return priority.id;
      }
    }
    
    return 'medium';
  }

  detectComplexity(promptContent) {
    const wordCount = promptContent.split(' ').length;
    const lineCount = promptContent.split('\n').length;
    
    // Palabras clave de complejidad
    const complexKeywords = [
      'arquitectura', 'sistema completo', 'microservicios', 'escalable',
      'distribuido', 'integración compleja', 'múltiples componentes'
    ];
    
    const simpleKeywords = [
      'simple', 'básico', 'sencillo', 'pequeño cambio', 'ajuste menor'
    ];
    
    const promptLower = promptContent.toLowerCase();
    
    // Detectar por palabras clave
    if (complexKeywords.some(keyword => promptLower.includes(keyword))) {
      return 'expert';
    }
    
    if (simpleKeywords.some(keyword => promptLower.includes(keyword))) {
      return 'simple';
    }
    
    // Detectar por longitud
    if (wordCount < 50 || lineCount < 3) {
      return 'simple';
    } else if (wordCount > 200 || lineCount > 15) {
      return 'complex';
    } else if (wordCount > 500 || lineCount > 30) {
      return 'expert';
    }
    
    return 'medium';
  }

  calculateRating(classification, promptContent) {
    let rating = 3; // Base
    
    // Bonus por proyectos detectados
    if (classification.projects.length > 0) rating += 0.5;
    if (classification.projects.length > 1) rating += 0.5;
    
    // Bonus por tags
    if (classification.tags.length > 2) rating += 0.5;
    if (classification.tags.length > 5) rating += 0.5;
    
    // Bonus por complejidad bien manejada
    if (classification.complexity === 'expert') rating += 1;
    else if (classification.complexity === 'complex') rating += 0.5;
    
    // Bonus por categoría específica
    if (classification.category && classification.category !== 'general') rating += 0.5;
    
    // Penalización por falta de estructura
    const hasStructure = promptContent.includes('##') || promptContent.includes('1.') || promptContent.includes('-');
    if (!hasStructure && promptContent.length > 200) rating -= 0.5;
    
    // Limitar entre 1 y 5
    return Math.max(1, Math.min(5, Math.round(rating)));
  }

  calculateConfidence(classification) {
    let confidence = 0;
    let factors = 0;
    
    // Factores que aumentan la confianza
    if (classification.projects.length > 0) {
      confidence += 0.2;
      factors++;
    }
    
    if (classification.tags.length > 0) {
      confidence += 0.2;
      factors++;
    }
    
    if (classification.category && classification.category !== 'general') {
      confidence += 0.2;
      factors++;
    }
    
    if (classification.priority !== 'medium') {
      confidence += 0.1;
      factors++;
    }
    
    if (classification.complexity !== 'medium') {
      confidence += 0.1;
      factors++;
    }
    
    // Bonus por múltiples factores detectados
    if (factors >= 3) confidence += 0.2;
    
    return Math.min(1, confidence);
  }

  // Método para enriquecer un prompt con clasificación
  async enrichPromptWithClassification(prompt, context = {}) {
    const classification = await this.classifyPrompt(prompt.content || prompt.text || prompt, context);
    
    return {
      ...prompt,
      classification: classification,
      autoClassified: true,
      classificationTimestamp: new Date().toISOString()
    };
  }
}

// Instancia singleton del servicio
const classificationService = new PromptClassificationService();
export default classificationService;