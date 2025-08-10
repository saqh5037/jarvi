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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">To-Do</h2>
              <p className="text-sm text-gray-500">Organiza y completa tus tareas</p>
            </div>
          </div>
          
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{todos.length}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {todos.filter(t => t.completed).length}
            </div>
            <div className="text-sm text-green-700">Completadas</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {todos.filter(t => !t.completed).length}
            </div>
            <div className="text-sm text-orange-700">Pendientes</div>
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