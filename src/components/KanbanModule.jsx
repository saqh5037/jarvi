import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import EnhancedTextEditor from './EnhancedTextEditor';
import {
  Layout,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  MessageSquare,
  Calendar,
  User,
  Tag,
  Timer,
  TrendingUp,
  Archive,
  Edit2,
  Trash2,
  ChevronRight,
  Filter,
  Search,
  BarChart3,
  Target,
  Zap,
  Users,
  Hash,
  X,
  Send,
  Eye,
  Bookmark,
  Flag
} from 'lucide-react';

const KanbanModule = () => {
  // Estados principales
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([
    { id: 'backlog', title: 'Backlog', color: 'gray', icon: Archive },
    { id: 'todo', title: 'Por Hacer', color: 'blue', icon: Clock },
    { id: 'in_progress', title: 'En Progreso', color: 'yellow', icon: TrendingUp },
    { id: 'review', title: 'En Revisión', color: 'purple', icon: Users },
    { id: 'done', title: 'Completado', color: 'green', icon: CheckCircle2 }
  ]);
  
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [taskComments, setTaskComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [taskTags, setTaskTags] = useState({});
  const [showRichEditor, setShowRichEditor] = useState(false);
  const [editingTaskTags, setEditingTaskTags] = useState(null);
  const [newTag, setNewTag] = useState('');

  // Cargar datos
  useEffect(() => {
    loadTasks();
    loadComments();
    loadTags();
    
    // WebSocket para actualizaciones en tiempo real
    const socket = io('http://localhost:3003');
    socket.on('task-updated', loadTasks);
    socket.on('task-created', loadTasks);
    
    return () => socket.disconnect();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/tasks');
      const data = await response.json();
      if (data.success) {
        // Mapear tareas a columnas Kanban
        const mappedTasks = data.tasks.map(task => ({
          ...task,
          column: mapStatusToColumn(task.status),
          progress: calculateTaskProgress(task)
        }));
        setTasks(mappedTasks);
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

  const loadTags = () => {
    const saved = localStorage.getItem('jarvi-task-tags');
    if (saved) {
      setTaskTags(JSON.parse(saved));
    }
  };

  // Mapear estado a columna
  const mapStatusToColumn = (status) => {
    const mapping = {
      'pending': 'todo',
      'in_progress': 'in_progress',
      'review': 'review',
      'completed': 'done',
      'cancelled': 'backlog'
    };
    return mapping[status] || 'backlog';
  };

  // Calcular progreso de tarea
  const calculateTaskProgress = (task) => {
    if (task.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter(st => st.completed).length;
      return (completed / task.subtasks.length) * 100;
    }
    return task.status === 'completed' ? 100 : 0;
  };

  // Manejar drag & drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.column !== columnId) {
      // Actualizar estado de la tarea
      const newStatus = mapColumnToStatus(columnId);
      
      try {
        const response = await fetch(`http://localhost:3003/api/tasks/${draggedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
          // Actualizar localmente
          setTasks(prev => prev.map(task => 
            task.id === draggedTask.id 
              ? { ...task, column: columnId, status: newStatus }
              : task
          ));
        }
      } catch (error) {
        console.error('Error actualizando tarea:', error);
      }
    }
    
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  // Mapear columna a estado
  const mapColumnToStatus = (columnId) => {
    const mapping = {
      'backlog': 'pending',
      'todo': 'pending',
      'in_progress': 'in_progress',
      'review': 'review',
      'done': 'completed'
    };
    return mapping[columnId] || 'pending';
  };

  // Filtrar tareas
  const getFilteredTasks = (columnId) => {
    return tasks.filter(task => {
      if (task.column !== columnId) return false;
      
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }
      
      return true;
    });
  };

  // Añadir comentario
  const addComment = () => {
    if (!selectedTask || !newComment.trim()) return;

    // Limpiar HTML si es necesario
    const cleanText = showRichEditor ? newComment : newComment.trim();
    
    const comment = {
      id: Date.now().toString(),
      text: cleanText,
      timestamp: new Date().toISOString(),
      user: 'Usuario',
      isRichText: showRichEditor
    };

    const updatedComments = {
      ...taskComments,
      [selectedTask.id]: [...(taskComments[selectedTask.id] || []), comment]
    };

    localStorage.setItem('jarvi-task-comments', JSON.stringify(updatedComments));
    setTaskComments(updatedComments);
    setNewComment('');
  };

  // Añadir etiqueta
  const addTag = (taskId, tag) => {
    if (!tag.trim()) return;
    
    const updatedTags = {
      ...taskTags,
      [taskId]: [...(taskTags[taskId] || []), tag.trim()]
    };
    
    localStorage.setItem('jarvi-task-tags', JSON.stringify(updatedTags));
    setTaskTags(updatedTags);
    setNewTag('');
  };

  // Eliminar etiqueta
  const removeTag = (taskId, tagIndex) => {
    const updatedTags = {
      ...taskTags,
      [taskId]: taskTags[taskId].filter((_, index) => index !== tagIndex)
    };
    
    localStorage.setItem('jarvi-task-tags', JSON.stringify(updatedTags));
    setTaskTags(updatedTags);
  };

  // Obtener color de prioridad
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  // Obtener estadísticas
  const getColumnStats = (columnId) => {
    const columnTasks = tasks.filter(t => t.column === columnId);
    const urgentCount = columnTasks.filter(t => t.priority === 'urgent').length;
    const totalTime = columnTasks.reduce((acc, t) => acc + (t.estimatedTime || 0), 0);
    
    return {
      count: columnTasks.length,
      urgent: urgentCount,
      estimatedHours: Math.round(totalTime / 60)
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Tablero Kanban</h1>
                <p className="text-sm text-gray-500">
                  {tasks.length} tareas • {tasks.filter(t => t.column === 'in_progress').length} en progreso
                </p>
              </div>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-3">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Filtro de prioridad */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
              
              {/* Botón de estadísticas */}
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <BarChart3 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Tablero Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(column => {
            const Icon = column.icon;
            const stats = getColumnStats(column.id);
            const columnTasks = getFilteredTasks(column.id);
            
            return (
              <div
                key={column.id}
                className={`flex-shrink-0 w-80 ${
                  dragOverColumn === column.id ? 'opacity-75' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Header de columna */}
                <div className="bg-white rounded-t-xl border border-b-0 border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 text-${column.color}-500`} />
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {column.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {stats.count}
                      </span>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Plus className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Mini estadísticas */}
                  <div className="flex gap-2 text-xs text-gray-500">
                    {stats.urgent > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        {stats.urgent} urgentes
                      </span>
                    )}
                    {stats.estimatedHours > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stats.estimatedHours}h estimadas
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de tareas */}
                <div className="bg-gray-50 rounded-b-xl border border-t-0 border-gray-200 p-3 min-h-[500px] space-y-2">
                  {columnTasks.map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-move hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskDetails(true);
                      }}
                    >
                      {/* Indicador de prioridad */}
                      <div className={`h-1 ${getPriorityColor(task.priority)} rounded-full mb-2`} />
                      
                      {/* Título y descripción */}
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Etiquetas de la tarea */}
                      {taskTags[task.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {taskTags[task.id].map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-xs font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Meta información */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.category && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                              {task.category}
                            </span>
                          )}
                          {task.pomodorosCompleted > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Timer className="w-3 h-3" />
                              {task.pomodorosCompleted}
                            </span>
                          )}
                        </div>
                        
                        {/* Comentarios */}
                        {taskComments[task.id]?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MessageSquare className="w-3 h-3" />
                            {taskComments[task.id].length}
                          </span>
                        )}
                      </div>
                      
                      {/* Barra de progreso si tiene subtareas */}
                      {task.progress > 0 && task.progress < 100 && (
                        <div className="mt-2">
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Fecha de vencimiento */}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal de detalles de tarea */}
        <AnimatePresence>
          {showTaskDetails && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowTaskDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del modal */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedTask.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {selectedTask.id} • Creada: {new Date(selectedTask.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Contenido del modal */}
                <div className="space-y-4">
                  {/* Descripción */}
                  {selectedTask.description && (
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-2">Descripción</h3>
                      <p className="text-gray-700 text-sm">{selectedTask.description}</p>
                    </div>
                  )}

                  {/* Metadatos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Prioridad</span>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mt-1 ${
                        selectedTask.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        selectedTask.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {selectedTask.priority}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Estado</span>
                      <div className="text-sm font-medium text-gray-800 mt-1">
                        {columns.find(c => c.id === selectedTask.column)?.title}
                      </div>
                    </div>
                    
                    {selectedTask.estimatedTime && (
                      <div>
                        <span className="text-xs text-gray-500">Tiempo estimado</span>
                        <div className="text-sm font-medium text-gray-800 mt-1">
                          {selectedTask.estimatedTime} minutos
                        </div>
                      </div>
                    )}
                    
                    {selectedTask.pomodorosCompleted > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Pomodoros completados</span>
                        <div className="text-sm font-medium text-gray-800 mt-1">
                          {selectedTask.pomodorosCompleted}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sistema de etiquetas */}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Etiquetas y Clasificación
                    </h3>
                    
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-3">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {taskTags[selectedTask.id]?.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white text-indigo-700 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm"
                          >
                            #{tag}
                            <button
                              onClick={() => removeTag(selectedTask.id, index)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )) || (
                          <span className="text-sm text-gray-500">Sin etiquetas</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addTag(selectedTask.id, newTag);
                            }
                          }}
                          placeholder="Añadir etiqueta..."
                          className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => addTag(selectedTask.id, newTag)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Etiquetas sugeridas */}
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-indigo-200">
                        <span className="text-xs text-gray-600">Sugerencias:</span>
                        {['urgente', 'bug', 'mejora', 'documentación', 'testing', 'diseño'].map(tag => (
                          <button
                            key={tag}
                            onClick={() => addTag(selectedTask.id, tag)}
                            className="px-2 py-1 text-xs bg-white text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                          >
                            +{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sistema de comentarios mejorado */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Comentarios de Seguimiento
                      </h3>
                      <button
                        onClick={() => setShowRichEditor(!showRichEditor)}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          showRichEditor 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {showRichEditor ? '✨ Editor Enriquecido' : '📝 Texto Simple'}
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto mb-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                      {taskComments[selectedTask.id]?.map(comment => (
                        <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {comment.user}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {new Date(comment.timestamp).toLocaleString('es-ES')}
                                </span>
                              </div>
                            </div>
                          </div>
                          {comment.isRichText ? (
                            <div 
                              className="prose prose-sm max-w-none text-gray-800"
                              dangerouslySetInnerHTML={{ 
                                __html: comment.text
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/_(.*?)_/g, '<em>$1</em>')
                                  .replace(/__(.*?)__/g, '<u>$1</u>')
                                  .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;color:#991b1b;">$1</code>')
                                  .replace(/==(.*?)==/g, '<mark style="background:#fef3c7;padding:2px;">$1</mark>')
                                  .replace(/\n/g, '<br>')
                              }}
                            />
                          ) : (
                            <p className="text-sm text-gray-800">{comment.text}</p>
                          )}
                        </div>
                      )) || (
                        <div className="text-center py-8">
                          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No hay comentarios aún. ¡Sé el primero en comentar!
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Editor de comentarios */}
                    {showRichEditor ? (
                      <div>
                        <EnhancedTextEditor
                          value={newComment}
                          onChange={setNewComment}
                          placeholder="Escribe tu comentario con formato enriquecido..."
                        />
                        <button
                          onClick={addComment}
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2 ml-auto"
                        >
                          <Send className="w-4 h-4" />
                          Enviar Comentario
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addComment()}
                          placeholder="Añadir comentario rápido..."
                          className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addComment}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KanbanModule;