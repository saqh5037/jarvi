import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  FolderOpen,
  Plus,
  Check,
  AlertCircle,
  Sparkles,
  Search,
  Tag,
  ChevronRight,
  Lightbulb,
  X,
  Zap,
  TrendingUp,
  Cpu,
  Rocket,
  Building2,
  Briefcase,
  Code2,
  Users,
  Calendar,
  Target,
  Layers
} from 'lucide-react';
import axios from 'axios';

const ProjectDetector = ({ 
  content, 
  onProjectSelect, 
  onProjectCreate,
  currentProject = null 
}) => {
  const [detectedProject, setDetectedProject] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [suggestedProjects, setSuggestedProjects] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [classification, setClassification] = useState(null);
  const [priority, setPriority] = useState(null);
  const [category, setCategory] = useState(null);

  // Palabras clave para detectar proyectos
  const projectKeywords = {
    'jarvi': ['jarvi', 'asistente', 'dashboard', 'módulo', 'componente'],
    'react': ['react', 'component', 'jsx', 'hooks', 'useState', 'useEffect'],
    'api': ['api', 'endpoint', 'backend', 'servidor', 'database', 'base de datos'],
    'frontend': ['ui', 'interfaz', 'diseño', 'css', 'tailwind', 'estilo'],
    'ia': ['ia', 'inteligencia artificial', 'gemini', 'claude', 'openai', 'prompt'],
    'cronología': ['cronología', 'historial', 'timeline', 'proyecto', 'aprendizaje']
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (content && content.length > 10) {
      analyzeContent();
    }
  }, [content]);

  // Mapeo de iconos de string a componentes
  const iconMap = {
    'Cpu': Cpu,
    'Rocket': Rocket,
    'Building2': Building2,
    'Briefcase': Briefcase,
    'Code2': Code2,
    'Users': Users,
    'Calendar': Calendar,
    'Target': Target,
    'Brain': Brain,
    'Zap': Zap,
    'Layers': Layers,
    'FolderOpen': FolderOpen
  };

  // Función helper para obtener el componente de icono
  const getIconComponent = (iconName) => {
    return iconMap[iconName] || FolderOpen;
  };

  const loadProjects = () => {
    // Cargar proyectos desde la configuración global
    const globalConfig = localStorage.getItem('jarvi-global-config');
    if (globalConfig) {
      const config = JSON.parse(globalConfig);
      // Los proyectos están en globalProjects, no en projects
      if (config.globalProjects && config.globalProjects.length > 0) {
        // Mapear proyectos de configuración global al formato esperado
        const mappedProjects = config.globalProjects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          icon: p.icon || 'FolderOpen',
          IconComponent: getIconComponent(p.icon),
          color: p.color || '#6366f1',
          tags: p.tags || [],
          status: p.status || 'active',
          team: p.team || [],
          startDate: p.startDate,
          endDate: p.endDate,
          stats: p.stats || { prompts: 0, iterations: 0, completedTasks: 0 }
        }));
        setProjects(mappedProjects);
        console.log('✅ Proyectos cargados desde configuración global:', mappedProjects.length);
      } else {
        console.log('⚠️ No hay proyectos en configuración global');
      }
    } else {
      // Fallback a proyectos antiguos si existen
      const saved = localStorage.getItem('jarvi_projects');
      if (saved) {
        const oldProjects = JSON.parse(saved);
        setProjects(oldProjects);
        console.log('📦 Proyectos cargados desde almacenamiento antiguo:', oldProjects.length);
      } else {
        console.log('❌ No hay proyectos disponibles');
      }
    }
  };

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    
    try {
      // Llamar al servidor de clasificación con IA
      const response = await axios.post('http://localhost:3005/api/classify', {
        content: content,
        context: {
          currentProject: currentProject?.name,
          availableProjects: projects
        }
      });
      
      if (response.data.success) {
        const classification = response.data.classification;
        
        // Usar la clasificación de IA
        if (classification.project.detected) {
          // Buscar el proyecto en la lista local
          const detectedProj = projects.find(p => 
            p.name.toLowerCase().includes(classification.project.detected.toLowerCase()) ||
            p.id === classification.project.detected
          );
          
          if (detectedProj) {
            setDetectedProject(detectedProj);
            setConfidence(classification.project.confidence);
            setSuggestedTags(classification.tags || []);
            
            // Auto-seleccionar si la confianza es alta
            if (classification.project.confidence > 80 && !currentProject) {
              onProjectSelect(detectedProj);
            } else if (classification.project.confidence < 60) {
              setShowSelector(true);
            }
          } else {
            // Proyecto no encontrado, sugerir crear uno nuevo
            setSuggestedTags(classification.tags || []);
            if (!currentProject) {
              setShowSelector(true);
            }
          }
        } else {
          // No se detectó proyecto
          setSuggestedTags(classification.tags || []);
          if (!currentProject) {
            setShowSelector(true);
          }
        }
        
        // Guardar la clasificación completa
        setClassification(classification);
        setPriority(classification.priority);
        setCategory(classification.category);
        
        // Hacer disponible globalmente para otros componentes
        window.lastClassification = classification;
      }
    } catch (error) {
      console.error('Error en clasificación con IA:', error);
      // Fallback a detección local
      const analysis = detectProjectFromContent(content);
      
      if (analysis.detected) {
        setDetectedProject(analysis.project);
        setConfidence(analysis.confidence);
        setSuggestedProjects(analysis.suggestions);
        setSuggestedTags(analysis.tags);
        
        if (analysis.confidence > 80 && !currentProject) {
          onProjectSelect(analysis.project);
        } else if (analysis.confidence < 60) {
          setShowSelector(true);
        }
      } else {
        setSuggestedTags(extractTagsFromContent(content));
        if (!currentProject) {
          setShowSelector(true);
        }
      }
    }
    
    setIsAnalyzing(false);
  };

  const detectProjectFromContent = (text) => {
    const lowerText = text.toLowerCase();
    const detectedKeywords = {};
    const detectedTags = new Set();
    
    // Analizar palabras clave
    Object.entries(projectKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          detectedKeywords[category] = (detectedKeywords[category] || 0) + 1;
          detectedTags.add(category);
        }
      });
    });
    
    // Buscar proyectos existentes que coincidan
    const projectMatches = projects.map(project => {
      let score = 0;
      
      // Verificar si el nombre del proyecto está en el contenido
      if (lowerText.includes(project.name.toLowerCase())) {
        score += 50;
      }
      
      // Verificar tags del proyecto
      project.tags?.forEach(tag => {
        if (lowerText.includes(tag.toLowerCase())) {
          score += 20;
        }
      });
      
      // Verificar palabras clave relacionadas
      Object.entries(detectedKeywords).forEach(([category, count]) => {
        if (project.tags?.includes(category)) {
          score += count * 10;
        }
      });
      
      return { project, score };
    }).filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score);
    
    if (projectMatches.length > 0) {
      const bestMatch = projectMatches[0];
      const confidence = Math.min(95, bestMatch.score);
      
      return {
        detected: true,
        project: bestMatch.project,
        confidence,
        suggestions: projectMatches.slice(0, 3).map(m => m.project),
        tags: Array.from(detectedTags)
      };
    }
    
    // Si no hay coincidencias, sugerir basándose en palabras clave
    const suggestedName = Object.entries(detectedKeywords)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    return {
      detected: false,
      project: null,
      confidence: 0,
      suggestions: projects.slice(0, 3),
      tags: Array.from(detectedTags)
    };
  };

  const extractTagsFromContent = (text) => {
    const tags = new Set();
    const lowerText = text.toLowerCase();
    
    // Detectar tecnologías mencionadas
    const technologies = ['react', 'node', 'python', 'javascript', 'typescript', 'css', 'html', 'api', 'database'];
    technologies.forEach(tech => {
      if (lowerText.includes(tech)) {
        tags.add(tech);
      }
    });
    
    // Detectar tipos de trabajo
    if (lowerText.includes('bug') || lowerText.includes('error') || lowerText.includes('fix')) {
      tags.add('bugfix');
    }
    if (lowerText.includes('feature') || lowerText.includes('nueva') || lowerText.includes('añadir')) {
      tags.add('feature');
    }
    if (lowerText.includes('refactor') || lowerText.includes('mejorar') || lowerText.includes('optimizar')) {
      tags.add('refactor');
    }
    
    return Array.from(tags);
  };

  // Función removida - Los proyectos se crean desde Configuración Global
  // Para crear proyectos, usar el módulo de Configuración Global

  return (
    <div className="mb-4">
      {/* Indicador de análisis */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 p-3 bg-indigo-900/20 rounded-lg border border-indigo-500/30 mb-3">
          <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="text-sm text-indigo-300">Analizando contenido para detectar proyecto...</span>
        </div>
      )}

      {/* Proyecto detectado automáticamente con clasificación completa */}
      {detectedProject && confidence > 60 && !showSelector && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Proyecto detectado */}
          <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-300">Proyecto detectado:</span>
                <div 
                  className="px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1"
                  style={{ backgroundColor: detectedProject.color + '40' }}
                >
                  <span>{detectedProject.icon}</span>
                  <span className="font-medium">{detectedProject.name}</span>
                </div>
                <span className="text-xs text-green-400">({confidence}% confianza)</span>
              </div>
              
              <button
                onClick={() => setShowSelector(true)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cambiar
              </button>
            </div>
          </div>
          
          {/* Clasificación adicional con IA */}
          {classification && (
            <div className="grid grid-cols-3 gap-2">
              {/* Prioridad */}
              {priority && (
                <div className="p-2 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className={`w-3 h-3 ${
                      priority.level === 'critical' ? 'text-red-400' :
                      priority.level === 'high' ? 'text-orange-400' :
                      priority.level === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`} />
                    <span className="text-xs text-gray-400">Prioridad</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    priority.level === 'critical' ? 'text-red-400' :
                    priority.level === 'high' ? 'text-orange-400' :
                    priority.level === 'medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {priority.level === 'critical' ? 'Crítica' :
                     priority.level === 'high' ? 'Alta' :
                     priority.level === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              )}
              
              {/* Categoría */}
              {category && (
                <div className="p-2 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-gray-400">Categoría</span>
                  </div>
                  <span className="text-xs font-medium text-blue-400">
                    {category.main === 'bugfix' ? 'Corrección' :
                     category.main === 'feature' ? 'Nueva función' :
                     category.main === 'refactor' ? 'Refactorización' :
                     category.main === 'documentation' ? 'Documentación' :
                     category.main}
                  </span>
                </div>
              )}
              
              {/* Complejidad */}
              {classification.complexity && (
                <div className="p-2 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Brain className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-gray-400">Complejidad</span>
                  </div>
                  <span className="text-xs font-medium text-purple-400">
                    {classification.complexity.level === 'simple' ? 'Simple' :
                     classification.complexity.level === 'medium' ? 'Media' : 'Compleja'}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Tags sugeridas */}
          {suggestedTags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {suggestedTags.map(tag => (
                  <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Título sugerido */}
          {classification?.suggestedTitle && (
            <div className="p-2 bg-gray-800/30 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-400">Título sugerido: </span>
              <span className="text-xs text-gray-300">{classification.suggestedTitle}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Selector manual de proyecto */}
      {showSelector && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 mb-3"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              Selecciona o crea un proyecto
            </h4>
            <button
              onClick={() => setShowSelector(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {confidence < 60 && suggestedProjects.length > 0 && (
            <div className="mb-3 p-2 bg-yellow-900/20 rounded border border-yellow-500/30">
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <Lightbulb className="w-3 h-3" />
                <span>No pude detectar el proyecto con certeza. ¿Es alguno de estos?</span>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-3">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  onProjectSelect(project);
                  setShowSelector(false);
                }}
                className={`w-full p-3 rounded-lg border transition-all text-left ${
                  currentProject?.id === project.id
                    ? 'bg-indigo-600/20 border-indigo-500'
                    : 'bg-gray-700/30 border-gray-700 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30">
                      {project.IconComponent ? (
                        <project.IconComponent className="w-5 h-5 text-indigo-300" />
                      ) : (
                        <FolderOpen className="w-5 h-5 text-indigo-300" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{project.description}</p>
                      )}
                    </div>
                  </div>
                  {suggestedProjects.includes(project) && (
                    <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded">
                      Sugerido
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Mensaje informativo si no hay proyectos */}
          {projects.length === 0 && (
            <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-amber-200">
                No hay proyectos configurados.
              </p>
              <p className="text-xs text-amber-100/70 mt-1">
                Ve a Configuración Global para crear proyectos.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Formulario removido - Los proyectos se crean desde Configuración Global */}

      {/* Proyecto actual seleccionado o selector rápido */}
      {!showSelector && (
        <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
          <FolderOpen className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Proyecto:</span>
          {currentProject ? (
            <>
              <div className="px-3 py-1.5 rounded-lg text-xs text-white flex items-center gap-2 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/30">
                {currentProject.IconComponent ? (
                  <currentProject.IconComponent className="w-4 h-4 text-indigo-300" />
                ) : (
                  <FolderOpen className="w-4 h-4 text-indigo-300" />
                )}
                <span className="font-medium">{currentProject.name}</span>
              </div>
              <button
                onClick={() => setShowSelector(true)}
                className="ml-auto text-xs text-gray-500 hover:text-indigo-400 transition-colors"
              >
                Cambiar
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-amber-400">Sin proyecto asignado</span>
              <button
                onClick={() => setShowSelector(true)}
                className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Seleccionar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetector;