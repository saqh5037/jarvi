import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Mic,
  Play,
  Pause,
  Volume2,
  Edit3,
  Tag,
  Flag,
  Folder,
  Calendar,
  MapPin,
  Hash,
  User,
  Users,
  Sparkles,
  RefreshCw,
  Undo,
  Redo,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Briefcase,
  Heart,
  DollarSign,
  GraduationCap,
  Cpu,
  TrendingUp,
  MessageCircle,
  Circle,
  Square,
  Triangle,
  Plus
} from 'lucide-react';
import axios from 'axios';

const TaskEditModal = ({ task, isOpen, onClose, onSave, globalConfig }) => {
  // Mapeo de iconos
  const iconMap = {
    Briefcase, User, Users, Heart, DollarSign, GraduationCap, Cpu, TrendingUp,
    MessageCircle, Folder, AlertCircle, Flag, Circle, Square, Triangle,
    CheckCircle, Clock, Calendar, Tag, MapPin, Hash
  };

  const getIcon = (iconName) => {
    return iconMap[iconName] || Folder;
  };

  // Estado principal
  const [editedTask, setEditedTask] = useState(task);
  const [taskTitle, setTaskTitle] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [location, setLocation] = useState('');
  
  // Historial para undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Referencias
  const audioRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Configuración global con valores por defecto
  const categories = globalConfig?.globalCategories?.reduce((acc, cat) => {
    acc[cat.id] = {
      color: cat.color,
      label: cat.name,
      icon: cat.icon,
      description: cat.description
    };
    return acc;
  }, {}) || {
    work: { color: 'indigo', label: 'Trabajo', icon: 'Briefcase' },
    personal: { color: 'pink', label: 'Personal', icon: 'User' },
    health: { color: 'green', label: 'Salud', icon: 'Heart' },
    finance: { color: 'yellow', label: 'Finanzas', icon: 'DollarSign' },
    education: { color: 'purple', label: 'Educación', icon: 'GraduationCap' },
    technology: { color: 'blue', label: 'Tecnología', icon: 'Cpu' },
    business: { color: 'emerald', label: 'Negocios', icon: 'TrendingUp' }
  };
  
  const priorities = globalConfig?.globalPriorities?.reduce((acc, pri) => {
    acc[pri.id] = {
      color: pri.color,
      label: pri.name,
      icon: pri.icon,
      level: pri.level
    };
    return acc;
  }, {}) || {
    critical: { color: 'red', label: 'Crítica', icon: 'AlertCircle' },
    high: { color: 'orange', label: 'Alta', icon: 'Flag' },
    medium: { color: 'yellow', label: 'Media', icon: 'Circle' },
    low: { color: 'green', label: 'Baja', icon: 'Square' }
  };
  
  const projects = globalConfig?.globalProjects?.map(p => p.name) || [
    'JARVI System',
    'Proyecto Personal',
    'Trabajo',
    'Casa',
    'Estudios'
  ];
  
  const availableTags = globalConfig?.globalTags?.map(t => t.name) || [
    'Urgente', 'Importante', 'Seguimiento', 'Delegado',
    'En Espera', 'Algún Día', 'Referencia', 'Rápido',
    'Recurrente', 'Hito'
  ];
  
  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen && task) {
      setEditedTask(task);
      const initialTranscription = task.transcription || task.description || '';
      const initialTitle = task.title || task.text || '';
      
      // Actualizar estados inmediatamente - RESETEAR TODO
      setTaskTitle(initialTitle);
      setTranscription(initialTranscription);
      setSelectedCategory(task.category || 'personal');
      setSelectedPriority(task.priority || 'medium');
      setSelectedProject(task.project || '');
      setSelectedTags(task.tags || []);
      setDueDate(task.dueDate || '');
      setLocation(task.location || '');
      setCustomTagInput(''); // Resetear input de tags custom
      setSuggestions(null); // Limpiar sugerencias previas
      setHistory([initialTranscription]);
      setHistoryIndex(0);
      setIsImproving(false); // Resetear estado de mejora
      setIsPlaying(false); // Resetear estado de audio
    } else if (!isOpen) {
      // Limpiar todo cuando se cierre el modal
      setTaskTitle('');
      setTranscription('');
      setSelectedCategory('personal');
      setSelectedPriority('medium');
      setSelectedProject('');
      setSelectedTags([]);
      setDueDate('');
      setLocation('');
      setCustomTagInput('');
      setSuggestions(null);
      setHistory([]);
      setHistoryIndex(0);
      setIsImproving(false);
      setIsPlaying(false);
    }
  }, [isOpen, task]);
  
  // Mejorar transcripción con IA
  const improveWithAI = async () => {
    setIsImproving(true);
    try {
      const response = await axios.post('http://localhost:3005/api/improve-text', {
        text: transcription,
        context: 'task',
        improvements: ['grammar', 'clarity', 'punctuation', 'structure']
      });
      
      if (response.data.success) {
        const improvedText = response.data.improvedText;
        setTranscription(improvedText);
        addToHistory(improvedText);
        
        // Obtener sugerencias de categorización
        if (response.data.suggestions) {
          setSuggestions(response.data.suggestions);
          
          // Auto-aplicar sugerencias si tienen alta confianza
          if (response.data.suggestions.category?.confidence > 0.8) {
            setSelectedCategory(response.data.suggestions.category.value);
          }
          if (response.data.suggestions.priority?.confidence > 0.8) {
            setSelectedPriority(response.data.suggestions.priority.value);
          }
          if (response.data.suggestions.tags?.length > 0) {
            const highConfidenceTags = response.data.suggestions.tags
              .filter(t => t.confidence > 0.7)
              .map(t => t.value);
            setSelectedTags(prev => [...new Set([...prev, ...highConfidenceTags])]);
          }
        }
      }
    } catch (error) {
      console.error('Error mejorando texto:', error);
      // Fallback: mejoras básicas locales
      const improved = transcription
        .charAt(0).toUpperCase() + transcription.slice(1)
        .replace(/\s+/g, ' ')
        .trim();
      setTranscription(improved);
      addToHistory(improved);
    }
    setIsImproving(false);
  };
  
  // Gestión del historial
  const addToHistory = (text) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(text);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTranscription(history[historyIndex - 1]);
    }
  };
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTranscription(history[historyIndex + 1]);
    }
  };
  
  // Control de audio
  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // Guardar cambios
  const handleSave = () => {
    const updatedTask = {
      ...editedTask,
      title: taskTitle,
      text: taskTitle,
      transcription,
      description: transcription,
      category: selectedCategory,
      priority: selectedPriority,
      project: selectedProject,
      tags: selectedTags,
      dueDate,
      location,
      lastModified: new Date().toISOString(),
      modifiedBy: 'user'
    };
    
    onSave(updatedTask);
    onClose();
  };
  
  // Toggle tag
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Agregar tag personalizado
  const addCustomTag = () => {
    if (customTagInput.trim() && !selectedTags.includes(customTagInput.trim())) {
      setSelectedTags(prev => [...prev, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };
  
  // Manejar Enter en el input de tags
  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
  };
  
  // Eliminar tag
  const removeTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };
  
  // Detectar cambios en el texto
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setTranscription(newText);
    
    // Debounce para historial
    clearTimeout(window.textChangeTimeout);
    window.textChangeTimeout = setTimeout(() => {
      addToHistory(newText);
    }, 1000);
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex"
        >
          {/* Panel Principal */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Editar Tarea
                </h2>
                {task?.audioFile && (
                  <button
                    onClick={toggleAudio}
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={historyIndex === 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex === history.length - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Redo className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Contenido Principal */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Editor de Título */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Título de la Tarea
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-medium"
                  placeholder="Ingresa el título de la tarea..."
                />
              </div>
              
              {/* Editor de Transcripción */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Transcripción / Descripción
                  </label>
                  <button
                    onClick={improveWithAI}
                    disabled={isImproving}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
                  >
                    {isImproving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="text-sm">Mejorar con IA</span>
                  </button>
                </div>
                
                <textarea
                  ref={textareaRef}
                  value={transcription}
                  onChange={handleTextChange}
                  className="w-full h-40 px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Escribe o edita la descripción de la tarea..."
                />
                
                {/* Sugerencias de IA */}
                {suggestions && (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-900">
                        Sugerencias de IA
                      </span>
                    </div>
                    <div className="text-sm text-indigo-700">
                      {suggestions.summary}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Fecha de vencimiento */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Fecha de vencimiento
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                {/* Ubicación */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Agregar ubicación..."
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Tags */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Etiquetas
                </label>
                
                {/* Input para agregar tags personalizados */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder="Escribe un tag y presiona Enter..."
                    className="flex-1 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={addCustomTag}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Tags seleccionados (editables) */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-indigo-50 rounded-lg">
                    <span className="text-xs font-medium text-indigo-700">Tags seleccionados:</span>
                    <div className="w-full flex flex-wrap gap-2 mt-1">
                      {selectedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-indigo-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tags sugeridos */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 w-full mb-1">Tags sugeridos:</span>
                  {availableTags.filter(tag => !selectedTags.includes(tag)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer con acciones */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
          
          {/* Panel Lateral de Configuración */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-4">Clasificación</h3>
            
            {/* Categoría */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Folder className="inline h-4 w-4 mr-1" />
                Categoría
              </label>
              <div className="space-y-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      selectedCategory === key
                        ? 'bg-white ring-2 ring-indigo-500 shadow-sm'
                        : 'hover:bg-white/70'
                    }`}
                  >
                    {React.createElement(getIcon(cat.icon), { 
                      className: `w-4 h-4 ${
                        cat.color === 'indigo' ? 'text-indigo-600' :
                        cat.color === 'pink' ? 'text-pink-600' :
                        cat.color === 'green' ? 'text-green-600' :
                        cat.color === 'yellow' ? 'text-yellow-600' :
                        cat.color === 'purple' ? 'text-purple-600' :
                        cat.color === 'blue' ? 'text-blue-600' :
                        cat.color === 'emerald' ? 'text-emerald-600' :
                        cat.color === 'rose' ? 'text-rose-600' :
                        cat.color === 'cyan' ? 'text-cyan-600' :
                        cat.color === 'violet' ? 'text-violet-600' :
                        'text-gray-600'
                      }`
                    })}
                    <span className={`text-sm font-medium ${
                      selectedCategory === key ? 'text-gray-900' : 'text-gray-700'
                    }`}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Prioridad */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Flag className="inline h-4 w-4 mr-1" />
                Prioridad
              </label>
              <div className="space-y-2">
                {Object.entries(priorities).map(([key, priority]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPriority(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      selectedPriority === key
                        ? 'bg-white ring-2 ring-indigo-500 shadow-sm'
                        : 'hover:bg-white/70'
                    }`}
                  >
                    {React.createElement(getIcon(priority.icon), { 
                      className: `w-4 h-4 ${
                        priority.color === 'red' ? 'text-red-600' :
                        priority.color === 'orange' ? 'text-orange-600' :
                        priority.color === 'yellow' ? 'text-yellow-600' :
                        priority.color === 'green' ? 'text-green-600' :
                        priority.color === 'gray' ? 'text-gray-600' :
                        'text-gray-600'
                      }`
                    })}
                    <span className={`text-sm font-medium ${
                      selectedPriority === key ? 'text-gray-900' : 'text-gray-700'
                    }`}>{priority.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Proyecto */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Hash className="inline h-4 w-4 mr-1" />
                Proyecto
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Sin proyecto</option>
                {projects.map(project => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Info de creación */}
            {task && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Creado por: {task.createdBy || 'Sistema'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(task.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {task.audioFile && (
                    <div className="flex items-center gap-1">
                      <Volume2 className="h-3 w-3" />
                      <span>Audio: {task.audioDuration}s</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Audio oculto */}
        {task?.audioFile && (
          <audio
            ref={audioRef}
            src={`http://localhost:3003${task.audioFile}`}
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskEditModal;