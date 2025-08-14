import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  CheckSquare,
  Mic,
  Search,
  Calendar,
  Clock,
  Filter,
  Trash2,
  RotateCcw,
  Download,
  ChevronDown,
  Tag,
  Folder,
  FolderOpen,
  FileText,
  Play,
  Pause,
  Volume2,
  User,
  Hash,
  Layers,
  Flame,
  AlertTriangle,
  Zap,
  Circle,
  MessageCircle,
  Star,
  Edit3,
  X
} from 'lucide-react';

// Componente de Tareas Archivadas (manteniendo toda la funcionalidad existente)
const ArchivedTasksSection = () => {
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    byPriority: {},
    completionRate: 0
  });

  // Configuración global
  const [globalCategories, setGlobalCategories] = useState([]);
  const [globalProjects, setGlobalProjects] = useState([]);
  const [globalPriorities, setGlobalPriorities] = useState([]);
  const [globalTags, setGlobalTags] = useState([]);

  useEffect(() => {
    loadGlobalConfig();
    loadArchivedTasks();
    loadStats();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [archivedTasks, searchTerm, selectedCategory, selectedPriority, selectedProject, selectedTag, dateRange]);

  const loadGlobalConfig = () => {
    const config = localStorage.getItem('jarvi-global-config');
    if (config) {
      const parsedConfig = JSON.parse(config);
      setGlobalCategories(parsedConfig.categories || []);
      setGlobalProjects(parsedConfig.projects || []);
      setGlobalPriorities(parsedConfig.priorities || []);
      setGlobalTags(parsedConfig.tags || []);
    }
  };

  const loadArchivedTasks = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/tasks/archived');
      const data = await response.json();
      if (data.success) {
        setArchivedTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error cargando tareas archivadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/tasks/archived/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const filterTasks = () => {
    let filtered = [...archivedTasks];

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    if (selectedProject !== 'all') {
      filtered = filtered.filter(task => task.project === selectedProject);
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(task => task.tags?.includes(selectedTag));
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.archivedAt || task.completedAt);
        return taskDate >= new Date(dateRange.start) && taskDate <= new Date(dateRange.end);
      });
    }

    setFilteredTasks(filtered);
  };

  const restoreTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:3003/api/tasks/${taskId}/restore`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setArchivedTasks(prev => prev.filter(task => task.id !== taskId));
        loadStats();
      }
    } catch (error) {
      console.error('Error restaurando tarea:', error);
    }
  };

  const deleteTaskPermanently = async (taskId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea permanentemente?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3003/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setArchivedTasks(prev => prev.filter(task => task.id !== taskId));
        loadStats();
      }
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
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
        return null;
    }
  };

  const priorityColors = {
    urgent: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Archive className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Tareas archivadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600">Tasa de completado</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(stats.byCategory || {}).length}
              </p>
              <p className="text-sm text-gray-600">Categorías</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-600">Período actual</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las categorías</option>
            {globalCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las prioridades</option>
            {globalPriorities.map(priority => (
              <option key={priority.id} value={priority.id}>{priority.name}</option>
            ))}
          </select>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los proyectos</option>
            {globalProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las etiquetas</option>
            {globalTags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {filteredTasks.length} tareas encontradas
            </h3>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No se encontraron tareas archivadas</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      {task.priority && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${priorityColors[task.priority]}`}>
                          {getPriorityIcon(task.priority)}
                          <span className="capitalize">{task.priority}</span>
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      {task.category && (
                        <span className="text-xs text-gray-500">
                          {globalCategories.find(c => c.id === task.category)?.name || task.category}
                        </span>
                      )}
                      {task.archivedAt && (
                        <span className="text-xs text-gray-500">
                          Archivado: {new Date(task.archivedAt).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreTask(task.id)}
                      className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Restaurar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTaskPermanently(task.id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de Notas de Voz Archivadas
const ArchivedVoiceNotesSection = () => {
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [playingNoteId, setPlayingNoteId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    totalDuration: 0,
    byCategory: {},
    averageDuration: 0
  });

  const [globalCategories, setGlobalCategories] = useState([]);
  const [globalTags, setGlobalTags] = useState([]);

  useEffect(() => {
    loadGlobalConfig();
    loadArchivedNotes();
    loadStats();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [archivedNotes, searchTerm, selectedCategory, selectedTag, dateRange]);

  const loadGlobalConfig = () => {
    const config = localStorage.getItem('jarvi-global-config');
    if (config) {
      const parsedConfig = JSON.parse(config);
      setGlobalCategories(parsedConfig.categories || []);
      setGlobalTags(parsedConfig.tags || []);
    }
  };

  const loadArchivedNotes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/voice-notes/archived');
      const data = await response.json();
      if (data.success) {
        setArchivedNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error cargando notas de voz archivadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/voice-notes/archived/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const filterNotes = () => {
    let filtered = [...archivedNotes];

    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.transcription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(note => note.tags?.includes(selectedTag));
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.archivedAt || note.createdAt);
        return noteDate >= new Date(dateRange.start) && noteDate <= new Date(dateRange.end);
      });
    }

    setFilteredNotes(filtered);
  };

  const restoreNote = async (noteId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/voice-notes/${noteId}/restore`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setArchivedNotes(prev => prev.filter(note => note.id !== noteId));
        loadStats();
      }
    } catch (error) {
      console.error('Error restaurando nota de voz:', error);
    }
  };

  const deleteNotePermanently = async (noteId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota de voz permanentemente?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/voice-notes/${noteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setArchivedNotes(prev => prev.filter(note => note.id !== noteId));
        loadStats();
      }
    } catch (error) {
      console.error('Error eliminando nota de voz:', error);
    }
  };

  const playNote = (noteId, audioUrl) => {
    if (playingNoteId === noteId) {
      setPlayingNoteId(null);
      // Pausar audio
    } else {
      setPlayingNoteId(noteId);
      // Reproducir audio
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setPlayingNoteId(null);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mic className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Notas archivadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(stats.totalDuration / 60)}m
              </p>
              <p className="text-sm text-gray-600">Duración total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Volume2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(Math.floor(stats.averageDuration))}
              </p>
              <p className="text-sm text-gray-600">Duración promedio</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Tag className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(stats.byCategory || {}).length}
              </p>
              <p className="text-sm text-gray-600">Categorías</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas las categorías</option>
            {globalCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas las etiquetas</option>
            {globalTags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Fecha inicio"
          />
        </div>
      </div>

      {/* Lista de notas */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {filteredNotes.length} notas encontradas
            </h3>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center">
              <Mic className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No se encontraron notas de voz archivadas</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {note.title || `Nota del ${new Date(note.createdAt).toLocaleDateString('es-ES')}`}
                      </h4>
                      {note.duration && (
                        <span className="text-xs text-gray-500">
                          {formatDuration(note.duration)}
                        </span>
                      )}
                    </div>
                    
                    {note.transcription && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {note.transcription}
                      </p>
                    )}
                    
                    {note.summary && (
                      <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-700">
                          <strong>Resumen:</strong> {note.summary}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      {note.category && (
                        <span className="text-xs text-gray-500">
                          {globalCategories.find(c => c.id === note.category)?.name || note.category}
                        </span>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {note.archivedAt && (
                        <span className="text-xs text-gray-500">
                          Archivado: {new Date(note.archivedAt).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {note.audioUrl && (
                      <button
                        onClick={() => playNote(note.id, note.audioUrl)}
                        className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title={playingNoteId === note.id ? "Pausar" : "Reproducir"}
                      >
                        {playingNoteId === note.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => restoreNote(note.id)}
                      className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Restaurar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNotePermanently(note.id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Componente Principal de Archivo General
const GeneralArchiveModule = () => {
  const [activeSection, setActiveSection] = useState('tasks');

  const sections = [
    { id: 'tasks', name: 'Tareas Archivadas', icon: CheckSquare, color: 'indigo' },
    { id: 'voice-notes', name: 'Notas de Voz Archivadas', icon: Mic, color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg">
                <Archive className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Centro de Archivos</h1>
                <p className="text-sm text-gray-600">
                  Gestiona todos tus elementos archivados
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="text-sm">Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selector de sección */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-4">
          <div className="flex gap-2">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${
                          section.color === 'purple' 
                            ? 'from-purple-500 to-pink-500' 
                            : 'from-indigo-500 to-blue-500'
                        } text-white shadow-lg`
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido de la sección activa */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'tasks' ? (
              <ArchivedTasksSection />
            ) : (
              <ArchivedVoiceNotesSection />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeneralArchiveModule;