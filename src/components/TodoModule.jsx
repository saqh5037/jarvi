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
  Mic,
  Edit3,
  Briefcase,
  Home,
  ShoppingBag,
  Heart,
  GraduationCap,
  DollarSign,
  AlertCircle,
  Circle,
  Sparkles,
  ChevronDown,
  Grid,
  List,
  Columns,
  SortAsc,
  Clock,
  TrendingUp,
  BarChart3,
  Layers,
  FolderOpen
} from 'lucide-react';
import TaskEditModal from './TaskEditModal';

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
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterTags, setFilterTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list, grid, kanban
  const [sortBy, setSortBy] = useState('date'); // date, priority, name, status
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'personal',
    project: '',
    dueDate: '',
    tags: []
  });

  // Usar configuración global o valores por defecto
  const priorities = globalConfig?.globalPriorities?.reduce((acc, pri) => {
    acc[pri.id] = {
      color: pri.color,
      label: pri.name,
      icon: pri.icon === 'AlertCircle' ? AlertCircle :
            pri.icon === 'Flag' ? Flag :
            pri.icon === 'Circle' ? Circle :
            pri.icon === 'Square' ? Square : Circle,
      level: pri.level
    };
    return acc;
  }, {}) || {
    urgent: { color: 'red', label: 'Urgente', icon: AlertCircle, level: 1 },
    high: { color: 'orange', label: 'Alta', icon: Flag, level: 2 },
    medium: { color: 'yellow', label: 'Media', icon: Circle, level: 3 },
    low: { color: 'green', label: 'Baja', icon: Circle, level: 4 }
  };

  const categories = globalConfig?.globalCategories?.reduce((acc, cat) => {
    acc[cat.id] = {
      color: cat.color,
      label: cat.name,
      icon: cat.icon === 'Briefcase' ? Briefcase :
            cat.icon === 'User' ? User :
            cat.icon === 'Heart' ? Heart :
            cat.icon === 'DollarSign' ? DollarSign :
            cat.icon === 'GraduationCap' ? GraduationCap :
            cat.icon === 'ShoppingBag' ? ShoppingBag :
            cat.icon === 'Home' ? Home :
            cat.icon === 'Cpu' ? Tag :
            cat.icon === 'TrendingUp' ? Tag :
            cat.icon === 'MessageCircle' ? Tag :
            cat.icon === 'Folder' ? Tag : Tag,
      description: cat.description
    };
    return acc;
  }, {}) || {
    work: { color: 'indigo', label: 'Trabajo', icon: Briefcase },
    personal: { color: 'pink', label: 'Personal', icon: User },
    health: { color: 'green', label: 'Salud', icon: Heart },
    finance: { color: 'blue', label: 'Finanzas', icon: DollarSign },
    learning: { color: 'purple', label: 'Aprendizaje', icon: GraduationCap },
    shopping: { color: 'amber', label: 'Compras', icon: ShoppingBag },
    home: { color: 'orange', label: 'Hogar', icon: Home },
    other: { color: 'gray', label: 'Otro', icon: Tag }
  };
  
  const states = globalConfig?.globalStates || [];
  const projects = globalConfig?.globalProjects || [];
  const globalTags = globalConfig?.globalTags || [];

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
          transcription: task.transcription || task.description || '', // Agregar campo transcription
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

  // Cargar configuración global del localStorage
  useEffect(() => {
    const loadGlobalConfig = () => {
      const savedConfig = localStorage.getItem('jarvi-global-config');
      if (savedConfig) {
        setGlobalConfig(JSON.parse(savedConfig));
      }
    };
    loadGlobalConfig();
  }, []);

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
          transcription: todo.transcription || todo.description || '', // Agregar campo transcription
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

  const addTodo = async () => {
    if (!newTodo.title) return;

    const todo = {
      ...newTodo,
      id: Date.now().toString(),
      completed: false,
      starred: false,
      tags: newTodo.tags || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: 'user'
    };

    try {
      // Guardar en el servidor
      const response = await fetch('http://localhost:3003/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Agregar localmente con el ID del servidor
        setTodos([...todos, data.task || todo]);
        
        // Emitir por WebSocket si está conectado
        if (socket) {
          socket.emit('task-created', data.task || todo);
        }
        
        // Limpiar formulario
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
      } else {
        console.error('Error al crear la tarea');
        alert('No se pudo crear la tarea. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error creando tarea:', error);
      alert('Error al crear la tarea. Por favor, intenta de nuevo.');
    }
  };

  // Funciones de manejo de tareas
  const toggleComplete = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const updatedTodo = { ...todo, completed: !todo.completed };
    
    try {
      // Actualizar en el servidor
      const response = await fetch(`http://localhost:3003/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedTodo,
          status: updatedTodo.completed ? 'completed' : 'pending'
        })
      });

      if (response.ok) {
        // Actualizar localmente solo si el servidor confirma
        setTodos(todos.map(t => 
          t.id === id ? updatedTodo : t
        ));
        
        // Emitir por WebSocket si está conectado
        if (socket) {
          socket.emit('task-updated', updatedTodo);
        }
      } else {
        console.error('Error al actualizar el estado de la tarea');
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };
  
  const toggleStar = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const updatedTodo = { ...todo, starred: !todo.starred };
    
    try {
      // Actualizar en el servidor
      const response = await fetch(`http://localhost:3003/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTodo)
      });

      if (response.ok) {
        // Actualizar localmente solo si el servidor confirma
        setTodos(todos.map(t => 
          t.id === id ? updatedTodo : t
        ));
        
        // Emitir por WebSocket si está conectado
        if (socket) {
          socket.emit('task-updated', updatedTodo);
        }
      } else {
        console.error('Error al actualizar favorito');
      }
    } catch (error) {
      console.error('Error actualizando favorito:', error);
    }
  };
  
  const deleteTodo = async (id) => {
    try {
      // Confirmar eliminación
      if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        return;
      }

      // Eliminar del servidor
      const response = await fetch(`http://localhost:3003/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Eliminar localmente solo si el servidor confirma
        setTodos(todos.filter(t => t.id !== id));
        
        // Emitir por WebSocket si está conectado
        if (socket) {
          socket.emit('task-deleted', { id });
        }
        
        console.log('Tarea eliminada exitosamente');
      } else {
        console.error('Error al eliminar la tarea del servidor');
        alert('No se pudo eliminar la tarea. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      alert('Error al eliminar la tarea. Por favor, intenta de nuevo.');
    }
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
    
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    
    const matchesProject = filterProject === 'all' || todo.project === filterProject;
    
    const matchesTags = filterTags.length === 0 || 
                       filterTags.some(tag => todo.tags?.includes(tag));
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority && matchesProject && matchesTags;
  }).sort((a, b) => {
    // Ordenamiento
    switch(sortBy) {
      case 'priority':
        const aPriority = priorities[a.priority]?.level || 999;
        const bPriority = priorities[b.priority]?.level || 999;
        return aPriority - bPriority;
      case 'name':
        return a.title.localeCompare(b.title);
      case 'status':
        return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
      case 'date':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
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

  // Abrir modal de edición avanzada
  const openEditModal = (todo) => {
    // Asegurar que transcription tenga el valor correcto
    const taskWithTranscription = {
      ...todo,
      transcription: todo.transcription || todo.description || ''
    };
    setSelectedTaskForEdit(taskWithTranscription);
    setShowEditModal(true);
  };
  
  // Guardar cambios del modal
  const handleSaveFromModal = async (updatedTask) => {
    try {
      // Actualizar en el servidor
      const response = await fetch(`http://localhost:3003/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
      
      if (response.ok) {
        // Actualizar localmente
        setTodos(todos.map(t => 
          t.id === updatedTask.id ? updatedTask : t
        ));
        
        // Emitir por WebSocket si está conectado
        if (socket) {
          socket.emit('task-updated', updatedTask);
        }
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
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
    <div className="space-y-4">
      {/* Header Compacto Estilo Notas de Voz */}
      <div className="bg-white rounded-2xl shadow-sm">
        {/* Header Principal */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Tareas</h2>
                <p className="text-xs text-gray-500">
                  {filteredTodos.length} de {todos.length} tareas • {pendingCount} pendientes
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Vista */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  title="Vista Lista"
                >
                  <List className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  title="Vista Grid"
                >
                  <Grid className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
                  title="Vista Kanban"
                >
                  <Columns className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              
              {/* Botón Filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                  showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filtros</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Botón Nueva Tarea */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Nueva</span>
              </button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descripción o proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Panel de Filtros Expandible */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 overflow-hidden"
            >
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-5 gap-3">
                  {/* Estado */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Estado</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendientes</option>
                      <option value="completed">Completadas</option>
                      <option value="starred">Favoritas</option>
                      {states.map(state => (
                        <option key={state.id} value={state.id}>{state.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Categoría */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Categoría</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todas</option>
                      {Object.entries(categories).map(([key, category]) => (
                        <option key={key} value={key}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Prioridad */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Prioridad</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todas</option>
                      {Object.entries(priorities).map(([key, priority]) => (
                        <option key={key} value={key}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Proyecto */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Proyecto</label>
                    <select
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.name}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Ordenar por */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Ordenar por</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="date">Fecha</option>
                      <option value="priority">Prioridad</option>
                      <option value="name">Nombre</option>
                      <option value="status">Estado</option>
                    </select>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Filtrar por Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {globalTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          if (filterTags.includes(tag.name)) {
                            setFilterTags(filterTags.filter(t => t !== tag.name));
                          } else {
                            setFilterTags([...filterTags, tag.name]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs transition-all ${
                          filterTags.includes(tag.name)
                            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Estadísticas en línea */}
                <div className="mt-4 flex items-center gap-6 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>{completedCount} completadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{todayCount} para hoy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>{todos.filter(t => t.starred).length} favoritas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{todos.filter(t => t.priority === 'urgent' || t.priority === 'critical').length} urgentes</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={newTodo.description}
                onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                placeholder="Detalles adicionales (opcional)"
                rows={3}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={newTodo.category}
                onChange={(e) => setNewTodo({...newTodo, category: e.target.value})}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(categories).map(([key, category]) => (
                  <option key={key} value={key}>{category.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({...newTodo, priority: e.target.value})}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(priorities).map(([key, priority]) => (
                  <option key={key} value={key}>{priority.label}</option>
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
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({...newTodo, dueDate: e.target.value})}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
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
                          
                          {/* Botones de acción movidos aquí para mayor visibilidad */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleStar(todo.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                todo.starred 
                                  ? 'text-yellow-500 hover:bg-yellow-50' 
                                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                              }`}
                              title="Marcar como favorito"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            
                            {/* Botón de Editar con IA - MÁS VISIBLE */}
                            <button
                              onClick={() => openEditModal(todo)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-xs font-medium"
                              title="Editar transcripción con IA ✨"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Editar IA</span>
                            </button>
                            
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
                            {categories[todo.category] ? (
                              <>
                                {React.createElement(categories[todo.category].icon, { className: "w-3 h-3 inline mr-1" })}
                                {categories[todo.category].label}
                              </>
                            ) : (
                              <>
                                <Tag className="w-3 h-3 inline mr-1" />
                                {todo.category}
                              </>
                            )}
                          </span>
                          
                          <span className={`px-2 py-1 rounded-full ${
                            todo.priority === 'high' ? 'bg-red-100 text-red-700' :
                            todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {priorities[todo.priority] ? (
                              <>
                                {React.createElement(priorities[todo.priority].icon, { className: "w-3 h-3 inline mr-1" })}
                                {priorities[todo.priority].label}
                              </>
                            ) : (
                              <>
                                <Circle className="w-3 h-3 inline mr-1" />
                                {todo.priority}
                              </>
                            )}
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
      
      {/* Modal de Edición con IA */}
      <TaskEditModal
        task={selectedTaskForEdit}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveFromModal}
        globalConfig={globalConfig}
      />
    </div>
  );
};

export default TodoModule;