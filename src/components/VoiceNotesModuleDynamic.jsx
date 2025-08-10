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
  WifiOff,
  Smartphone,
  Upload
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

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

const VoiceNotesModuleDynamic = () => {
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
  const [costData, setCostData] = useState(null);
  const [stats, setStats] = useState(null);
  const [showUploadArea, setShowUploadArea] = useState(false);
  
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    console.log('🔄 VoiceNotesModuleDynamic: useEffect ejecutándose');
    // Conectar con Socket.io
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      console.log('✅ Conectado al servidor');
      setIsConnected(true);
      console.log('📞 Llamando a loadData()...');
      loadData();
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setIsConnected(false);
    });
    
    // Escuchar nuevas notas de voz
    socketRef.current.on('new-voice-note', (voiceNote) => {
      console.log('🎙️ Nueva nota de voz:', voiceNote);
      setVoiceNotes(prev => [voiceNote, ...prev]);
      showNotification('Nueva nota de voz', `De: ${voiceNote.sender.name}`);
      loadData(); // Actualizar estadísticas
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
      loadData(); // Actualizar estadísticas y costos
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
  }, [voiceNotes, selectedCategory, selectedSubcategory]);
  
  const loadData = async () => {
    try {
      // Cargar notas de voz
      const notesResponse = await axios.get('http://localhost:3001/api/voice-notes');
      if (notesResponse.data.success) {
        setVoiceNotes(notesResponse.data.notes);
      }

      // Cargar estadísticas
      const statsResponse = await axios.get('http://localhost:3001/api/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Cargar costos
      const costsResponse = await axios.get('http://localhost:3001/api/costs');
      if (costsResponse.data.success) {
        setCostData(costsResponse.data.costs);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
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
        audioRef.current.src = `http://localhost:3001/voice-notes/${note.fileName}`;
        audioRef.current.play();
        setCurrentlyPlaying(note.id);
      }
    }
  };
  
  const transcribeVoiceNote = async (note) => {
    if (transcribingNotes[note.id]) return;
    
    setTranscribingNotes(prev => ({ ...prev, [note.id]: true }));
    
    try {
      const response = await axios.post('http://localhost:3001/api/transcribe', {
        noteId: note.id,
        fileName: note.fileName
      });
      
      if (response.data.success) {
        setVoiceNotes(prev => prev.map(n => 
          n.id === note.id 
            ? { ...n, transcription: response.data.transcription }
            : n
        ));
        loadData(); // Actualizar estadísticas y costos
      }
    } catch (error) {
      console.error('Error transcribiendo:', error);
    } finally {
      setTranscribingNotes(prev => ({ ...prev, [note.id]: false }));
    }
  };
  
  const downloadVoiceNote = (note) => {
    const link = document.createElement('a');
    link.href = `http://localhost:3001/voice-notes/${note.fileName}`;
    link.download = `nota_${note.id}_${note.category || 'sin_categoria'}.ogg`;
    link.click();
  };
  
  const deleteVoiceNote = async (note) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/voice-notes/${note.id}`);
      
      if (response.data.success) {
        setVoiceNotes(prev => prev.filter(n => n.id !== note.id));
        setShowDeleteConfirm(null);
        loadData(); // Actualizar estadísticas
      }
    } catch (error) {
      console.error('Error eliminando nota:', error);
    }
  };
  
  const updateNoteCategory = async (note, categoryId, subcategoryId = null) => {
    try {
      const response = await axios.patch(`http://localhost:3001/api/voice-notes/${note.id}`, {
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
        loadData(); // Actualizar estadísticas
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
    }
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('audio/')) {
          console.log('Archivo de audio seleccionado:', file.name);
          // Aquí podrías implementar la subida del archivo
          // Por ahora solo mostramos que se detectó
          showNotification('Archivo detectado', `Audio: ${file.name}`);
        }
      });
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
      {/* Panel de información del módulo dinámico */}
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
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm font-semibold">{isConnected ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
          
          {/* API Calls */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">API Calls</span>
              <Hash className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {costData ? (costData.apiUsage.gemini.calls + costData.apiUsage.openai.calls) : 0}
            </div>
            <div className="text-xs text-gray-500">
              Gemini: {costData?.apiUsage.gemini.calls || 0} | OpenAI: {costData?.apiUsage.openai.calls || 0}
            </div>
          </div>
          
          {/* Tokens */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Tokens (Gemini)</span>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {costData?.geminiFreeTier.used || 0}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full" 
                style={{ width: `${(costData?.geminiFreeTier.percentage || 0)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(costData?.geminiFreeTier.percentage || 0)}% usado
            </div>
          </div>
          
          {/* Costos */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Costos</span>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-sm font-semibold text-gray-900">
              ${(costData?.totalCost || 0).toFixed(4)}
            </div>
            <div className="text-xs text-gray-500">
              Hoy: ${(costData?.todayCost || 0).toFixed(4)}
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Actividad Reciente</h4>
          <div className="space-y-1">
            {costData?.recentTransactions.slice(0, 3).map((transaction, index) => (
              <div key={transaction.id || index} className="text-xs text-gray-600 flex items-center justify-between">
                <span>{transaction.api} - {transaction.service}</span>
                <span>{new Date(transaction.timestamp).toLocaleTimeString()}</span>
              </div>
            )) || (
              <div className="text-xs text-gray-500">No hay actividad reciente</div>
            )}
          </div>
        </div>
      </div>

      {/* Header con estadísticas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Mic className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notas de Voz</h2>
              <p className="text-sm text-gray-500">Sistema dinámico de gestión</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            {/* Botón de subida de archivos */}
            <button
              onClick={() => setShowUploadArea(!showUploadArea)}
              className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Subir Audio
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>
        
        {/* Área de subida de archivos */}
        {showUploadArea && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-dashed border-green-200"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">Arrastra archivos de audio aquí o</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Seleccionar archivos
              </button>
              <p className="text-xs text-green-600 mt-2">Formatos soportados: MP3, M4A, WAV, OGG</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </motion.div>
        )}
        
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
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todas
              </button>
              
              {Object.values(CATEGORIES).map(category => {
                const Icon = category.icon;
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
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {category.name}
                    </button>
                    
                    {category.subcategories && selectedCategory === category.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg p-1 z-10">
                        {Object.values(category.subcategories).map(sub => {
                          const SubIcon = sub.icon;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setSelectedSubcategory(sub.id)}
                              className={`w-full px-3 py-1.5 rounded text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 ${
                                selectedSubcategory === sub.id ? 'bg-gray-100' : ''
                              }`}
                            >
                              <SubIcon className="w-3 h-3" />
                              <span className="text-gray-900">{sub.name}</span>
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
                {stats?.transcribed || 0}
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
                {stats?.categorized || 0}
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
                {stats?.today || 0}
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
              Envía una nota de voz desde Telegram para comenzar
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
                        
                        {/* Transcripción */}
                        {note.transcription ? (
                          <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700">
                              "{note.transcription}"
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => transcribeVoiceNote(note)}
                            disabled={transcribingNotes[note.id]}
                            className="mt-2 px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {transcribingNotes[note.id] ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Transcribiendo...
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                Transcribir
                              </>
                            )}
                          </button>
                        )}
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
                          <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20">
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

export default VoiceNotesModuleDynamic;