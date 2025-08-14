import React, { useState, useEffect, useContext, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Maximize2,
  X,
  Coffee,
  Target,
  ChevronUp,
  ChevronDown,
  Hourglass
} from 'lucide-react';

// Context para compartir el estado del Pomodoro globalmente
export const PomodoroContext = createContext();

export const PomodoroProvider = ({ children }) => {
  const [pomodoroState, setPomodoroState] = useState({
    isActive: false,
    timeLeft: 25 * 60,
    isBreak: false,
    selectedTasks: [],
    currentTaskIndex: 0,
    pomodoroCount: 0,
    settings: {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      autoStartBreaks: true,
      autoStartPomodoros: false,
      longBreakInterval: 4
    }
  });

  const [isMinimized, setIsMinimized] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({ x: 20, y: 20 });

  useEffect(() => {
    let interval;
    if (pomodoroState.isActive && pomodoroState.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (pomodoroState.timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [pomodoroState.isActive, pomodoroState.timeLeft]);

  const handleTimerComplete = () => {
    const audio = new Audio('/sounds/bell.mp3');
    audio.play().catch(e => console.log('Error playing sound:', e));

    if (!pomodoroState.isBreak) {
      // Completó un pomodoro
      const newCount = pomodoroState.pomodoroCount + 1;
      const shouldTakeLongBreak = newCount % pomodoroState.settings.longBreakInterval === 0;
      const breakDuration = shouldTakeLongBreak 
        ? pomodoroState.settings.longBreak 
        : pomodoroState.settings.shortBreak;
      
      setPomodoroState(prev => ({
        ...prev,
        isActive: prev.settings.autoStartBreaks,
        isBreak: true,
        timeLeft: breakDuration * 60,
        pomodoroCount: newCount
      }));

      // Avanzar a la siguiente tarea si hay múltiples
      if (pomodoroState.selectedTasks.length > 1) {
        setPomodoroState(prev => ({
          ...prev,
          currentTaskIndex: (prev.currentTaskIndex + 1) % prev.selectedTasks.length
        }));
      }
    } else {
      // Completó un descanso
      setPomodoroState(prev => ({
        ...prev,
        isActive: prev.settings.autoStartPomodoros,
        isBreak: false,
        timeLeft: prev.settings.workDuration * 60
      }));
    }
  };

  const toggleTimer = () => {
    setPomodoroState(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  const resetTimer = () => {
    setPomodoroState(prev => ({
      ...prev,
      isActive: false,
      isBreak: false,
      timeLeft: prev.settings.workDuration * 60
    }));
  };

  const selectTasks = (tasks) => {
    setPomodoroState(prev => ({
      ...prev,
      selectedTasks: tasks,
      currentTaskIndex: 0
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PomodoroContext.Provider value={{
      pomodoroState,
      setPomodoroState,
      toggleTimer,
      resetTimer,
      selectTasks,
      formatTime,
      isMinimized,
      setIsMinimized
    }}>
      {children}
      <PomodoroFloatingWidget />
    </PomodoroContext.Provider>
  );
};

// Widget flotante que se muestra en todas las páginas
const PomodoroFloatingWidget = () => {
  const {
    pomodoroState,
    toggleTimer,
    resetTimer,
    formatTime,
    isMinimized,
    setIsMinimized
  } = useContext(PomodoroContext);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // No mostrar si no hay tareas seleccionadas
  if (pomodoroState.selectedTasks.length === 0) return null;

  const currentTask = pomodoroState.selectedTasks[pomodoroState.currentTaskIndex];
  const totalSeconds = pomodoroState.isBreak 
    ? pomodoroState.settings.shortBreak * 60
    : pomodoroState.settings.workDuration * 60;
  const elapsedSeconds = totalSeconds - pomodoroState.timeLeft;
  const progress = (elapsedSeconds / totalSeconds) * 100;
  
  // Determinar color de la barra según el progreso
  const getProgressColor = () => {
    if (pomodoroState.isBreak) return 'from-blue-400 to-cyan-500';
    
    if (progress < 50) {
      return 'from-green-400 to-emerald-500';
    } else if (progress < 80) {
      return 'from-yellow-400 to-orange-500';
    } else {
      return 'from-red-400 to-red-600';
    }
  };
  
  // Determinar si mostrar animación de urgencia
  const isUrgent = !pomodoroState.isBreak && progress > 90;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: isUrgent && pomodoroState.isActive ? [1, 1.02, 1] : 1 
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={isUrgent && pomodoroState.isActive ? {
        scale: {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : {}}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999
      }}
      className={`${isMinimized ? 'w-48' : 'w-96'} bg-white rounded-xl shadow-2xl border-2 ${
        isUrgent ? 'border-red-500' : 'border-gray-200'
      } overflow-hidden transition-all duration-500`}
    >
      {/* Header draggable */}
      <div
        onMouseDown={handleMouseDown}
        className={`p-3 cursor-move flex items-center justify-between bg-gradient-to-r ${
          pomodoroState.isBreak 
            ? 'from-blue-500 to-cyan-500' 
            : isUrgent 
              ? 'from-red-600 to-red-700 animate-pulse' 
              : 'from-red-500 to-orange-500'
        } transition-all duration-500`}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={pomodoroState.isActive ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            {pomodoroState.isBreak ? (
              <Coffee className="w-4 h-4 text-white" />
            ) : (
              <Hourglass className="w-4 h-4 text-white" />
            )}
          </motion.div>
          <span className="text-white text-sm font-medium">
            {pomodoroState.isBreak ? 'Descanso' : 'Enfoque'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-3 h-3 text-white" />
            ) : (
              <Minimize2 className="w-3 h-3 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3">
        {/* Timer compacto */}
        <div className="flex items-center justify-between mb-2">
          <div className={`text-2xl font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-gray-800'} transition-all`}>
            {formatTime(pomodoroState.timeLeft)}
          </div>
          <div className="flex gap-1">
            <button
              onClick={toggleTimer}
              className={`p-2 rounded-lg transition-colors ${
                pomodoroState.isActive 
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              {pomodoroState.isActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={resetTimer}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de progreso animada con colores dinámicos */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
          <motion.div
            className={`h-full bg-gradient-to-r ${getProgressColor()} relative overflow-hidden`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {/* Efecto de brillo animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 1
              }}
            />
          </motion.div>
          
          {/* Indicadores de cuartos */}
          <div className="absolute inset-0 flex justify-between px-1">
            <div className="w-0.5 h-full bg-gray-300 opacity-50" style={{ marginLeft: '25%' }} />
            <div className="w-0.5 h-full bg-gray-300 opacity-50" style={{ marginLeft: '25%' }} />
            <div className="w-0.5 h-full bg-gray-300 opacity-50" style={{ marginLeft: '25%' }} />
          </div>
        </div>
        
        {/* Indicador de porcentaje */}
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{Math.round(progress)}%</span>
          <span className={`${isUrgent ? 'text-red-500 font-semibold animate-pulse' : ''}`}>
            {pomodoroState.timeLeft < 60 && !pomodoroState.isBreak && '¡Último minuto!'}
          </span>
        </div>

        {/* Tareas seleccionadas (solo cuando está expandido) */}
        {!isMinimized && pomodoroState.selectedTasks.length > 0 && (
          <div className="space-y-1">
            {/* Tarea actual destacada */}
            <motion.div 
              key={currentTask?.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-2 border border-indigo-200"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: pomodoroState.isActive ? 360 : 0 }}
                  transition={{ duration: 2, repeat: pomodoroState.isActive ? Infinity : 0, ease: "linear" }}
                >
                  <Target className="w-3 h-3 text-indigo-600" />
                </motion.div>
                <span className="text-xs font-semibold text-gray-800">
                  Enfoque actual:
                </span>
              </div>
              <div className="text-xs font-medium text-gray-700 mt-1 truncate">
                {currentTask?.title || 'Sin tarea seleccionada'}
              </div>
              {currentTask?.priority && (
                <div className={`text-xs mt-1 inline-flex items-center px-2 py-0.5 rounded-full ${
                  currentTask.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  currentTask.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  currentTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {currentTask.priority === 'urgent' ? '🔥 Urgente' :
                   currentTask.priority === 'high' ? '⚠️ Alta' :
                   currentTask.priority === 'medium' ? '⚡ Media' :
                   '⭕ Baja'}
                </div>
              )}
            </motion.div>
            
            {/* Lista de todas las tareas seleccionadas */}
            {pomodoroState.selectedTasks.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="bg-gray-50 rounded-lg p-2 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    Cola de tareas
                  </span>
                  <span className="text-xs text-gray-500">
                    {pomodoroState.currentTaskIndex + 1}/{pomodoroState.selectedTasks.length}
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  {pomodoroState.selectedTasks.map((task, index) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-2 p-1 rounded transition-all ${
                        index === pomodoroState.currentTaskIndex
                          ? 'bg-indigo-100 border-l-2 border-indigo-500'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        index === pomodoroState.currentTaskIndex
                          ? 'bg-indigo-500 text-white'
                          : index < pomodoroState.currentTaskIndex
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index === pomodoroState.currentTaskIndex ? '▶' : 
                         index < pomodoroState.currentTaskIndex ? '✓' : 
                         index + 1}
                      </span>
                      <span className={`text-xs truncate flex-1 ${
                        index === pomodoroState.currentTaskIndex
                          ? 'text-indigo-700 font-medium'
                          : index < pomodoroState.currentTaskIndex
                            ? 'text-gray-400 line-through'
                            : 'text-gray-600'
                      }`}>
                        {task.title}
                      </span>
                      {task.estimatedTime && (
                        <span className="text-xs text-gray-400">
                          {Math.ceil(task.estimatedTime / 25)}p
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Progreso total de tareas */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Progreso total</span>
                    <span className="text-indigo-600 font-medium">
                      {Math.round((pomodoroState.currentTaskIndex / pomodoroState.selectedTasks.length) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(pomodoroState.currentTaskIndex / pomodoroState.selectedTasks.length) * 100}%` 
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Contador de pomodoros */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < (pomodoroState.pomodoroCount % 4)
                    ? 'bg-red-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {pomodoroState.pomodoroCount} sesiones
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PomodoroFloatingWidget;