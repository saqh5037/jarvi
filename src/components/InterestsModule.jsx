import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
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
  TrendingUp
} from 'lucide-react';

const InterestsModule = () => {
  const [interests, setInterests] = useState([]);
  const [socket, setSocket] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInterest, setEditingInterest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [newInterest, setNewInterest] = useState({
    title: '',
    description: '',
    url: '',
    category: 'technology',
    type: 'article',
    tags: '',
    priority: 'medium',
    readingTime: 0,
    notes: ''
  });

  const categories = {
    technology: { label: 'Tecnología', icon: Code, color: 'blue' },
    learning: { label: 'Aprendizaje', icon: BookOpen, color: 'green' },
    design: { label: 'Diseño', icon: Image, color: 'purple' },
    business: { label: 'Negocios', icon: TrendingUp, color: 'indigo' },
    science: { label: 'Ciencia', icon: Lightbulb, color: 'yellow' },
    health: { label: 'Salud', icon: Heart, color: 'red' },
    entertainment: { label: 'Entretenimiento', icon: Music, color: 'pink' }
  };

  const types = {
    article: { label: 'Artículo', icon: FileText },
    video: { label: 'Video', icon: Video },
    course: { label: 'Curso', icon: BookOpen },
    podcast: { label: 'Podcast', icon: Music },
    tool: { label: 'Herramienta', icon: Code },
    research: { label: 'Investigación', icon: Lightbulb }
  };

  const priorities = {
    high: { label: 'Alta', color: 'red' },
    medium: { label: 'Media', color: 'yellow' },
    low: { label: 'Baja', color: 'green' }
  };

  // Conectar con WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

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
          category: interest.category || 'general',
          type: interest.type || 'link',
          tags: interest.tags || [],
          dateAdded: interest.timestamp || new Date().toISOString(),
          dateRead: null,
          favorite: interest.favorite || false,
          priority: interest.priority || 'medium',
          notes: interest.notes || '',
          rating: interest.rating || 0,
          readingTime: interest.readingTime || 0,
          source: interest.source || 'telegram',
          sender: interest.sender
        };
        
        return [formattedInterest, ...prev];
      });
    });

    // Escuchar actualizaciones
    newSocket.on('interest-updated', (update) => {
      setInterests(prev => prev.map(i => 
        i.id === update.id ? { ...i, ...update } : i
      ));
    });

    // Escuchar eliminación
    newSocket.on('interest-deleted', ({ id }) => {
      setInterests(prev => prev.filter(i => i.id !== id));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const addInterest = () => {
    if (newInterest.title && newInterest.url) {
      const interest = {
        ...newInterest,
        id: Date.now(),
        tags: newInterest.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        dateAdded: new Date().toISOString(),
        dateRead: null,
        favorite: false,
        rating: 0,
        source: getDomainFromUrl(newInterest.url)
      };
      
      setInterests([interest, ...interests]);
      setNewInterest({
        title: '',
        description: '',
        url: '',
        category: 'technology',
        type: 'article',
        tags: '',
        priority: 'medium',
        readingTime: 0,
        notes: ''
      });
      setShowAddForm(false);
    }
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

  const deleteInterest = (id) => {
    setInterests(interests.filter(interest => interest.id !== id));
  };

  const filteredInterests = interests.filter(interest => {
    const matchesSearch = interest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interest.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || interest.category === filterCategory;
    const matchesType = filterType === 'all' || interest.type === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && interest.dateRead) ||
                         (filterStatus === 'unread' && !interest.dateRead) ||
                         (filterStatus === 'favorite' && interest.favorite);
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Intereses</h2>
              <p className="text-sm text-gray-500">Guarda y organiza contenido interesante para más tarde</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Interés
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-emerald-600">{interests.length}</div>
            <div className="text-sm text-emerald-700">Total</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{interests.filter(i => !i.dateRead).length}</div>
            <div className="text-sm text-blue-700">Sin leer</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{interests.filter(i => i.dateRead).length}</div>
            <div className="text-sm text-green-700">Leídos</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600">{interests.filter(i => i.favorite).length}</div>
            <div className="text-sm text-yellow-700">Favoritos</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{interests.filter(i => i.priority === 'high').length}</div>
            <div className="text-sm text-purple-700">Alta prioridad</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar intereses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(categories).map(([key, category]) => (
              <option key={key} value={key}>{category.label}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(types).map(([key, type]) => (
              <option key={key} value={key}>{type.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos</option>
            <option value="unread">Sin leer</option>
            <option value="read">Leídos</option>
            <option value="favorite">Favoritos</option>
          </select>
        </div>
      </div>

      {/* Formulario para agregar interés */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Nuevo Interés</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={newInterest.title}
                onChange={(e) => setNewInterest({...newInterest, title: e.target.value})}
                placeholder="Título del contenido"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={newInterest.url}
                onChange={(e) => setNewInterest({...newInterest, url: e.target.value})}
                placeholder="https://ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={newInterest.description}
                onChange={(e) => setNewInterest({...newInterest, description: e.target.value})}
                placeholder="Breve descripción del contenido"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={newInterest.category}
                onChange={(e) => setNewInterest({...newInterest, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(categories).map(([key, category]) => (
                  <option key={key} value={key}>{category.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={newInterest.type}
                onChange={(e) => setNewInterest({...newInterest, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(types).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={newInterest.priority}
                onChange={(e) => setNewInterest({...newInterest, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(priorities).map(([key, priority]) => (
                  <option key={key} value={key}>{priority.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de lectura (min)</label>
              <input
                type="number"
                value={newInterest.readingTime}
                onChange={(e) => setNewInterest({...newInterest, readingTime: parseInt(e.target.value) || 0})}
                placeholder="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por comas)</label>
              <input
                type="text"
                value={newInterest.tags}
                onChange={(e) => setNewInterest({...newInterest, tags: e.target.value})}
                placeholder="react, javascript, frontend"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={newInterest.notes}
                onChange={(e) => setNewInterest({...newInterest, notes: e.target.value})}
                placeholder="Notas adicionales (opcional)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={addInterest}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Agregar Interés
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

      {/* Lista de intereses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredInterests.map((interest) => {
            const CategoryIcon = categories[interest.category]?.icon || BookOpen;
            const TypeIcon = types[interest.type]?.icon || FileText;
            
            return (
              <motion.div
                key={interest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-white rounded-xl p-6 shadow-sm border-l-4 hover:shadow-md transition-shadow ${
                  interest.category === 'technology' ? 'border-blue-500' :
                  interest.category === 'learning' ? 'border-green-500' :
                  interest.category === 'design' ? 'border-purple-500' :
                  interest.category === 'business' ? 'border-indigo-500' :
                  interest.category === 'science' ? 'border-yellow-500' :
                  interest.category === 'health' ? 'border-red-500' :
                  interest.category === 'entertainment' ? 'border-pink-500' :
                  'border-gray-500'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={`w-5 h-5 ${
                      interest.category === 'technology' ? 'text-blue-600' :
                      interest.category === 'learning' ? 'text-green-600' :
                      interest.category === 'design' ? 'text-purple-600' :
                      interest.category === 'business' ? 'text-indigo-600' :
                      interest.category === 'science' ? 'text-yellow-600' :
                      interest.category === 'health' ? 'text-red-600' :
                      interest.category === 'entertainment' ? 'text-pink-600' :
                      'text-gray-600'
                    }`} />
                    <TypeIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavorite(interest.id)}
                      className={`p-1 rounded transition-colors ${
                        interest.favorite 
                          ? 'text-yellow-500 hover:text-yellow-600' 
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteInterest(interest.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Título y descripción */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{interest.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{interest.description}</p>

                {/* Meta información */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="w-3 h-3" />
                    <span>{interest.source}</span>
                    {interest.readingTime > 0 && (
                      <>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{interest.readingTime} min</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>Agregado: {formatDate(interest.dateAdded)}</span>
                    {interest.dateRead && (
                      <>
                        <span>•</span>
                        <span>Leído: {formatDate(interest.dateRead)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {interest.tags && interest.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {interest.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                    {interest.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{interest.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Prioridad */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    interest.priority === 'high' ? 'bg-red-100 text-red-700' :
                    interest.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {priorities[interest.priority].label} prioridad
                  </span>
                  
                  {!interest.dateRead && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Sin leer
                    </span>
                  )}
                </div>

                {/* Rating */}
                {interest.rating > 0 && (
                  <div className="mb-3">
                    {renderStars(interest.rating, interest.id)}
                  </div>
                )}

                {/* Notas */}
                {interest.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700">{interest.notes}</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2">
                  <a
                    href={interest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm text-center flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                  </a>
                  
                  {!interest.dateRead && (
                    <button
                      onClick={() => markAsRead(interest.id)}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Marcar leído
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredInterests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || filterCategory !== 'all' || filterType !== 'all' || filterStatus !== 'all'
              ? 'No hay intereses que coincidan con los filtros'
              : 'No tienes intereses guardados aún. ¡Agrega tu primer enlace!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InterestsModule;