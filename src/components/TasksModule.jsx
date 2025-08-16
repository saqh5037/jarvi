import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar,
  CheckCircle,
  Circle,
  AlertCircle,
  Bell,
  Mic,
  Plus,
  Trash2,
  Edit,
  Filter,
  TrendingUp,
  Star,
  MapPin,
  Tag,
  ChevronRight,
  Timer,
  Target,
  Zap,
  Flag,
  Hash,
  User,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Headphones,
  Music
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import { API_ENDPOINTS, SOCKET_URLS } from '../config/api';
import useVoiceReader from '../hooks/useVoiceReader';
import VoiceReadingSystem from './VoiceReadingSystem';
import KaraokeReadingMode from './KaraokeReadingMode';

const TASKS_SERVER = API_ENDPOINTS.TASKS;

const TasksModule = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [readingTaskId, setReadingTaskId] = useState(null);
  const [showVoiceReader, setShowVoiceReader] = useState(false);
  const [selectedTaskForReading, setSelectedTaskForReading] = useState(null);
  const [showKaraokeMode, setShowKaraokeMode] = useState(false);
  const [selectedTaskForKaraoke, setSelectedTaskForKaraoke] = useState(null);
  const audioRef = useRef(null);
  
  const {
    isReading,
    speak,
    stop,
    pause,
    resume,
    isPaused
  } = useVoiceReader();

  // Colores para prioridades
  const priorityColors = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  const priorityIcons = {
    urgent: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  };

  const categoryIcons = {
    personal: '👤',
    work: '💼',
    shopping: '🛒',
    health: '🏥',
    education: '📚',
    home: '🏠'
  };

  // Conectar WebSocket
  useEffect(() => {
    const socketConnection = io(SOCKET_URLS.TASKS);
    
    socketConnection.on('connect', () => {
      console.log('Conectado al servidor de tareas');
    });

    socketConnection.on('task-created', (data) => {
      loadTasks();
      if (data.notification) {
        showNotification(data.notification, 'success');
      }
    });

    socketConnection.on('task-updated', (task) => {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    });

    socketConnection.on('task-completed', (data) => {
      loadTasks();
      if (data.notification) {
        showNotification(data.notification, 'success');
      }
    });

    socketConnection.on('task-deleted', (data) => {
      setTasks(prev => prev.filter(t => t.id !== data.id));
      if (data.notification) {
        showNotification(data.notification, 'info');
      }
    });

    socketConnection.on('task-overdue', (data) => {
      showNotification(data.message, 'warning');
    });

    socketConnection.on('task-reminder', (data) => {
      showNotification(data.message, 'info');
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Cargar tareas
  const loadTasks = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`${TASKS_SERVER}/api/tasks${params}`);
      setTasks(response.data.tasks || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setIsLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await axios.get(`${TASKS_SERVER}/api/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadStats();
    const interval = setInterval(loadStats, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [filter]);

  // Mostrar notificación
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Crear tarea desde texto natural
  const createTask = async () => {
    if (!newTaskText.trim()) return;
    
    try {
      await axios.post(`${TASKS_SERVER}/api/tasks/natural`, {
        text: newTaskText,
        source: 'web'
      });
      setNewTaskText('');
      setShowNewTaskModal(false);
    } catch (error) {
      console.error('Error creando tarea:', error);
      showNotification('Error al crear la tarea', 'error');
    }
  };

  // Completar tarea
  const completeTask = async (taskId) => {
    try {
      await axios.post(`${TASKS_SERVER}/api/tasks/${taskId}/complete`);
    } catch (error) {
      console.error('Error completando tarea:', error);
    }
  };

  // Eliminar tarea
  const deleteTask = async (taskId) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    
    try {
      await axios.delete(`${TASKS_SERVER}/api/tasks/${taskId}`);
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
  };

  // Funciones de audio
  const playAudio = (audioFile) => {
    if (audioRef.current) {
      if (playingAudio === audioFile) {
        // Pausar si ya está reproduciendo
        audioRef.current.pause();
        setPlayingAudio(null);
      } else {
        // Reproducir nuevo audio
        audioRef.current.src = `${TASKS_SERVER}/audio/${audioFile}`;
        audioRef.current.play();
        setPlayingAudio(audioFile);
      }
    }
  };

  // Funciones de lectura de voz
  const startReadingTask = (task) => {
    if (isReading && readingTaskId === task.id) {
      // Si ya está leyendo esta tarea, detener
      stop();
      setReadingTaskId(null);
    } else {
      // Preparar texto para leer
      const priority = task.priority || 'normal';
      const category = task.category || 'general';
      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'sin fecha límite';
      
      const textToRead = `
        Tarea: ${task.title}.
        ${task.description ? `Descripción: ${task.description}.` : ''}
        Prioridad: ${priority === 'urgent' ? 'urgente' : priority === 'high' ? 'alta' : priority === 'medium' ? 'media' : 'baja'}.
        Categoría: ${category}.
        Fecha límite: ${dueDate}.
        Estado: ${task.status === 'completed' ? 'completada' : task.status === 'in_progress' ? 'en progreso' : 'pendiente'}.
        ${task.assignedTo ? `Asignada a: ${task.assignedTo}.` : ''}
      `;
      
      speak(textToRead, {
        onStart: () => setReadingTaskId(task.id),
        onEnd: () => setReadingTaskId(null)
      });
    }
  };

  const openVoiceReaderForTask = (task) => {
    setSelectedTaskForReading(task);
    setShowVoiceReader(true);
  };

  const openKaraokeModeForTask = (task) => {
    setSelectedTaskForKaraoke(task);
    setShowKaraokeMode(true);
  };

  const formatAudioDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (diff < 0) return <span className="text-red-500 font-bold">Vencida</span>;
    if (hours < 1) return <span className="text-orange-500">En menos de 1 hora</span>;
    if (hours < 24) return <span className="text-yellow-500">{hours}h restantes</span>;
    if (days === 1) return <span className="text-blue-500">Mañana</span>;
    if (days < 7) return <span className="text-blue-500">{days} días</span>;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular progreso del día
  const getDayProgress = () => {
    if (!stats) return 0;
    const todayTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    });
    
    const completed = todayTasks.filter(t => t.status === 'completed').length;
    return todayTasks.length > 0 ? (completed / todayTasks.length) * 100 : 0;
  };

  return (
    <div className="space-y-6 min-h-screen bg-gray-100 fixed inset-0 overflow-auto p-6">
      {/* Header con estadísticas */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Centro de Tareas Inteligente
            </h1>
            <p className="text-gray-600">
              Gestiona tus tareas y recordatorios con IA
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewTaskModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Nueva Tarea
          </motion.button>
        </div>

        {/* Tarjetas de estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Hash className="w-8 h-8 text-purple-600" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Vencidas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Hoy</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.dueToday}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Barra de progreso del día */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-900 font-medium">Progreso del día</span>
            <span className="text-gray-600">{Math.round(getDayProgress())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${getDayProgress()}%` }}
              transition={{ duration: 1 }}
              className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'in_progress', 'completed'].map(status => (
          <motion.button
            key={status}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === status 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {status === 'all' ? 'Todas' : 
             status === 'pending' ? 'Pendientes' :
             status === 'in_progress' ? 'En Progreso' : 'Completadas'}
          </motion.button>
        ))}
      </div>

      {/* Lista de tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden"
            >
              {/* Indicador de prioridad */}
              <div className={`absolute top-0 left-0 w-full h-1 ${priorityColors[task.priority]}`} />
              
              {/* Badge de recordatorio por voz */}
              {task.createdBy === 'telegram-voice' && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Recordatorio
                </div>
              )}
              
              {/* Header de la tarea */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => completeTask(task.id)}
                    className="mt-1"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 hover:text-gray-900 transition-colors" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className={`text-gray-900 font-medium ${
                      task.status === 'completed' ? 'line-through opacity-60' : ''
                    }`}>
                      {task.title}
                    </h3>
                    {task.description && task.description !== task.title && (
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Botón de lectura rápida */}
                  <button
                    onClick={() => startReadingTask(task)}
                    className={`p-2 rounded-lg transition-all ${
                      isReading && readingTaskId === task.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={isReading && readingTaskId === task.id ? 'Detener lectura' : 'Leer tarea'}
                  >
                    {isReading && readingTaskId === task.id ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Botón de lector avanzado */}
                  <button
                    onClick={() => openVoiceReaderForTask(task)}
                    className="p-2 hover:bg-purple-100 text-purple-600 rounded-lg transition-all"
                    title="Abrir lector avanzado"
                  >
                    <Headphones className="w-4 h-4" />
                  </button>
                  
                  <span className="text-2xl">{categoryIcons[task.category]}</span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Metadatos */}
              <div className="space-y-2">
                {/* Fecha de vencimiento */}
                {task.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {formatDate(task.dueDate)}
                  </div>
                )}

                {/* Botón de Karaoke - SIEMPRE VISIBLE */}
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-pink-300">
                  <button
                    onClick={() => openKaraokeModeForTask(task)}
                    className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 animate-pulse"
                    title="🎤 Modo Karaoke"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-6 h-6" />
                      <span className="text-lg font-bold">🎤 KARAOKE</span>
                    </div>
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">Leer tarea en modo Karaoke</p>
                    <p className="text-xs text-gray-500">Click para activar lectura con efectos visuales</p>
                  </div>
                </div>

                {/* Audio de voz */}
                {task.audioFile && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg mt-2">
                    <button
                      onClick={() => playAudio(task.audioFile)}
                      className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
                    >
                      {playingAudio === task.audioFile ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-gray-700">Nota de voz</span>
                        {task.audioDuration && (
                          <span className="text-xs text-gray-500">
                            {formatAudioDuration(task.audioDuration)}
                          </span>
                        )}
                      </div>
                      {playingAudio === task.audioFile && (
                        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 animate-pulse" style={{width: '50%'}}></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ubicación */}
                {task.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {task.location}
                  </div>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.slice(0, 3).map((tag, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Origen y tiempo */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    {task.createdBy === 'telegram' && (
                      <>
                        <Mic className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">Telegram</span>
                      </>
                    )}
                    {task.createdBy === 'telegram-voice' && (
                      <>
                        <Bell className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">Recordatorio por voz</span>
                      </>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(task.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <span className="text-lg">{priorityIcons[task.priority]}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal de nueva tarea */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Crear Nueva Tarea
            </h3>
            
            <textarea
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Escribe tu tarea de forma natural. Ej: 'Recordar llamar al doctor mañana a las 3pm'"
              className="w-full h-32 px-4 py-3 bg-gray-50 text-gray-900 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none resize-none"
              autoFocus
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTask}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Crear Tarea
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notificaciones flotantes */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className={`px-6 py-3 rounded-lg shadow-lg text-white ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-orange-500' :
                'bg-blue-500'
              }`}
            >
              {notification.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      )}

      {/* Mensaje vacío */}
      {!isLoading && tasks.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay tareas pendientes</p>
          <p className="text-gray-500 mt-2">¡Crea una nueva tarea para comenzar!</p>
        </motion.div>
      )}

      {/* Elemento de audio oculto */}
      <audio 
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />

      {/* Sistema de lectura de voz avanzado */}
      {showVoiceReader && selectedTaskForReading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-3xl w-full">
            <VoiceReadingSystem
              text={`${selectedTaskForReading.title}. ${selectedTaskForReading.description || ''}`}
              title={selectedTaskForReading.title}
              onClose={() => {
                setShowVoiceReader(false);
                setSelectedTaskForReading(null);
              }}
              allowSummary={true}
              mode="expanded"
            />
          </div>
        </div>
      )}

      {/* Modo Karaoke */}
      {showKaraokeMode && selectedTaskForKaraoke && (
        <KaraokeReadingMode
          task={selectedTaskForKaraoke}
          onClose={() => {
            setShowKaraokeMode(false);
            setSelectedTaskForKaraoke(null);
          }}
        />
      )}
    </div>
  );
};

export default TasksModule;