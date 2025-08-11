import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Mic,
  FileText,
  Brain,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Settings,
  Loader2,
  CheckCircle,
  X,
  Edit3,
  Save,
  Target,
  Hash,
  Clock
} from 'lucide-react';
import axios from 'axios';

const AutoPromptGenerator = ({ 
  transcription = '', 
  voiceNote = null,
  onPromptsGenerated,
  onClose 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [analyzedThemes, setAnalyzedThemes] = useState([]);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [maxPromptLength, setMaxPromptLength] = useState(200);
  const [generationMode, setGenerationMode] = useState('auto'); // auto, manual
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [processingStep, setProcessingStep] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [showJSON, setShowJSON] = useState(false);

  // Módulos predefinidos del sistema JARVI
  const availableModules = [
    {
      id: 'tasks',
      name: 'Tareas',
      icon: '✅',
      description: 'Gestión de tareas y to-dos',
      promptTemplate: 'Crear tarea: {content}',
      keywords: ['tarea', 'hacer', 'pendiente', 'completar', 'lista']
    },
    {
      id: 'reminders',
      name: 'Recordatorios',
      icon: '🔔',
      description: 'Alertas y notificaciones',
      promptTemplate: 'Recordatorio: {content} - Fecha: {date}',
      keywords: ['recordar', 'avisar', 'notificar', 'alarma', 'fecha']
    },
    {
      id: 'meetings',
      name: 'Reuniones',
      icon: '👥',
      description: 'Gestión de reuniones',
      promptTemplate: 'Reunión: {content} - Participantes: {participants}',
      keywords: ['reunión', 'meeting', 'cita', 'encuentro', 'junta']
    },
    {
      id: 'interests',
      name: 'Intereses',
      icon: '📚',
      description: 'Artículos y contenido guardado',
      promptTemplate: 'Guardar artículo/recurso: {content}',
      keywords: ['artículo', 'guardar', 'interesante', 'leer', 'revisar']
    },
    {
      id: 'notes',
      name: 'Notas',
      icon: '📝',
      description: 'Notas generales',
      promptTemplate: 'Nota: {content}',
      keywords: ['nota', 'apunte', 'idea', 'pensamiento', 'reflexión']
    },
    {
      id: 'projects',
      name: 'Proyectos',
      icon: '📁',
      description: 'Gestión de proyectos',
      promptTemplate: 'Proyecto: {content} - Objetivo: {objective}',
      keywords: ['proyecto', 'desarrollo', 'implementar', 'crear', 'construir']
    }
  ];

  useEffect(() => {
    if (transcription && transcription.length > 10) {
      analyzeTranscription();
    }
  }, [transcription]);

  // Analizar la transcripción para identificar temas principales
  const analyzeTranscription = async () => {
    setProcessingStep('Analizando transcripción...');
    
    try {
      // Llamar al servidor de clasificación con IA
      const response = await axios.post('http://localhost:3005/api/classify', {
        content: transcription,
        context: {
          task: 'prompt_generation',
          modules: availableModules.map(m => m.name)
        }
      });

      if (response.data.success) {
        const classification = response.data.classification;
        
        // Extraer temas principales
        const themes = [
          classification.category?.main,
          ...classification.tags,
          ...classification.actionItems
        ].filter(Boolean);
        
        setAnalyzedThemes(themes);
        setConfidence(classification.category?.confidence || 75);
        
        // Auto-seleccionar módulos relevantes basados en el análisis
        autoSelectModules(classification);
        
        // Si el modo es automático, generar prompts inmediatamente
        if (generationMode === 'auto') {
          setTimeout(() => generatePrompts(), 500);
        }
      }
    } catch (error) {
      console.error('Error analizando transcripción:', error);
      // Fallback a análisis local
      localAnalyzeTranscription();
    }
  };

  // Análisis local de la transcripción (fallback)
  const localAnalyzeTranscription = () => {
    const lowerText = transcription.toLowerCase();
    const themes = [];
    const selectedMods = [];

    availableModules.forEach(module => {
      const keywordMatches = module.keywords.filter(keyword => 
        lowerText.includes(keyword)
      );
      
      if (keywordMatches.length > 0) {
        themes.push(...keywordMatches);
        selectedMods.push(module.id);
      }
    });

    // Extraer fechas mencionadas
    const datePattern = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+de\s+\w+|mañana|hoy|próximo\s+\w+)\b/gi;
    const dates = transcription.match(datePattern);
    if (dates) {
      themes.push('fecha detectada');
    }

    // Extraer nombres propios (posibles participantes)
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const names = transcription.match(namePattern);
    if (names) {
      themes.push('participantes detectados');
    }

    setAnalyzedThemes([...new Set(themes)]);
    setSelectedModules(selectedMods);
    setConfidence(65);
  };

  // Auto-seleccionar módulos basados en el análisis
  const autoSelectModules = (classification) => {
    const selectedMods = [];
    const lowerText = transcription.toLowerCase();

    // Seleccionar módulos basados en categoría y tags
    if (classification.category?.main === 'feature' || classification.tags?.includes('tarea')) {
      selectedMods.push('tasks');
    }
    
    if (lowerText.includes('recordar') || lowerText.includes('fecha') || classification.priority?.level === 'high') {
      selectedMods.push('reminders');
    }
    
    if (lowerText.includes('reunión') || lowerText.includes('meeting') || classification.tags?.includes('colaboración')) {
      selectedMods.push('meetings');
    }
    
    if (classification.category?.main === 'documentation' || classification.tags?.includes('documentación')) {
      selectedMods.push('interests');
    }

    // Si no se detectó ningún módulo específico, usar "notes" como fallback
    if (selectedMods.length === 0) {
      selectedMods.push('notes');
    }

    setSelectedModules(selectedMods);
  };

  // Generar prompts para los módulos seleccionados
  const generatePrompts = async () => {
    if (selectedModules.length === 0) {
      alert('Por favor selecciona al menos un módulo');
      return;
    }

    setIsGenerating(true);
    setProcessingStep('Generando prompts...');
    const prompts = [];

    try {
      // Generar prompts con IA
      const response = await axios.post('http://localhost:3005/api/generate-prompts', {
        transcription,
        modules: selectedModules.map(id => availableModules.find(m => m.id === id)),
        maxLength: maxPromptLength,
        themes: analyzedThemes
      });

      if (response.data.success) {
        prompts.push(...response.data.prompts);
      } else {
        // Fallback a generación local
        generateLocalPrompts(prompts);
      }
    } catch (error) {
      console.error('Error generando prompts con IA:', error);
      // Fallback a generación local
      generateLocalPrompts(prompts);
    }

    setGeneratedPrompts(prompts);
    setIsGenerating(false);
    setProcessingStep('');
    
    // Notificar al componente padre
    if (onPromptsGenerated) {
      onPromptsGenerated(prompts);
    }
  };

  // Generación local de prompts (fallback)
  const generateLocalPrompts = (prompts) => {
    selectedModules.forEach(moduleId => {
      const module = availableModules.find(m => m.id === moduleId);
      if (!module) return;

      let prompt = transcription;
      
      // Acortar si es necesario
      if (prompt.length > maxPromptLength) {
        prompt = prompt.substring(0, maxPromptLength - 3) + '...';
      }

      // Aplicar template del módulo
      let formattedPrompt = module.promptTemplate;
      formattedPrompt = formattedPrompt.replace('{content}', prompt);
      
      // Reemplazar placeholders adicionales
      const dateMatch = transcription.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+de\s+\w+|mañana|hoy|próximo\s+\w+)\b/i);
      if (dateMatch) {
        formattedPrompt = formattedPrompt.replace('{date}', dateMatch[0]);
      } else {
        formattedPrompt = formattedPrompt.replace(' - Fecha: {date}', '');
      }

      const nameMatch = transcription.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g);
      if (nameMatch) {
        formattedPrompt = formattedPrompt.replace('{participants}', nameMatch.join(', '));
      } else {
        formattedPrompt = formattedPrompt.replace(' - Participantes: {participants}', '');
      }

      formattedPrompt = formattedPrompt.replace('{objective}', 'Por definir');

      prompts.push({
        module: module.name,
        moduleId: module.id,
        icon: module.icon,
        prompt: formattedPrompt,
        confidence: confidence,
        themes: analyzedThemes.filter(t => module.keywords.includes(t))
      });
    });
  };

  // Copiar prompt al portapapeles
  const copyPrompt = (prompt, index) => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Guardar prompt editado
  const saveEditedPrompt = (index, newText) => {
    const updated = [...generatedPrompts];
    updated[index].prompt = newText;
    setGeneratedPrompts(updated);
    setEditingPrompt(null);
  };

  // Exportar como JSON
  const exportAsJSON = () => {
    const output = {
      transcription,
      analyzedThemes,
      confidence: `${confidence}%`,
      timestamp: new Date().toISOString(),
      prompts: generatedPrompts.map(p => ({
        module: p.module,
        prompt: p.prompt,
        confidence: p.confidence,
        themes: p.themes
      }))
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Obtener JSON formateado para visualización
  const getFormattedJSON = () => {
    const output = {
      transcription: transcription.substring(0, 100) + (transcription.length > 100 ? '...' : ''),
      prompts: generatedPrompts.map(p => ({
        module: p.module,
        prompt: p.prompt
      }))
    };
    return JSON.stringify(output, null, 2);
  };

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
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Wand2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Generador Automático de Prompts</h2>
                <p className="text-purple-100 text-sm">
                  Convierte notas de voz en prompts estructurados
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Transcripción */}
          {transcription && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Transcripción
                </h3>
                <span className="text-xs text-gray-500">
                  {transcription.length} caracteres
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 italic">
                  "{transcription}"
                </p>
              </div>
            </div>
          )}

          {/* Temas analizados */}
          {analyzedThemes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Temas Identificados
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  Confianza: {confidence}%
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {analyzedThemes.map((theme, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-200"
                  >
                    #{theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selector de módulos */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Módulos Objetivo
              </h3>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableModules.map(module => (
                <button
                  key={module.id}
                  onClick={() => {
                    if (selectedModules.includes(module.id)) {
                      setSelectedModules(selectedModules.filter(id => id !== module.id));
                    } else {
                      setSelectedModules([...selectedModules, module.id]);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedModules.includes(module.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{module.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {module.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  {selectedModules.includes(module.id) && (
                    <CheckCircle className="w-4 h-4 text-purple-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Configuración avanzada */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 p-4 bg-gray-50 rounded-lg overflow-hidden"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-3">Configuración Avanzada</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Modo de generación
                    </label>
                    <select
                      value={generationMode}
                      onChange={(e) => setGenerationMode(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-sm"
                    >
                      <option value="auto">Automático</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Longitud máxima del prompt (caracteres)
                    </label>
                    <input
                      type="number"
                      value={maxPromptLength}
                      onChange={(e) => setMaxPromptLength(parseInt(e.target.value) || 200)}
                      min="50"
                      max="500"
                      className="w-full p-2 bg-white border border-gray-200 rounded text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de generación */}
          {!isGenerating && generatedPrompts.length === 0 && (
            <div className="flex justify-center">
              <button
                onClick={generatePrompts}
                disabled={selectedModules.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generar Prompts
              </button>
            </div>
          )}

          {/* Estado de procesamiento */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
              <p className="text-gray-600 font-medium">{processingStep}</p>
              <p className="text-sm text-gray-500 mt-1">Esto puede tomar unos segundos...</p>
            </div>
          )}

          {/* Prompts generados */}
          {generatedPrompts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Prompts Generados ({generatedPrompts.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJSON(!showJSON)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    <Hash className="w-3 h-3" />
                    {showJSON ? 'Ocultar' : 'Ver'} JSON
                  </button>
                  <button
                    onClick={exportAsJSON}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Exportar
                  </button>
                  <button
                    onClick={generatePrompts}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerar
                  </button>
                </div>
              </div>

              {/* Vista JSON */}
              {showJSON && (
                <div className="mb-4 p-4 bg-gray-900 rounded-lg">
                  <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                    {getFormattedJSON()}
                  </pre>
                </div>
              )}

              {/* Lista de prompts */}
              <div className="space-y-3">
                {generatedPrompts.map((prompt, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{prompt.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {prompt.module}
                          </h4>
                          {prompt.themes && prompt.themes.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {prompt.themes.slice(0, 3).map((theme, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                  {theme}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingPrompt === index ? (
                          <>
                            <button
                              onClick={() => {
                                const textarea = document.getElementById(`prompt-edit-${index}`);
                                saveEditedPrompt(index, textarea.value);
                              }}
                              className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                              title="Guardar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingPrompt(null)}
                              className="p-1.5 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingPrompt(index)}
                              className="p-1.5 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => copyPrompt(prompt, index)}
                              className="p-1.5 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                              title="Copiar"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingPrompt === index ? (
                      <textarea
                        id={`prompt-edit-${index}`}
                        defaultValue={prompt.prompt}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {prompt.prompt}
                        </p>
                      </div>
                    )}
                    
                    {prompt.confidence && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            style={{ width: `${prompt.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {prompt.confidence}% confianza
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedPrompts.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                Generados a las {new Date().toLocaleTimeString()}
              </p>
              <button
                onClick={() => {
                  if (onPromptsGenerated) {
                    onPromptsGenerated(generatedPrompts);
                  }
                  onClose();
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Aplicar Prompts
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AutoPromptGenerator;