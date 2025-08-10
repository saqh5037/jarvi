import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  CheckSquare, 
  Plus, 
  Square,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  Filter,
  Calendar,
  Flag,
  User,
  Tag,
  MoreHorizontal,
  Archive,
  Star,
  Play,
  Pause,
  Volume2,
  Mic
} from 'lucide-react';

const TodoModule = () => {
  const [todos, setTodos] = useState([]);
  const [socket, setSocket] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'personal',
    project: '',
    dueDate: '',
    tags: []
  });

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

  // Cargar tareas desde el servidor
  const loadTasks = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/tasks');
      const data = await response.json();
      if (data.success) {
        // Convertir las tareas al formato del TodoModule
        const formattedTasks = data.tasks.map(task => ({
          id: task.id,
          title: task.title || 'Sin título',
          description: task.description || '',
          completed: task.status === 'completed',
          priority: task.priority || 'medium',
          category: task.category || 'personal',
          project: task.project || '',
          dueDate: task.dueDate || '',
          tags: task.tags || [],
          starred: task.starred || false,
          createdAt: task.createdAt,
          createdBy: task.createdBy,
          audioFile: task.audioFile,
          audioDuration: task.audioDuration,
          location: task.location
        }));
        setTodos(formattedTasks);
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };

  // Conectar con WebSocket del servidor de tareas
  useEffect(() => {
    // Cargar tareas existentes
    loadTasks();
    
    const newSocket = io('http://localhost:3003');
    setSocket(newSocket);

    // Escuchar nuevas tareas
    newSocket.on('task-created', (data) => {
      console.log('Nueva tarea creada:', data);
      loadTasks(); // Recargar todas las tareas
    });

    newSocket.on('task-updated', (task) => {
      setTodos(prev => prev.map(t => t.id === task.id ? {
        ...t,
        ...task,
        completed: task.status === 'completed'
      } : t));
    });

    newSocket.on('task-completed', (data) => {
      loadTasks();
    });

    newSocket.on('task-deleted', (data) => {
      setTodos(prev => prev.filter(t => t.id !== data.id));
    });

    // Socket anterior para compatibilidad
    newSocket.on('new-todo', (todo) => {
      console.log('Nueva tarea recibida:', todo);
      setTodos(prev => {
        // Evitar duplicados
        const exists = prev.find(t => t.id === todo.id);
        if (exists) return prev;
        
        // Formatear la tarea
        const formattedTodo = {
          id: todo.id || Date.now(),
          title: todo.title || 'Tarea sin título',
          description: todo.description || '',
          completed: todo.status === 'completed' || false,
          priority: todo.priority || 'medium',
          category: todo.category || 'personal',
          project: todo.project || '',
          dueDate: todo.dueDate || '',
          tags: todo.tags || [],
          starred: todo.starred || false,
          type: todo.type || 'text',
          sender: todo.sender,
          timestamp: todo.timestamp
        };
        
        return [formattedTodo, ...prev];
      });
    });

    // Escuchar actualizaciones
    newSocket.on('todo-updated', (update) => {
      setTodos(prev => prev.map(t => 
        t.id === update.id ? { ...t, ...update } : t
      ));
    });

    // Escuchar eliminación
    newSocket.on('todo-deleted', ({ id }) => {
      setTodos(prev => prev.filter(t => t.id !== id));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const addTodo = () => {
    if (newTodo.title) {
      const todo = {
        ...newTodo,
        id: Date.now(),
        completed: false,
        starred: false,
        tags: newTodo.tags || []
      };
      setTodos([...todos, todo]);
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        category: 'personal',
        project: '',
        dueDate: '',
        tags: []
      });
      setShowAddForm(false);
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const toggleComplete = (id) => {
    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const toggleStar = (id) => {
    setTodos(todos.map(t => 
      t.id === id ? { ...t, starred: !t.starred } : t
    ));
  };

  const updateTodo = (updatedTodo) => {
    setTodos(todos.map(t => 
      t.id === updatedTodo.id ? updatedTodo : t
    ));
    setEditingTodo(null);
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (todo.project && todo.project.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || todo.category === filterCategory;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && todo.completed) ||
                         (filterStatus === 'pending' && !todo.completed) ||
                         (filterStatus === 'starred' && todo.starred);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Vencido ${Math.abs(diffDays)} días`, color: 'red' };
    if (diffDays === 0) return { text: 'Vence hoy', color: 'orange' };
    if (diffDays === 1) return { text: 'Vence mañana', color: 'yellow' };
    if (diffDays <= 7) return { text: `${diffDays} días`, color: 'blue' };
    return { text: date.toLocaleDateString('es-ES'), color: 'gray' };
  };

  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.filter(t => !t.completed).length;
  const todayCount = todos.filter(t => {
    if (!t.dueDate) return false;
    const today = new Date().toDateString();
    const todoDate = new Date(t.dueDate).toDateString();
    return today === todoDate && !t.completed;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">To-Do</h2>
              <p className="text-sm text-gray-500">Organiza y completa tus tareas</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{todos.length}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-green-700">Completadas</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <div className="text-sm text-orange-700">Pendientes</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{todayCount}</div>
            <div className="text-sm text-purple-700">Para hoy</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(categories).map(([key, category]) => (
              <option key={key} value={key}>{category.icon} {category.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
            <option value="starred">Favoritas</option>
          </select>
        </div>
      </div>

      {/* Formulario de nueva tarea */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Tarea</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={newTodo.title}
                onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                placeholder="¿Qué necesitas hacer?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={newTodo.description}
                onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                placeholder="Detalles adicionales (opcional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={newTodo.category}
                onChange={(e) => setNewTodo({...newTodo, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(categories).map(([key, category]) => (
                  <option key={key} value={key}>{category.icon} {category.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({...newTodo, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(priorities).map(([key, priority]) => (
                  <option key={key} value={key}>{priority.icon} {priority.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
              <input
                type="text"
                value={newTodo.project}
                onChange={(e) => setNewTodo({...newTodo, project: e.target.value})}
                placeholder="Nombre del proyecto (opcional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({...newTodo, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={addTodo}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Crear Tarea
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* Lista de tareas */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTodos.map((todo) => {
            const dueDateInfo = formatDueDate(todo.dueDate);
            
            return (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md ${
                  todo.completed 
                    ? 'border-green-500 opacity-75' 
                    : `border-${priorities[todo.priority].color}-500`
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${
                            todo.completed 
                              ? 'text-gray-500 line-through' 
                              : 'text-gray-900'
                          }`}>
                            {todo.title}
                          </h3>
                          
                          {todo.starred && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        {todo.description && (
                          <p className={`text-sm mb-2 ${
                            todo.completed ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {todo.description}
                          </p>
                        )}
                        
                        {/* Audio player si hay archivo de audio */}
                        {todo.audioFile && (
                          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg mb-2">
                            <button
                              onClick={() => {
                                if (playingAudio === todo.audioFile) {
                                  audioRef.current?.pause();
                                  setPlayingAudio(null);
                                } else {
                                  if (audioRef.current) {
                                    audioRef.current.src = `http://localhost:3003/audio/${todo.audioFile}`;
                                    audioRef.current.play();
                                    setPlayingAudio(todo.audioFile);
                                  }
                                }
                              }}
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
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            todo.category === 'work' ? 'bg-blue-100 text-blue-700' :
                            todo.category === 'personal' ? 'bg-green-100 text-green-700' :
                            todo.category === 'health' ? 'bg-red-100 text-red-700' :
                            todo.category === 'finance' ? 'bg-yellow-100 text-yellow-700' :
                            todo.category === 'learning' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {categories[todo.category].icon} {categories[todo.category].label}
                          </span>
                          
                          <span className={`px-2 py-1 rounded-full ${
                            todo.priority === 'high' ? 'bg-red-100 text-red-700' :
                            todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {priorities[todo.priority].icon} {priorities[todo.priority].label}
                          </span>
                          
                          {todo.project && (
                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              📁 {todo.project}
                            </span>
                          )}
                          
                          {dueDateInfo && (
                            <span className={`px-2 py-1 rounded-full ${
                              dueDateInfo.color === 'red' ? 'bg-red-100 text-red-700' :
                              dueDateInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              📅 {dueDateInfo.text}
                            </span>
                          )}
                        </div>
                        
                        {/* Tags */}
                        {todo.tags && todo.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {todo.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleStar(todo.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            todo.starred 
                              ? 'text-yellow-500 hover:bg-yellow-50' 
                              : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => setEditingTodo(todo)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
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
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredTodos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                ? 'No hay tareas que coincidan con los filtros'
                : 'No tienes tareas aún. ¡Crea tu primera tarea!'}
            </p>
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

export default TodoModule;