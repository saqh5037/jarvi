import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Upload, 
  FileAudio,
  Play,
  Pause,
  Download,
  Trash2,
  FileText,
  Mail,
  Clock,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Copy,
  X,
  User,
  Star,
  Search,
  Mic,
  Brain,
  Hash,
  DollarSign,
  Activity,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  Zap,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import { API_ENDPOINTS, SOCKET_URLS } from '../config/api';

const EnhancedMeetingsModule = () => {
  const [meetings, setMeetings] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedTranscriptions, setExpandedTranscriptions] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [processingMeetings, setProcessingMeetings] = useState(new Set());
  const [showAnalysisModal, setShowAnalysisModal] = useState(null);
  const [showCustomAnalysisModal, setShowCustomAnalysisModal] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customAnalysisResults, setCustomAnalysisResults] = useState([]);
  const [showRetranscribeModal, setShowRetranscribeModal] = useState(null);
  const [retranscribeContext, setRetranscribeContext] = useState('');
  const [isRetranscribing, setIsRetranscribing] = useState(false);
  const [isLoadingCustomAnalysis, setIsLoadingCustomAnalysis] = useState(false);
  const [aiStats, setAiStats] = useState({
    totalTranscriptions: 0,
    totalSummaries: 0,
    totalTokens: 0,
    totalCost: 0
  });
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const socketRef = useRef(null);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    participants: '',
    tags: '',
    category: 'personal',
    status: 'pendiente'
  });

  // Categorías de reuniones
  const meetingCategories = {
    dynamtek: { label: 'Dynamtek', color: 'blue', icon: '💼' },
    wbi: { label: 'WBI', color: 'purple', icon: '🏢' },
    personal: { label: 'Personal', color: 'green', icon: '👤' },
    proyectos: { label: 'Proyectos', color: 'orange', icon: '🚀' },
    ingles: { label: 'Clases de Inglés', color: 'pink', icon: '🇬🇧' }
  };

  // Estados de reuniones
  const meetingStatuses = {
    pendiente: { label: 'Pendiente', color: 'yellow', icon: '⏳' },
    procesada: { label: 'Procesada', color: 'green', icon: '✅' },
    archivada: { label: 'Archivada', color: 'gray', icon: '📁' }
  };

  const [emailTemplate, setEmailTemplate] = useState({
    to: '',
    cc: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    // Conectar con Socket.io del servidor de reuniones
    socketRef.current = io(SOCKET_URLS.MEETINGS);
    
    socketRef.current.on('connect', () => {
      console.log('✅ Conectado al servidor de reuniones');
      setIsConnected(true);
      loadMeetings();
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado del servidor de reuniones');
      setIsConnected(false);
    });
    
    // Escuchar eventos del servidor
    socketRef.current.on('new-meeting', (meeting) => {
      console.log('📊 Nueva reunión:', meeting);
      setMeetings(prev => [meeting, ...prev]);
    });
    
    socketRef.current.on('meeting-status', ({ id, status, progress }) => {
      console.log(`📊 Estado reunión ${id}: ${status} (${progress}%)`);
      if (status === 'transcribing') {
        setProcessingMeetings(prev => new Set([...prev, id]));
      }
    });
    
    socketRef.current.on('meeting-transcribed', ({ id, transcription }) => {
      console.log('✅ Reunión transcrita:', id);
      setMeetings(prev => prev.map(m => 
        m.id === id ? { ...m, transcription, status: 'completed' } : m
      ));
      setProcessingMeetings(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      updateAiStats();
    });
    
    socketRef.current.on('meeting-updated', (meeting) => {
      setMeetings(prev => prev.map(m => 
        m.id === meeting.id ? meeting : m
      ));
    });
    
    socketRef.current.on('meeting-deleted', (id) => {
      setMeetings(prev => prev.filter(m => m.id !== id));
    });
    
    socketRef.current.on('meeting-error', ({ id, error }) => {
      console.error(`❌ Error en reunión ${id}:`, error);
      setProcessingMeetings(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const loadMeetings = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.MEETINGS}/api/meetings`);
      if (response.data.success) {
        setMeetings(response.data.meetings || []);
        updateAiStats();
      }
    } catch (error) {
      console.error('Error cargando reuniones:', error);
    }
  };

  const updateAiStats = () => {
    setAiStats(prev => {
      const transcribed = meetings.filter(m => m.transcription).length;
      const withSummary = meetings.filter(m => m.summary).length;
      const totalTokens = meetings.reduce((acc, m) => acc + (m.tokens || 0), 0);
      const totalCost = meetings.reduce((acc, m) => acc + (m.cost || 0), 0);
      
      return {
        totalTranscriptions: transcribed,
        totalSummaries: withSummary,
        totalTokens,
        totalCost
      };
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Aceptar varios tipos de audio incluidos .m4a
    const validTypes = ['audio/', 'video/mp4', 'video/x-m4a'];
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus'];
    
    const isValidType = validTypes.some(type => file.type.startsWith(type)) || 
                       validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      alert('Por favor selecciona un archivo de audio válido (MP3, WAV, M4A, OGG, AAC, etc.)');
      return;
    }

    // Verificar tamaño del archivo (máximo 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. Máximo 500MB.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', newMeeting.title || `Reunión ${new Date().toLocaleDateString()}`);
    formData.append('date', newMeeting.date || new Date().toISOString());
    formData.append('participants', newMeeting.participants);
    formData.append('tags', newMeeting.tags);
    formData.append('category', newMeeting.category || 'personal');
    formData.append('status', newMeeting.status || 'pendiente');

    setUploadingFile({
      name: file.name,
      size: file.size,
      progress: 0
    });

    try {
      const response = await axios.post(`${API_ENDPOINTS.MEETINGS}/api/meetings/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadingFile(prev => ({ ...prev, progress }));
        }
      });

      if (response.data.success) {
        console.log('✅ Archivo subido exitosamente:', response.data.meeting);
        setUploadingFile(null);
        setShowUploadForm(false);
        setNewMeeting({ title: '', date: '', participants: '', tags: '', category: 'personal', status: 'pendiente' });
        
        // La transcripción se iniciará automáticamente en el servidor
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      alert('Error al subir el archivo: ' + (error.response?.data?.error || error.message));
      setUploadingFile(null);
    }
  };

  const transcribeMeeting = async (meeting) => {
    if (processingMeetings.has(meeting.id)) return;
    
    try {
      setProcessingMeetings(prev => new Set([...prev, meeting.id]));
      
      const response = await axios.post(`${API_ENDPOINTS.MEETINGS}/api/meetings/${meeting.id}/transcribe`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Error al transcribir');
      }
      
      console.log('✅ Transcripción iniciada');
    } catch (error) {
      console.error('Error transcribiendo reunión:', error);
      alert('Error al transcribir: ' + error.message);
      setProcessingMeetings(prev => {
        const newSet = new Set(prev);
        newSet.delete(meeting.id);
        return newSet;
      });
    }
  };

  const generateSummary = async (meeting) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.MEETINGS}/api/meetings/${meeting.id}/summarize`);
      
      if (response.data.success) {
        console.log('✅ Resumen generado');
        loadMeetings(); // Recargar para obtener el resumen actualizado
      }
    } catch (error) {
      console.error('Error generando resumen:', error);
      alert('Error al generar resumen: ' + error.message);
    }
  };

  const generateMinutes = async (meeting) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.MEETINGS}/api/meetings/${meeting.id}/generate-minutes`);
      
      if (response.data.success) {
        console.log('✅ Minuta generada');
        
        // Descargar la minuta
        const blob = new Blob([response.data.minutes], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `minuta_${meeting.title.replace(/[^a-z0-9]/gi, '_')}_${meeting.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generando minuta:', error);
      alert('Error al generar minuta: ' + error.message);
    }
  };
  
  const downloadTranscription = async (meeting) => {
    try {
      window.open(`${API_ENDPOINTS.MEETINGS}/api/meetings/${meeting.id}/download-transcription`, '_blank');
    } catch (error) {
      console.error('Error descargando transcripción:', error);
      alert('Error al descargar transcripción: ' + error.message);
    }
  };
  
  const generateAdvancedAnalysis = async (meeting) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.MEETINGS}/api/meetings/${meeting.id}/advanced-analysis`);
      
      if (response.data.success) {
        console.log('✅ Análisis avanzado generado');
        alert('✅ Análisis avanzado generado exitosamente. Revisa los detalles en la reunión.');
        loadMeetings(); // Recargar para ver el análisis
      }
    } catch (error) {
      console.error('Error generando análisis avanzado:', error);
      alert('Error al generar análisis: ' + error.message);
    }
  };

  const submitCustomAnalysis = async () => {
    if (!customPrompt.trim() || !showCustomAnalysisModal) return;
    
    try {
      setIsLoadingCustomAnalysis(true);
      
      const response = await axios.post(
        `${API_ENDPOINTS.MEETINGS}/api/meetings/${showCustomAnalysisModal.id}/custom-analysis`,
        { prompt: customPrompt }
      );
      
      if (response.data.success) {
        const newAnalysis = response.data.analysis;
        
        // Agregar al historial de análisis
        setCustomAnalysisResults(prev => [newAnalysis, ...prev]);
        
        // Actualizar la reunión con el nuevo análisis
        setMeetings(prev => prev.map(m => {
          if (m.id === showCustomAnalysisModal.id) {
            const customAnalyses = m.customAnalyses || [];
            return { ...m, customAnalyses: [newAnalysis, ...customAnalyses].slice(0, 10) };
          }
          return m;
        }));
        
        // Limpiar el prompt
        setCustomPrompt('');
      }
    } catch (error) {
      console.error('Error en análisis personalizado:', error);
      alert('Error al procesar el análisis personalizado');
    } finally {
      setIsLoadingCustomAnalysis(false);
    }
  };

  const openCustomAnalysis = (meeting) => {
    setShowCustomAnalysisModal(meeting);
    setCustomAnalysisResults(meeting.customAnalyses || []);
    setCustomPrompt('');
  };

  const handleRetranscribe = async () => {
    if (!retranscribeContext.trim() || !showRetranscribeModal) return;
    
    try {
      setIsRetranscribing(true);
      
      const response = await axios.post(
        `${API_ENDPOINTS.MEETINGS}/api/meetings/${showRetranscribeModal.id}/retranscribe`,
        { 
          context: retranscribeContext,
          audioPath: showRetranscribeModal.audioPath
        }
      );
      
      if (response.data.success) {
        // Actualizar la reunión con la nueva transcripción
        setMeetings(prev => prev.map(m => {
          if (m.id === showRetranscribeModal.id) {
            return { 
              ...m, 
              transcription: response.data.transcription,
              summary: response.data.summary,
              advancedAnalysis: response.data.advancedAnalysis,
              contextUsed: retranscribeContext,
              retranscribedAt: new Date().toISOString()
            };
          }
          return m;
        }));
        
        // Cerrar modal y limpiar
        setShowRetranscribeModal(null);
        setRetranscribeContext('');
        
        // Mostrar notificación de éxito
        alert('✅ Re-transcripción completada con éxito. La reunión ha sido actualizada con el nuevo contexto.');
      }
    } catch (error) {
      console.error('Error en re-transcripción:', error);
      alert('❌ Error al re-transcribir: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsRetranscribing(false);
    }
  };

  const deleteMeeting = async (meeting) => {
    if (!confirm('¿Estás seguro de eliminar esta reunión?')) return;
    
    try {
      const response = await axios.delete(`${API_ENDPOINTS.MEETINGS}/api/meetings/${meeting.id}`);
      
      if (response.data.success) {
        console.log('✅ Reunión eliminada');
      }
    } catch (error) {
      console.error('Error eliminando reunión:', error);
      alert('Error al eliminar: ' + error.message);
    }
  };

  const playAudio = (meeting) => {
    if (audioRef.current) {
      if (currentlyPlaying === meeting.id) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      } else {
        audioRef.current.src = `${API_ENDPOINTS.MEETINGS}${meeting.audioPath}`;
        audioRef.current.play();
        setCurrentlyPlaying(meeting.id);
      }
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const toggleTranscription = (meetingId) => {
    setExpandedTranscriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId);
      } else {
        newSet.add(meetingId);
      }
      return newSet;
    });
  };

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const generateEmailDraft = (meeting) => {
    const subject = `Minuta: ${meeting.title}`;
    const body = `
Estimados participantes,

Adjunto encuentran la minuta de la reunión "${meeting.title}" realizada el ${formatDate(meeting.date)}.

## Resumen
${meeting.summary || 'Pendiente de generar'}

## Puntos Clave Discutidos
${meeting.keyPoints?.map(point => `• ${point}`).join('\n') || 'Pendiente de generar'}

## Acciones a Realizar
${meeting.actionItems?.map(item => `• ${item.task} (Responsable: ${item.assignee}, Fecha: ${item.deadline})`).join('\n') || 'Pendiente de generar'}

## Transcripción Completa
${meeting.transcription || 'Pendiente de transcribir'}

Saludos,
Generado automáticamente por JARVI
`;

    return {
      to: meeting.participants?.join(', ') || '',
      cc: '',
      subject,
      body
    };
  };

  const openEmailModal = (meeting) => {
    const draft = generateEmailDraft(meeting);
    setEmailTemplate(draft);
    setShowEmailModal(meeting.id);
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.participants?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || meeting.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || meeting.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;
  const processingCount = processingMeetings.size;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas de IA */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Reuniones Inteligentes</h2>
              <p className="text-purple-100">Transcribe y genera minutas con IA para archivos largos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              } animate-pulse`} />
              <span className="text-sm">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            <button
              onClick={() => {
                console.log('Botón clickeado - Abriendo formulario');
                setShowUploadForm(!showUploadForm);
              }}
              className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Subir Audio (hasta 500MB)
            </button>
            
            {/* Botón alternativo de prueba */}
            <button
              onClick={() => {
                console.log('Abriendo selector de archivos directamente');
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                  console.error('fileInputRef no está disponible');
                }
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
            >
              <FileAudio className="w-4 h-4" />
              Subir Directo
            </button>
          </div>
        </div>

        {/* Estadísticas de IA */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Brain className="w-5 h-5 text-purple-200" />
              <span className="text-xl font-bold">{totalMeetings}</span>
            </div>
            <p className="text-xs text-purple-100">Total Reuniones</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-5 h-5 text-purple-200" />
              <span className="text-xl font-bold">{completedMeetings}</span>
            </div>
            <p className="text-xs text-purple-100">Procesadas</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Hash className="w-5 h-5 text-purple-200" />
              <span className="text-xl font-bold">{aiStats.totalTokens.toLocaleString()}</span>
            </div>
            <p className="text-xs text-purple-100">Tokens Total</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-5 h-5 text-purple-200" />
              <span className="text-xl font-bold">${aiStats.totalCost.toFixed(4)}</span>
            </div>
            <p className="text-xs text-purple-100">Costo Total</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Activity className="w-5 h-5 text-purple-200" />
              <span className="text-xl font-bold">{processingCount}</span>
            </div>
            <p className="text-xs text-purple-100">En Proceso</p>
          </div>
        </div>
      </div>

      {/* Formulario de subida */}
      {showUploadForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir Audio de Reunión Larga</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Reunión</label>
              <input
                type="text"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                placeholder="Ej: Reunión de Planning Q1 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Participantes (separados por comas)</label>
              <input
                type="text"
                value={newMeeting.participants}
                onChange={(e) => setNewMeeting({...newMeeting, participants: e.target.value})}
                placeholder="Juan Pérez, María García, Carlos López"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por comas)</label>
              <input
                type="text"
                value={newMeeting.tags}
                onChange={(e) => setNewMeeting({...newMeeting, tags: e.target.value})}
                placeholder="sprint, planning, Q1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={newMeeting.category}
                onChange={(e) => setNewMeeting({...newMeeting, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(meetingCategories).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={newMeeting.status}
                onChange={(e) => setNewMeeting({...newMeeting, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(meetingStatuses).map(([key, status]) => (
                  <option key={key} value={key}>
                    {status.icon} {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Área de subida de archivo */}
          <div 
            className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors bg-purple-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileAudio className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">Arrastra tu archivo de audio aquí</p>
            <p className="text-sm text-gray-500 mt-2">o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400 mt-2">
              Formatos soportados: MP3, WAV, M4A, OGG, AAC, FLAC, OPUS
            </p>
            <p className="text-sm font-medium text-purple-600 mt-2">
              ¡Archivos grandes hasta 500MB soportados!
            </p>
            <p className="text-xs text-green-600 mt-1">
              ✅ Perfecto para reuniones largas de 1+ hora
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowUploadForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* Indicador de subida */}
      {uploadingFile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Subiendo: {uploadingFile.name}</p>
              <p className="text-sm text-gray-500">Tamaño: {formatFileSize(uploadingFile.size)}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <motion.div 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadingFile.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{uploadingFile.progress}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar reuniones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* Filtro de categoría */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(meetingCategories).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          
          {/* Filtro de estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(meetingStatuses).map(([key, status]) => (
              <option key={key} value={key}>
                {status.icon} {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de reuniones */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredMeetings.map((meeting) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                    
                    {/* Badge de categoría */}
                    {meeting.category && meetingCategories[meeting.category] && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${meetingCategories[meeting.category].color}-100 text-${meetingCategories[meeting.category].color}-700`}>
                        {meetingCategories[meeting.category].icon} {meetingCategories[meeting.category].label}
                      </span>
                    )}
                    
                    {/* Badge de estado */}
                    {meeting.status && meetingStatuses[meeting.status] ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${meetingStatuses[meeting.status].color}-100 text-${meetingStatuses[meeting.status].color}-700`}>
                        {processingMeetings.has(meeting.id) && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                        {meetingStatuses[meeting.status].icon} {meetingStatuses[meeting.status].label}
                      </span>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        meeting.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                        meeting.status === 'transcribing' ? 'bg-yellow-100 text-yellow-700' :
                        meeting.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {processingMeetings.has(meeting.id) && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                        {meeting.status === 'transcribing' ? 'Transcribiendo' :
                         meeting.status === 'completed' ? 'Completado' :
                         meeting.status === 'uploaded' ? 'Subido' : 'Error'}
                      </span>
                    )}

                    {meeting.fileSize && (
                      <span className="text-sm text-gray-500">
                        {formatFileSize(meeting.fileSize)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(meeting.date)}
                    </div>
                    {meeting.duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(meeting.duration)}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {meeting.participants?.length || 0} participantes
                    </div>
                  </div>

                  {/* Participantes */}
                  {meeting.participants && meeting.participants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {meeting.participants.map((participant, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {participant}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {meeting.tags && meeting.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {meeting.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Transcripción */}
                  {meeting.transcription && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Transcripción</h4>
                          <div 
                            onClick={() => toggleTranscription(meeting.id)}
                            className="cursor-pointer hover:bg-gray-100 rounded p-2 -m-2 transition-colors"
                          >
                            <p className="text-sm text-gray-700 italic">
                              "{expandedTranscriptions.has(meeting.id) 
                                ? meeting.transcription 
                                : truncateText(meeting.transcription, 200)}"
                            </p>
                            {meeting.transcription.length > 200 && (
                              <button className="text-xs text-purple-600 hover:text-purple-700 mt-1 font-medium flex items-center gap-1">
                                {expandedTranscriptions.has(meeting.id) ? (
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
                          {meeting.tokens && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {meeting.tokens} tokens
                              </span>
                              {meeting.cost && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ${meeting.cost.toFixed(4)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resumen */}
                  {meeting.summary && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Resumen</h4>
                      <p className="text-sm text-gray-700">{meeting.summary}</p>
                    </div>
                  )}

                  {/* Puntos clave */}
                  {meeting.keyPoints && meeting.keyPoints.length > 0 && (
                    <div className="bg-indigo-50 rounded-lg p-4 mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Puntos Clave</h4>
                      <ul className="space-y-1">
                        {meeting.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Items de acción */}
                  {meeting.actionItems && meeting.actionItems.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Acciones a Realizar</h4>
                      <ul className="space-y-2">
                        {meeting.actionItems.map((item, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{item.task}</span>
                              <div className="text-xs text-gray-500">
                                Responsable: {item.assignee} | Fecha: {item.deadline}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 ml-4">
                  {meeting.audioFile && (
                    <button
                      onClick={() => playAudio(meeting)}
                      className={`p-2 rounded-lg transition-colors ${
                        currentlyPlaying === meeting.id
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                      title="Reproducir audio"
                    >
                      {currentlyPlaying === meeting.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {!meeting.transcription && meeting.status === 'uploaded' && (
                    <button
                      onClick={() => transcribeMeeting(meeting)}
                      className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Transcribir con IA"
                      disabled={processingMeetings.has(meeting.id)}
                    >
                      {processingMeetings.has(meeting.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {meeting.transcription && !meeting.summary && (
                    <button
                      onClick={() => generateSummary(meeting)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Generar resumen"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}

                  {meeting.summary && (
                    <button
                      onClick={() => generateMinutes(meeting)}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="Generar minuta"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Botón para descargar transcripción */}
                  {meeting.transcription && (
                    <button
                      onClick={() => downloadTranscription(meeting)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Descargar transcripción TXT"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Botón para análisis avanzado */}
                  {meeting.transcription && !meeting.advancedAnalysis && (
                    <button
                      onClick={() => generateAdvancedAnalysis(meeting)}
                      className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Generar análisis avanzado tipo Plaud AI"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Botón para ver análisis avanzado */}
                  {meeting.advancedAnalysis && (
                    <button
                      onClick={() => setShowAnalysisModal(meeting)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Ver análisis avanzado"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {/* Botón para análisis personalizado con prompt */}
                  {meeting.transcription && (
                    <button
                      onClick={() => openCustomAnalysis(meeting)}
                      className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Análisis personalizado con pregunta"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  {/* Botón para re-transcribir con contexto */}
                  {meeting.audioPath && (
                    <button
                      onClick={() => setShowRetranscribeModal(meeting)}
                      className="p-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Re-transcribir con contexto"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  {meeting.status === 'completed' && (
                    <button
                      onClick={() => openEmailModal(meeting)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Enviar por email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteMeeting(meeting)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMeetings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No hay reuniones que coincidan con los filtros'
                : 'No tienes reuniones aún. ¡Sube tu primera grabación larga!'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Análisis Avanzado */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-5xl my-8"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Análisis Avanzado - {showAnalysisModal.title}</h3>
                    <p className="text-sm text-gray-500">Análisis tipo Plaud AI generado con inteligencia artificial</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalysisModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {showAnalysisModal.advancedAnalysis ? (
                <>
                  {/* Metadata del análisis */}
                  {showAnalysisModal.advancedAnalysis.metadata && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Brain className="w-6 h-6" />
                          <div>
                            <h4 className="font-semibold">{showAnalysisModal.advancedAnalysis.metadata.engine || 'JARVI Analysis'}</h4>
                            <p className="text-xs opacity-90">Versión {showAnalysisModal.advancedAnalysis.metadata.analysisVersion || '2.0'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{showAnalysisModal.advancedAnalysis.metadata.wordCount} palabras</p>
                          <p className="text-xs opacity-90">~{showAnalysisModal.advancedAnalysis.metadata.estimatedDuration}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resumen Ejecutivo Mejorado */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Resumen Ejecutivo
                    </h4>
                    <p className="text-gray-700 mb-3">{showAnalysisModal.advancedAnalysis.executiveSummary?.briefSummary || showAnalysisModal.advancedAnalysis.executiveSummary?.content}</p>
                    {showAnalysisModal.advancedAnalysis.executiveSummary?.mainConclusion && (
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-gray-900 mb-1">Conclusión Principal:</p>
                        <p className="text-sm text-gray-700">{showAnalysisModal.advancedAnalysis.executiveSummary.mainConclusion}</p>
                      </div>
                    )}
                    {showAnalysisModal.advancedAnalysis.executiveSummary?.keyTakeaways && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 mb-2">Puntos Clave:</p>
                        <ul className="space-y-1">
                          {showAnalysisModal.advancedAnalysis.executiveSummary.keyTakeaways.map((takeaway, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {showAnalysisModal.advancedAnalysis.executiveSummary?.confidenceScore && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                            style={{ width: `${showAnalysisModal.advancedAnalysis.executiveSummary.confidenceScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">Confianza: {Math.round(showAnalysisModal.advancedAnalysis.executiveSummary.confidenceScore * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Temas Principales Mejorados */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-600" />
                      Temas Principales Identificados
                    </h4>
                    <div className="space-y-3">
                      {(showAnalysisModal.advancedAnalysis.mainTopics || []).map((topic, idx) => (
                        <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{topic.topic}</h5>
                              <p className="text-sm text-gray-600 mt-1">{topic.context}</p>
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  {topic.mentions} menciones
                                </span>
                                {topic.percentage && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {topic.percentage}
                                  </span>
                                )}
                                {topic.timeSpent && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {topic.timeSpent}
                                  </span>
                                )}
                              </div>
                              {topic.relatedConcepts && topic.relatedConcepts.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {topic.relatedConcepts.map((concept, cidx) => (
                                    <span key={cidx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                                      {concept}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="w-16 h-16 relative">
                                <svg className="w-16 h-16 transform -rotate-90">
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="#E5E7EB"
                                    strokeWidth="8"
                                    fill="none"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="#6366F1"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(topic.relevanceScore || topic.relevance || 0) * 1.76} 176`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-600">
                                  {topic.relevanceScore || topic.relevance || 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Análisis de Participantes Mejorado */}
                  {showAnalysisModal.advancedAnalysis.participants && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Análisis de Participantes
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Participantes Identificados:</p>
                          <div className="flex flex-wrap gap-2">
                            {(showAnalysisModal.advancedAnalysis.participants.identified || []).map((participant, idx) => (
                              <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-blue-200">
                                {participant}
                              </span>
                            ))}
                          </div>
                        </div>
                        {showAnalysisModal.advancedAnalysis.participants.speakingDistribution && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Distribución de Participación:</p>
                            <div className="space-y-1">
                              {Object.entries(showAnalysisModal.advancedAnalysis.participants.speakingDistribution).map(([name, percentage]) => (
                                <div key={name} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 w-24">{name}:</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                                    <div 
                                      className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-1"
                                      style={{ width: percentage }}
                                    >
                                      <span className="text-xs text-white font-medium">{percentage}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {showAnalysisModal.advancedAnalysis.participants.interactionMatrix && (
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-2xl font-bold text-blue-600">
                              {showAnalysisModal.advancedAnalysis.participants.interactionMatrix.totalInteractions}
                            </p>
                            <p className="text-xs text-gray-600">Interacciones</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-2xl font-bold text-green-600">
                              {showAnalysisModal.advancedAnalysis.participants.interactionMatrix.questionsAsked}
                            </p>
                            <p className="text-xs text-gray-600">Preguntas</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-2xl font-bold text-purple-600">
                              {showAnalysisModal.advancedAnalysis.participants.interactionMatrix.responsesGiven}
                            </p>
                            <p className="text-xs text-gray-600">Respuestas</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Métricas Detalladas Mejoradas */}
                  {showAnalysisModal.advancedAnalysis.metrics && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        Métricas de la Reunión
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {showAnalysisModal.advancedAnalysis.metrics.efficiency && (
                          <div className="bg-white rounded-lg p-3 text-center">
                            <Activity className="w-6 h-6 text-green-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-gray-900">
                              {showAnalysisModal.advancedAnalysis.metrics.efficiency.score || 0}
                            </p>
                            <p className="text-xs text-gray-600">Eficiencia</p>
                            <p className="text-xs text-green-600 mt-1">
                              {showAnalysisModal.advancedAnalysis.metrics.efficiency.timeUtilization}
                            </p>
                          </div>
                        )}
                        {showAnalysisModal.advancedAnalysis.metrics.productivity && (
                          <div className="bg-white rounded-lg p-3 text-center">
                            <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">
                              {showAnalysisModal.advancedAnalysis.metrics.productivity.level}
                            </p>
                            <p className="text-xs text-gray-600">Productividad</p>
                            <p className="text-xs text-blue-600 mt-1">
                              {showAnalysisModal.advancedAnalysis.metrics.productivity.actionItemsGenerated} tareas
                            </p>
                          </div>
                        )}
                        {showAnalysisModal.advancedAnalysis.metrics.engagement && (
                          <div className="bg-white rounded-lg p-3 text-center">
                            <Users className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-gray-900">
                              {showAnalysisModal.advancedAnalysis.metrics.engagement.overallScore}%
                            </p>
                            <p className="text-xs text-gray-600">Engagement</p>
                            <p className="text-xs text-purple-600 mt-1">
                              {showAnalysisModal.advancedAnalysis.metrics.engagement.participationRate}
                            </p>
                          </div>
                        )}
                        {showAnalysisModal.advancedAnalysis.metrics.clarity && (
                          <div className="bg-white rounded-lg p-3 text-center">
                            <Eye className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-gray-900">
                              {showAnalysisModal.advancedAnalysis.metrics.clarity.communicationScore}
                            </p>
                            <p className="text-xs text-gray-600">Claridad</p>
                            <p className="text-xs text-indigo-600 mt-1">
                              {showAnalysisModal.advancedAnalysis.metrics.clarity.understandingLevel}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Análisis de Sentimiento Avanzado */}
                  {showAnalysisModal.advancedAnalysis.sentiment && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Análisis de Sentimiento y Tono
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-center mb-3">
                            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {showAnalysisModal.advancedAnalysis.sentiment.overall}
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                              Score: {showAnalysisModal.advancedAnalysis.sentiment.score}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-green-600">Positivo</span>
                                <span className="font-medium">{showAnalysisModal.advancedAnalysis.sentiment.breakdown?.positive || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${showAnalysisModal.advancedAnalysis.sentiment.breakdown?.positive || 0}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Neutral</span>
                                <span className="font-medium">{showAnalysisModal.advancedAnalysis.sentiment.breakdown?.neutral || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gray-400 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${showAnalysisModal.advancedAnalysis.sentiment.breakdown?.neutral || 0}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-red-600">Negativo</span>
                                <span className="font-medium">{showAnalysisModal.advancedAnalysis.sentiment.breakdown?.negative || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${showAnalysisModal.advancedAnalysis.sentiment.breakdown?.negative || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {showAnalysisModal.advancedAnalysis.sentiment.emotionalTone && (
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Tono Emocional</p>
                              <p className="font-medium text-gray-900">{showAnalysisModal.advancedAnalysis.sentiment.emotionalTone}</p>
                            </div>
                          )}
                          {showAnalysisModal.advancedAnalysis.sentiment.energyLevel && (
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Nivel de Energía</p>
                              <p className="font-medium text-gray-900">{showAnalysisModal.advancedAnalysis.sentiment.energyLevel}</p>
                            </div>
                          )}
                          {showAnalysisModal.advancedAnalysis.sentiment.trend && (
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Tendencia</p>
                              <p className="font-medium text-gray-900">{showAnalysisModal.advancedAnalysis.sentiment.trend}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {showAnalysisModal.advancedAnalysis.sentiment.keyMoments && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Momentos Clave:</p>
                          <div className="space-y-1">
                            {showAnalysisModal.advancedAnalysis.sentiment.keyMoments.map((moment, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <span className="font-mono text-xs text-gray-500">{moment.time}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  moment.sentiment === 'Positivo' ? 'bg-green-100 text-green-700' :
                                  moment.sentiment === 'Negativo' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {moment.sentiment}
                                </span>
                                <span className="text-gray-600">{moment.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Decisiones y Preguntas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-yellow-50 rounded-xl p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">✅ Decisiones</h4>
                      <ul className="space-y-2">
                        {showAnalysisModal.advancedAnalysis.decisions.map((decision, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">{decision.decision}</span>
                            <span className="text-gray-500 text-xs block">{decision.timestamp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">❓ Preguntas Sin Resolver</h4>
                      <ul className="space-y-2">
                        {showAnalysisModal.advancedAnalysis.openQuestions.map((question, idx) => (
                          <li key={idx} className="text-sm text-gray-700">• {question}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Items de Acción */}
                  <div className="bg-red-50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">📋 Items de Acción</h4>
                    <div className="space-y-3">
                      {showAnalysisModal.advancedAnalysis.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.item}</p>
                            <div className="flex gap-4 text-sm text-gray-600 mt-1">
                              <span>👤 {item.assignee}</span>
                              <span>📅 {item.dueDate}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                item.priority === 'Alta' ? 'bg-red-200 text-red-700' :
                                item.priority === 'Media' ? 'bg-yellow-200 text-yellow-700' :
                                'bg-green-200 text-green-700'
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="bg-purple-50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">💡 Insights y Recomendaciones</h4>
                    <div className="space-y-3">
                      {showAnalysisModal.advancedAnalysis.insights.map((insight, idx) => (
                        <div key={idx} className="border-l-4 border-purple-400 pl-4">
                          <p className="font-medium text-gray-900">{insight.content}</p>
                          <p className="text-sm text-purple-700 mt-1">→ {insight.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Palabras Clave */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">🔑 Palabras Clave</h4>
                    <div className="flex flex-wrap gap-2">
                      {showAnalysisModal.advancedAnalysis.keywords.map((keyword, idx) => (
                        <span 
                          key={idx} 
                          className={`px-3 py-1 rounded-full text-sm ${
                            keyword.importance === 'crítica' ? 'bg-red-100 text-red-700' :
                            keyword.importance === 'alta' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {keyword.word} ({keyword.count})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Mejorado */}
                  {showAnalysisModal.advancedAnalysis.timeline && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Línea de Tiempo de la Reunión
                      </h4>
                      {showAnalysisModal.advancedAnalysis.timeline.segments ? (
                        <div className="space-y-3">
                          {showAnalysisModal.advancedAnalysis.timeline.segments.map((segment, idx) => (
                            <div key={idx} className="relative">
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                    segment.phase === 'Apertura' ? 'bg-green-500' :
                                    segment.phase === 'Desarrollo' ? 'bg-blue-500' :
                                    segment.phase === 'Conclusiones' ? 'bg-purple-500' :
                                    'bg-gray-500'
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  {idx < showAnalysisModal.advancedAnalysis.timeline.segments.length - 1 && (
                                    <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                                  )}
                                </div>
                                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold text-gray-900">{segment.phase}</h5>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      {segment.startTime} • {segment.duration}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{segment.description}</p>
                                  {segment.keyPoints && segment.keyPoints.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {segment.keyPoints.map((point, pidx) => (
                                        <span key={pidx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                                          {point}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {segment.sentiment && (
                                    <div className="mt-2">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        segment.sentiment === 'Positivo' ? 'bg-green-100 text-green-700' :
                                        segment.sentiment === 'Negativo' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        Sentimiento: {segment.sentiment}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="text-center pt-3">
                            <p className="text-sm text-gray-600">
                              Duración total: <span className="font-semibold">{showAnalysisModal.advancedAnalysis.timeline.totalDuration}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(Array.isArray(showAnalysisModal.advancedAnalysis.timeline) ? 
                            showAnalysisModal.advancedAnalysis.timeline : []).map((event, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <span className="text-indigo-600 font-mono text-sm min-w-[60px]">{event.time}</span>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5" />
                              <span className="text-gray-700 text-sm flex-1">{event.event}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay análisis avanzado disponible para esta reunión.</p>
                  <button
                    onClick={() => {
                      setShowAnalysisModal(null);
                      generateAdvancedAnalysis(showAnalysisModal);
                    }}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Generar Análisis Ahora
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Análisis Personalizado */}
      {showCustomAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
          >
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <MessageSquare className="w-7 h-7" />
                    Análisis Personalizado con IA
                  </h3>
                  <p className="text-white/90 mt-1">
                    {showCustomAnalysisModal.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCustomAnalysisModal(null);
                    setCustomPrompt('');
                    setCustomAnalysisResults([]);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Input para el prompt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Qué quieres analizar de esta reunión?
                </label>
                <div className="relative">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ejemplos:
• Identifica los hablantes
• ¿Qué dijo Sam sobre el proyecto?
• ¿Qué decisiones se tomaron?
• ¿Cuáles son las tareas pendientes?
• Resume los temas principales
• ¿Qué opinó el equipo sobre la propuesta?"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none resize-none text-gray-900 placeholder-gray-400 bg-white"
                    rows="4"
                    disabled={isLoadingCustomAnalysis}
                  />
                  <button
                    onClick={submitCustomAnalysis}
                    disabled={!customPrompt.trim() || isLoadingCustomAnalysis}
                    className={`absolute bottom-3 right-3 px-4 py-2 rounded-lg font-medium transition-all ${
                      customPrompt.trim() && !isLoadingCustomAnalysis
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoadingCustomAnalysis ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analizando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Analizar
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Sugerencias de prompts */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Sugerencias rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Identifica los hablantes",
                    "Es una clase con participantes",
                    "Análisis de clase de inglés",
                    "Los hablantes son: [escribe los nombres aquí]",
                    "¿Qué decisiones se tomaron?",
                    "Lista las tareas pendientes",
                    "Resume en 3 puntos",
                    "¿Qué temas de inglés se enseñaron?"
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (suggestion.includes('[escribe los nombres aquí]')) {
                          setCustomPrompt('Los hablantes son: ');
                          // Enfocar el textarea
                          setTimeout(() => {
                            const textarea = document.querySelector('textarea');
                            if (textarea) {
                              textarea.focus();
                              textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                            }
                          }, 100);
                        } else {
                          setCustomPrompt(suggestion);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        suggestion.includes('hablantes son') 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                          : suggestion.includes('clase') || suggestion.includes('inglés')
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultados de análisis */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {customAnalysisResults.length > 0 ? (
                  customAnalysisResults.map((result, idx) => (
                    <motion.div
                      key={result.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            📝 {result.prompt}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(result.createdAt).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-white rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                          {typeof result.response === 'object' 
                            ? result.response.analysis 
                            : result.response}
                        </pre>
                        
                        {/* Mostrar información adicional si existe */}
                        {result.response?.speakers && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Hablantes identificados:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {result.response.speakers.map((speaker, sidx) => (
                                <span key={sidx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {speaker}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {result.response?.statistics && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(result.response.statistics).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500">{key}:</span>
                                  <span className="font-medium">{JSON.stringify(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Haz una pregunta para analizar la reunión
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Puedes preguntar sobre hablantes, decisiones, tareas, temas, etc.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Re-transcripción con Contexto */}
      {showRetranscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
          >
            <div className="bg-gradient-to-r from-white/10 to-transparent p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <RefreshCw className="w-7 h-7" />
                    Re-transcribir con Contexto
                  </h3>
                  <p className="text-white/90 mt-1">
                    {showRetranscribeModal.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRetranscribeModal(null);
                    setRetranscribeContext('');
                  }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Proporciona contexto para mejorar la transcripción. El sistema identificará a los hablantes por su voz y generará el tipo de documento apropiado.
                </p>
                
                {/* Sugerencias de contexto */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Ejemplos de contexto útil:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      onClick={() => setRetranscribeContext("Esta es una clase de inglés con un profesor y 5 estudiantes. Identifica a cada participante como 'Profesor' y 'Estudiante 1', 'Estudiante 2', etc. Genera notas de estudio con los temas principales, vocabulario nuevo y ejercicios realizados.")}
                      className="text-left p-3 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 transition-colors"
                    >
                      <span className="font-medium text-cyan-700 text-sm">📚 Clase con estudiantes</span>
                      <p className="text-xs text-gray-600 mt-1">Identifica profesor y estudiantes, genera notas de estudio</p>
                    </button>
                    
                    <button
                      onClick={() => setRetranscribeContext("Esta es una reunión de negocios con Juan (CEO), María (CTO), y Carlos (PM). Identifica a cada persona por su nombre y rol. Genera minutas formales con decisiones, tareas asignadas y próximos pasos.")}
                      className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                    >
                      <span className="font-medium text-blue-700 text-sm">💼 Reunión de negocios</span>
                      <p className="text-xs text-gray-600 mt-1">Identifica por nombres y roles, genera minutas formales</p>
                    </button>
                    
                    <button
                      onClick={() => setRetranscribeContext("Esta es una sesión de brainstorming con el equipo de diseño. Identifica a los participantes como 'Participante 1', 'Participante 2', etc. Captura todas las ideas propuestas y agrúpalas por temas.")}
                      className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                    >
                      <span className="font-medium text-purple-700 text-sm">💡 Brainstorming</span>
                      <p className="text-xs text-gray-600 mt-1">Captura y agrupa ideas por temas</p>
                    </button>
                    
                    <button
                      onClick={() => setRetranscribeContext("Esta es una entrevista de trabajo. Identifica al entrevistador y al candidato. Genera un resumen con las preguntas principales, respuestas del candidato, y evaluación de competencias.")}
                      className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                    >
                      <span className="font-medium text-green-700 text-sm">👔 Entrevista</span>
                      <p className="text-xs text-gray-600 mt-1">Identifica entrevistador y candidato, evalúa competencias</p>
                    </button>
                  </div>
                </div>

                {/* Campo de texto para contexto personalizado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contexto personalizado:
                  </label>
                  <textarea
                    value={retranscribeContext}
                    onChange={(e) => setRetranscribeContext(e.target.value)}
                    placeholder="Ejemplo: Esta es una reunión de sprint planning con 4 desarrolladores. Identifica a cada uno como Dev1, Dev2, etc. Genera una lista de historias de usuario discutidas con sus estimaciones y asignaciones..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 placeholder-gray-400 bg-white"
                  />
                </div>

                {/* Opciones adicionales */}
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500" />
                    <span className="text-sm text-gray-700">Identificar emociones y tono de voz</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500" />
                    <span className="text-sm text-gray-700">Incluir timestamps detallados</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500" />
                    <span className="text-sm text-gray-700">Generar resumen ejecutivo</span>
                  </label>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowRetranscribeModal(null);
                    setRetranscribeContext('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRetranscribe()}
                  disabled={!retranscribeContext.trim() || isRetranscribing}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRetranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Re-transcribiendo...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Iniciar Re-transcripción
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enviar Minuta por Email</h3>
              <button
                onClick={() => setShowEmailModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Para</label>
                <input
                  type="email"
                  value={emailTemplate.to}
                  onChange={(e) => setEmailTemplate({...emailTemplate, to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="destinatario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                <input
                  type="email"
                  value={emailTemplate.cc}
                  onChange={(e) => setEmailTemplate({...emailTemplate, cc: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="copia@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <input
                  type="text"
                  value={emailTemplate.subject}
                  onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  value={emailTemplate.body}
                  onChange={(e) => setEmailTemplate({...emailTemplate, body: e.target.value})}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(emailTemplate.body);
                  alert('Contenido copiado al portapapeles');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
              
              <button
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Input de archivo global (siempre disponible) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.m4a,.aac,.mp3,.wav,.ogg,.flac,.opus"
        onChange={handleFileUpload}
        className="hidden"
        style={{ display: 'none' }}
      />
      
      {/* Audio Player oculto */}
      <audio 
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        className="hidden"
      />
    </div>
  );
};

export default EnhancedMeetingsModule;