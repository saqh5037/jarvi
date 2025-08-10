import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Brain,
  Sparkles,
  Copy,
  Share2,
  ChevronRight,
  Loader2,
  Check,
  Plus,
  Wand2,
  FileText,
  MessageSquare,
  Target,
  Lightbulb,
  Code,
  Users,
  ListChecks,
  Send
} from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import { API_ENDPOINTS, SOCKET_URLS } from '../config/api';

const VOICE_SERVER = API_ENDPOINTS.VOICE_NOTES_SERVER;

const VoiceNotesProcessor = ({ voiceNote }) => {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [processedResult, setProcessedResult] = useState(null);
  const [improvedPrompt, setImprovedPrompt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('process'); // process, improve, share

  // Iconos para los tipos de prompt
  const promptIcons = {
    summary: <FileText className="w-4 h-4" />,
    tasks: <ListChecks className="w-4 h-4" />,
    meeting: <Users className="w-4 h-4" />,
    ideas: <Lightbulb className="w-4 h-4" />,
    improve: <Target className="w-4 h-4" />,
    code: <Code className="w-4 h-4" />,
    'code-python': <Code className="w-4 h-4" />,
    'code-javascript': <Code className="w-4 h-4" />,
    'code-react': <Code className="w-4 h-4" />
  };

  useEffect(() => {
    loadPrompts();
    
    // Conectar WebSocket
    const socketConnection = io(SOCKET_URLS.VOICE_NOTES);
    socketConnection.on('connect', () => {
      console.log('Conectado al procesador de notas de voz');
    });
    
    socketConnection.on('processing-complete', (result) => {
      setProcessedResult(result);
      setIsProcessing(false);
    });
    
    socketConnection.on('processing-error', (error) => {
      console.error('Error procesando:', error);
      setIsProcessing(false);
    });
    
    setSocket(socketConnection);
    
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const loadPrompts = async () => {
    try {
      const response = await axios.get(`${VOICE_SERVER}/api/voice-notes/prompts`);
      if (response.data.success) {
        setPrompts(response.data.prompts);
      }
    } catch (error) {
      console.error('Error cargando prompts:', error);
    }
  };

  const processWithPrompt = async (promptType = null) => {
    if (!voiceNote?.transcription && !voiceNote?.text) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(`${VOICE_SERVER}/api/voice-notes/process`, {
        noteId: voiceNote.id,
        transcription: voiceNote.transcription || voiceNote.text,
        promptType: promptType || selectedPrompt,
        customPrompt: customPrompt || null
      });
      
      if (response.data.success) {
        setProcessedResult(response.data.result);
      }
    } catch (error) {
      console.error('Error procesando nota:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const improveForClaude = async () => {
    if (!voiceNote?.transcription && !voiceNote?.text) return;
    
    setIsImproving(true);
    try {
      const response = await axios.post(`${VOICE_SERVER}/api/voice-notes/improve-prompt`, {
        instructions: voiceNote.transcription || voiceNote.text,
        context: customPrompt || ''
      });
      
      if (response.data.success) {
        setImprovedPrompt(response.data.result);
        setActiveTab('share');
      }
    } catch (error) {
      console.error('Error mejorando prompt:', error);
    } finally {
      setIsImproving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWithClaude = async () => {
    const textToShare = improvedPrompt?.improved || processedResult?.processed || '';
    
    try {
      const response = await axios.post(`${VOICE_SERVER}/api/voice-notes/share-claude`, {
        prompt: textToShare,
        context: voiceNote?.transcription || ''
      });
      
      if (response.data.success) {
        copyToClipboard(response.data.claudeReady.formatted);
      }
    } catch (error) {
      console.error('Error compartiendo con Claude:', error);
    }
  };

  const saveCustomPrompt = async () => {
    if (!customPrompt.trim()) return;
    
    try {
      const response = await axios.post(`${VOICE_SERVER}/api/voice-notes/prompts`, {
        name: 'Prompt personalizado',
        prompt: customPrompt,
        icon: '⭐'
      });
      
      if (response.data.success) {
        loadPrompts();
        setShowCustomPromptModal(false);
        setCustomPrompt('');
      }
    } catch (error) {
      console.error('Error guardando prompt:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-2xl p-6 border border-purple-500/30">
      {/* Header con tabs */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" />
          Procesador Inteligente de Notas
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'process' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Procesar
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'code' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Code className="w-4 h-4" />
            Generar Código
          </button>
          <button
            onClick={() => setActiveTab('improve')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'improve' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Mejorar Prompt
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'share' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Compartir
          </button>
        </div>
      </div>

      {/* Tab de Procesar */}
      {activeTab === 'process' && (
        <div className="space-y-4">
          {/* Selección de prompts */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Selecciona un tipo de procesamiento:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {prompts.map(prompt => (
                <motion.button
                  key={prompt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedPrompt(prompt.id);
                    processWithPrompt(prompt.id);
                  }}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedPrompt === prompt.id
                      ? 'bg-purple-600/30 border-purple-500'
                      : 'bg-gray-800/50 border-gray-700 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{prompt.icon}</span>
                    <span className="text-sm text-white">{prompt.name}</span>
                  </div>
                </motion.button>
              ))}
              
              {/* Botón para prompt personalizado */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCustomPromptModal(true)}
                className="p-3 rounded-lg border bg-gray-800/50 border-gray-700 hover:border-purple-500/50"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white">Personalizado</span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Resultado procesado */}
          {processedResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-purple-400">
                  {selectedPrompt && selectedPrompt.startsWith('code') ? 
                    '💻 Código Generado' : 
                    'Resultado Procesado'}
                </h4>
                <div className="flex items-center gap-2">
                  {selectedPrompt && selectedPrompt.startsWith('code') && (
                    <span className="text-xs px-2 py-1 bg-purple-600/30 text-purple-300 rounded-full">
                      {selectedPrompt === 'code-python' ? 'Python' :
                       selectedPrompt === 'code-javascript' ? 'JavaScript' :
                       selectedPrompt === 'code-react' ? 'React' : 'Código'}
                    </span>
                  )}
                  <button
                    onClick={() => copyToClipboard(processedResult.processed)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className={`whitespace-pre-wrap text-sm max-h-96 overflow-y-auto ${
                selectedPrompt && selectedPrompt.startsWith('code') 
                  ? 'bg-black/40 p-4 rounded font-mono text-green-400' 
                  : 'text-gray-300'
              }`}>
                {processedResult.processed}
              </div>
            </motion.div>
          )}

          {/* Indicador de procesamiento */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="ml-3 text-gray-300">Procesando con IA...</span>
            </div>
          )}
        </div>
      )}

      {/* Tab de Generar Código */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Selecciona el lenguaje de programación:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedPrompt('code-python');
                  processWithPrompt('code-python');
                }}
                className="p-4 rounded-lg bg-gradient-to-r from-blue-600/20 to-yellow-600/20 border border-blue-500/30 hover:border-blue-500/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">🐍</span>
                  <span className="text-white font-medium">Python</span>
                  <span className="text-xs text-gray-400">Scripts, IA, Data Science</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedPrompt('code-javascript');
                  processWithPrompt('code-javascript');
                }}
                className="p-4 rounded-lg bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 hover:border-yellow-500/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">🟨</span>
                  <span className="text-white font-medium">JavaScript</span>
                  <span className="text-xs text-gray-400">Web, Node.js, APIs</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedPrompt('code-react');
                  processWithPrompt('code-react');
                }}
                className="p-4 rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">⚛️</span>
                  <span className="text-white font-medium">React</span>
                  <span className="text-xs text-gray-400">Componentes, UI, Hooks</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedPrompt('code');
                  processWithPrompt('code');
                }}
                className="p-4 rounded-lg bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">💻</span>
                  <span className="text-white font-medium">Código General</span>
                  <span className="text-xs text-gray-400">Cualquier lenguaje</span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-yellow-400 mb-2">💡 Cómo usar la generación de código:</h4>
            <ol className="text-xs text-gray-400 space-y-1">
              <li>1. Describe claramente qué debe hacer el código en tu nota de voz</li>
              <li>2. Menciona entradas, salidas y algoritmos específicos</li>
              <li>3. Selecciona el lenguaje de programación apropiado</li>
              <li>4. El código generado incluirá comentarios y ejemplos de uso</li>
            </ol>
          </div>

          {/* Resultado del código generado */}
          {processedResult && selectedPrompt && selectedPrompt.startsWith('code') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 rounded-lg p-4 border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-green-400" />
                  <h4 className="text-sm font-medium text-green-400">Código Generado</h4>
                  <span className="text-xs px-2 py-1 bg-green-600/30 text-green-300 rounded-full">
                    {selectedPrompt === 'code-python' ? 'Python' :
                     selectedPrompt === 'code-javascript' ? 'JavaScript' :
                     selectedPrompt === 'code-react' ? 'React' : 'Código'}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(processedResult.processed)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-green-400 font-mono text-xs overflow-x-auto">
                <code>{processedResult.processed}</code>
              </pre>
            </motion.div>
          )}

          {/* Indicador de procesamiento */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="ml-3 text-gray-300">Generando código con IA...</span>
            </div>
          )}
        </div>
      )}

      {/* Tab de Mejorar Prompt */}
      {activeTab === 'improve' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Contexto adicional (opcional):
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Añade contexto para mejorar la conversión del prompt..."
              className="w-full h-24 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={improveForClaude}
            disabled={isImproving}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isImproving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mejorando prompt...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Mejorar para Claude
              </>
            )}
          </button>

          {improvedPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-4 border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-green-400">Prompt Mejorado para Claude</h4>
                <button
                  onClick={() => copyToClipboard(improvedPrompt.improved)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-gray-300 whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
                {improvedPrompt.improved}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab de Compartir */}
      {activeTab === 'share' && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <Share2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">
              Compartir con Claude
            </h4>
            <p className="text-gray-400 text-sm mb-6">
              Copia el prompt optimizado y pégalo en Claude para obtener mejores resultados
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={shareWithClaude}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copiar para Claude
              </button>
              
              <button
                onClick={() => window.open('https://claude.ai', '_blank')}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Abrir Claude
              </button>
            </div>
          </div>

          {(improvedPrompt || processedResult) && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h5 className="text-sm text-gray-400 mb-2">Vista previa del prompt:</h5>
              <div className="text-gray-300 text-xs font-mono bg-black/30 p-3 rounded">
                {improvedPrompt?.improved || processedResult?.processed || 'No hay contenido procesado'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de prompt personalizado */}
      {showCustomPromptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-purple-500/30"
          >
            <h4 className="text-lg font-bold text-white mb-4">
              Prompt Personalizado
            </h4>
            
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Escribe tu prompt personalizado para procesar la nota de voz..."
              className="w-full h-32 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none mb-4"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCustomPromptModal(false);
                  setCustomPrompt('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  processWithPrompt();
                  setShowCustomPromptModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Procesar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VoiceNotesProcessor;