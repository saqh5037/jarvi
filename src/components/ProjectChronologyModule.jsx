import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  FolderOpen,
  Tag,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Brain,
  Lightbulb,
  Code,
  GitBranch,
  Activity,
  BarChart3,
  Target,
  Award,
  BookOpen,
  MessageSquare,
  Hash,
  Zap,
  Archive,
  Edit3,
  Trash2,
  Star,
  StarOff,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
  Download,
  Upload,
  Sparkles,
  Folder,
  Flag,
  X
} from 'lucide-react';
import axios from 'axios';
import PromptClassifier from './PromptClassifier';

const ProjectChronologyModule = () => {
  // Estados principales
  const [projects, setProjects] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [activeView, setActiveView] = useState('timeline'); // timeline, analytics, learning
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  
  // Estados para filtros de clasificación
  const [filterRating, setFilterRating] = useState(0); // 0 = todos, 1-5 = filtrar por rating
  const [filterCategory, setFilterCategory] = useState(''); // vacío = todas
  const [filterPriority, setFilterPriority] = useState(''); // vacío = todas
  const [filterStatus, setFilterStatus] = useState(''); // vacío = todos
  const [showFilters, setShowFilters] = useState(false);
  
  // Cargar configuración global para los filtros
  const [globalConfig, setGlobalConfig] = useState(null);
  
  // Estados para crear/editar
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showClassifier, setShowClassifier] = useState(false);
  const [promptToClassify, setPromptToClassify] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    tags: [],
    color: '#6366f1',
    icon: '📁'
  });
  
  // Estados para análisis
  const [learnings, setLearnings] = useState([]);
  const [errors, setErrors] = useState([]);
  const [metrics, setMetrics] = useState({
    totalPrompts: 0,
    successRate: 0,
    avgIterations: 0,
    timesSaved: 0,
    commonErrors: []
  });

  // Colores predefinidos para proyectos
  const projectColors = [
    { name: 'Índigo', value: '#6366f1' },
    { name: 'Púrpura', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Amarillo', value: '#f59e0b' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Cyan', value: '#06b6d4' }
  ];

  // Iconos predefinidos para proyectos
  const projectIcons = ['📁', '🚀', '💡', '🎯', '🔧', '📊', '🎨', '🔬', '📱', '🌐', '🛠️', '⚡'];

  // Cargar datos al montar
  useEffect(() => {
    loadProjects();
    loadPrompts();
    loadLearnings();
    calculateMetrics();
    
    // Cargar configuración global
    const config = localStorage.getItem('jarvi-global-config');
    if (config) {
      setGlobalConfig(JSON.parse(config));
    }
  }, []);

  const loadProjects = () => {
    const savedProjects = localStorage.getItem('jarvi_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      // Proyectos de ejemplo
      const defaultProjects = [
        {
          id: 'jarvi-main',
          name: 'JARVI Principal',
          description: 'Sistema de asistente personal inteligente',
          tags: ['desarrollo', 'react', 'ia'],
          color: '#6366f1',
          icon: '🚀',
          createdAt: new Date().toISOString(),
          promptCount: 0
        }
      ];
      setProjects(defaultProjects);
      localStorage.setItem('jarvi_projects', JSON.stringify(defaultProjects));
    }
  };

  const loadPrompts = () => {
    const savedPrompts = localStorage.getItem('jarvi_chronology_prompts');
    if (savedPrompts) {
      setPrompts(JSON.parse(savedPrompts));
    }
  };

  const loadLearnings = () => {
    const savedLearnings = localStorage.getItem('jarvi_learnings');
    if (savedLearnings) {
      setLearnings(JSON.parse(savedLearnings));
    }
  };

  const calculateMetrics = () => {
    const allPrompts = JSON.parse(localStorage.getItem('jarvi_chronology_prompts') || '[]');
    const successfulPrompts = allPrompts.filter(p => p.status === 'success');
    
    setMetrics({
      totalPrompts: allPrompts.length,
      successRate: allPrompts.length > 0 ? (successfulPrompts.length / allPrompts.length * 100).toFixed(1) : 0,
      avgIterations: calculateAverageIterations(allPrompts),
      timesSaved: calculateTimeSaved(allPrompts),
      commonErrors: findCommonErrors(allPrompts)
    });
  };

  const calculateAverageIterations = (prompts) => {
    if (prompts.length === 0) return 0;
    const total = prompts.reduce((sum, p) => sum + (p.iterations || 1), 0);
    return (total / prompts.length).toFixed(1);
  };

  const calculateTimeSaved = (prompts) => {
    // Estimación: cada prompt bien hecho ahorra 15 minutos
    return prompts.filter(p => p.status === 'success').length * 15;
  };

  const findCommonErrors = (prompts) => {
    const errors = {};
    prompts.forEach(p => {
      if (p.errors) {
        p.errors.forEach(error => {
          errors[error.type] = (errors[error.type] || 0) + 1;
        });
      }
    });
    return Object.entries(errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  };

  const savePromptToChronology = (prompt, projectId, analysis = {}) => {
    const newChronologyPrompt = {
      id: Date.now().toString(),
      projectId: projectId || selectedProject?.id,
      content: prompt,
      timestamp: new Date().toISOString(),
      tags: analysis.tags || [],
      status: analysis.status || 'draft',
      iterations: analysis.iterations || 1,
      errors: analysis.errors || [],
      learnings: analysis.learnings || [],
      result: analysis.result || '',
      timeSpent: analysis.timeSpent || 0,
      isSuccessful: analysis.isSuccessful || false
    };

    const updatedPrompts = [...prompts, newChronologyPrompt];
    setPrompts(updatedPrompts);
    localStorage.setItem('jarvi_chronology_prompts', JSON.stringify(updatedPrompts));
    
    // Actualizar contador del proyecto
    if (projectId) {
      updateProjectPromptCount(projectId);
    }
    
    calculateMetrics();
    return newChronologyPrompt;
  };

  const updateProjectPromptCount = (projectId) => {
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, promptCount: (p.promptCount || 0) + 1 };
      }
      return p;
    });
    setProjects(updatedProjects);
    localStorage.setItem('jarvi_projects', JSON.stringify(updatedProjects));
  };

  const createProject = () => {
    const project = {
      ...newProject,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      promptCount: 0
    };
    
    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);
    localStorage.setItem('jarvi_projects', JSON.stringify(updatedProjects));
    
    setShowProjectModal(false);
    setNewProject({ name: '', description: '', tags: [], color: '#6366f1', icon: '📁' });
  };

  const deleteProject = (projectId) => {
    if (confirm('¿Estás seguro de eliminar este proyecto y todos sus prompts?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      const updatedPrompts = prompts.filter(p => p.projectId !== projectId);
      
      setProjects(updatedProjects);
      setPrompts(updatedPrompts);
      localStorage.setItem('jarvi_projects', JSON.stringify(updatedProjects));
      localStorage.setItem('jarvi_chronology_prompts', JSON.stringify(updatedPrompts));
      
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    }
  };

  const addLearning = (promptId, learning) => {
    const newLearning = {
      id: Date.now().toString(),
      promptId,
      projectId: selectedProject?.id,
      content: learning,
      type: 'improvement', // improvement, error, tip
      timestamp: new Date().toISOString()
    };
    
    const updatedLearnings = [...learnings, newLearning];
    setLearnings(updatedLearnings);
    localStorage.setItem('jarvi_learnings', JSON.stringify(updatedLearnings));
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesProject = !selectedProject || prompt.projectId === selectedProject.id;
    const matchesSearch = !searchQuery || 
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.result?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => prompt.tags?.includes(tag));
    
    // Filtros de clasificación
    const matchesRating = filterRating === 0 || 
      (prompt.classification?.rating >= filterRating);
    const matchesCategory = !filterCategory || 
      prompt.classification?.category === filterCategory;
    const matchesPriority = !filterPriority || 
      prompt.classification?.priority === filterPriority;
    const matchesStatus = !filterStatus || 
      prompt.classification?.status === filterStatus ||
      prompt.status === filterStatus;
    
    return matchesProject && matchesSearch && matchesTags && 
           matchesRating && matchesCategory && matchesPriority && matchesStatus;
  });

  const getAllTags = () => {
    const tags = new Set();
    prompts.forEach(p => {
      p.tags?.forEach(tag => tags.add(tag));
    });
    projects.forEach(p => {
      p.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const handleClassifyPrompt = (prompt) => {
    setPromptToClassify(prompt);
    setShowClassifier(true);
  };

  const handleClassificationComplete = (classifiedPrompt) => {
    // Actualizar el prompt con la clasificación
    const updatedPrompts = prompts.map(p => 
      p.id === classifiedPrompt.id ? classifiedPrompt : p
    );
    setPrompts(updatedPrompts);
    localStorage.setItem('jarvi_chronology_prompts', JSON.stringify(updatedPrompts));
    
    // Actualizar proyectos si hay nuevos
    if (classifiedPrompt.classification?.projects) {
      classifiedPrompt.classification.projects.forEach(projectName => {
        if (!projects.find(p => p.name === projectName)) {
          const newProj = {
            id: Date.now().toString(),
            name: projectName,
            description: 'Proyecto detectado automáticamente',
            tags: [],
            color: projectColors[projects.length % projectColors.length].value,
            icon: projectIcons[projects.length % projectIcons.length],
            createdAt: new Date().toISOString(),
            promptCount: 1
          };
          const updatedProjects = [...projects, newProj];
          setProjects(updatedProjects);
          localStorage.setItem('jarvi_projects', JSON.stringify(updatedProjects));
        }
      });
    }
    
    setShowClassifier(false);
    setPromptToClassify(null);
  };

  const exportData = () => {
    const data = {
      projects,
      prompts,
      learnings,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvi-chronology-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Cronología de Proyectos</h2>
          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs">
            {prompts.length} prompts
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeView === 'timeline' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Línea de Tiempo
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeView === 'analytics' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Análisis
          </button>
          <button
            onClick={() => setActiveView('learning')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeView === 'learning' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Lightbulb className="w-4 h-4 inline mr-2" />
            Aprendizajes
          </button>
          <button
            onClick={exportData}
            className="p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
            title="Exportar datos"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Botón de filtros */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {(filterRating > 0 || filterCategory || filterPriority || filterStatus) && (
            <span className="ml-2 px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
              {[filterRating > 0, filterCategory, filterPriority, filterStatus].filter(Boolean).length}
            </span>
          )}
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Panel de filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Filtro por Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Star className="w-4 h-4 inline mr-1" />
                    Filtrar por Rating
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFilterRating(0)}
                      className={`px-2 py-1 rounded text-xs transition-all ${
                        filterRating === 0
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Todos
                    </button>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFilterRating(rating)}
                        className={`p-1 rounded transition-all ${
                          filterRating === rating
                            ? 'bg-yellow-500/20 border border-yellow-500'
                            : 'hover:bg-gray-700'
                        }`}
                        title={`${rating} estrellas o más`}
                      >
                        <Star className={`w-4 h-4 ${
                          filterRating >= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-500'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Filtro por Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Folder className="w-4 h-4 inline mr-1" />
                    Categoría
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-1 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm"
                  >
                    <option value="">Todas las categorías</option>
                    {globalConfig?.globalCategories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Filtro por Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Flag className="w-4 h-4 inline mr-1" />
                    Prioridad
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-1 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm"
                  >
                    <option value="">Todas las prioridades</option>
                    {globalConfig?.globalPriorities?.map((priority) => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Activity className="w-4 h-4 inline mr-1" />
                    Estado
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-1 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm"
                  >
                    <option value="">Todos los estados</option>
                    {globalConfig?.globalStates?.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Botón para limpiar filtros */}
              {(filterRating > 0 || filterCategory || filterPriority || filterStatus) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setFilterRating(0);
                      setFilterCategory('');
                      setFilterPriority('');
                      setFilterStatus('');
                    }}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <X className="w-3 h-3" />
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de proyectos */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedProject(null)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
            !selectedProject 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Todos los proyectos
        </button>
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedProject?.id === project.id 
                ? 'text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={{
              backgroundColor: selectedProject?.id === project.id ? project.color : undefined
            }}
          >
            <span>{project.icon}</span>
            <span>{project.name}</span>
            <span className="text-xs opacity-75">({project.promptCount || 0})</span>
          </button>
        ))}
      </div>

      {/* Vista de Línea de Tiempo */}
      {activeView === 'timeline' && (
        <div className="space-y-4">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay prompts en la cronología</p>
              <p className="text-gray-500 text-sm mt-2">
                Los prompts editados y guardados aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrompts
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((prompt) => {
                  const project = projects.find(p => p.id === prompt.projectId);
                  return (
                    <motion.div
                      key={prompt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Sistema de valoración con estrellas */}
                            {prompt.classification?.rating ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= prompt.classification.rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleClassifyPrompt(prompt)}
                                  className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
                                  title="Editar clasificación"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleClassifyPrompt(prompt)}
                                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-xs font-medium animate-pulse"
                              >
                                <Sparkles className="w-4 h-4" />
                                Clasificar Prompt
                              </button>
                            )}
                            
                            {project && (
                              <div 
                                className="px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1"
                                style={{ backgroundColor: project.color + '40', borderColor: project.color }}
                              >
                                <span>{project.icon}</span>
                                <span>{project.name}</span>
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(prompt.timestamp).toLocaleString()}
                            </span>
                            {prompt.status === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : prompt.status === 'error' ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-2 line-clamp-3">
                            {prompt.content}
                          </p>
                          
                          {prompt.tags && prompt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {prompt.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-gray-700 text-gray-400 rounded-full text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {prompt.learnings && prompt.learnings.length > 0 && (
                            <div className="mt-2 p-2 bg-green-900/20 rounded-lg border border-green-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <Lightbulb className="w-3 h-3 text-green-400" />
                                <span className="text-xs text-green-400 font-medium">Aprendizaje:</span>
                              </div>
                              <p className="text-xs text-gray-400">{prompt.learnings[0]}</p>
                            </div>
                          )}
                          
                          {prompt.errors && prompt.errors.length > 0 && (
                            <div className="mt-2 p-2 bg-red-900/20 rounded-lg border border-red-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                                <span className="text-xs text-red-400 font-medium">Error encontrado:</span>
                              </div>
                              <p className="text-xs text-gray-400">{prompt.errors[0].message}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => setSelectedPrompt(prompt)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(prompt.content);
                            }}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Copiar prompt"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      {prompt.iterations > 1 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <RefreshCw className="w-3 h-3" />
                          <span>{prompt.iterations} iteraciones</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Vista de Análisis */}
      {activeView === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{metrics.totalPrompts}</span>
            </div>
            <p className="text-gray-400 text-sm">Total de Prompts</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">{metrics.successRate}%</span>
            </div>
            <p className="text-gray-400 text-sm">Tasa de Éxito</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{metrics.avgIterations}</span>
            </div>
            <p className="text-gray-400 text-sm">Promedio de Iteraciones</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{metrics.timesSaved}min</span>
            </div>
            <p className="text-gray-400 text-sm">Tiempo Ahorrado</p>
          </div>
          
          {/* Errores comunes */}
          {metrics.commonErrors.length > 0 && (
            <div className="col-span-full bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Errores Más Comunes
              </h3>
              <div className="space-y-2">
                {metrics.commonErrors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{error.type}</span>
                    <span className="text-gray-500 text-sm">{error.count} veces</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista de Aprendizajes */}
      {activeView === 'learning' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-6 border border-green-500/30">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Lecciones Aprendidas
            </h3>
            
            {learnings.length === 0 ? (
              <p className="text-gray-400">
                A medida que documentes aprendizajes en tus prompts, aparecerán aquí
              </p>
            ) : (
              <div className="space-y-3">
                {learnings
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, 10)
                  .map(learning => (
                    <div key={learning.id} className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-300 text-sm mb-1">{learning.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{new Date(learning.timestamp).toLocaleDateString()}</span>
                        {learning.type === 'improvement' && (
                          <span className="text-green-400">Mejora</span>
                        )}
                        {learning.type === 'error' && (
                          <span className="text-red-400">Error evitado</span>
                        )}
                        {learning.type === 'tip' && (
                          <span className="text-blue-400">Consejo</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          {/* Recomendaciones basadas en el historial */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Recomendaciones para Mejorar
            </h3>
            
            <div className="space-y-2">
              {metrics.avgIterations > 2 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <p className="text-gray-300 text-sm">
                    Intenta ser más específico en tus prompts iniciales para reducir las iteraciones
                  </p>
                </div>
              )}
              
              {metrics.successRate < 70 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <p className="text-gray-300 text-sm">
                    Revisa los patrones de los prompts exitosos y úsalos como plantilla
                  </p>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <p className="text-gray-300 text-sm">
                  Documenta cada error y su solución para crear una base de conocimiento
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <p className="text-gray-300 text-sm">
                  Usa etiquetas consistentes para facilitar la búsqueda de prompts similares
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Proyecto */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowProjectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nombre del Proyecto</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Mi Proyecto"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Descripción</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Descripción del proyecto..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Icono</label>
                  <div className="grid grid-cols-6 gap-2">
                    {projectIcons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewProject({ ...newProject, icon })}
                        className={`p-3 rounded-lg text-2xl transition-all ${
                          newProject.icon === icon
                            ? 'bg-indigo-600 ring-2 ring-indigo-400'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {projectColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewProject({ ...newProject, color: color.value })}
                        className={`h-10 rounded-lg transition-all ${
                          newProject.color === color.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800'
                            : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Etiquetas</label>
                  <input
                    type="text"
                    placeholder="desarrollo, react, ia (separadas por comas)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        setNewProject({ ...newProject, tags });
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {newProject.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newProject.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs flex items-center gap-1"
                        >
                          #{tag}
                          <button
                            onClick={() => setNewProject({
                              ...newProject,
                              tags: newProject.tags.filter(t => t !== tag)
                            })}
                            className="hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createProject}
                  disabled={!newProject.name}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal del Clasificador de Prompts */}
      {showClassifier && promptToClassify && (
        <PromptClassifier
          prompt={promptToClassify}
          onClassificationComplete={handleClassificationComplete}
          onClose={() => {
            setShowClassifier(false);
            setPromptToClassify(null);
          }}
          existingProjects={projects.map(p => p.name)}
          existingTags={getAllTags()}
        />
      )}
    </div>
  );
};

export default ProjectChronologyModule;