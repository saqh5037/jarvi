import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { SOCKET_URLS } from '../config/api';
import { 
  BookOpen, 
  Plus, 
  Star,
  ExternalLink,
  Bookmark,
  Tag,
  Search,
  Filter,
  Eye,
  Clock,
  Calendar,
  Link,
  Edit,
  Trash2,
  Save,
  X,
  Globe,
  Youtube,
  FileText,
  Image,
  Video,
  Music,
  Code,
  Lightbulb,
  Heart,
  Share,
  Download,
  Archive,
  TrendingUp,
  Layers,
  Flag,
  Folder,
  Rocket
} from 'lucide-react';

const InterestsModule = () => {
  // Cargar intereses desde localStorage al inicio
  const [interests, setInterests] = useState(() => {
    const saved = localStorage.getItem('jarvi-interests');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInterest, setEditingInterest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  // Configuración global con valores por defecto
  const [globalConfig, setGlobalConfig] = useState({
    globalStates: [
      { id: 'pending', name: 'Pendiente', color: 'yellow' },
      { id: 'in-progress', name: 'En Progreso', color: 'blue' },
      { id: 'completed', name: 'Completado', color: 'green' },
      { id: 'cancelled', name: 'Cancelado', color: 'red' }
    ],
    globalPriorities: [
      { id: 'critical', name: 'Crítica', color: 'red', level: 1 },
      { id: 'high', name: 'Alta', color: 'orange', level: 2 },
      { id: 'medium', name: 'Media', color: 'yellow', level: 3 },
      { id: 'low', name: 'Baja', color: 'green', level: 4 }
    ],
    globalCategories: [
      { id: 'work', name: 'Trabajo', color: 'blue' },
      { id: 'personal', name: 'Personal', color: 'purple' },
      { id: 'learning', name: 'Aprendizaje', color: 'green' }
    ],
    globalProjects: [],
    globalTags: []
  });
  
  const [newInterest, setNewInterest] = useState({
    title: '',
    description: '',
    url: '',
    categoryId: globalConfig.globalCategories[0]?.id || 'personal',
    type: 'article',
    tags: [],
    priorityId: globalConfig.globalPriorities.find(p => p.level === 3)?.id || 'medium',
    stateId: globalConfig.globalStates.find(s => s.id === 'pending')?.id || 'pending',
    projectId: '',
    readingTime: 5,
    notes: ''
  });

  // Tipos de contenido (estos siguen siendo locales del módulo)
  const types = {
    article: { label: 'Artículo', icon: FileText },
    video: { label: 'Video', icon: Video },
    course: { label: 'Curso', icon: BookOpen },
    podcast: { label: 'Podcast', icon: Music },
    tool: { label: 'Herramienta', icon: Code },
    research: { label: 'Investigación', icon: Lightbulb }
  };

  // Cargar configuración global
  useEffect(() => {
    const loadGlobalConfig = () => {
      const savedConfig = localStorage.getItem('jarvi-global-config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          // Fusionar con valores por defecto para asegurar que siempre haya datos
          setGlobalConfig(prevConfig => ({
            globalStates: config.globalStates?.length > 0 ? config.globalStates : prevConfig.globalStates,
            globalPriorities: config.globalPriorities?.length > 0 ? config.globalPriorities : prevConfig.globalPriorities,
            globalCategories: config.globalCategories?.length > 0 ? config.globalCategories : prevConfig.globalCategories,
            globalProjects: config.globalProjects || [],
            globalTags: config.globalTags || []
          }));
          
          // Si es un nuevo interés, establecer valores por defecto
          if (!newInterest.categoryId && config.globalCategories?.length > 0) {
            setNewInterest(prev => ({
              ...prev,
              categoryId: config.globalCategories[0].id,
              priorityId: config.globalPriorities?.find(p => p.level === 3)?.id || config.globalPriorities?.[0]?.id,
              stateId: config.globalStates?.find(s => s.id === 'pending')?.id || config.globalStates?.[0]?.id
            }));
          }
        } catch (error) {
          console.error('Error loading global config:', error);
        }
      }
      // Log para debug
      console.log('Global config loaded:', globalConfig);
    };

    loadGlobalConfig();

    // Escuchar cambios en la configuración global
    const handleConfigUpdate = (event) => {
      const config = event.detail;
      if (config) {
        setGlobalConfig(prevConfig => ({
          globalStates: config.globalStates?.length > 0 ? config.globalStates : prevConfig.globalStates,
          globalPriorities: config.globalPriorities?.length > 0 ? config.globalPriorities : prevConfig.globalPriorities,
          globalCategories: config.globalCategories?.length > 0 ? config.globalCategories : prevConfig.globalCategories,
          globalProjects: config.globalProjects || prevConfig.globalProjects,
          globalTags: config.globalTags || prevConfig.globalTags
        }));
      }
    };

    window.addEventListener('global-config-updated', handleConfigUpdate);

    return () => {
      window.removeEventListener('global-config-updated', handleConfigUpdate);
    };
  }, []);

  // Guardar intereses en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('jarvi-interests', JSON.stringify(interests));
  }, [interests]);

  // Conectar con WebSocket (opcional, para sincronización futura)
  useEffect(() => {
    try {
      const newSocket = io(SOCKET_URLS.ENHANCED_NOTES);

      // Escuchar nuevos intereses
      newSocket.on('new-interest', (interest) => {
        console.log('Nuevo interés recibido:', interest);
        setInterests(prev => {
          // Evitar duplicados
          const exists = prev.find(i => i.id === interest.id);
          if (exists) return prev;
          
          // Formatear el interés
          const formattedInterest = {
            id: interest.id || Date.now(),
            title: interest.title || 'Interés sin título',
            description: interest.description || '',
            url: interest.url || '',
            categoryId: interest.categoryId || globalConfig.globalCategories[0]?.id,
            type: interest.type || 'article',
            tags: interest.tags || [],
            dateAdded: interest.timestamp || new Date().toISOString(),
            dateRead: null,
            favorite: interest.favorite || false,
            priorityId: interest.priorityId || globalConfig.globalPriorities[0]?.id,
            stateId: interest.stateId || 'pending',
            projectId: interest.projectId || '',
            notes: interest.notes || '',
            rating: interest.rating || 0,
            readingTime: interest.readingTime || 0,
            source: interest.source || 'telegram',
            sender: interest.sender
          };
          
          const updated = [formattedInterest, ...prev];
          localStorage.setItem('jarvi-interests', JSON.stringify(updated));
          return updated;
        });
      });

      // Escuchar actualizaciones
      newSocket.on('interest-updated', (update) => {
        setInterests(prev => {
          const updated = prev.map(i => 
            i.id === update.id ? { ...i, ...update } : i
          );
          localStorage.setItem('jarvi-interests', JSON.stringify(updated));
          return updated;
        });
      });

      // Escuchar eliminación
      newSocket.on('interest-deleted', ({ id }) => {
        setInterests(prev => {
          const updated = prev.filter(i => i.id !== id);
          localStorage.setItem('jarvi-interests', JSON.stringify(updated));
          return updated;
        });
      });

      return () => {
        newSocket.disconnect();
      };
    } catch {
      console.log('WebSocket no disponible, usando solo localStorage');
    }
  }, [globalConfig]);

  const addInterest = () => {
    // Validación mejorada
    if (!newInterest.title || !newInterest.url) {
      alert('Por favor complete al menos el título y la URL');
      return;
    }

    const interest = {
      ...newInterest,
      id: Date.now(),
      dateAdded: new Date().toISOString(),
      dateRead: null,
      favorite: false,
      rating: 0,
      source: getDomainFromUrl(newInterest.url),
      // Asegurar valores por defecto si no se seleccionaron
      categoryId: newInterest.categoryId || globalConfig.globalCategories[0]?.id || 'personal',
      priorityId: newInterest.priorityId || globalConfig.globalPriorities.find(p => p.level === 3)?.id || 'medium',
      stateId: newInterest.stateId || globalConfig.globalStates.find(s => s.id === 'pending')?.id || 'pending',
      type: newInterest.type || 'article'
    };
    
    const updatedInterests = [interest, ...interests];
    setInterests(updatedInterests);
    
    // Reset con valores por defecto de la configuración global
    setNewInterest({
      title: '',
      description: '',
      url: '',
      categoryId: globalConfig.globalCategories[0]?.id || 'personal',
      type: 'article',
      tags: [],
      priorityId: globalConfig.globalPriorities.find(p => p.level === 3)?.id || 'medium',
      stateId: globalConfig.globalStates.find(s => s.id === 'pending')?.id || 'pending',
      projectId: '',
      readingTime: 0,
      notes: ''
    });
    setShowAddForm(false);
    
    // Notificación de éxito
    console.log('✅ Interés agregado exitosamente');
  };

  const getDomainFromUrl = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'Unknown';
    }
  };

  const toggleFavorite = (id) => {
    setInterests(interests.map(interest =>
      interest.id === id ? { ...interest, favorite: !interest.favorite } : interest
    ));
  };

  const markAsRead = (id) => {
    setInterests(interests.map(interest =>
      interest.id === id ? { ...interest, dateRead: new Date().toISOString() } : interest
    ));
  };

  const updateRating = (id, rating) => {
    setInterests(interests.map(interest =>
      interest.id === id ? { ...interest, rating } : interest
    ));
  };

  const editInterest = (interest) => {
    setEditingInterest(interest);
    setNewInterest({
      title: interest.title,
      description: interest.description,
      url: interest.url,
      categoryId: interest.categoryId,
      type: interest.type,
      tags: interest.tags || [],
      priorityId: interest.priorityId,
      stateId: interest.stateId,
      projectId: interest.projectId || '',
      readingTime: interest.readingTime || 0,
      notes: interest.notes || ''
    });
    setShowAddForm(true);
  };

  const updateInterest = () => {
    if (!newInterest.title || !newInterest.url) {
      alert('Por favor complete al menos el título y la URL');
      return;
    }

    const updatedInterest = {
      ...editingInterest,
      ...newInterest,
      id: editingInterest.id,
      dateAdded: editingInterest.dateAdded,
      dateRead: editingInterest.dateRead,
      favorite: editingInterest.favorite,
      rating: editingInterest.rating,
      source: getDomainFromUrl(newInterest.url)
    };

    setInterests(interests.map(interest =>
      interest.id === editingInterest.id ? updatedInterest : interest
    ));

    // Reset
    setEditingInterest(null);
    setNewInterest({
      title: '',
      description: '',
      url: '',
      categoryId: globalConfig.globalCategories[0]?.id || 'personal',
      type: 'article',
      tags: [],
      priorityId: globalConfig.globalPriorities.find(p => p.level === 3)?.id || 'medium',
      stateId: globalConfig.globalStates.find(s => s.id === 'pending')?.id || 'pending',
      projectId: '',
      readingTime: 5,
      notes: ''
    });
    setShowAddForm(false);
    console.log('✏️ Interés actualizado exitosamente');
  };

  const deleteInterest = (id) => {
    if (confirm('¿Está seguro de eliminar este interés?')) {
      const updatedInterests = interests.filter(interest => interest.id !== id);
      setInterests(updatedInterests);
      console.log('🗑️ Interés eliminado');
    }
  };

  const filteredInterests = interests.filter(interest => {
    const matchesSearch = interest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interest.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || interest.categoryId === filterCategory;
    const matchesType = filterType === 'all' || interest.type === filterType;
    const matchesProject = filterProject === 'all' || interest.projectId === filterProject;
    const matchesState = filterState === 'all' || interest.stateId === filterState;
    const matchesPriority = filterPriority === 'all' || interest.priorityId === filterPriority;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && interest.dateRead) ||
                         (filterStatus === 'unread' && !interest.dateRead) ||
                         (filterStatus === 'favorite' && interest.favorite);
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesProject && matchesState && matchesPriority;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderStars = (rating, interestId) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => updateRating(interestId, star)}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          >
            <Star className="w-4 h-4" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Horizontal Compacto */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          {/* Sección Izquierda: Ícono + Título */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Intereses</h2>
              <p className="text-xs text-yellow-100">Guarda y organiza contenido</p>
            </div>
          </div>
          
          {/* Sección Central: Estadísticas */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-yellow-200" />
              <span className="text-sm font-medium">{interests.length} total</span>
            </div>
            <div className="h-4 w-px bg-yellow-400/30"></div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-yellow-200" />
              <span className="text-sm font-medium">{interests.filter(i => !i.dateRead).length} sin leer</span>
            </div>
            <div className="h-4 w-px bg-yellow-400/30"></div>
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-yellow-200" />
              <span className="text-sm font-medium">{interests.filter(i => i.dateRead).length} leídos</span>
            </div>
            <div className="h-4 w-px bg-yellow-400/30"></div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-200" />
              <span className="text-sm font-medium">{interests.filter(i => i.favorite).length} favoritos</span>
            </div>
            <div className="h-4 w-px bg-yellow-400/30"></div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-200" />
              <span className="text-sm font-medium">{interests.filter(i => i.priority === 'high').length} prioritarios</span>
            </div>
          </div>
          
          {/* Sección Derecha: Acciones */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Indicadores de filtros activos */}
        {(searchTerm || filterCategory !== 'all' || filterState !== 'all' || filterPriority !== 'all' || filterProject !== 'all' || filterType !== 'all' || filterStatus !== 'all') && (
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Filtros activos:</span>
              {searchTerm && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                  Búsqueda: "{searchTerm}"
                </span>
              )}
              {filterState !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {globalConfig.globalStates.find(s => s.id === filterState)?.name || filterState}
                </span>
              )}
              {filterPriority !== 'all' && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                  {globalConfig.globalPriorities.find(p => p.id === filterPriority)?.name || filterPriority}
                </span>
              )}
              {filterCategory !== 'all' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                  {globalConfig.globalCategories.find(c => c.id === filterCategory)?.name || filterCategory}
                </span>
              )}
              {filterProject !== 'all' && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                  {globalConfig.globalProjects.find(p => p.id === filterProject)?.name || filterProject}
                </span>
              )}
              {filterType !== 'all' && (
                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                  {types[filterType]?.label}
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  {filterStatus === 'unread' ? 'Sin leer' : filterStatus === 'read' ? 'Leídos' : 'Favoritos'}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterState('all');
                setFilterPriority('all');
                setFilterProject('all');
                setFilterType('all');
                setFilterStatus('all');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpiar filtros
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar intereses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          
          {/* Filtro de Estado */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
            <Layers className="w-4 h-4 text-blue-600" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Estados</option>
              {globalConfig.globalStates && globalConfig.globalStates.length > 0 ? (
                globalConfig.globalStates.map((state) => (
                  <option key={state.id} value={state.id}>{state.name}</option>
                ))
              ) : (
                <>
                  <option value="pending">Pendiente</option>
                  <option value="in-progress">En Progreso</option>
                  <option value="completed">Completado</option>
                </>
              )}
            </select>
          </div>
          
          {/* Filtro de Prioridad */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
            <Flag className="w-4 h-4 text-orange-600" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Prioridades</option>
              {globalConfig.globalPriorities && globalConfig.globalPriorities.length > 0 ? (
                globalConfig.globalPriorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>{priority.name}</option>
                ))
              ) : (
                <>
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </>
              )}
            </select>
          </div>
          
          {/* Filtro de Categoría */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
            <Folder className="w-4 h-4 text-purple-600" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Categorías</option>
              {globalConfig.globalCategories && globalConfig.globalCategories.length > 0 ? (
                globalConfig.globalCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))
              ) : (
                <>
                  <option value="work">Trabajo</option>
                  <option value="personal">Personal</option>
                  <option value="learning">Aprendizaje</option>
                </>
              )}
            </select>
          </div>
          
          {/* Filtro de Proyecto */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg">
            <Rocket className="w-4 h-4 text-emerald-600" />
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Proyectos</option>
              {globalConfig.globalProjects && globalConfig.globalProjects.length > 0 && 
                globalConfig.globalProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))
              }
            </select>
          </div>

          {/* Filtro de Tipo */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-lg">
            <FileText className="w-4 h-4 text-pink-600" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Tipos</option>
              {Object.entries(types).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Vista */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
            <Eye className="w-4 h-4 text-green-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Vista</option>
              <option value="unread">Sin leer</option>
              <option value="read">Leídos</option>
              <option value="favorite">Favoritos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Formulario para agregar interés - Estilo Moderno */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingInterest ? 'Editar Interés' : 'Agregar Nuevo Interés'}
                </h3>
                <p className="text-sm text-gray-500">
                  {editingInterest ? 'Actualiza la información del contenido' : 'Guarda contenido para leer después'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo de Título - Requerido */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newInterest.title}
                  onChange={(e) => setNewInterest({...newInterest, title: e.target.value})}
                  placeholder="Ej: Artículo sobre IA en 2024"
                  className="w-full px-4 py-2.5 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            {/* Campo de URL - Requerido */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="url"
                  value={newInterest.url}
                  onChange={(e) => setNewInterest({...newInterest, url: e.target.value})}
                  placeholder="https://ejemplo.com/articulo"
                  className="w-full pl-10 pr-4 py-2.5 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            {/* Campo de Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={newInterest.description}
                onChange={(e) => setNewInterest({...newInterest, description: e.target.value})}
                placeholder="Breve descripción del contenido (opcional)"
                rows={3}
                className="w-full px-4 py-2.5 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            
            {/* Categoría con ícono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Folder className="w-4 h-4 inline mr-1" />
                Categoría
              </label>
              <select
                value={newInterest.categoryId}
                onChange={(e) => setNewInterest({...newInterest, categoryId: e.target.value})}
                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
              >
                {globalConfig.globalCategories && globalConfig.globalCategories.length > 0 ? (
                  globalConfig.globalCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))
                ) : (
                  <>
                    <option value="work">Trabajo</option>
                    <option value="personal">Personal</option>
                    <option value="learning">Aprendizaje</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Tipo con ícono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Tipo de Contenido
              </label>
              <select
                value={newInterest.type}
                onChange={(e) => setNewInterest({...newInterest, type: e.target.value})}
                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
              >
                {Object.entries(types).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
            </div>
            
            {/* Prioridad con ícono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="w-4 h-4 inline mr-1" />
                Prioridad
              </label>
              <select
                value={newInterest.priorityId}
                onChange={(e) => setNewInterest({...newInterest, priorityId: e.target.value})}
                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
              >
                {globalConfig.globalPriorities && globalConfig.globalPriorities.length > 0 ? (
                  globalConfig.globalPriorities.map((priority) => (
                    <option key={priority.id} value={priority.id}>{priority.name}</option>
                  ))
                ) : (
                  <>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Tiempo de lectura con ícono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Tiempo de lectura
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={newInterest.readingTime}
                  onChange={(e) => setNewInterest({...newInterest, readingTime: parseInt(e.target.value) || 0})}
                  placeholder="15"
                  className="w-full px-4 py-2.5 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                />
                <span className="absolute right-3 top-3 text-sm text-gray-500">min</span>
              </div>
            </div>
            
            {/* Estado con ícono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Layers className="w-4 h-4 inline mr-1" />
                Estado
              </label>
              <select
                value={newInterest.stateId}
                onChange={(e) => setNewInterest({...newInterest, stateId: e.target.value})}
                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
              >
                {globalConfig.globalStates && globalConfig.globalStates.length > 0 ? (
                  globalConfig.globalStates.map((state) => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))
                ) : (
                  <>
                    <option value="pending">Pendiente</option>
                    <option value="in-progress">En Progreso</option>
                    <option value="completed">Completado</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Proyecto con ícono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Rocket className="w-4 h-4 inline mr-1" />
                Proyecto
              </label>
              <select
                value={newInterest.projectId}
                onChange={(e) => setNewInterest({...newInterest, projectId: e.target.value})}
                className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Sin proyecto</option>
                {globalConfig.globalProjects && globalConfig.globalProjects.length > 0 &&
                  globalConfig.globalProjects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))
                }
              </select>
            </div>
            
            {/* Tags con ícono */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Etiquetas
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[50px]">
                {globalConfig.globalTags && globalConfig.globalTags.length > 0 ? (
                  globalConfig.globalTags.map((tag) => (
                    <label key={tag.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newInterest.tags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewInterest({...newInterest, tags: [...newInterest.tags, tag.id]});
                          } else {
                            setNewInterest({...newInterest, tags: newInterest.tags.filter(t => t !== tag.id)});
                          }
                        }}
                        className="sr-only"
                      />
                      <span 
                        className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all border ${
                          newInterest.tags.includes(tag.id)
                            ? `bg-yellow-100 text-yellow-700 border-yellow-300 font-medium`
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No hay etiquetas configuradas</span>
                )}
              </div>
            </div>
            
            {/* Notas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Notas adicionales
              </label>
              <textarea
                value={newInterest.notes}
                onChange={(e) => setNewInterest({...newInterest, notes: e.target.value})}
                placeholder="Añade notas o comentarios sobre este contenido..."
                rows={3}
                className="w-full px-4 py-2.5 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={editingInterest ? updateInterest : addInterest}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-medium rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-5 h-5" />
              {editingInterest ? 'Actualizar Interés' : 'Guardar Interés'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingInterest(null);
                setNewInterest({
                  title: '',
                  description: '',
                  url: '',
                  categoryId: globalConfig.globalCategories[0]?.id || 'personal',
                  type: 'article',
                  tags: [],
                  priorityId: globalConfig.globalPriorities.find(p => p.level === 3)?.id || 'medium',
                  stateId: globalConfig.globalStates.find(s => s.id === 'pending')?.id || 'pending',
                  projectId: '',
                  readingTime: 5,
                  notes: ''
                });
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* Lista de intereses */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Intereses ({filteredInterests.length})
          </h3>
        </div>
        
        <div className="p-6">
          {filteredInterests.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-gray-500">
                {searchTerm || filterCategory !== 'all' || filterType !== 'all' || filterStatus !== 'all'
                  ? 'No hay intereses que coincidan con los filtros'
                  : 'No tienes intereses guardados aún. ¡Agrega tu primer enlace!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 mb-4">
                Mostrando {filteredInterests.length} intereses organizados por fecha
              </div>
              <AnimatePresence>
                {filteredInterests.map((interest, index) => {
                  // Obtener datos de la configuración global
                  const category = globalConfig.globalCategories.find(c => c.id === interest.categoryId);
                  const priority = globalConfig.globalPriorities.find(p => p.id === interest.priorityId);
                  const state = globalConfig.globalStates.find(s => s.id === interest.stateId);
                  const project = globalConfig.globalProjects.find(p => p.id === interest.projectId);
                  const interestTags = interest.tags ? globalConfig.globalTags.filter(t => interest.tags.includes(t.id)) : [];
                  
                  // Iconos disponibles para categorías
                  const iconMap = {
                    Briefcase: () => <Bookmark className="w-5 h-5" />,
                    User: () => <Bookmark className="w-5 h-5" />,
                    Heart: () => <Heart className="w-5 h-5" />,
                    DollarSign: () => <Bookmark className="w-5 h-5" />,
                    GraduationCap: () => <BookOpen className="w-5 h-5" />,
                    Cpu: () => <Code className="w-5 h-5" />,
                    TrendingUp: () => <TrendingUp className="w-5 h-5" />,
                    Users: () => <Bookmark className="w-5 h-5" />,
                    MessageCircle: () => <Bookmark className="w-5 h-5" />,
                    Folder: () => <Bookmark className="w-5 h-5" />
                  };
                  
                  const CategoryIcon = category && iconMap[category.icon] ? iconMap[category.icon] : () => <BookOpen className="w-5 h-5" />;
                  
                  return (
                    <motion.div
                      key={interest.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Icono y favorito */}
                          <div className="flex items-center gap-2">
                            <div className={`p-2 bg-${category?.color || 'gray'}-100 rounded-xl`}>
                              <CategoryIcon />
                            </div>
                            <button
                              onClick={() => toggleFavorite(interest.id)}
                              className={`p-1 rounded transition-colors ${
                                interest.favorite 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              title="Marcar como favorito"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Título y proyecto */}
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900 text-lg truncate">
                                {interest.title}
                              </h3>
                              {project && (
                                <span className={`px-2 py-1 bg-${project.color}-100 text-${project.color}-700 rounded-full text-xs font-medium`}>
                                  {project.name}
                                </span>
                              )}
                            </div>
                            
                            {/* Descripción */}
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{interest.description}</p>
                            
                            {/* Meta información */}
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                <span>{interest.source}</span>
                              </div>
                              
                              {interest.readingTime > 0 && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{interest.readingTime} min</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Agregado: {formatDate(interest.dateAdded)}</span>
                              </div>
                              
                              {interest.dateRead && (
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-green-500" />
                                  <span>Leído: {formatDate(interest.dateRead)}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Rating */}
                            {interest.rating > 0 && (
                              <div className="mb-2">
                                {renderStars(interest.rating, interest.id)}
                              </div>
                            )}
                            
                            {/* Estados, prioridades y tags */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {state && (
                                <span className={`px-2 py-1 bg-${state.color}-100 text-${state.color}-700 rounded-full text-xs font-medium`}>
                                  {state.name}
                                </span>
                              )}
                              
                              {priority && (
                                <span className={`px-2 py-1 bg-${priority.color}-100 text-${priority.color}-700 rounded-full text-xs font-medium`}>
                                  {priority.name}
                                </span>
                              )}
                              
                              {interestTags.slice(0, 3).map((tag) => (
                                <span key={tag.id} className={`px-2 py-1 bg-${tag.color}-50 text-${tag.color}-700 rounded text-xs`}>
                                  #{tag.name}
                                </span>
                              ))}
                              
                              {interestTags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{interestTags.length - 3} tags
                                </span>
                              )}
                            </div>
                            
                            {/* Notas */}
                            {interest.notes && (
                              <div className="bg-white rounded-lg p-2 mb-2 border border-gray-200">
                                <p className="text-sm text-gray-700 line-clamp-2">{interest.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Botones de acción */}
                        <div className="flex items-center gap-2 ml-4">
                          <a
                            href={interest.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm flex items-center gap-1"
                            title="Abrir enlace"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Abrir
                          </a>
                          
                          {!interest.dateRead && (
                            <button
                              onClick={() => markAsRead(interest.id)}
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                              title="Marcar como leído"
                            >
                              <Eye className="w-3 h-3" />
                              Leído
                            </button>
                          )}
                          
                          <button
                            onClick={() => editInterest(interest)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                            title="Editar interés"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => deleteInterest(interest.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                            title="Eliminar interés"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterestsModule;