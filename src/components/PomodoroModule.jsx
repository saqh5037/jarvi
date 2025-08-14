import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Coffee,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Plus,
  X,
  Calendar,
  TrendingUp,
  Award,
  Zap,
  Brain,
  Volume2,
  VolumeX,
  ChevronRight,
  Hash,
  User,
  Send
} from 'lucide-react';

const PomodoroModule = () => {
  // Estados principales
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos en segundos
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Configuración de Pomodoro
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    longBreakInterval: 4
  });

  // Estados para comentarios
  const [taskComments, setTaskComments] = useState({});
  const [newComment, setNewComment] = useState('');
  
  // Estadísticas de sesión
  const [sessionStats, setSessionStats] = useState({
    totalPomodoros: 0,
    totalFocusTime: 0,
    tasksCompleted: 0,
    startTime: new Date()
  });

  // Referencias
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Cargar tareas desde el servidor
  useEffect(() => {
    loadTasks();
    loadComments();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  // Cargar tareas
  const loadTasks = async () => {
    try {
      // Cargar todas las tareas y filtrar las no completadas localmente
      const response = await fetch('http://localhost:3003/api/tasks');
      const data = await response.json();
      if (data.success) {
        // Incluir todas las tareas activas: pending, in_progress, review, etc.
        const activeTasks = data.tasks.filter(task => {
          // Incluir todos los estados excepto completadas, canceladas y archivadas
          const excludedStatuses = ['completed', 'cancelled', 'archived'];
          return !excludedStatuses.includes(task.status);
        });
        setTasks(activeTasks);
        console.log(`Cargadas ${activeTasks.length} tareas activas para Pomodoro`);
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };

  // Cargar comentarios
  const loadComments = () => {
    const saved = localStorage.getItem('jarvi-task-comments');
    if (saved) {
      setTaskComments(JSON.parse(saved));
    }
  };

  // Guardar comentarios
  const saveComments = (comments) => {
    localStorage.setItem('jarvi-task-comments', JSON.stringify(comments));
    setTaskComments(comments);
  };

  // Manejar finalización del timer
  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (soundEnabled) {
      playSound();
    }

    if (!isBreak) {
      // Completó un pomodoro
      setPomodoroCount(count => count + 1);
      setSessionStats(prev => ({
        ...prev,
        totalPomodoros: prev.totalPomodoros + 1,
        totalFocusTime: prev.totalFocusTime + settings.workDuration
      }));

      // Registrar pomodoro en la tarea
      if (selectedTask) {
        updateTaskPomodoros(selectedTask.id);
      }

      // Decidir qué tipo de descanso
      const shouldTakeLongBreak = (pomodoroCount + 1) % settings.longBreakInterval === 0;
      const breakDuration = shouldTakeLongBreak ? settings.longBreak : settings.shortBreak;
      
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      
      if (settings.autoStartBreaks) {
        setIsActive(true);
      }
    } else {
      // Completó un descanso
      setIsBreak(false);
      setTimeLeft(settings.workDuration * 60);
      
      if (settings.autoStartPomodoros) {
        setIsActive(true);
      }
    }
  };

  // Actualizar pomodoros de una tarea
  const updateTaskPomodoros = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:3003/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pomodorosCompleted: (selectedTask.pomodorosCompleted || 0) + 1
        })
      });
    } catch (error) {
      console.error('Error actualizando pomodoros:', error);
    }
  };

  // Reproducir sonido
  const playSound = () => {
    const audio = new Audio('/sounds/bell.mp3');
    audio.play().catch(e => console.log('Error playing sound:', e));
  };

  // Formatear tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular progreso
  const calculateProgress = () => {
    const totalTime = isBreak 
      ? (pomodoroCount % settings.longBreakInterval === 0 ? settings.longBreak : settings.shortBreak) * 60
      : settings.workDuration * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Iniciar/Pausar timer
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // Reiniciar timer
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(settings.workDuration * 60);
  };

  // Seleccionar tarea
  const selectTask = (task) => {
    setSelectedTask(task);
    resetTimer();
  };

  // Añadir comentario
  const addComment = () => {
    if (!selectedTask || !newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date().toISOString(),
      taskId: selectedTask.id
    };

    const updatedComments = {
      ...taskComments,
      [selectedTask.id]: [...(taskComments[selectedTask.id] || []), comment]
    };

    saveComments(updatedComments);
    setNewComment('');
  };

  // Obtener color según estado
  const getStatusColor = () => {
    if (!isActive) return 'from-gray-500 to-gray-600';
    if (isBreak) return 'from-green-500 to-emerald-600';
    return 'from-red-500 to-orange-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Pomodoro Timer</h1>
                <p className="text-sm text-gray-500">
                  Sesión {pomodoroCount} • {isBreak ? 'Descanso' : 'Enfoque'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-gray-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel Principal - Timer */}
          <div className="lg:col-span-2 space-y-4">
            {/* Timer Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center">
                {/* Círculo de progreso */}
                <div className="relative w-64 h-64 mb-6">
                  <svg className="transform -rotate-90 w-64 h-64">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 120}`}
                      strokeDashoffset={`${2 * Math.PI * 120 * (1 - calculateProgress() / 100)}`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient">
                        <stop offset="0%" stopColor={isBreak ? '#10b981' : '#ef4444'} />
                        <stop offset="100%" stopColor={isBreak ? '#059669' : '#f97316'} />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold text-gray-800">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {isBreak ? 'Tiempo de descanso' : 'Tiempo de enfoque'}
                    </div>
                  </div>
                </div>

                {/* Tarea seleccionada */}
                {selectedTask ? (
                  <div className="w-full mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-800">
                          {selectedTask.title}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-white rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {taskComments[selectedTask.id]?.length || 0}
                      </button>
                    </div>
                    {selectedTask.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {selectedTask.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                    <div className="text-center">
                      <Target className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Selecciona una tarea para comenzar</p>
                    </div>
                  </div>
                )}

                {/* Controles */}
                <div className="flex gap-3">
                  <button
                    onClick={toggleTimer}
                    className={`px-6 py-3 bg-gradient-to-r ${getStatusColor()} text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2`}
                  >
                    {isActive ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Iniciar
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetTimer}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Comentarios de seguimiento */}
            <AnimatePresence>
              {showComments && selectedTask && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Seguimiento de {selectedTask.title}
                  </h3>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                    {taskComments[selectedTask.id]?.map(comment => (
                      <div key={comment.id} className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{comment.text}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(comment.timestamp).toLocaleString('es-ES')}
                        </p>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No hay comentarios aún
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addComment()}
                      placeholder="Añadir comentario de seguimiento..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addComment}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Estadísticas de sesión */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Estadísticas de Hoy</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {sessionStats.totalPomodoros}
                  </div>
                  <div className="text-xs text-gray-500">Pomodoros</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {Math.floor(sessionStats.totalFocusTime / 60)}h
                  </div>
                  <div className="text-xs text-gray-500">Enfoque Total</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {sessionStats.tasksCompleted}
                  </div>
                  <div className="text-xs text-gray-500">Completadas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Lateral - Lista de Tareas */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Seleccionar Tarea</h3>
                <span className="text-xs text-gray-500">{tasks.length} pendientes</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay tareas pendientes</p>
                  </div>
                ) : (
                  tasks.map(task => {
                    const isSelected = selectedTask?.id === task.id;
                    const priorityColors = {
                      urgent: 'border-l-4 border-l-red-500',
                      high: 'border-l-4 border-l-orange-500',
                      medium: 'border-l-4 border-l-yellow-500',
                      low: 'border-l-4 border-l-green-500'
                    };
                    
                    return (
                      <button
                        key={task.id}
                        onClick={() => selectTask(task)}
                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${priorityColors[task.priority] || ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              )}
                              <p className="text-sm font-medium text-gray-800">
                                {task.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {task.estimatedTime && (
                                <p className="text-xs text-gray-500">
                                  ⏱ {Math.ceil(task.estimatedTime / 25)} pomodoros
                                </p>
                              )}
                              {task.category && (
                                <span className="text-xs text-blue-600">
                                  {task.category}
                                </span>
                              )}
                            </div>
                          </div>
                          {task.pomodorosCompleted > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                              <Timer className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">
                                {task.pomodorosCompleted}
                              </span>
                            </div>
                          )}
                        </div>
                        {taskComments[task.id]?.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                            <MessageSquare className="w-3 h-3" />
                            {taskComments[task.id].length} comentarios
                          </div>
                        )}
                      </button>
                    );
                  })
                )}}
              </div>
            </div>

            {/* Tips de productividad */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900">
                    Tip de Productividad
                  </h4>
                  <p className="text-xs text-indigo-700 mt-1">
                    Después de 4 pomodoros, toma un descanso largo de 15-30 minutos 
                    para recargar energías completamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Configuración */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Configuración Pomodoro</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Duración del Pomodoro (minutos)
                    </label>
                    <input
                      type="number"
                      value={settings.workDuration}
                      onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value)})}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Descanso Corto (minutos)
                    </label>
                    <input
                      type="number"
                      value={settings.shortBreak}
                      onChange={(e) => setSettings({...settings, shortBreak: parseInt(e.target.value)})}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Descanso Largo (minutos)
                    </label>
                    <input
                      type="number"
                      value={settings.longBreak}
                      onChange={(e) => setSettings({...settings, longBreak: parseInt(e.target.value)})}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Intervalo de Descanso Largo
                    </label>
                    <input
                      type="number"
                      value={settings.longBreakInterval}
                      onChange={(e) => setSettings({...settings, longBreakInterval: parseInt(e.target.value)})}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.autoStartBreaks}
                        onChange={(e) => setSettings({...settings, autoStartBreaks: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Auto-iniciar descansos</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.autoStartPomodoros}
                        onChange={(e) => setSettings({...settings, autoStartPomodoros: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Auto-iniciar pomodoros</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => {
                      setSettings({
                        workDuration: 25,
                        shortBreak: 5,
                        longBreak: 15,
                        autoStartBreaks: true,
                        autoStartPomodoros: false,
                        longBreakInterval: 4
                      });
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Restaurar
                  </button>
                  <button
                    onClick={() => {
                      resetTimer();
                      setShowSettings(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PomodoroModule;