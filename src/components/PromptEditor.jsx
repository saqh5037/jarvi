import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Save,
  History,
  Zap,
  X,
  Check,
  Plus,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Tag,
  FileText,
  Sparkles,
  RefreshCw,
  Star,
  StarOff
} from 'lucide-react';
import ProjectDetector from './ProjectDetector';
import PromptNameGenerator from './PromptNameGenerator';
import classificationService from '../services/PromptClassificationService';

const PromptEditor = ({ 
  initialPrompt = '', 
  onSave, 
  onCancel,
  title = 'Editor de Prompt',
  showPreview = true,
  context = '',
  promptType = 'custom'
}) => {
  const [editedPrompt, setEditedPrompt] = useState(initialPrompt);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [shortcuts, setShortcuts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isEditing, setIsEditing] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState(null);
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [generatedName, setGeneratedName] = useState('');
  const [generatedTags, setGeneratedTags] = useState([]);
  const textareaRef = useRef(null);

  // Shortcuts predefinidos
  const defaultShortcuts = [
    {
      id: 1,
      trigger: '::precaution',
      text: 'ANTES DE HACER CUALQUIER MODIFICACION de codigo o configuracion dame 3 opciones de hacerlo y dime una recomendacion PREGUNTAME ANTES',
      icon: '⚠️'
    },
    {
      id: 2,
      trigger: '::options',
      text: 'Dame 3 opciones diferentes de implementar esto con sus pros y contras',
      icon: '🔄'
    },
    {
      id: 3,
      trigger: '::validate',
      text: 'Valida esta solución y sugiere mejoras antes de proceder',
      icon: '✅'
    },
    {
      id: 4,
      trigger: '::security',
      text: 'Revisa las consideraciones de seguridad y mejores prácticas',
      icon: '🔒'
    },
    {
      id: 5,
      trigger: '::performance',
      text: 'Analiza el rendimiento y sugiere optimizaciones',
      icon: '⚡'
    },
    {
      id: 6,
      trigger: '::explain',
      text: 'Explica paso a paso lo que harás antes de ejecutar',
      icon: '📝'
    }
  ];

  // Tags disponibles
  const availableTags = [
    'desarrollo', 'marketing', 'documentación', 'análisis', 
    'reunión', 'tareas', 'ideas', 'código', 'diseño', 'estrategia'
  ];

  useEffect(() => {
    // Cargar datos guardados del localStorage
    const saved = localStorage.getItem('jarvi_saved_prompts');
    const userShortcuts = localStorage.getItem('jarvi_shortcuts');
    const promptHistory = localStorage.getItem('jarvi_prompt_history');
    
    if (saved) {
      setSavedPrompts(JSON.parse(saved));
    }
    
    if (userShortcuts) {
      setShortcuts([...defaultShortcuts, ...JSON.parse(userShortcuts)]);
    } else {
      setShortcuts(defaultShortcuts);
    }
    
    if (promptHistory) {
      setHistory(JSON.parse(promptHistory).slice(0, 20)); // Últimos 20
    }

    // Inicializar historia con el prompt inicial
    if (initialPrompt) {
      addToHistory(initialPrompt);
    }
  }, []);

  const addToHistory = (prompt) => {
    if (!prompt || prompt.trim() === '') return;
    
    const newHistory = [prompt, ...history.filter(h => h !== prompt)].slice(0, 20);
    setHistory(newHistory);
    setHistoryIndex(-1);
    localStorage.setItem('jarvi_prompt_history', JSON.stringify(newHistory));
  };

  const insertShortcut = (shortcut) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedPrompt;
    
    const newText = text.substring(0, start) + shortcut.text + text.substring(end);
    setEditedPrompt(newText);
    
    // Restaurar el foco y posición del cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + shortcut.text.length,
        start + shortcut.text.length
      );
    }, 0);
  };

  const savePromptTemplate = async () => {
    // Usar el nombre generado o el personalizado
    const finalName = promptName || generatedName;
    if (!finalName.trim()) return;

    const projectId = selectedProject?.id || localStorage.getItem('jarvi_active_project') || 'jarvi-main';
    
    // Usar los tags generados si no hay tags seleccionados manualmente
    const finalTags = selectedTags.length > 0 ? selectedTags : generatedTags;
    
    // Preparar contexto para la clasificación
    const classificationContext = {
      currentProject: selectedProject?.name || projectId,
      tags: finalTags,
      promptType: promptType
    };
    
    // Realizar clasificación automática
    const classification = await classificationService.classifyPrompt(
      editedPrompt,
      classificationContext
    );

    const newPrompt = {
      id: Date.now().toString(),
      name: finalName,
      content: editedPrompt,
      tags: finalTags,
      type: promptType,
      projectId: projectId,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 0,
      classification: classification // Usar clasificación automática
    };

    const updated = [...savedPrompts, newPrompt];
    setSavedPrompts(updated);
    localStorage.setItem('jarvi_saved_prompts', JSON.stringify(updated));
    
    // Guardar también en la cronología de proyectos
    const chronologyPrompts = JSON.parse(localStorage.getItem('jarvi_chronology_prompts') || '[]');
    const chronologyEntry = {
      id: Date.now().toString(),
      projectId: projectId,
      content: editedPrompt,
      timestamp: new Date().toISOString(),
      tags: selectedTags,
      status: 'draft',
      iterations: 1,
      errors: [],
      learnings: [],
      result: '',
      timeSpent: 0,
      isSuccessful: false,
      name: promptName,
      classification: classification, // Agregar clasificación automática
      autoClassified: true
    };
    chronologyPrompts.push(chronologyEntry);
    localStorage.setItem('jarvi_chronology_prompts', JSON.stringify(chronologyPrompts));
    
    // Guardar proyecto activo
    if (selectedProject) {
      localStorage.setItem('jarvi_active_project', selectedProject.id);
    }
    
    setShowSaveDialog(false);
    setPromptName('');
    setSelectedTags([]);
  };

  const loadSavedPrompt = (prompt) => {
    setEditedPrompt(prompt.content);
    
    // Actualizar última fecha de uso
    const updated = savedPrompts.map(p => 
      p.id === prompt.id 
        ? { ...p, lastUsed: new Date().toISOString(), useCount: (p.useCount || 0) + 1 }
        : p
    );
    setSavedPrompts(updated);
    localStorage.setItem('jarvi_saved_prompts', JSON.stringify(updated));
  };

  const deletePrompt = (promptId) => {
    const updated = savedPrompts.filter(p => p.id !== promptId);
    setSavedPrompts(updated);
    localStorage.setItem('jarvi_saved_prompts', JSON.stringify(updated));
  };

  const handleSave = async () => {
    if (editedPrompt.trim()) {
      addToHistory(editedPrompt);
      
      // Preparar contexto para la clasificación
      const classificationContext = {
        currentProject: selectedProject?.name || localStorage.getItem('jarvi_active_project') || 'jarvi-main',
        tags: selectedTags,
        promptType: promptType
      };
      
      // Realizar clasificación automática
      const classification = await classificationService.classifyPrompt(
        editedPrompt,
        classificationContext
      );
      
      // Guardar automáticamente en la cronología cuando se aplica un prompt
      const chronologyPrompts = JSON.parse(localStorage.getItem('jarvi_chronology_prompts') || '[]');
      const chronologyEntry = {
        id: Date.now().toString(),
        projectId: localStorage.getItem('jarvi_active_project') || 'jarvi-main',
        content: editedPrompt,
        timestamp: new Date().toISOString(),
        tags: selectedTags.length > 0 ? selectedTags : [promptType || 'general'],
        status: 'processing',
        iterations: 1,
        errors: [],
        learnings: [],
        result: '',
        timeSpent: 0,
        isSuccessful: false,
        context: context || '',
        classification: classification, // Agregar clasificación automática
        autoClassified: true
      };
      chronologyPrompts.push(chronologyEntry);
      localStorage.setItem('jarvi_chronology_prompts', JSON.stringify(chronologyPrompts));
      
      onSave(editedPrompt);
    }
  };

  const handleUndo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditedPrompt(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedPrompt(history[newIndex]);
    }
  };

  const toggleFavorite = (promptId) => {
    const updated = savedPrompts.map(p => 
      p.id === promptId ? { ...p, isFavorite: !p.isFavorite } : p
    );
    setSavedPrompts(updated);
    localStorage.setItem('jarvi_saved_prompts', JSON.stringify(updated));
  };

  // Ordenar prompts guardados (favoritos primero, luego por uso)
  const sortedPrompts = [...savedPrompts].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return (b.useCount || 0) - (a.useCount || 0);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Edit3 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botones de historial */}
          <button
            onClick={handleUndo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors disabled:opacity-30"
            title="Deshacer"
          >
            <RefreshCw className="w-4 h-4 text-gray-400 rotate-180" />
          </button>
          
          <button
            onClick={handleRedo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors disabled:opacity-30"
            title="Rehacer"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>

          {/* Botones de acción */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            title="Historial"
          >
            <History className="w-4 h-4 text-gray-400" />
          </button>
          
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            title="Shortcuts"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
          </button>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            title={isEditing ? "Vista previa" : "Editar"}
          >
            {isEditing ? <FileText className="w-4 h-4 text-gray-400" /> : <Edit3 className="w-4 h-4 text-gray-400" />}
          </button>
          
          {/* Botón de cerrar */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="ml-2 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Detector de Proyecto Inteligente */}
      <ProjectDetector
        content={editedPrompt}
        currentProject={selectedProject}
        onProjectSelect={(project) => {
          setSelectedProject(project);
          localStorage.setItem('jarvi_active_project', project.id);
        }}
        onProjectCreate={(project) => {
          setSelectedProject(project);
          localStorage.setItem('jarvi_active_project', project.id);
        }}
      />

      {/* Editor Principal */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          readOnly={!isEditing}
          className={`w-full h-48 p-4 bg-gray-800/50 rounded-lg text-gray-100 resize-none focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all ${
            !isEditing ? 'cursor-default opacity-75' : ''
          }`}
          placeholder="Escribe o edita tu prompt aquí..."
        />
        
        {/* Contador de caracteres */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          {editedPrompt.length} caracteres
        </div>
      </div>

      {/* Panel de Shortcuts */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 p-4 bg-gray-800/30 rounded-lg overflow-hidden"
          >
            <h4 className="text-sm font-medium text-gray-300 mb-3">Frases Recurrentes (Click para insertar)</h4>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.id}
                  onClick={() => insertShortcut(shortcut)}
                  className="flex items-start gap-2 p-2 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg text-left transition-colors group"
                >
                  <span className="text-lg">{shortcut.icon}</span>
                  <div className="flex-1">
                    <span className="text-xs text-cyan-400 font-mono">{shortcut.trigger}</span>
                    <p className="text-xs text-gray-300 mt-1">{shortcut.text}</p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 mt-1" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de Historial */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 p-4 bg-gray-800/30 rounded-lg overflow-hidden"
          >
            <h4 className="text-sm font-medium text-gray-300 mb-3">Historial de Prompts</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-xs text-gray-500">No hay historial disponible</p>
              ) : (
                history.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setEditedPrompt(item)}
                    className="w-full p-2 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg text-left transition-colors"
                  >
                    <p className="text-xs text-gray-300 line-clamp-2">{item}</p>
                    <span className="text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Hace {index + 1} cambio{index > 0 ? 's' : ''}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompts Guardados */}
      <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Prompts Guardados ({sortedPrompts.length})
          </h4>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="text-xs px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Guardar actual
          </button>
        </div>
        
        {sortedPrompts.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No hay prompts guardados</p>
            <p className="text-xs text-gray-600 mt-1">Los prompts que guardes aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-all ${
                  expandedPrompt === prompt.id ? 'ring-2 ring-cyan-500' : ''
                }`}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavorite(prompt.id)}
                          className="text-yellow-400 hover:scale-110 transition-transform"
                        >
                          {prompt.isFavorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                        </button>
                        
                        <h5 className="text-sm font-medium text-gray-200 flex-1">{prompt.name}</h5>
                        
                        <button
                          onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
                          className="text-gray-400 hover:text-cyan-400 transition-colors"
                          title={expandedPrompt === prompt.id ? "Ocultar" : "Ver contenido"}
                        >
                          {expandedPrompt === prompt.id ? 
                            <ChevronUp className="w-4 h-4" /> : 
                            <ChevronDown className="w-4 h-4" />
                          }
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {prompt.tags && prompt.tags.map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-600/50 text-gray-400 rounded">
                            #{tag}
                          </span>
                        ))}
                        <span className="text-xs text-gray-500 ml-auto">
                          {prompt.useCount || 0} usos
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(prompt.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => loadSavedPrompt(prompt)}
                        className="p-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded transition-colors"
                        title="Usar este prompt"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(prompt.content);
                        }}
                        className="p-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded transition-colors"
                        title="Copiar prompt"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => deletePrompt(prompt.id)}
                        className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Vista previa del contenido */}
                  {expandedPrompt === prompt.id && (
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">Contenido del Prompt:</p>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                        {prompt.content}
                      </pre>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            setEditedPrompt(prompt.content);
                            setExpandedPrompt(null);
                          }}
                          className="text-xs px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
                        >
                          Cargar en Editor
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(prompt.content);
                          }}
                          className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Copiar al Portapapeles
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Guardar */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Guardar Prompt</h3>
              
              {/* Generador de Nombre Inteligente */}
              <div className="mb-4">
                <PromptNameGenerator
                  content={editedPrompt}
                  projectName={selectedProject?.name}
                  classification={window.lastClassification}
                  initialTags={selectedTags}
                  onNameGenerated={(name, tags) => {
                    setGeneratedName(name);
                    setGeneratedTags(tags);
                    setPromptName(name);
                    if (tags.length > 0 && selectedTags.length === 0) {
                      setSelectedTags(tags);
                    }
                  }}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">O usa un nombre personalizado:</label>
                <input
                  type="text"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  placeholder="Nombre personalizado del prompt..."
                  className="w-full p-3 bg-gray-700/50 rounded-lg text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Tags (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-cyan-500/30 text-cyan-400'
                          : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={savePromptTemplate}
                  disabled={!promptName.trim()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones de Acción Principal */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Aplicar Prompt
        </button>
      </div>
    </motion.div>
  );
};

export default PromptEditor;