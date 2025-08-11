import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  StarOff,
  Tag,
  FolderOpen,
  Sparkles,
  Edit3,
  Save,
  X,
  Plus,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
  Wand2,
  Hash,
  // Íconos adicionales para estados
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Eye,
  ThumbsUp,
  // Íconos adicionales para prioridades
  AlertCircle,
  Flag,
  Circle,
  Square,
  Triangle,
  // Íconos adicionales para categorías
  Briefcase,
  User,
  Heart,
  DollarSign,
  GraduationCap,
  Cpu,
  TrendingUp,
  Users,
  MessageCircle,
  Folder,
  Rocket
} from 'lucide-react';
import axios from 'axios';

const PromptClassifier = ({ 
  prompt, 
  onClassificationComplete,
  onClose,
  existingProjects = [],
  existingTags = [],
  autoClassify = false
}) => {
  // Cargar configuración global
  const [globalConfig, setGlobalConfig] = useState(null);
  
  // Función helper para obtener valores de color
  const getColorValue = (colorName, shade = 500, opacity = 1) => {
    const colors = {
      gray: { 400: '#9ca3af', 500: '#6b7280' },
      red: { 400: '#f87171', 500: '#ef4444' },
      orange: { 400: '#fb923c', 500: '#f97316' },
      yellow: { 400: '#facc15', 500: '#eab308' },
      green: { 400: '#4ade80', 500: '#22c55e' },
      emerald: { 400: '#34d399', 500: '#10b981' },
      blue: { 400: '#60a5fa', 500: '#3b82f6' },
      cyan: { 400: '#22d3ee', 500: '#06b6d4' },
      indigo: { 400: '#818cf8', 500: '#6366f1' },
      purple: { 400: '#a78bfa', 500: '#8b5cf6' },
      violet: { 400: '#a78bfa', 500: '#8b5cf6' },
      pink: { 400: '#f472b6', 500: '#ec4899' },
      rose: { 400: '#fb7185', 500: '#f43f5e' }
    };
    
    const color = colors[colorName] || colors.gray;
    const hex = color[shade] || color[500];
    
    if (opacity < 1) {
      // Convertir hex a rgba
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return hex;
  };
  
  const [classification, setClassification] = useState({
    rating: 0,
    projects: [],
    tags: [],
    category: '',
    priority: 'medium',
    status: 'pending',
    complexity: 'medium',
    effectiveness: 'pending'
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [newProject, setNewProject] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  
  // Cargar configuración global al montar
  useEffect(() => {
    const config = localStorage.getItem('jarvi-global-config');
    if (config) {
      setGlobalConfig(JSON.parse(config));
    }
  }, []);
  
  // Mapeo de íconos desde strings a componentes
  const iconMap = {
    // Estados
    'Clock': Clock,
    'Loader2': Loader2,
    'CheckCircle': CheckCircle,
    'XCircle': XCircle,
    'Archive': Archive,
    'Edit2': Edit3,
    'Eye': Eye,
    'ThumbsUp': ThumbsUp,
    // Prioridades
    'AlertCircle': AlertCircle,
    'Flag': Flag,
    'Circle': Circle,
    'Square': Square,
    'Triangle': Triangle,
    // Categorías
    'Briefcase': Briefcase,
    'User': User,
    'Heart': Heart,
    'DollarSign': DollarSign,
    'GraduationCap': GraduationCap,
    'Cpu': Cpu,
    'TrendingUp': TrendingUp,
    'Users': Users,
    'MessageCircle': MessageCircle,
    'Folder': Folder,
    'Rocket': Rocket,
    'FolderOpen': FolderOpen
  };
  
  // Usar categorías de la configuración global
  const categories = globalConfig?.globalCategories?.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    IconComponent: iconMap[cat.icon] || Folder
  })) || [
    { id: 'work', name: 'Trabajo', icon: 'Briefcase', color: 'indigo', IconComponent: Briefcase },
    { id: 'personal', name: 'Personal', icon: 'User', color: 'pink', IconComponent: User },
    { id: 'technology', name: 'Tecnología', icon: 'Cpu', color: 'blue', IconComponent: Cpu },
    { id: 'business', name: 'Negocios', icon: 'TrendingUp', color: 'emerald', IconComponent: TrendingUp },
    { id: 'projects', name: 'Proyectos', icon: 'Folder', color: 'violet', IconComponent: Folder }
  ];
  
  // Usar prioridades de la configuración global
  const priorities = globalConfig?.globalPriorities?.map(priority => ({
    id: priority.id,
    name: priority.name,
    color: priority.color,
    level: priority.level,
    icon: priority.icon,
    IconComponent: iconMap[priority.icon] || Flag
  })) || [
    { id: 'critical', name: 'Crítica', color: 'red', level: 1, icon: 'AlertCircle', IconComponent: AlertCircle },
    { id: 'high', name: 'Alta', color: 'orange', level: 2, icon: 'Flag', IconComponent: Flag },
    { id: 'medium', name: 'Media', color: 'yellow', level: 3, icon: 'Circle', IconComponent: Circle },
    { id: 'low', name: 'Baja', color: 'green', level: 4, icon: 'Square', IconComponent: Square },
    { id: 'optional', name: 'Opcional', color: 'gray', level: 5, icon: 'Triangle', IconComponent: Triangle }
  ];
  
  // Usar estados de la configuración global
  const states = globalConfig?.globalStates?.map(state => ({
    id: state.id,
    name: state.name,
    color: state.color,
    icon: state.icon,
    description: state.description,
    IconComponent: iconMap[state.icon] || Clock
  })) || [
    { id: 'pending', name: 'Pendiente', color: 'yellow', icon: 'Clock', IconComponent: Clock },
    { id: 'in-progress', name: 'En Progreso', color: 'blue', icon: 'Loader2', IconComponent: Loader2 },
    { id: 'completed', name: 'Completado', color: 'green', icon: 'CheckCircle', IconComponent: CheckCircle },
    { id: 'cancelled', name: 'Cancelado', color: 'red', icon: 'XCircle', IconComponent: XCircle }
  ];
  
  // Niveles de complejidad
  const complexityLevels = [
    { id: 'simple', name: 'Simple', color: 'text-green-500' },
    { id: 'medium', name: 'Medio', color: 'text-yellow-500' },
    { id: 'complex', name: 'Complejo', color: 'text-orange-500' },
    { id: 'expert', name: 'Experto', color: 'text-red-500' }
  ];

  // Análisis automático con IA
  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simular análisis de IA (en producción, llamar a API real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Análisis basado en palabras clave del prompt
      const promptLower = prompt.text?.toLowerCase() || '';
      
      // Detectar proyectos usando configuración global si está disponible
      const detectedProjects = [];
      const projects = globalConfig?.globalProjects || [];
      
      // Primero intentar con proyectos de configuración global
      projects.forEach(project => {
        if (project.keywords) {
          const keywords = Array.isArray(project.keywords) ? project.keywords : [project.name.toLowerCase()];
          if (keywords.some(keyword => promptLower.includes(keyword.toLowerCase()))) {
            detectedProjects.push(project.name);
          }
        } else if (promptLower.includes(project.name.toLowerCase())) {
          detectedProjects.push(project.name);
        }
      });
      
      // Si no hay proyectos en config global, usar detección por defecto
      if (detectedProjects.length === 0) {
        if (promptLower.includes('jarvi')) detectedProjects.push('JARVI');
        if (promptLower.includes('dashboard')) detectedProjects.push('Dashboard');
        if (promptLower.includes('api')) detectedProjects.push('API Backend');
      }
      
      // Detectar tags usando configuración global si está disponible
      const detectedTags = [];
      const tags = globalConfig?.globalTags || [];
      
      // Primero intentar con tags de configuración global
      tags.forEach(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        if (promptLower.includes(tagName.toLowerCase())) {
          detectedTags.push(tagName);
        }
      });
      
      // Si no hay suficientes tags, usar detección por defecto
      if (detectedTags.length < 2) {
        if (promptLower.includes('react')) detectedTags.push('React');
        if (promptLower.includes('node')) detectedTags.push('NodeJS');
        if (promptLower.includes('database') || promptLower.includes('db')) detectedTags.push('Database');
        if (promptLower.includes('ui') || promptLower.includes('interfaz')) detectedTags.push('UI/UX');
        if (promptLower.includes('bug') || promptLower.includes('error')) detectedTags.push('Bugfix');
        if (promptLower.includes('feature') || promptLower.includes('nueva')) detectedTags.push('Feature');
      }
      
      // Determinar categoría
      let category = 'development';
      if (promptLower.includes('diseño') || promptLower.includes('mockup')) category = 'design';
      if (promptLower.includes('doc') || promptLower.includes('readme')) category = 'documentation';
      if (promptLower.includes('test') || promptLower.includes('prueba')) category = 'testing';
      if (promptLower.includes('optimiz') || promptLower.includes('performance')) category = 'optimization';
      
      // Determinar complejidad basada en longitud y palabras clave
      let complexity = 'medium';
      const wordCount = prompt.text?.split(' ').length || 0;
      if (wordCount < 50) complexity = 'simple';
      else if (wordCount > 200) complexity = 'complex';
      if (promptLower.includes('arquitectura') || promptLower.includes('sistema completo')) complexity = 'expert';
      
      // Calcular rating automático basado en criterios
      let rating = 3; // Base
      if (detectedProjects.length > 0) rating += 0.5;
      if (detectedTags.length > 2) rating += 0.5;
      if (complexity === 'expert') rating += 1;
      if (prompt.isSuccessful) rating += 0.5;
      rating = Math.min(5, Math.round(rating));
      
      const suggestions = {
        projects: detectedProjects,
        tags: detectedTags,
        category,
        complexity,
        rating,
        confidence: 0.85,
        reasoning: `Detecté ${detectedProjects.length} proyectos, ${detectedTags.length} tags relevantes. La complejidad es ${complexity} basada en el análisis del contenido.`
      };
      
      setAiSuggestions(suggestions);
      setClassification({
        ...classification,
        ...suggestions
      });
      
    } catch (error) {
      console.error('Error en análisis IA:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Aplicar sugerencias de IA
  const applySuggestions = () => {
    if (aiSuggestions) {
      setClassification({
        ...classification,
        ...aiSuggestions
      });
    }
  };

  // Manejar cambio de rating
  const handleRatingChange = (value) => {
    setClassification({
      ...classification,
      rating: value
    });
  };

  // Agregar proyecto
  const addProject = (project) => {
    if (project && !classification.projects.includes(project)) {
      setClassification({
        ...classification,
        projects: [...classification.projects, project]
      });
    }
    setNewProject('');
    setShowProjectInput(false);
  };

  // Remover proyecto
  const removeProject = (project) => {
    setClassification({
      ...classification,
      projects: classification.projects.filter(p => p !== project)
    });
  };

  // Agregar tag
  const addTag = (tag) => {
    if (tag && !classification.tags.includes(tag)) {
      setClassification({
        ...classification,
        tags: [...classification.tags, tag]
      });
    }
    setNewTag('');
    setShowTagInput(false);
  };

  // Remover tag
  const removeTag = (tag) => {
    setClassification({
      ...classification,
      tags: classification.tags.filter(t => t !== tag)
    });
  };

  // Guardar clasificación
  const saveClassification = () => {
    const enrichedPrompt = {
      ...prompt,
      classification: {
        ...classification,
        classifiedAt: new Date().toISOString(),
        method: isManualMode ? 'manual' : 'ai_assisted'
      }
    };
    
    // Guardar en localStorage
    const savedPrompts = JSON.parse(localStorage.getItem('jarvi_classified_prompts') || '[]');
    savedPrompts.push(enrichedPrompt);
    localStorage.setItem('jarvi_classified_prompts', JSON.stringify(savedPrompts));
    
    onClassificationComplete(enrichedPrompt);
  };

  // Iniciar análisis automático al montar
  useEffect(() => {
    if (!isManualMode && prompt) {
      analyzeWithAI();
    }
  }, []);
  
  // Clasificación automática si está habilitada
  useEffect(() => {
    if (autoClassify && prompt && !isManualMode) {
      analyzeWithAI().then(() => {
        // Auto-aplicar sugerencias si la confianza es alta
        if (aiSuggestions && aiSuggestions.confidence > 0.7) {
          setTimeout(() => {
            applySuggestions();
          }, 500);
        }
      });
    }
  }, [autoClassify]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Clasificador de Prompts
              </h2>
              <p className="text-gray-400 text-sm">
                Organiza y valora tu prompt para mejor referencia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Modo de clasificación */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              setIsManualMode(false);
              if (!aiSuggestions) analyzeWithAI();
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              !isManualMode 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Clasificación con IA
          </button>
          <button
            onClick={() => setIsManualMode(true)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              isManualMode 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Clasificación Manual
          </button>
        </div>

        {/* Análisis con IA */}
        {!isManualMode && (
          <AnimatePresence>
            {isAnalyzing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 mb-6"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                  <span className="text-white">Analizando prompt con IA...</span>
                </div>
              </motion.div>
            ) : aiSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 mb-6 border border-purple-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    Sugerencias de IA
                  </h3>
                  <button
                    onClick={applySuggestions}
                    className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Aplicar Todo
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-300">{aiSuggestions.reasoning}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Confianza:</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${aiSuggestions.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-white">{Math.round(aiSuggestions.confidence * 100)}%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Sistema de valoración con estrellas */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Valoración del Prompt
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRatingChange(value)}
                className="p-1 transition-all hover:scale-110"
              >
                {value <= classification.rating ? (
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                ) : (
                  <StarOff className="w-8 h-8 text-gray-600" />
                )}
              </button>
            ))}
            <span className="ml-3 text-gray-400">
              {classification.rating === 0 && 'Sin valorar'}
              {classification.rating === 1 && '⭐ Básico'}
              {classification.rating === 2 && '⭐⭐ Útil'}
              {classification.rating === 3 && '⭐⭐⭐ Bueno'}
              {classification.rating === 4 && '⭐⭐⭐⭐ Excelente'}
              {classification.rating === 5 && '⭐⭐⭐⭐⭐ Excepcional'}
            </span>
          </div>
        </div>

        {/* Proyectos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Proyectos Relacionados
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {classification.projects.map((project) => (
              <motion.div
                key={project}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm">{project}</span>
                <button
                  onClick={() => removeProject(project)}
                  className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            {!showProjectInput ? (
              <button
                onClick={() => setShowProjectInput(true)}
                className="px-3 py-1 border border-gray-600 border-dashed rounded-lg flex items-center gap-2 text-gray-400 hover:text-white hover:border-gray-400 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Agregar Proyecto</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addProject(newProject)}
                  placeholder="Nombre del proyecto"
                  className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                <button
                  onClick={() => addProject(newProject)}
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowProjectInput(false);
                    setNewProject('');
                  }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {classification.tags.map((tag) => (
              <motion.div
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2"
              >
                <Hash className="w-3 h-3 text-green-400" />
                <span className="text-white text-sm">{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            {!showTagInput ? (
              <button
                onClick={() => setShowTagInput(true)}
                className="px-3 py-1 border border-gray-600 border-dashed rounded-lg flex items-center gap-2 text-gray-400 hover:text-white hover:border-gray-400 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Agregar Tag</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
                  placeholder="Nuevo tag"
                  className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                <button
                  onClick={() => addTag(newTag)}
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowTagInput(false);
                    setNewTag('');
                  }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Estado del Prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Estado del Prompt
          </label>
          <div className="flex flex-wrap gap-2">
            {states.map((state) => {
              const IconComp = state.IconComponent;
              return (
                <button
                  key={state.id}
                  onClick={() => setClassification({ ...classification, status: state.id })}
                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    classification.status === state.id
                      ? 'border-2'
                      : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                  }`}
                  style={classification.status === state.id ? {
                    backgroundColor: getColorValue(state.color, 500, 0.2),
                    borderColor: getColorValue(state.color, 500)
                  } : {}}
                  title={state.description}
                >
                  <IconComp 
                    className="w-4 h-4"
                    style={{
                      color: classification.status === state.id 
                        ? getColorValue(state.color, 400) 
                        : 'rgb(156 163 175)'
                    }}
                  />
                  <span 
                    className="text-sm"
                    style={{
                      color: classification.status === state.id 
                        ? getColorValue(state.color, 400) 
                        : 'rgb(156 163 175)'
                    }}
                  >
                    {state.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categoría, Prioridad y Complejidad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Categoría
            </label>
            <div className="relative">
              <select
                value={classification.category}
                onChange={(e) => setClassification({ ...classification, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 appearance-none"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            {/* Mostrar íconos de categoría */}
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.slice(0, 5).map((cat) => {
                const IconComp = cat.IconComponent;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setClassification({ ...classification, category: cat.id })}
                    className={`p-2 rounded-lg transition-all ${
                      classification.category === cat.id
                        ? 'border-2'
                        : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                    }`}
                    style={classification.category === cat.id ? {
                      backgroundColor: getColorValue(cat.color, 500, 0.2),
                      borderColor: getColorValue(cat.color, 500)
                    } : {}}
                    title={cat.name}
                  >
                    <IconComp 
                      className="w-4 h-4"
                      style={{
                        color: classification.category === cat.id 
                          ? getColorValue(cat.color, 400) 
                          : 'rgb(156 163 175)'
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Prioridad
            </label>
            <div className="relative">
              <select
                value={classification.priority}
                onChange={(e) => setClassification({ ...classification, priority: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 appearance-none"
              >
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            {/* Mostrar íconos de prioridad */}
            <div className="mt-2 flex items-center gap-2">
              {priorities.map((priority) => {
                const IconComp = priority.IconComponent;
                return (
                  <button
                    key={priority.id}
                    onClick={() => setClassification({ ...classification, priority: priority.id })}
                    className={`p-2 rounded-lg transition-all ${
                      classification.priority === priority.id
                        ? 'border-2'
                        : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                    }`}
                    style={classification.priority === priority.id ? {
                      backgroundColor: getColorValue(priority.color, 500, 0.2),
                      borderColor: getColorValue(priority.color, 500)
                    } : {}}
                    title={priority.name}
                  >
                    <IconComp 
                      className="w-4 h-4"
                      style={{
                        color: classification.priority === priority.id 
                          ? getColorValue(priority.color, 400) 
                          : 'rgb(156 163 175)'
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Complejidad
            </label>
            <select
              value={classification.complexity}
              onChange={(e) => setClassification({ ...classification, complexity: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {complexityLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={saveClassification}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Clasificación
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PromptClassifier;