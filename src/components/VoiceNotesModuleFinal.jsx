import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Volume2,
  Send,
  Clock,
  User,
  MessageSquare,
  FileText,
  Filter,
  Briefcase,
  Zap,
  Bell,
  Home,
  Code,
  Building,
  Folder,
  Heart,
  ChevronDown,
  X,
  Loader2,
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Hash,
  TrendingUp,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import { API_ENDPOINTS, SOCKET_URLS } from '../config/api';

// Categorías disponibles con colores correctos
const CATEGORIES = {
  QUICK_IDEA: { 
    id: 'quick_idea', 
    name: 'Idea Rápida', 
    icon: Zap, 
    bgColor: 'bg-yellow-500',
    bgColorLight: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-500'
  },
  REMINDER: { 
    id: 'reminder', 
    name: 'Recordatorio', 
    icon: Bell, 
    bgColor: 'bg-blue-500',
    bgColorLight: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500'
  },
  WORK: { 
    id: 'work', 
    name: 'Trabajo', 
    icon: Briefcase, 
    bgColor: 'bg-indigo-500',
    bgColorLight: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-500',
    subcategories: {
      DYNAMTEK: { id: 'dynamtek', name: 'Dynamtek', icon: Building },
      WBI: { id: 'wbi', name: 'WBI', icon: Code },
      PROJECTS: { id: 'projects', name: 'Proyectos', icon: Folder }
    }
  },
  PERSONAL: { 
    id: 'personal', 
    name: 'Vida Personal', 
    icon: Heart, 
    bgColor: 'bg-pink-500',
    bgColorLight: 'bg-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-500'
  }
};

const VoiceNotesModuleFinal = () => {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [transcribingNotes, setTranscribingNotes] = useState({});
  const [showCategoryMenu, setShowCategoryMenu] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [moduleStats, setModuleStats] = useState({
    status: 'active',
    totalNotes: 0,
    totalTranscriptions: 0,
    apiCalls: {
      gemini: 0,
      openai: 0,
      whisper: 0
    },
    tokens: {
      gemini: { used: 0, limit: 1000000 },
      openai: { used: 0, limit: 0 }
    },
    costs: {
      gemini: 0,
      openai: 0,
      total: 0
    },
    activity: [],
    errors: []
  });
  
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    // Conectar con Socket.io
    socketRef.current = io(SOCKET_URLS.ENHANCED_NOTES);
    
    socketRef.current.on('connect', () => {
      console.log('✅ Conectado al servidor');
      setIsConnected(true);
      updateModuleStatus('connected');
      loadVoiceNotes();
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setIsConnected(false);
      updateModuleStatus('disconnected');
    });
    
    // Escuchar nuevas notas de voz
    socketRef.current.on('new-voice-note', (voiceNote) => {
      console.log('🎙️ Nueva nota de voz:', voiceNote);
      setVoiceNotes(prev => [voiceNote, ...prev]);
      updateActivity('Nueva nota de voz recibida');
      showNotification('Nueva nota de voz', `De: ${voiceNote.sender.name}`);
    });
    
    // Escuchar mensajes de Telegram
    socketRef.current.on('telegram-message', (message) => {
      console.log('📝 Mensaje de Telegram:', message);
      setMessages(prev => [message, ...prev].slice(0, 10));
    });
    
    // Escuchar actualizaciones de transcripción
    socketRef.current.on('transcription-complete', (data) => {
      console.log('📝 Transcripción completada:', data);
      setVoiceNotes(prev => prev.map(note => 
        note.id === data.noteId 
          ? { ...note, transcription: data.transcription }
          : note
      ));
      setTranscribingNotes(prev => ({ ...prev, [data.noteId]: false }));
      updateApiUsage('gemini', data.tokens || 100);
      updateActivity('Transcripción completada');
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  useEffect(() => {
    // Filtrar notas por categoría
    let filtered = [...voiceNotes];
    
    if (selectedCategory) {
      filtered = filtered.filter(note => note.category === selectedCategory);
      
      if (selectedSubcategory) {
        filtered = filtered.filter(note => note.subcategory === selectedSubcategory);
      }
    }
    
    setFilteredNotes(filtered);
    
    // Actualizar estadísticas
    updateModuleStats(voiceNotes);
  }, [voiceNotes, selectedCategory, selectedSubcategory]);
  
  const updateModuleStatus = (status) => {
    setModuleStats(prev => ({
      ...prev,
      status: status === 'connected' ? 'active' : 'inactive'
    }));
  };
  
  const updateActivity = (action) => {
    setModuleStats(prev => ({
      ...prev,
      activity: [
        { action, timestamp: new Date().toISOString() },
        ...prev.activity
      ].slice(0, 10)
    }));
  };
  
  const updateApiUsage = (api, tokens) => {
    setModuleStats(prev => {
      const newStats = { ...prev };
      newStats.apiCalls[api] = (newStats.apiCalls[api] || 0) + 1;
      newStats.tokens[api] = {
        ...newStats.tokens[api],
        used: (newStats.tokens[api]?.used || 0) + tokens
      };
      
      // Calcular costos (Gemini es gratis hasta 1M tokens/mes)
      if (api === 'gemini') {
        // Gratis hasta 1 millón de tokens
        newStats.costs.gemini = 0;
      } else if (api === 'openai') {
        // OpenAI Whisper: $0.006 por minuto
        newStats.costs.openai = (newStats.apiCalls.openai * 0.006).toFixed(4);
      }
      
      newStats.costs.total = parseFloat(newStats.costs.gemini) + parseFloat(newStats.costs.openai);
      
      return newStats;
    });
  };
  
  const updateModuleStats = (notes) => {
    setModuleStats(prev => ({
      ...prev,
      totalNotes: notes.length,
      totalTranscriptions: notes.filter(n => n.transcription).length
    }));
  };
  
  const loadVoiceNotes = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.VOICE_NOTES);
      if (response.data.success) {
        setVoiceNotes(response.data.notes);
        updateActivity('Notas de voz cargadas');
      }
    } catch (error) {
      console.error('Error cargando notas de voz:', error);
      setModuleStats(prev => ({
        ...prev,
        errors: [...prev.errors, { error: error.message, timestamp: new Date().toISOString() }]
      }));
    }
  };
  
  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
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
        updateActivity(`Reproduciendo nota ${note.id}`);
      }
    }
  };
  
  const transcribeVoiceNote = async (note) => {
    if (transcribingNotes[note.id]) return;
    
    setTranscribingNotes(prev => ({ ...prev, [note.id]: true }));
    updateActivity(`Transcribiendo nota ${note.id}`);
    
    try {
      const response = await axios.post(`${API_ENDPOINTS.ENHANCED_NOTES}/api/transcribe`, {
        noteId: note.id,
        fileName: note.fileName
      });
      
      if (response.data.success) {
        setVoiceNotes(prev => prev.map(n => 
          n.id === note.id 
            ? { ...n, transcription: response.data.transcription }
            : n
        ));
        updateApiUsage('gemini', 150); // Estimado de tokens
      }
    } catch (error) {
      console.error('Error transcribiendo:', error);
      setModuleStats(prev => ({
        ...prev,
        errors: [...prev.errors, { error: `Error transcribiendo: ${error.message}`, timestamp: new Date().toISOString() }]
      }));
    } finally {
      setTranscribingNotes(prev => ({ ...prev, [note.id]: false }));
    }
  };
  
  const downloadVoiceNote = (note) => {
    const link = document.createElement('a');
    link.href = `${API_ENDPOINTS.ENHANCED_NOTES}/voice-notes/${note.fileName}`;
    link.download = `nota_${note.id}_${note.category || 'sin_categoria'}.ogg`;
    link.click();
    updateActivity(`Descargada nota ${note.id}`);
  };
  
  const deleteVoiceNote = async (note) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.ENHANCED_NOTES}/api/voice-notes/${note.id}`);
      
      if (response.data.success) {
        setVoiceNotes(prev => prev.filter(n => n.id !== note.id));
        setShowDeleteConfirm(null);
        updateActivity(`Eliminada nota ${note.id}`);
      }
    } catch (error) {
      console.error('Error eliminando nota:', error);
      setModuleStats(prev => ({
        ...prev,
        errors: [...prev.errors, { error: `Error eliminando: ${error.message}`, timestamp: new Date().toISOString() }]
      }));
    }
  };
  
  const updateNoteCategory = async (note, categoryId, subcategoryId = null) => {
    try {
      const response = await axios.patch(`${API_ENDPOINTS.ENHANCED_NOTES}/api/voice-notes/${note.id}`, {
        category: categoryId,
        subcategory: subcategoryId
      });
      
      if (response.data.success) {
        setVoiceNotes(prev => prev.map(n => 
          n.id === note.id 
            ? { ...n, category: categoryId, subcategory: subcategoryId }
            : n
        ));
        setShowCategoryMenu(prev => ({ ...prev, [note.id]: false }));
        updateActivity(`Categorizada nota ${note.id}`);
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
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
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} horas`;
    return date.toLocaleDateString();
  };
  
  const getCategoryInfo = (categoryId, subcategoryId) => {
    const category = Object.values(CATEGORIES).find(c => c.id === categoryId);
    if (!category) return null;
    
    if (subcategoryId && category.subcategories) {
      const subcategory = Object.values(category.subcategories).find(s => s.id === subcategoryId);
      return { ...category, subcategory };
    }
    
    return category;
  };
  
  // Solicitar permisos de notificación
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Panel de información del módulo */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Estado del Módulo
          </h3>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Desconectado</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          {/* Estado del servicio */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Servicio</span>
              <Server className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${moduleStats.status === 'active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm font-semibold capitalize">{moduleStats.status}</span>
            </div>
          </div>
          
          {/* API Calls */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">API Calls</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">{moduleStats.apiCalls.gemini + moduleStats.apiCalls.openai}</div>
              <div className="text-xs text-gray-500">
                Gemini: {moduleStats.apiCalls.gemini} | OpenAI: {moduleStats.apiCalls.openai}
              </div>
            </div>
          </div>
          
          {/* Tokens */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Tokens Gemini</span>
              <Hash className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">{moduleStats.tokens.gemini.used.toLocaleString()}</div>
              <div className="text-xs text-gray-500">
                de {(moduleStats.tokens.gemini.limit / 1000).toFixed(0)}k gratis/mes
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className="bg-indigo-500 h-1 rounded-full"
                  style={{ width: `${(moduleStats.tokens.gemini.used / moduleStats.tokens.gemini.limit) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Costos */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Costo Total</span>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-green-600">${moduleStats.costs.total.toFixed(4)}</div>
              <div className="text-xs text-gray-500">
                Gemini: GRATIS
              </div>
            </div>
          </div>
        </div>
        
        {/* Actividad reciente */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Actividad Reciente</h4>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {moduleStats.activity.slice(0, 3).map((act, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-gray-600">{act.action}</span>
                <span className="text-gray-400">{formatTime(act.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Errores si hay */}
        {moduleStats.errors.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Último error: {moduleStats.errors[moduleStats.errors.length - 1].error}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Header con estadísticas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Mic className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notas de Voz Inteligentes</h2>
              <p className="text-sm text-gray-500">Con transcripción Gemini AI</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
        
        {/* Filtros de categorías */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 rounded-xl"
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                  !selectedCategory 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todas ({voiceNotes.length})
              </button>
              
              {Object.values(CATEGORIES).map(category => {
                const Icon = category.icon;
                const count = voiceNotes.filter(n => n.category === category.id).length;
                return (
                  <div key={category.id} className="relative">
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedSubcategory(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 ${
                        selectedCategory === category.id 
                          ? `${category.bgColor} text-white` 
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {category.name} ({count})
                    </button>
                    
                    {category.subcategories && selectedCategory === category.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg p-1 z-10 min-w-[150px]">
                        {Object.values(category.subcategories).map(sub => {
                          const SubIcon = sub.icon;
                          const subCount = voiceNotes.filter(n => n.subcategory === sub.id).length;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setSelectedSubcategory(sub.id)}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                                selectedSubcategory === sub.id ? 'bg-gray-100' : ''
                              }`}
                            >
                              <SubIcon className="w-3 h-3" />
                              {sub.name} ({subCount})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredNotes.length}</p>
              <p className="text-sm text-gray-500">Total Notas</p>
            </div>
            <Mic className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredNotes.filter(n => n.transcription).length}
              </p>
              <p className="text-sm text-gray-500">Transcritas</p>
            </div>
            <FileText className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredNotes.filter(n => n.category).length}
              </p>
              <p className="text-sm text-gray-500">Categorizadas</p>
            </div>
            <Folder className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredNotes.filter(n => {
                  const date = new Date(n.timestamp);
                  const now = new Date();
                  return now - date < 86400000;
                }).length}
              </p>
              <p className="text-sm text-gray-500">Hoy</p>
            </div>
            <Clock className="w-8 h-8 text-pink-200" />
          </div>
        </div>
      </div>
      
      {/* Voice Notes List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedCategory 
            ? `Notas de ${CATEGORIES[Object.keys(CATEGORIES).find(k => CATEGORIES[k].id === selectedCategory)]?.name}`
            : 'Todas las Notas de Voz'
          }
        </h3>
        
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <Mic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay notas de voz en esta categoría</p>
            <p className="text-sm text-gray-400 mt-2">
              Envía una nota de voz desde Telegram @JarviSamu_bot
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotes.map((note) => {
                const categoryInfo = note.category ? getCategoryInfo(note.category, note.subcategory) : null;
                const CategoryIcon = categoryInfo?.icon || Mic;
                
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => playVoiceNote(note)}
                        className={`p-3 rounded-full transition-all ${
                          currentlyPlaying === note.id
                            ? 'bg-indigo-500 text-white'
                            : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                        }`}
                      >
                        {currentlyPlaying === note.id ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {note.sender.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            @{note.sender.username}
                          </span>
                          
                          {/* Categoría Badge */}
                          {categoryInfo && (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${categoryInfo.bgColorLight} ${categoryInfo.textColor} text-xs`}>
                              <CategoryIcon className="w-3 h-3" />
                              <span>{categoryInfo.name}</span>
                              {categoryInfo.subcategory && (
                                <>
                                  <span>/</span>
                                  <span>{categoryInfo.subcategory.name}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm text-gray-500">
                            {formatDuration(note.duration)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatTime(note.timestamp)}
                          </span>
                        </div>
                        
                        {/* Transcripción y botón siempre visible */}
                        <div className="mt-2">
                          {note.transcription ? (
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-700">
                                "{note.transcription}"
                              </p>
                            </div>
                          ) : null}
                          
                          {/* Botón transcribir siempre visible */}
                          <button
                            onClick={() => transcribeVoiceNote(note)}
                            disabled={transcribingNotes[note.id]}
                            className={`mt-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              note.transcription 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                            }`}
                          >
                            {transcribingNotes[note.id] ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Transcribiendo...
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                {note.transcription ? 'Re-transcribir' : 'Transcribir'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      {/* Categoría Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowCategoryMenu(prev => ({ 
                            ...prev, 
                            [note.id]: !prev[note.id] 
                          }))}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Categorizar"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                        
                        {showCategoryMenu[note.id] && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-20">
                            {Object.values(CATEGORIES).map(category => {
                              const Icon = category.icon;
                              
                              if (category.subcategories) {
                                return (
                                  <div key={category.id}>
                                    <div className="px-3 py-1.5 text-sm font-medium text-gray-900 flex items-center gap-2">
                                      <Icon className="w-3 h-3 text-gray-600" />
                                      <span className="text-gray-900">{category.name}</span>
                                    </div>
                                    {Object.values(category.subcategories).map(sub => {
                                      const SubIcon = sub.icon;
                                      return (
                                        <button
                                          key={sub.id}
                                          onClick={() => updateNoteCategory(note, category.id, sub.id)}
                                          className="w-full px-6 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <SubIcon className="w-3 h-3 text-gray-600" />
                                          <span className="text-gray-900">{sub.name}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              
                              return (
                                <button
                                  key={category.id}
                                  onClick={() => updateNoteCategory(note, category.id)}
                                  className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Icon className="w-3 h-3 text-gray-600" />
                                  <span className="text-gray-900">{category.name}</span>
                                </button>
                              );
                            })}
                            
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                updateNoteCategory(note, null);
                                setShowCategoryMenu(prev => ({ ...prev, [note.id]: false }));
                              }}
                              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <span className="text-gray-900">Sin categoría</span>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Descargar */}
                      <button
                        onClick={() => downloadVoiceNote(note)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {/* Eliminar con confirmación */}
                      <div className="relative">
                        <button
                          onClick={() => setShowDeleteConfirm(note.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        {showDeleteConfirm === note.id && (
                          <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg p-3 z-20">
                            <p className="text-sm text-gray-700 mb-2">¿Eliminar esta nota?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => deleteVoiceNote(note)}
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                              >
                                Eliminar
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Audio Player (hidden) */}
      <audio 
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        className="hidden"
      />
    </div>
  );
};

export default VoiceNotesModuleFinal;