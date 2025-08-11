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
  TrendingUp
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

  const loadProjects = () => {
    const saved = localStorage.getItem('jarvi_projects');
    if (saved) {
      setProjects(JSON.parse(saved));
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

  const createNewProject = () => {
    if (!newProjectName.trim()) return;
    
    const project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDescription,
      tags: suggestedTags,
      color: '#6366f1',
      icon: '📁',
      createdAt: new Date().toISOString(),
      promptCount: 0
    };
    
    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);
    localStorage.setItem('jarvi_projects', JSON.stringify(updatedProjects));
    
    onProjectSelect(project);
    if (onProjectCreate) {
      onProjectCreate(project);
    }
    
    setShowCreateNew(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

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
                    <span className="text-lg">{project.icon}</span>
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

          <button
            onClick={() => {
              setShowCreateNew(true);
              setShowSelector(false);
            }}
            className="w-full p-3 border-2 border-dashed border-gray-600 hover:border-indigo-500 rounded-lg transition-colors"
          >
            <div className="flex items-center justify-center gap-2 text-gray-400 hover:text-indigo-400">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Crear nuevo proyecto</span>
            </div>
          </button>
        </motion.div>
      )}

      {/* Formulario de nuevo proyecto */}
      {showCreateNew && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-gray-800/50 rounded-lg border border-indigo-500/50 mb-3"
        >
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            Crear nuevo proyecto
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre del proyecto</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Mi nuevo proyecto"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Descripción (opcional)</label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Descripción del proyecto..."
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                rows={2}
              />
            </div>

            {suggestedTags.length > 0 && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Etiquetas sugeridas</label>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateNew(false);
                  setShowSelector(true);
                }}
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createNewProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear proyecto
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Proyecto actual seleccionado */}
      {currentProject && !showSelector && !detectedProject && (
        <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
          <FolderOpen className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Proyecto:</span>
          <div 
            className="px-2 py-1 rounded text-xs text-white flex items-center gap-1"
            style={{ backgroundColor: currentProject.color + '40' }}
          >
            <span>{currentProject.icon}</span>
            <span>{currentProject.name}</span>
          </div>
          <button
            onClick={() => setShowSelector(true)}
            className="ml-auto text-xs text-gray-500 hover:text-indigo-400 transition-colors"
          >
            Cambiar
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectDetector;