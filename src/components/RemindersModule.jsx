import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  Bell, 
  Plus, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  Filter
} from 'lucide-react';

const RemindersModule = () => {
  const [reminders, setReminders] = useState([]);
  const [socket, setSocket] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    datetime: '',
    priority: 'medium',
    category: 'personal'
  });

  const priorities = {
    high: { color: 'red', label: 'Alta' },
    medium: { color: 'yellow', label: 'Media' },
    low: { color: 'green', label: 'Baja' }
  };

  const categories = {
    work: { color: 'indigo', label: 'Trabajo' },
    personal: { color: 'pink', label: 'Personal' },
    health: { color: 'green', label: 'Salud' },
    finance: { color: 'blue', label: 'Finanzas' }
  };

  // Conectar con WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Escuchar nuevos recordatorios
    newSocket.on('new-reminder', (reminder) => {
      console.log('Nuevo recordatorio recibido:', reminder);
      setReminders(prev => {
        // Evitar duplicados
        const exists = prev.find(r => r.id === reminder.id);
        if (exists) return prev;
        
        // Formatear el recordatorio
        const formattedReminder = {
          id: reminder.id || Date.now(),
          title: reminder.content || reminder.title || 'Recordatorio sin título',
          description: reminder.description || '',
          datetime: reminder.datetime || new Date().toISOString(),
          priority: reminder.priority || 'medium',
          completed: reminder.status === 'completed' || false,
          category: reminder.category || 'personal',
          type: reminder.type || 'text',
          sender: reminder.sender,
          timestamp: reminder.timestamp
        };
        
        return [formattedReminder, ...prev];
      });
    });

    // Escuchar actualizaciones de recordatorios
    newSocket.on('reminder-updated', (update) => {
      setReminders(prev => prev.map(r => 
        r.id === update.id ? { ...r, ...update } : r
      ));
    });

    // Escuchar eliminación de recordatorios
    newSocket.on('reminder-deleted', ({ id }) => {
      setReminders(prev => prev.filter(r => r.id !== id));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const addReminder = () => {
    if (newReminder.title && newReminder.datetime) {
      const reminder = {
        ...newReminder,
        id: Date.now(),
        completed: false
      };
      setReminders([...reminders, reminder]);
      setNewReminder({
        title: '',
        description: '',
        datetime: '',
        priority: 'medium',
        category: 'personal'
      });
      setShowAddForm(false);
    }
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const toggleComplete = (id) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const updateReminder = (updatedReminder) => {
    setReminders(reminders.map(r => 
      r.id === updatedReminder.id ? updatedReminder : r
    ));
    setEditingReminder(null);
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reminder.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || reminder.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (datetime) => {
    const now = new Date();
    const target = new Date(datetime);
    const diff = target - now;
    
    if (diff < 0) return 'Vencido';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `En ${days}d ${hours}h`;
    if (hours > 0) return `En ${hours}h`;
    return 'Hoy';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recordatorios</h2>
              <p className="text-sm text-gray-500">Gestiona tus recordatorios y citas</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Recordatorio
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recordatorios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Todas las prioridades</option>
            <option value="high">Alta prioridad</option>
            <option value="medium">Media prioridad</option>
            <option value="low">Baja prioridad</option>
          </select>
        </div>
      </div>

      {/* Formulario de nuevo recordatorio */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Recordatorio</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={newReminder.title}
                onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                placeholder="Título del recordatorio"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={newReminder.description}
                onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                placeholder="Descripción opcional"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={newReminder.datetime}
                onChange={(e) => setNewReminder({...newReminder, datetime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={newReminder.priority}
                onChange={(e) => setNewReminder({...newReminder, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={newReminder.category}
                onChange={(e) => setNewReminder({...newReminder, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {Object.entries(categories).map(([key, category]) => (
                  <option key={key} value={key}>{category.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={addReminder}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Guardar
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

      {/* Lista de recordatorios */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredReminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                reminder.completed 
                  ? 'border-green-500 opacity-75' 
                  : `border-${priorities[reminder.priority].color}-500`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => toggleComplete(reminder.id)}
                      className={`p-1 rounded-full transition-colors ${
                        reminder.completed 
                          ? 'text-green-600' 
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      {reminder.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </button>
                    
                    <h3 className={`font-medium ${
                      reminder.completed 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {reminder.title}
                    </h3>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      reminder.priority === 'high' ? 'bg-red-100 text-red-700' :
                      reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {priorities[reminder.priority].label}
                    </span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      reminder.category === 'personal' ? 'bg-blue-100 text-blue-700' :
                      reminder.category === 'work' ? 'bg-purple-100 text-purple-700' :
                      reminder.category === 'health' ? 'bg-green-100 text-green-700' :
                      reminder.category === 'finance' ? 'bg-yellow-100 text-yellow-700' :
                      reminder.category === 'social' ? 'bg-pink-100 text-pink-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {categories[reminder.category].label}
                    </span>
                  </div>
                  
                  {reminder.description && (
                    <p className={`text-sm mb-2 ${
                      reminder.completed ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {reminder.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(reminder.datetime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getTimeUntil(reminder.datetime)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingReminder(reminder)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredReminders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay recordatorios que coincidan con los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersModule;