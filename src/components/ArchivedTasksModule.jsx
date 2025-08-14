import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  Search,
  Filter,
  Calendar,
  Tag,
  RotateCcw,
  Download,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  TrendingUp,
  Users,
  X,
  ChartBar,
  Eye,
  EyeOff,
  Flame,
  Zap,
  Circle
} from 'lucide-react';
import ArchiveAnalytics from './ArchiveAnalytics';

const ArchivedTasksModule = () => {
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statistics, setStatistics] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);

  // Cargar configuración global
  useEffect(() => {
    const savedConfig = localStorage.getItem('jarvi-global-config');
    if (savedConfig) {
      setGlobalConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Cargar tareas archivadas
  useEffect(() => {
    loadArchivedTasks();
    loadStatistics();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [archivedTasks, searchTerm, selectedCategory, selectedProject, selectedPriority, selectedTag, dateRange]);

  const loadArchivedTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: 100,
        orderBy: 'archived_at',
        order: 'DESC'
      });

      const response = await fetch(`http://localhost:3003/api/tasks/archived?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArchivedTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error cargando tareas archivadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/tasks/archived/stats');
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...archivedTasks];

    // Búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term) ||
        task.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    // Filtro por proyecto
    if (selectedProject !== 'all') {
      filtered = filtered.filter(task => task.project === selectedProject);
    }

    // Filtro por prioridad
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    // Filtro por tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(task => 
        task.tags && task.tags.includes(selectedTag)
      );
    }

    // Filtro por fecha
    if (dateRange.start) {
      filtered = filtered.filter(task => 
        new Date(task.completed_at || task.archived_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(task => 
        new Date(task.completed_at || task.archived_at) <= new Date(dateRange.end)
      );
    }

    setFilteredTasks(filtered);
  };

  const unarchiveTask = async (taskId) => {
    if (!window.confirm('¿Deseas restaurar esta tarea a la lista activa?')) return;

    try {
      const response = await fetch(`http://localhost:3003/api/tasks/${taskId}/unarchive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Recargar lista
        await loadArchivedTasks();
        alert('Tarea restaurada exitosamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al restaurar la tarea');
      }
    } catch (error) {
      console.error('Error desarchivando tarea:', error);
      alert('Error al restaurar la tarea');
    }
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(filteredTasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tareas_archivadas_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent':
        return <Flame className="w-3 h-3" />;
      case 'high':
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <Zap className="w-3 h-3" />;
      case 'low':
        return <Circle className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  // Obtener configuración global
  const globalCategories = globalConfig?.globalCategories || [];
  const globalProjects = globalConfig?.globalProjects || [];
  const globalPriorities = globalConfig?.globalPriorities || [
    { id: 'urgent', name: 'Urgente', color: '#ef4444' },
    { id: 'high', name: 'Alta', color: '#f97316' },
    { id: 'medium', name: 'Media', color: '#eab308' },
    { id: 'low', name: 'Baja', color: '#22c55e' }
  ];
  const globalTags = globalConfig?.globalTags || [];
  
  // Obtener tags únicos de las tareas archivadas
  const uniqueTags = [...new Set(archivedTasks.flatMap(t => t.tags || []).filter(Boolean))];

  // Si mostramos analytics, renderizar solo ese componente
  if (showAnalytics) {
    return (
      <ArchiveAnalytics 
        archivedTasks={archivedTasks}
        statistics={statistics}
        onClose={() => setShowAnalytics(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Archive className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Archivo de Tareas</h1>
                <p className="text-sm text-gray-500">
                  {filteredTasks.length} de {archivedTasks.length} tareas archivadas
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                {showAnalytics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAnalytics ? 'Ocultar' : 'Analytics'}
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                Stats
              </button>
              <button
                onClick={exportTasks}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button
                onClick={loadArchivedTasks}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <AnimatePresence>
            {showStats && statistics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-xs">Total</span>
                      <Folder className="w-3 h-3 text-indigo-500" />
                    </div>
                    <div className="text-xl font-bold text-gray-800">{statistics.total}</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-xs">Este Mes</span>
                      <Calendar className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {statistics.byMonth?.[0]?.count || 0}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-xs">Proyectos</span>
                      <FolderOpen className="w-3 h-3 text-purple-500" />
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {statistics.byProject?.length || 0}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-xs">Tasa</span>
                      <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    </div>
                    <div className="text-xl font-bold text-gray-800">100%</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filtros */}
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en tareas archivadas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Categoría */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {globalCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              {/* Proyecto */}
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los proyectos</option>
                {globalProjects.map(proj => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>

              {/* Prioridad */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las prioridades</option>
                {globalPriorities.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>

              {/* Tags */}
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los tags</option>
                {globalTags.map(tag => (
                  <option key={tag.id} value={tag.name}>
                    #{tag.name}
                  </option>
                ))}
                {uniqueTags
                  .filter(tag => !globalTags.some(gt => gt.name === tag))
                  .map(tag => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))
                }
              </select>

              {/* Fecha */}
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Desde"
              />
            </div>
          </div>
        </div>

        {/* Lista de tareas archivadas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay tareas archivadas</p>
              <p className="text-gray-400 text-sm mt-2">
                Las tareas completadas que archives aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="group relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <h3 className="font-medium text-gray-800 text-sm">{task.title}</h3>
                        {task.priority && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)}
                            <span className="capitalize">{task.priority}</span>
                          </span>
                        )}
                        {task.category && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                            {globalCategories.find(c => c.id === task.category)?.name || task.category}
                          </span>
                        )}
                        {task.project && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs">
                            {globalProjects.find(p => p.id === task.project)?.name || task.project}
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-gray-500">{formatDate(task.completed_at)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Archive className="w-3 h-3" />
                          <span className="text-gray-500">{formatDate(task.archived_at)}</span>
                        </span>
                        {task.created_by && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="text-gray-500">{task.created_by}</span>
                          </span>
                        )}
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{task.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => unarchiveTask(task.id)}
                      className="ml-2 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Restaurar tarea"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivedTasksModule;