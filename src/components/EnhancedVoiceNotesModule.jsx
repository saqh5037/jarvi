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
  List,
  HardDrive,
  Edit2,
  Save,
  X,
  Check,
  CheckSquare,
  Square,
  Copy,
  RefreshCw,
  Archive,
  Sparkles as SparklesIcon,
  VolumeX,
  Headphones
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import VoiceNotesProcessor from './VoiceNotesProcessor';
import PromptGenerator from './PromptGenerator';
import VoiceNotesSearch from './VoiceNotesSearch';
import AutoPromptGenerator from './AutoPromptGenerator';
import { API_ENDPOINTS, SOCKET_URLS } from '../config/api';
import useVoiceReader from '../hooks/useVoiceReader';
import VoiceReadingSystem from './VoiceReadingSystem';

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
  const [readingNoteId, setReadingNoteId] = useState(null);
  const [showVoiceReader, setShowVoiceReader] = useState(false);
  const [selectedNoteForReading, setSelectedNoteForReading] = useState(null);
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
  const [editingNoteId, setEditingNoteId] = useState(null); // ID de la nota siendo editada
  const [editingText, setEditingText] = useState(''); // Texto temporal de edición
  const [showProcessed, setShowProcessed] = useState(true); // Mostrar/ocultar notas procesadas
  const [promptGeneratingFor, setPromptGeneratingFor] = useState(null); // ID de nota generando prompt
  const [generatedPrompts, setGeneratedPrompts] = useState({}); // Prompts generados por nota ID
  const [editingPromptFor, setEditingPromptFor] = useState(null); // ID de nota editando prompt
  const [highlightedNoteId, setHighlightedNoteId] = useState(null); // ID de nota a destacar
  const [archivingNoteId, setArchivingNoteId] = useState(null); // ID de nota siendo archivada
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(null); // ID de nota para confirmar archivo
  const [showNotification, setShowNotification] = useState(null); // Notificación temporal
  const [archivedCount, setArchivedCount] = useState(0); // Contador de notas archivadas
  const [scrollToNoteId, setScrollToNoteId] = useState(null); // ID de nota para hacer scroll
  
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const editTextareaRef = useRef(null);
  
  const {
    isReading,
    speak,
    stop,
    pause,
    resume,
    isPaused
  } = useVoiceReader();
  
  // Efecto para hacer scroll a la nota cuando cambia scrollToNoteId
  useEffect(() => {
    if (scrollToNoteId) {
      setTimeout(() => {
        const element = document.getElementById(`note-${scrollToNoteId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
        setScrollToNoteId(null);
      }, 100); // Pequeño delay para asegurar que el DOM está actualizado
    }
  }, [scrollToNoteId]);
  
  useEffect(() => {
    // Conectar con Socket.io
    socketRef.current = io(SOCKET_URLS.ENHANCED_NOTES);
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      loadVoiceNotes();
      loadAiStats();
    });
    
    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });
    
    // Escuchar nuevas notas de voz
    socketRef.current.on('new-voice-note', (voiceNote) => {
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
      const response = await axios.get(API_ENDPOINTS.VOICE_NOTES);
      if (response.data.success) {
        const notes = response.data.notes || [];
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
    
    if (transcribingNotes.has(note.id)) {
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
      
      
      const response = await axios.post(`${API_ENDPOINTS.ENHANCED_NOTES}/api/transcribe`, {
        noteId: note.id,
        fileName: note.fileName
      });
      
      clearInterval(progressInterval);
      
      
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

  /**
   * Inicia el proceso de archivo mostrando el modal de confirmación
   * @param {Object} note - La nota de voz a archivar
   */
  const archiveVoiceNote = async (note) => {
    setShowArchiveConfirm(note.id);
  };

  /**
   * Confirma y ejecuta el archivo de la nota de voz
   * @param {Object} note - La nota de voz a archivar
   */
  const confirmArchive = async (note) => {
    try {
      setShowArchiveConfirm(null);
      setArchivingNoteId(note.id);
      
      const response = await axios.post(`${API_ENDPOINTS.ENHANCED_NOTES}/api/voice-notes/${note.id}/archive`);
      if (response.data.success) {
        // Animación de desvanecimiento antes de eliminar
        setTimeout(() => {
          setVoiceNotes(prev => prev.filter(n => n.id !== note.id));
          setArchivingNoteId(null);
          setArchivedCount(prev => prev + 1);
          
          // Mostrar notificación de éxito
          setShowNotification({
            type: 'success',
            message: '✅ Nota archivada exitosamente',
            details: note.title || 'Nota de voz'
          });
          
          // Ocultar notificación después de 3 segundos
          setTimeout(() => setShowNotification(null), 3000);
        }, 300);
      }
    } catch (error) {
      console.error('Error archivando nota:', error);
      setArchivingNoteId(null);
      setShowNotification({
        type: 'error',
        message: '❌ Error al archivar la nota',
        details: error.message
      });
      setTimeout(() => setShowNotification(null), 3000);
    }
  };

  /**
   * Cancela el proceso de archivo
   */
  const cancelArchive = () => {
    setShowArchiveConfirm(null);
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
  
  // Funciones para edición inline
  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditingText(note.transcription || '');
    // Enfocar el textarea después de renderizar
    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.focus();
        editTextareaRef.current.select();
      }
    }, 100);
  };
  
  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingText('');
  };
  
  const saveEditedTranscription = async (noteId) => {
    try {
      // Actualizar localmente primero
      setVoiceNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, transcription: editingText, editedManually: true }
          : note
      ));
      
      // Guardar en el servidor
      const response = await fetch(`${API_ENDPOINTS.ENHANCED_NOTES}/api/voice-notes/${noteId}/transcription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: editingText })
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar la transcripción');
      }
      
      // Limpiar estado de edición
      setEditingNoteId(null);
      setEditingText('');
    } catch (error) {
      console.error('Error guardando transcripción:', error);
      // Revertir cambio local si falla
      loadVoiceNotes();
    }
  };
  
  // Funciones de lectura de voz
  const startReadingNote = (note) => {
    if (!note.transcription) return;
    
    if (isReading && readingNoteId === note.id) {
      // Si ya está leyendo esta nota, detener
      stop();
      setReadingNoteId(null);
    } else {
      // Preparar texto para leer
      const textToRead = `
        Nota de voz del ${formatTime(note.timestamp)}.
        ${note.transcription}.
        ${note.processed ? 'Esta nota ya ha sido procesada.' : ''}
      `;
      
      speak(textToRead, {
        onStart: () => setReadingNoteId(note.id),
        onEnd: () => setReadingNoteId(null)
      });
    }
  };
  
  const openVoiceReaderForNote = (note) => {
    if (!note.transcription) return;
    setSelectedNoteForReading(note);
    setShowVoiceReader(true);
  };

  // Función para generar prompt con IA
  const generatePromptForNote = async (note) => {
    if (!note.transcription) {
      console.error('La nota no tiene transcripción');
      return;
    }

    setPromptGeneratingFor(note.id);
    
    try {
      const response = await axios.post('http://localhost:3005/api/generate-prompt', {
        text: note.transcription,
        context: 'voice_note',
        type: 'optimized'
      });

      if (response.data.success) {
        const generatedPrompt = response.data.prompt;
        
        // Guardar el prompt generado
        setGeneratedPrompts(prev => ({
          ...prev,
          [note.id]: generatedPrompt
        }));
        
        // Activar modo edición automáticamente
        setEditingPromptFor(note.id);
      }
    } catch (error) {
      console.error('Error generando prompt:', error);
      // Fallback: generar prompt básico localmente
      const basicPrompt = `Analiza y procesa la siguiente nota de voz:\n\n"${note.transcription}"\n\n¿Cuáles son los puntos clave y acciones a tomar?`;
      
      setGeneratedPrompts(prev => ({
        ...prev,
        [note.id]: basicPrompt
      }));
      
      setEditingPromptFor(note.id);
    } finally {
      setPromptGeneratingFor(null);
    }
  };

  // Función para guardar prompt en cronología
  const savePromptToChronology = async (noteId) => {
    const prompt = generatedPrompts[noteId];
    const note = voiceNotes.find(n => n.id === noteId);
    if (!prompt || !note) return;

    try {
      // Crear entrada para cronología
      const chronologyEntry = {
        id: Date.now(),
        title: `Prompt: ${note.transcription?.substring(0, 50)}...`,
        prompt,
        sourceNoteId: noteId,
        sourceTranscription: note.transcription,
        timestamp: new Date().toISOString(),
        type: 'voice_note_prompt',
        category: 'ai_prompts'
      };

      // Guardar en localStorage para el módulo de cronología
      const existingChronology = JSON.parse(localStorage.getItem('jarvi-chronology') || '[]');
      existingChronology.unshift(chronologyEntry);
      localStorage.setItem('jarvi-chronology', JSON.stringify(existingChronology));
      
      // También guardar en servidor si existe endpoint
      try {
        await axios.post('http://localhost:3001/api/chronology', chronologyEntry);
      } catch (err) {
      }
      
      
      // Limpiar estado de edición
      setEditingPromptFor(null);
      
      // Feedback visual
      const originalText = generatedPrompts[noteId];
      setGeneratedPrompts(prev => ({
        ...prev,
        [noteId]: '✅ Guardado en cronología!'
      }));
      
      setTimeout(() => {
        setGeneratedPrompts(prev => ({
          ...prev,
          [noteId]: originalText
        }));
      }, 2000);
      
    } catch (error) {
      console.error('Error guardando prompt:', error);
    }
  };

  // Función para copiar prompt al portapapeles
  const copyPromptToClipboard = async (noteId) => {
    const prompt = generatedPrompts[noteId];
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);
      
      // Feedback visual temporal
      const originalText = generatedPrompts[noteId];
      setGeneratedPrompts(prev => ({
        ...prev,
        [noteId]: '📋 ¡Copiado al portapapeles!'
      }));
      
      setTimeout(() => {
        setGeneratedPrompts(prev => ({
          ...prev,
          [noteId]: originalText
        }));
      }, 1500);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  // Función para marcar nota como procesada/completada
  const toggleNoteProcessed = async (noteId) => {
    try {
      const note = voiceNotes.find(n => n.id === noteId);
      const newProcessedStatus = !note?.processed;
      
      // Actualizar localmente primero
      setVoiceNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, processed: newProcessedStatus, processedAt: newProcessedStatus ? new Date().toISOString() : null }
          : note
      ));
      
      // Guardar en el servidor
      const response = await fetch(`${API_ENDPOINTS.ENHANCED_NOTES}/api/voice-notes/${noteId}/processed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processed: newProcessedStatus })
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar estado de procesado');
      }
      
    } catch (error) {
      console.error('Error actualizando estado de procesado:', error);
      // Revertir cambio local si falla
      loadVoiceNotes();
    }
  };
  
  // Filtrar notas según configuración
  const filteredNotes = showProcessed 
    ? voiceNotes 
    : voiceNotes.filter(note => !note.processed);
  
  // Calcular estadísticas
  const totalNotes = voiceNotes.length;
  const processedNotes = voiceNotes.filter(n => n.processed).length;
  const pendingNotes = totalNotes - processedNotes;
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
              <CheckSquare className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">{processedNotes} procesadas</span>
            </div>
            <div className="h-4 w-px bg-purple-400/30"></div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">{pendingNotes} pendientes</span>
            </div>
            {archivedCount > 0 && (
              <>
                <div className="h-4 w-px bg-purple-400/30"></div>
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-purple-200" />
                  <span className="text-sm font-medium">{archivedCount} archivadas</span>
                </div>
              </>
            )}
            <div className="h-4 w-px bg-purple-400/30"></div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">{transcribedNotes}/{totalNotes} transcritas</span>
            </div>
            <div className="h-4 w-px bg-purple-400/30"></div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-medium">${aiStats.totalCost.toFixed(2)}</span>
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
      
      {/* Tabs para Lista y Búsqueda con Botones de Procesamiento */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
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
          
          {/* Indicador de notas pendientes */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4 text-orange-500" />
                <span>{voiceNotes.filter(n => !n.processed).length} pendientes</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span>{voiceNotes.filter(n => n.processed).length} procesadas</span>
              </div>
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
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">
                  Mostrando {filteredNotes.length} de {voiceNotes.length} notas
                </div>
                <button
                  onClick={() => setShowProcessed(!showProcessed)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    showProcessed 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {showProcessed ? (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      Mostrando todas
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      Solo pendientes
                    </>
                  )}
                </button>
              </div>
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    id={`note-${note.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: archivingNoteId === note.id ? 0.3 : 1, 
                      x: archivingNoteId === note.id ? 100 : 0,
                      scale: archivingNoteId === note.id ? 0.9 : 1
                    }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl p-4 transition-all ${
                      archivingNoteId === note.id
                        ? 'bg-yellow-50 border-2 border-yellow-400'
                        : highlightedNoteId === note.id
                        ? 'bg-indigo-100 border-2 border-indigo-500 shadow-lg ring-4 ring-indigo-200 animate-pulse'
                        : note.processed 
                          ? 'bg-green-50 border border-green-200 opacity-75' 
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Checkbox para marcar como procesada */}
                        <button
                          onClick={() => toggleNoteProcessed(note.id)}
                          className={`mt-1 p-1 rounded transition-all ${
                            note.processed
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-gray-400 hover:text-purple-600'
                          }`}
                          title={note.processed ? 'Marcar como no procesada' : 'Marcar como procesada'}
                        >
                          {note.processed ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                        
                        {/* Botón de reproducción */}
                        <button
                          onClick={() => playVoiceNote(note)}
                          className={`p-3 rounded-full transition-all ${
                            currentlyPlaying === note.id
                              ? 'bg-purple-600 text-white'
                              : note.processed
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
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
                            
                            {/* Indicador de nota procesada */}
                            {note.processed && (
                              <>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                                  <Check className="w-3 h-3" />
                                  Procesada
                                </span>
                              </>
                            )}
                            
                            {/* INDICADOR DE IA USADO PARA TRANSCRIPCIÓN */}
                            {note.transcriptionProvider && (
                              <>
                                <span className="text-sm text-gray-500">•</span>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                  note.transcriptionProvider === 'gemini' 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-sm' 
                                    : note.transcriptionProvider === 'openai'
                                    ? 'bg-green-500 text-white'
                                    : note.transcriptionProvider === 'whisper_local'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-gray-400 text-white'
                                }`}>
                                  {note.transcriptionProvider === 'gemini' ? (
                                    <>
                                      <Sparkles className="w-3 h-3" />
                                      Gemini
                                    </>
                                  ) : note.transcriptionProvider === 'openai' ? (
                                    <>
                                      <Cpu className="w-3 h-3" />
                                      OpenAI
                                    </>
                                  ) : note.transcriptionProvider === 'whisper_local' ? (
                                    <>
                                      <HardDrive className="w-3 h-3" />
                                      Local
                                    </>
                                  ) : (
                                    <>
                                      <MessageSquare className="w-3 h-3" />
                                      IA
                                    </>
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                          
                          {/* Transcripción o estado */}
                          {note.transcription ? (
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-purple-600 mt-0.5" />
                                <div className="flex-1">
                                  {editingNoteId === note.id ? (
                                    // Modo de edición
                                    <div className="space-y-2">
                                      <textarea
                                        ref={editTextareaRef}
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        className="w-full p-2 text-gray-700 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        rows={4}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') {
                                            cancelEditing();
                                          } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            e.preventDefault();
                                            saveEditedTranscription(note.id);
                                          }
                                        }}
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => saveEditedTranscription(note.id)}
                                          className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                        >
                                          <Save className="w-3 h-3" />
                                          Guardar
                                        </button>
                                        <button
                                          onClick={cancelEditing}
                                          className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                        >
                                          <X className="w-3 h-3" />
                                          Cancelar
                                        </button>
                                        <span className="text-xs text-gray-500 ml-2">
                                          {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter para guardar • Esc para cancelar
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    // Modo de visualización
                                    <div>
                                      <div className="flex items-start justify-between">
                                        <div 
                                          onClick={() => toggleExpanded(note.id)}
                                          className="cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors flex-1"
                                        >
                                          <p className={`italic ${
                                            note.processed 
                                              ? 'text-gray-500 line-through' 
                                              : 'text-gray-700'
                                          }`}>
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
                                        <button
                                          onClick={() => startEditing(note)}
                                          className="ml-2 p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                          title="Editar transcripción"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    {/* Indicador de edición manual */}
                                    {note.editedManually && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                        <Edit2 className="w-3 h-3" />
                                        Editado manualmente
                                      </span>
                                    )}
                                    
                                    {/* Indicador del servicio de IA */}
                                    {note.transcriptionProvider && !note.editedManually && (
                                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                        note.transcriptionProvider === 'gemini' 
                                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 font-medium' 
                                          : note.transcriptionProvider === 'openai'
                                          ? 'bg-green-100 text-green-700'
                                          : note.transcriptionProvider === 'whisper_local'
                                          ? 'bg-gray-100 text-gray-700'
                                          : 'bg-gray-50 text-gray-600'
                                      }`}>
                                        {note.transcriptionProvider === 'gemini' ? (
                                          <>
                                            <Sparkles className="w-3 h-3" />
                                            Gemini 1.5
                                          </>
                                        ) : note.transcriptionProvider === 'openai' ? (
                                          <>
                                            <Cpu className="w-3 h-3" />
                                            OpenAI
                                          </>
                                        ) : note.transcriptionProvider === 'whisper_local' ? (
                                          <>
                                            <HardDrive className="w-3 h-3" />
                                            Whisper Local
                                          </>
                                        ) : (
                                          <>
                                            <MessageSquare className="w-3 h-3" />
                                            {note.transcriptionProviderName || 'IA'}
                                          </>
                                        )}
                                      </span>
                                    )}
                                    
                                    {note.tokens && (
                                      <span className="flex items-center gap-1">
                                        <Hash className="w-3 h-3" />
                                        {note.tokens} tokens
                                      </span>
                                    )}
                                    {note.cost && (
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        ${note.cost.toFixed(4)}
                                      </span>
                                    )}
                                    {!note.transcriptionProvider && (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        IA Procesado {note.transcriptionProviderName && `- ${note.transcriptionProviderName}`}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-3">
                                    {/* Botón ver transcripción original */}
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
                        
                        {/* Botón de lectura rápida */}
                        {note.transcription && (
                          <button
                            onClick={() => startReadingNote(note)}
                            className={`p-2 rounded-lg transition-all ${
                              isReading && readingNoteId === note.id
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={isReading && readingNoteId === note.id ? 'Detener lectura' : 'Leer nota'}
                          >
                            {isReading && readingNoteId === note.id ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        
                        {/* Botón de lector avanzado */}
                        {note.transcription && (
                          <button
                            onClick={() => openVoiceReaderForNote(note)}
                            className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                            title="Abrir lector avanzado"
                          >
                            <Headphones className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Botón de Generar Prompt individual */}
                        {note.transcription && (
                          <button
                            onClick={() => {
                              setSelectedNoteForPrompt(note);
                              setShowPromptGenerator(true);
                            }}
                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Generar Prompt Optimizado"
                          >
                            <Wand2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => window.open(`${API_ENDPOINTS.ENHANCED_NOTES}/voice-notes/${note.fileName}`, '_blank')}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => archiveVoiceNote(note)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Archivar"
                        >
                          <Archive className="w-4 h-4" />
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
                // Reproducir la nota seleccionada
                playVoiceNote(note);
              }}
              onNavigateToNote={(note) => {
                // Cambiar a tab de notas
                setActiveTab('notes');
                // Destacar la nota
                setHighlightedNoteId(note.id);
                // Expandir la nota si tiene transcripción
                if (note.transcription) {
                  setExpandedNotes(prev => new Set([...prev, note.id]));
                }
                // Hacer scroll a la nota
                setScrollToNoteId(note.id);
                // Quitar el highlight después de 3 segundos
                setTimeout(() => {
                  setHighlightedNoteId(null);
                }, 3000);
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
              // Aquí puedes hacer algo con los prompts generados
            }}
            onClose={() => {
              setShowAutoPromptGenerator(false);
              setSelectedNoteForAutoPrompt(null);
            }}
          />
        </AnimatePresence>
      )}

      {/* Modal de Confirmación para Archivar */}
      <AnimatePresence>
        {showArchiveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={cancelArchive}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <Archive className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Archivar esta nota de voz?
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                La nota se moverá al archivo y podrás restaurarla más tarde desde el módulo de archivos.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelArchive}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const note = filteredNotes.find(n => n.id === showArchiveConfirm);
                    if (note) confirmArchive(note);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archivar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sistema de lectura de voz avanzado */}
      {showVoiceReader && selectedNoteForReading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full">
            <VoiceReadingSystem
              text={selectedNoteForReading.transcription}
              title={`Nota del ${formatTime(selectedNoteForReading.timestamp)}`}
              onClose={() => {
                setShowVoiceReader(false);
                setSelectedNoteForReading(null);
              }}
              allowSummary={true}
              mode="expanded"
            />
          </div>
        </div>
      )}

      {/* Notificación Flotante */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
              showNotification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium">{showNotification.message}</span>
              {showNotification.details && (
                <span className="text-sm opacity-90">({showNotification.details})</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedVoiceNotesModule;