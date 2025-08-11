import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Volume2,
  Clock,
  User,
  FileText,
  Loader2,
  Sparkles,
  Brain,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  Hash,
  MessageSquare,
  Cpu,
  Globe,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Wand2,
  Search,
  List
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import VoiceNotesProcessor from './VoiceNotesProcessor';
import PromptGenerator from './PromptGenerator';
import VoiceNotesSearch from './VoiceNotesSearch';
import AutoPromptGenerator from './AutoPromptGenerator';
import { API_ENDPOINTS, SOCKET_URLS } from '../config/api';

const EnhancedVoiceNotesModule = () => {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transcribingNotes, setTranscribingNotes] = useState(new Set());
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [selectedNoteForProcessing, setSelectedNoteForProcessing] = useState(null);
  const [showProcessor, setShowProcessor] = useState(false);
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);
  const [selectedNoteForPrompt, setSelectedNoteForPrompt] = useState(null);
  const [aiStats, setAiStats] = useState({
    totalTokens: 0,
    totalCost: 0,
    transcriptionsToday: 0,
    averageTokens: 0,
    provider: 'Gemini AI'
  });
  const [realtimeTranscription, setRealtimeTranscription] = useState({});
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' o 'search'
  const [showAutoPromptGenerator, setShowAutoPromptGenerator] = useState(false);
  const [selectedNoteForAutoPrompt, setSelectedNoteForAutoPrompt] = useState(null);
  
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    // Conectar con Socket.io
    socketRef.current = io(SOCKET_URLS.ENHANCED_NOTES);
    
    socketRef.current.on('connect', () => {
      console.log('✅ Conectado al servidor');
      setIsConnected(true);
      loadVoiceNotes();
      loadAiStats();
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setIsConnected(false);
    });
    
    // Escuchar nuevas notas de voz
    socketRef.current.on('new-voice-note', (voiceNote) => {
      console.log('🎙️ Nueva nota de voz:', voiceNote);
      setVoiceNotes(prev => [voiceNote, ...prev]);
      
      // Auto-transcribir si no tiene transcripción
      if (!voiceNote.transcription) {
        setTimeout(() => transcribeVoiceNote(voiceNote), 1000);
      }
      
      // Actualizar estadísticas
      setAiStats(prev => ({
        ...prev,
        transcriptionsToday: prev.transcriptionsToday + 1
      }));
    });
    
    // Escuchar progreso de transcripción
    socketRef.current.on('transcription-progress', ({ noteId, progress, tokens }) => {
      setRealtimeTranscription(prev => ({
        ...prev,
        [noteId]: { progress, tokens }
      }));
    });
    
    // Escuchar transcripciones completadas
    socketRef.current.on('transcription-complete', ({ noteId, transcription, tokens, cost }) => {
      console.log('✅ Transcripción completada:', noteId);
      
      setVoiceNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, transcription, tokens, cost } : note
      ));
      
      setTranscribingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
      
      setRealtimeTranscription(prev => {
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });
      
      // Actualizar estadísticas de IA
      setAiStats(prev => ({
        ...prev,
        totalTokens: prev.totalTokens + (tokens || 0),
        totalCost: prev.totalCost + (cost || 0),
        averageTokens: Math.round((prev.totalTokens + (tokens || 0)) / (prev.transcriptionsToday + 1))
      }));
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  const loadVoiceNotes = async () => {
    try {
      console.log('🔄 Cargando notas de voz...');
      const response = await axios.get(API_ENDPOINTS.VOICE_NOTES);
      console.log('📝 Respuesta del servidor:', response.data);
      if (response.data.success) {
        const notes = response.data.notes || [];
        console.log(`✅ ${notes.length} notas cargadas`);
        setVoiceNotes(notes);
      }
    } catch (error) {
      console.error('❌ Error cargando notas de voz:', error);
      alert('Error al cargar notas de voz: ' + error.message);
    }
  };
  
  const loadAiStats = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ENHANCED_NOTES}/api/costs`);
      if (response.data.success) {
        const costs = response.data.costs || {};
        setAiStats(prev => ({
          ...prev,
          totalCost: costs.total || 0,
          totalTokens: costs.totalTokens || 0
        }));
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };
  
  const playVoiceNote = (note) => {
    if (audioRef.current) {
      if (currentlyPlaying === note.id) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      } else {
        audioRef.current.src = `${API_ENDPOINTS.ENHANCED_NOTES}/voice-notes/${note.fileName}`;
        audioRef.current.play();
        setCurrentlyPlaying(note.id);
      }
    }
  };
  
  const transcribeVoiceNote = async (note) => {
    console.log('🎤 Iniciando transcripción para:', note);
    
    if (transcribingNotes.has(note.id)) {
      console.log('⚠️ Transcripción ya en proceso');
      return;
    }
    
    try {
      setTranscribingNotes(prev => new Set([...prev, note.id]));
      
      // Simular progreso de transcripción
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          setRealtimeTranscription(prev => ({
            ...prev,
            [note.id]: { 
              progress, 
              tokens: Math.floor(progress * 1.5),
              status: 'Procesando audio con IA...'
            }
          }));
        }
      }, 200);
      
      console.log('📡 Enviando solicitud de transcripción:', {
        noteId: note.id,
        fileName: note.fileName
      });
      
      const response = await axios.post(`${API_ENDPOINTS.ENHANCED_NOTES}/api/transcribe`, {
        noteId: note.id,
        fileName: note.fileName
      });
      
      clearInterval(progressInterval);
      
      console.log('✅ Respuesta de transcripción:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Error en transcripción');
      }
    } catch (error) {
      console.error('❌ Error transcribiendo:', error);
      alert('Error al transcribir: ' + (error.response?.data?.error || error.message));
      setTranscribingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note.id);
        return newSet;
      });
      setRealtimeTranscription(prev => {
        const newState = { ...prev };
        delete newState[note.id];
        return newState;
      });
    }
  };
  
  const deleteVoiceNote = async (note) => {
    if (confirm('¿Eliminar esta nota de voz?')) {
      try {
        const response = await axios.delete(`${API_ENDPOINTS.ENHANCED_NOTES}/api/voice-notes/${note.id}`);
        if (response.data.success) {
          setVoiceNotes(prev => prev.filter(n => n.id !== note.id));
        }
      } catch (error) {
        console.error('Error eliminando nota:', error);
      }
    }
  };
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };
  
  const toggleExpanded = (noteId) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };
  
  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Calcular estadísticas
  const totalNotes = voiceNotes.length;
  const transcribedNotes = voiceNotes.filter(n => n.transcription).length;
  const totalDuration = voiceNotes.reduce((acc, n) => acc + (n.duration || 0), 0);
  const transcriptionRate = totalNotes > 0 ? Math.round((transcribedNotes / totalNotes) * 100) : 0;
  
  return (
    <div className="space-y-4">
      {/* Header Horizontal Compacto */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          {/* Sección Izquierda: Ícono + Título */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Notas de Voz Inteligentes</h2>
              <p className="text-xs text-purple-100">Transcripción automática con IA</p>
            </div>
          </div>
          
          {/* Sección Central: Estadísticas */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">{transcribedNotes}/{totalNotes} transcritas</span>
            </div>
            <div className="h-4 w-px bg-purple-400/30"></div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">{aiStats.totalTokens.toLocaleString()} tokens</span>
            </div>
            <div className="h-4 w-px bg-purple-400/30"></div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">${aiStats.totalCost.toFixed(2)}</span>
            </div>
            <div className="h-4 w-px bg-purple-400/30"></div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">{transcriptionRate}% completado</span>
            </div>
            <div className="h-4 w-px bg-purple-400/30"></div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">{aiStats.averageTokens} tokens/nota</span>
            </div>
          </div>
          
          {/* Sección Derecha: Estado y Provider */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              } animate-pulse`} />
              <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
            
            <div className="px-2 py-1 bg-white/20 backdrop-blur rounded-full">
              <span className="text-xs font-medium">{aiStats.provider}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barra de progreso de transcripción global */}
      {Object.keys(realtimeTranscription).length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="font-medium text-indigo-900">Procesando con IA...</span>
          </div>
          {Object.entries(realtimeTranscription).map(([noteId, data]) => (
            <div key={noteId} className="mb-2">
              <div className="flex justify-between text-sm text-indigo-700 mb-1">
                <span>{data.status || 'Analizando audio...'}</span>
                <span>{data.tokens || 0} tokens</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.progress || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalNotes}</p>
              <p className="text-sm text-gray-500">Total Notas</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Mic className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(totalDuration)}</p>
              <p className="text-sm text-gray-500">Duración Total</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{aiStats.transcriptionsToday}</p>
              <p className="text-sm text-gray-500">Hoy</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {voiceNotes.filter(n => !n.transcription).length}
              </p>
              <p className="text-sm text-gray-500">Sin Transcribir</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Tabs para Lista y Búsqueda */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'notes' ? `Notas de Voz Recientes (${voiceNotes.length})` : 'Búsqueda en Notas'}
            </h3>
            
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  activeTab === 'notes' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">Lista</span>
              </button>
              
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  activeTab === 'search' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Buscar</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'notes' ? (
            // Lista de notas existente
            <>
              {voiceNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Mic className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-500">No hay notas de voz aún</p>
              <p className="text-sm text-gray-400 mt-2">
                Envía una nota de voz desde Telegram para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-2">
                Mostrando {voiceNotes.length} notas de voz
              </div>
              <AnimatePresence>
                {voiceNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    id={`note-${note.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Botón de reproducción */}
                        <button
                          onClick={() => playVoiceNote(note)}
                          className={`p-3 rounded-full transition-all ${
                            currentlyPlaying === note.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-purple-600 hover:bg-purple-100'
                          } shadow-md`}
                        >
                          {currentlyPlaying === note.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          {/* Info del usuario y tiempo */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {note.sender?.name || 'Usuario'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {formatDuration(note.duration || 0)}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {formatTime(note.timestamp)}
                            </span>
                          </div>
                          
                          {/* Transcripción o estado */}
                          {note.transcription ? (
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-purple-600 mt-0.5" />
                                <div className="flex-1">
                                  <div 
                                    onClick={() => toggleExpanded(note.id)}
                                    className="cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                                  >
                                    <p className="text-gray-700 italic">
                                      "{expandedNotes.has(note.id) 
                                        ? note.transcription 
                                        : truncateText(note.transcription, 80)}"
                                    </p>
                                    {note.transcription.length > 80 && (
                                      <button className="text-xs text-purple-600 hover:text-purple-700 mt-1 font-medium flex items-center gap-1">
                                        {expandedNotes.has(note.id) ? (
                                          <>
                                            <ChevronUp className="w-3 h-3" />
                                            Ver menos
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-3 h-3" />
                                            Ver más
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  {note.tokens && (
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Hash className="w-3 h-3" />
                                        {note.tokens} tokens
                                      </span>
                                      {note.cost && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          ${note.cost.toFixed(4)}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        IA Procesado
                                      </span>
                                    </div>
                                  )}
                                  <div className="mt-3">
                                    <button
                                      onClick={() => window.open(`${API_ENDPOINTS.ENHANCED_NOTES}/voice-notes/${note.fileName}.txt`, '_blank')}
                                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 inline-flex"
                                    >
                                      <FileText className="w-3 h-3" />
                                      Ver Transcripción (.txt)
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : transcribingNotes.has(note.id) ? (
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                                <span className="text-purple-700 font-medium">
                                  Transcribiendo con IA...
                                </span>
                                {realtimeTranscription[note.id] && (
                                  <span className="text-purple-600 text-sm">
                                    ({realtimeTranscription[note.id].progress}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => transcribeVoiceNote(note)}
                          className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                          title="Transcribir con Gemini"
                          disabled={transcribingNotes.has(note.id)}
                        >
                          {transcribingNotes.has(note.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4" />
                          )}
                        </button>
                        
                        {/* Botón de procesamiento inteligente con IA */}
                        <button
                          onClick={() => {
                            setSelectedNoteForProcessing(note);
                            setShowProcessor(true);
                          }}
                          className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Procesar con IA"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedNoteForPrompt(note);
                            setShowPromptGenerator(true);
                          }}
                          className="p-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-all"
                          title="Generar Prompt Optimizado"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedNoteForAutoPrompt(note);
                            setShowAutoPromptGenerator(true);
                          }}
                          className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                          title="Auto Generar Prompts para Módulos"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => window.open(`${API_ENDPOINTS.ENHANCED_NOTES}/voice-notes/${note.fileName}`, '_blank')}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteVoiceNote(note)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
            </>
          ) : (
            // Tab de búsqueda
            <VoiceNotesSearch 
              notes={voiceNotes}
              onNoteSelect={(note) => {
                // Cambiar a tab de notas y reproducir la nota seleccionada
                setActiveTab('notes');
                playVoiceNote(note);
                // Expandir la nota si tiene transcripción
                if (note.transcription) {
                  setExpandedNotes(prev => new Set([...prev, note.id]));
                }
                // Scroll to note
                setTimeout(() => {
                  const element = document.getElementById(`note-${note.id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              currentAudioUrl={currentlyPlaying ? voiceNotes.find(n => n.id === currentlyPlaying)?.url : null}
            />
          )}
        </div>
      </div>
      
      {/* Panel de estadísticas de IA */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Análisis de IA en Tiempo Real</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Proveedor IA</span>
              <Globe className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xl font-bold">{aiStats.provider}</p>
            <p className="text-xs text-gray-400 mt-1">Modelo: gemini-1.5-flash</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Velocidad Promedio</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-xl font-bold">2.3s</p>
            <p className="text-xs text-gray-400 mt-1">Por transcripción</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Precisión</span>
              <BarChart3 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-xl font-bold">98.5%</p>
            <p className="text-xs text-gray-400 mt-1">Tasa de éxito</p>
          </div>
        </div>
      </div>
      
      {/* Audio Player (oculto) */}
      <audio 
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        className="hidden"
      />

      {/* Modal de Procesador Inteligente */}
      {showProcessor && selectedNoteForProcessing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-400" />
                Procesador Inteligente de Nota de Voz
              </h2>
              <button
                onClick={() => {
                  setShowProcessor(false);
                  setSelectedNoteForProcessing(null);
                }}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Mostrar información de la nota */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-white font-medium">
                  {selectedNoteForProcessing.sender.name}
                </span>
                <span className="text-gray-400 text-sm">
                  {new Date(selectedNoteForProcessing.timestamp).toLocaleString('es-ES')}
                </span>
              </div>
              {selectedNoteForProcessing.transcription ? (
                <div className="text-gray-300 italic">
                  "{selectedNoteForProcessing.transcription}"
                </div>
              ) : (
                <div className="text-yellow-400 italic">
                  ⚠️ Esta nota aún no ha sido transcrita. Transcribe primero la nota con Gemini para poder procesarla.
                </div>
              )}
            </div>

            {/* Componente procesador - solo si hay transcripción */}
            {selectedNoteForProcessing.transcription ? (
              <VoiceNotesProcessor 
                voiceNote={{
                  id: selectedNoteForProcessing.id,
                  transcription: selectedNoteForProcessing.transcription,
                  text: selectedNoteForProcessing.transcription
                }} 
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  Primero transcribe la nota de voz para poder procesarla con IA
                </p>
                <button
                  onClick={() => {
                    transcribeVoiceNote(selectedNoteForProcessing);
                    setShowProcessor(false);
                    setSelectedNoteForProcessing(null);
                  }}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Transcribir ahora
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Modal de Generador de Prompts */}
      {showPromptGenerator && (
        <AnimatePresence>
          <PromptGenerator
            transcription={selectedNoteForPrompt?.transcription || ''}
            onClose={() => {
              setShowPromptGenerator(false);
              setSelectedNoteForPrompt(null);
            }}
          />
        </AnimatePresence>
      )}
      
      {/* Auto Prompt Generator Modal */}
      {showAutoPromptGenerator && selectedNoteForAutoPrompt && (
        <AnimatePresence>
          <AutoPromptGenerator
            transcription={selectedNoteForAutoPrompt.transcription || ''}
            voiceNote={selectedNoteForAutoPrompt}
            onPromptsGenerated={(prompts) => {
              console.log('Prompts generados:', prompts);
              // Aquí puedes hacer algo con los prompts generados
              // Por ejemplo, guardarlos o enviarlos a los módulos correspondientes
            }}
            onClose={() => {
              setShowAutoPromptGenerator(false);
              setSelectedNoteForAutoPrompt(null);
            }}
          />
        </AnimatePresence>
      )}
    </div>
  );
};

export default EnhancedVoiceNotesModule;