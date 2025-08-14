import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PomodoroContext } from './PomodoroWidget';
import {
  Timer,
  Play,
  Settings,
  Coffee,
  Target,
  CheckCircle2,
  MessageSquare,
  Plus,
  X,
  Zap,
  Brain,
  Volume2,
  VolumeX,
  CheckSquare,
  Square,
  Send,
  User,
  Clock,
  Calendar
} from 'lucide-react';

const PomodoroModuleV2 = () => {
  // Context del Pomodoro global
  const pomodoroContext = useContext(PomodoroContext);
  
  // Estados principales
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [taskComments, setTaskComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [activeTaskForComments, setActiveTaskForComments] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    totalPomodoros: 0,
    totalFocusTime: 0,
    tasksCompleted: 0,
    startTime: new Date()
  });

  // Cargar tareas y comentarios
  useEffect(() => {
    loadTasks();
    loadComments();
  }, []);

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

  const loadComments = () => {
    const saved = localStorage.getItem('jarvi-task-comments');
    if (saved) {
      setTaskComments(JSON.parse(saved));
    }
  };

  const saveComments = (comments) => {
    localStorage.setItem('jarvi-task-comments', JSON.stringify(comments));
    setTaskComments(comments);
  };

  // Seleccionar/deseleccionar tarea
  const toggleTaskSelection = (task) => {
    setSelectedTasks(prev => {
      const isSelected = prev.find(t => t.id === task.id);
      if (isSelected) {
        return prev.filter(t => t.id !== task.id);
      } else {
        return [...prev, task];
      }
    });
  };

  // Seleccionar todas las tareas
  const selectAllTasks = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks);
    }
  };

  // Iniciar sesión con tareas seleccionadas
  const startPomodoroSession = () => {
    if (selectedTasks.length > 0 && pomodoroContext) {
      pomodoroContext.selectTasks(selectedTasks);
      pomodoroContext.resetTimer();
    }
  };

  // Añadir comentario
  const addComment = () => {
    if (!activeTaskForComments || !newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date().toISOString(),
      taskId: activeTaskForComments.id
    };

    const updatedComments = {
      ...taskComments,
      [activeTaskForComments.id]: [...(taskComments[activeTaskForComments.id] || []), comment]
    };

    saveComments(updatedComments);
    setNewComment('');
  };

  // Calcular tiempo total estimado
  const calculateTotalTime = () => {
    const totalMinutes = selectedTasks.reduce((acc, task) => {
      return acc + (task.estimatedTime || 25);
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
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
                <h1 className="text-xl font-bold text-gray-800">Centro de Productividad</h1>
                <p className="text-sm text-gray-600">
                  {selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''} seleccionada{selectedTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {selectedTasks.length > 0 && (
                <button
                  onClick={startPomodoroSession}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Sesión Pomodoro
                </button>
              )}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-gray-700" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel Principal - Selección de Tareas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Resumen de selección */}
            {selectedTasks.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-orange-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Sesión Planificada</h3>
                  <span className="text-sm text-gray-600">
                    Tiempo estimado: {calculateTotalTime()}
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedTasks.map((task, index) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{index + 1}.</span>
                      <span className="text-gray-700 flex-1">{task.title}</span>
                      <button
                        onClick={() => toggleTaskSelection(task)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de tareas disponibles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  Tareas Disponibles ({tasks.length})
                </h3>
                <button
                  onClick={selectAllTasks}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {selectedTasks.length === tasks.length ? (
                    <>
                      <Square className="w-3 h-3" />
                      Deseleccionar todas
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3 h-3" />
                      Seleccionar todas
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay tareas pendientes</p>
                  </div>
                ) : (
                  tasks.map(task => {
                    const isSelected = selectedTasks.find(t => t.id === task.id);
                    const priorityColors = {
                      urgent: 'border-l-red-500',
                      high: 'border-l-orange-500',
                      medium: 'border-l-yellow-500',
                      low: 'border-l-green-500'
                    };
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTaskSelection(task)}
                        className={`p-3 rounded-lg border-2 border-l-4 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${priorityColors[task.priority] || ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-800">
                                  {task.title}
                                </p>
                                {/* Indicador de estado */}
                                {task.status && task.status !== 'pending' && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                    task.status === 'review' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {task.status === 'in_progress' ? 'En progreso' :
                                     task.status === 'review' ? 'En revisión' :
                                     task.status}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                {task.estimatedTime && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {task.estimatedTime} min
                                  </span>
                                )}
                                {task.dueDate && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.dueDate).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short'
                                    })}
                                  </span>
                                )}
                                {task.category && (
                                  <span className="text-xs text-blue-600">
                                    {task.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {task.pomodorosCompleted > 0 && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                                <Timer className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">
                                  {task.pomodorosCompleted}
                                </span>
                              </div>
                            )}
                            {taskComments[task.id]?.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTaskForComments(task);
                                }}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                              >
                                <MessageSquare className="w-3 h-3" />
                                {taskComments[task.id].length}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Estadísticas de sesión */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Estadísticas de Hoy</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {pomodoroContext?.pomodoroState?.pomodoroCount || 0}
                  </div>
                  <div className="text-xs text-gray-600">Pomodoros</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {Math.floor((pomodoroContext?.pomodoroState?.pomodoroCount || 0) * 25 / 60)}h
                  </div>
                  <div className="text-xs text-gray-600">Enfoque Total</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {sessionStats.tasksCompleted}
                  </div>
                  <div className="text-xs text-gray-600">Completadas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Lateral - Comentarios y Tips */}
          <div className="space-y-4">
            {/* Sistema de comentarios */}
            {activeTaskForComments && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Comentarios: {activeTaskForComments.title}
                  </h3>
                  <button
                    onClick={() => setActiveTaskForComments(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                  {taskComments[activeTaskForComments.id]?.map(comment => (
                    <div key={comment.id} className="p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
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
                    placeholder="Añadir comentario..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addComment}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tips de productividad */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900">
                    Tip: Multitarea Eficiente
                  </h4>
                  <p className="text-xs text-indigo-700 mt-1">
                    Selecciona múltiples tareas relacionadas para mantener el contexto. 
                    El sistema rotará automáticamente entre ellas cada pomodoro.
                  </p>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Cómo usar</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Selecciona una o más tareas haciendo clic en ellas</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Haz clic en "Iniciar Sesión Pomodoro"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>El widget flotante aparecerá y podrás moverlo donde quieras</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>El timer seguirá visible mientras navegas por otros módulos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Configuración */}
        <AnimatePresence>
          {showSettings && pomodoroContext && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Configuración Pomodoro</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Duración del Pomodoro (minutos)
                    </label>
                    <input
                      type="number"
                      value={pomodoroContext.pomodoroState.settings.workDuration}
                      onChange={(e) => pomodoroContext.setPomodoroState(prev => ({
                        ...prev,
                        settings: {...prev.settings, workDuration: parseInt(e.target.value)}
                      }))}
                      className="w-full mt-1 px-3 py-2 text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Descanso Corto (minutos)
                    </label>
                    <input
                      type="number"
                      value={pomodoroContext.pomodoroState.settings.shortBreak}
                      onChange={(e) => pomodoroContext.setPomodoroState(prev => ({
                        ...prev,
                        settings: {...prev.settings, shortBreak: parseInt(e.target.value)}
                      }))}
                      className="w-full mt-1 px-3 py-2 text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Descanso Largo (minutos)
                    </label>
                    <input
                      type="number"
                      value={pomodoroContext.pomodoroState.settings.longBreak}
                      onChange={(e) => pomodoroContext.setPomodoroState(prev => ({
                        ...prev,
                        settings: {...prev.settings, longBreak: parseInt(e.target.value)}
                      }))}
                      className="w-full mt-1 px-3 py-2 text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pomodoroContext.pomodoroState.settings.autoStartBreaks}
                        onChange={(e) => pomodoroContext.setPomodoroState(prev => ({
                          ...prev,
                          settings: {...prev.settings, autoStartBreaks: e.target.checked}
                        }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-800">Auto-iniciar descansos</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pomodoroContext.pomodoroState.settings.autoStartPomodoros}
                        onChange={(e) => pomodoroContext.setPomodoroState(prev => ({
                          ...prev,
                          settings: {...prev.settings, autoStartPomodoros: e.target.checked}
                        }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-800">Auto-iniciar pomodoros</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowSettings(false)}
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

export default PomodoroModuleV2;