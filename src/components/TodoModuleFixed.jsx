import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Square,
  Trash2,
  Play,
  Pause,
  Volume2,
  Mic
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const TodoModuleFixed = () => {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);

  // Cargar tareas desde el servidor
  const loadTasks = async () => {
    try {
      console.log('Cargando tareas desde servidor...');
      const response = await fetch(`${API_ENDPOINTS.TASKS}/api/tasks`);
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      if (data.success) {
        // Convertir las tareas al formato del TodoModule
        const formattedTasks = data.tasks.map(task => ({
          id: task.id,
          title: task.title || 'Sin título',
          description: task.description || '',
          completed: task.status === 'completed',
          priority: task.priority || 'medium',
          category: task.category || 'personal',
          audioFile: task.audioFile,
          audioDuration: task.audioDuration,
          createdBy: task.createdBy
        }));
        setTodos(formattedTasks);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setIsLoading(false);
      // Datos de ejemplo si falla la conexión
      setTodos([
        {
          id: 1,
          title: 'Tarea de ejemplo',
          description: 'Esta es una tarea de ejemplo mientras se conecta al servidor',
          completed: false,
          priority: 'medium',
          category: 'personal'
        }
      ]);
    }
  };

  useEffect(() => {
    console.log('TodoModuleFixed montado');
    loadTasks();
  }, []);

  const toggleComplete = (id) => {
    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const playAudio = (audioFile) => {
    if (audioRef.current) {
      if (playingAudio === audioFile) {
        audioRef.current.pause();
        setPlayingAudio(null);
      } else {
        audioRef.current.src = `${API_ENDPOINTS.TASKS}/audio/${audioFile}`;
        audioRef.current.play();
        setPlayingAudio(audioFile);
      }
    }
  };

  const priorities = {
    high: { color: 'red', label: 'Alta', icon: '🔴' },
    medium: { color: 'yellow', label: 'Media', icon: '🟡' },
    low: { color: 'green', label: 'Baja', icon: '🟢' }
  };

  const categories = {
    work: { color: 'indigo', label: 'Trabajo', icon: '💼' },
    personal: { color: 'pink', label: 'Personal', icon: '👤' },
    health: { color: 'green', label: 'Salud', icon: '🏥' },
    finance: { color: 'blue', label: 'Finanzas', icon: '💰' },
    learning: { color: 'purple', label: 'Aprendizaje', icon: '📚' }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando tareas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Horizontal Compacto */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          {/* Sección Izquierda: Ícono + Título */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">To-Do</h2>
              <p className="text-xs text-green-100">Organiza y completa tus tareas</p>
            </div>
          </div>
          
          {/* Sección Central: Estadísticas */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-green-200" />
              <span className="text-sm font-medium">{todos.length} total</span>
            </div>
            <div className="h-4 w-px bg-green-400/30"></div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-green-200" />
              <span className="text-sm font-medium">{todos.filter(t => t.completed).length} completadas</span>
            </div>
            <div className="h-4 w-px bg-green-400/30"></div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-green-200" />
              <span className="text-sm font-medium">{todos.filter(t => !t.completed).length} pendientes</span>
            </div>
            {todos.filter(t => t.audioFile).length > 0 && (
              <>
                <div className="h-4 w-px bg-green-400/30"></div>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-green-200" />
                  <span className="text-sm font-medium">{todos.filter(t => t.audioFile).length} con audio</span>
                </div>
              </>
            )}
          </div>
          
          {/* Sección Derecha: Acciones */}
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4" />
              Nueva
            </button>
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="space-y-3">
        {todos.length > 0 ? (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md ${
                todo.completed 
                  ? 'border-green-500 opacity-75' 
                  : 'border-blue-500'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleComplete(todo.id)}
                  className={`mt-1 p-1 rounded-full transition-colors ${
                    todo.completed 
                      ? 'text-green-600' 
                      : 'text-gray-400 hover:text-green-600'
                  }`}
                >
                  {todo.completed ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                
                {/* Contenido principal */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        todo.completed 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className={`text-sm mt-1 ${
                          todo.completed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      
                      {/* Audio player si hay archivo de audio */}
                      {todo.audioFile && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg mt-2">
                          <button
                            onClick={() => playAudio(todo.audioFile)}
                            className="p-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors"
                          >
                            {playingAudio === todo.audioFile ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </button>
                          <div className="flex items-center gap-1 text-xs text-purple-700">
                            <Volume2 className="w-3 h-3" />
                            <span>Nota de voz</span>
                            {todo.audioDuration && (
                              <span className="text-purple-500">
                                ({Math.floor(todo.audioDuration / 60)}:{(todo.audioDuration % 60).toString().padStart(2, '0')})
                              </span>
                            )}
                          </div>
                          {todo.createdBy === 'telegram-voice' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              <Mic className="w-3 h-3 inline mr-1" />
                              Telegram
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Meta información */}
                      <div className="flex items-center gap-4 text-xs mt-2">
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {categories[todo.category]?.icon} {categories[todo.category]?.label || todo.category}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {priorities[todo.priority]?.icon} {priorities[todo.priority]?.label || todo.priority}
                        </span>
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tienes tareas aún. ¡Crea tu primera tarea!</p>
          </div>
        )}
      </div>
      
      {/* Elemento de audio oculto */}
      <audio 
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />
    </div>
  );
};

export default TodoModuleFixed;