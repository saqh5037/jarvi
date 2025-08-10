import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Tag,
  Layers,
  Key,
  Palette,
  Bell,
  Database,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  ChevronRight,
  AlertCircle,
  Shield,
  Globe,
  Zap,
  Archive,
  Hash,
  Circle,
  Square,
  Triangle,
  Star,
  Heart,
  Flag,
  Bookmark,
  Clock,
  Calendar,
  User,
  Users,
  Briefcase,
  Home,
  Book,
  DollarSign,
  Activity,
  Coffee,
  Loader2
} from 'lucide-react';

const SettingsModule = () => {
  // Estado para la sección activa
  const [activeSection, setActiveSection] = useState('states');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Estados y categorías configurables
  const [config, setConfig] = useState({
    taskStates: [],
    meetingStates: [],
    reminderStates: [],
    globalCategories: [],
    customTags: [],
    apiKeys: {
      openai: '',
      gemini: '',
      claude: '',
      telegram: ''
    },
    preferences: {
      theme: 'light',
      language: 'es',
      notifications: true,
      soundAlerts: true,
      autoSave: true,
      compactMode: false
    },
    limits: {
      maxTokensPerRequest: 4000,
      maxRequestsPerDay: 100,
      maxAudioDuration: 300
    }
  });

  // Estados para edición
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    label: '',
    value: '',
    color: 'blue',
    icon: 'Circle'
  });

  // Colores disponibles
  const availableColors = [
    { name: 'gray', class: 'bg-gray-500' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'yellow', class: 'bg-yellow-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'indigo', class: 'bg-indigo-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'pink', class: 'bg-pink-500' }
  ];

  // Iconos disponibles
  const availableIcons = {
    Circle, Square, Triangle, Star, Heart, Flag, 
    Bookmark, Clock, Calendar, User, Users, Briefcase,
    Home, Book, DollarSign, Activity, Coffee
  };

  // Secciones del menú
  const menuSections = [
    {
      id: 'states',
      title: 'Estados y Categorías',
      icon: Layers,
      items: [
        { id: 'task-states', label: 'Estados de Tareas', count: config.taskStates.length },
        { id: 'meeting-states', label: 'Estados de Reuniones', count: config.meetingStates.length },
        { id: 'reminder-states', label: 'Estados de Recordatorios', count: config.reminderStates.length },
        { id: 'categories', label: 'Categorías Globales', count: config.globalCategories.length },
        { id: 'tags', label: 'Tags Personalizados', count: config.customTags.length }
      ]
    },
    {
      id: 'integrations',
      title: 'Integraciones',
      icon: Zap,
      items: [
        { id: 'api-keys', label: 'API Keys', count: Object.keys(config.apiKeys).length },
        { id: 'telegram', label: 'Telegram Bot', status: config.apiKeys.telegram ? 'Configurado' : 'No configurado' },
        { id: 'limits', label: 'Límites de Uso', count: Object.keys(config.limits).length }
      ]
    },
    {
      id: 'personalization',
      title: 'Personalización',
      icon: Palette,
      items: [
        { id: 'appearance', label: 'Apariencia', status: config.preferences.theme },
        { id: 'notifications', label: 'Notificaciones', status: config.preferences.notifications ? 'Activas' : 'Inactivas' },
        { id: 'language', label: 'Idioma', status: 'Español' }
      ]
    },
    {
      id: 'system',
      title: 'Sistema',
      icon: Database,
      items: [
        { id: 'backup', label: 'Respaldo', action: true },
        { id: 'export', label: 'Exportar Configuración', action: true },
        { id: 'import', label: 'Importar Configuración', action: true },
        { id: 'reset', label: 'Restablecer Todo', action: true, danger: true }
      ]
    }
  ];

  // Cargar configuración al montar
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Cargar configuración desde localStorage
  const loadConfiguration = () => {
    setIsLoading(true);
    try {
      const savedConfig = localStorage.getItem('jarvi_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      } else {
        // Configuración por defecto
        const defaultConfig = {
          taskStates: [
            { id: 1, label: 'Pendiente', value: 'pending', color: 'yellow', icon: 'Clock' },
            { id: 2, label: 'En Progreso', value: 'in_progress', color: 'blue', icon: 'Activity' },
            { id: 3, label: 'Completada', value: 'completed', color: 'green', icon: 'Check' }
          ],
          meetingStates: [
            { id: 1, label: 'Pendiente', value: 'pendiente', color: 'yellow', icon: 'Clock' },
            { id: 2, label: 'Procesada', value: 'procesada', color: 'green', icon: 'Check' },
            { id: 3, label: 'Archivada', value: 'archivada', color: 'gray', icon: 'Archive' }
          ],
          reminderStates: [
            { id: 1, label: 'Activo', value: 'active', color: 'blue', icon: 'Bell' },
            { id: 2, label: 'Completado', value: 'completed', color: 'green', icon: 'Check' },
            { id: 3, label: 'Cancelado', value: 'cancelled', color: 'red', icon: 'X' }
          ],
          globalCategories: [
            { id: 1, label: 'Personal', value: 'personal', color: 'green', icon: 'Home' },
            { id: 2, label: 'Trabajo', value: 'work', color: 'blue', icon: 'Briefcase' },
            { id: 3, label: 'Proyectos', value: 'projects', color: 'purple', icon: 'Flag' },
            { id: 4, label: 'Educación', value: 'education', color: 'indigo', icon: 'Book' }
          ],
          customTags: [
            { id: 1, label: 'Urgente', value: 'urgent', color: 'red', icon: 'AlertCircle' },
            { id: 2, label: 'Importante', value: 'important', color: 'orange', icon: 'Star' },
            { id: 3, label: 'Revisar', value: 'review', color: 'yellow', icon: 'Eye' }
          ],
          apiKeys: {
            openai: '',
            gemini: '',
            claude: '',
            telegram: ''
          },
          preferences: {
            theme: 'light',
            language: 'es',
            notifications: true,
            soundAlerts: true,
            autoSave: true,
            compactMode: false
          },
          limits: {
            maxTokensPerRequest: 4000,
            maxRequestsPerDay: 100,
            maxAudioDuration: 300
          }
        };
        setConfig(defaultConfig);
        localStorage.setItem('jarvi_config', JSON.stringify(defaultConfig));
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar configuración
  const saveConfiguration = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('jarvi_config', JSON.stringify(config));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Emitir evento para que otros módulos se actualicen
      window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
    } catch (error) {
      console.error('Error guardando configuración:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Agregar nuevo item
  const addItem = (type) => {
    const newId = Date.now();
    const itemToAdd = {
      ...newItem,
      id: newId,
      value: newItem.value || newItem.label.toLowerCase().replace(/\s+/g, '_')
    };

    setConfig(prev => ({
      ...prev,
      [type]: [...prev[type], itemToAdd]
    }));

    setNewItem({ label: '', value: '', color: 'blue', icon: 'Circle' });
  };

  // Eliminar item
  const deleteItem = (type, id) => {
    setConfig(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
  };

  // Actualizar item
  const updateItem = (type, id, updates) => {
    setConfig(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
    setEditingItem(null);
  };

  // Exportar configuración
  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `jarvi_config_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Importar configuración
  const importConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target.result);
          setConfig(importedConfig);
          saveConfiguration();
        } catch (error) {
          console.error('Error importando configuración:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Restablecer configuración
  const resetConfig = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer toda la configuración? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('jarvi_config');
      loadConfiguration();
    }
  };

  // Renderizar contenido según sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'task-states':
        return renderStatesList('taskStates', 'Estados de Tareas');
      case 'meeting-states':
        return renderStatesList('meetingStates', 'Estados de Reuniones');
      case 'reminder-states':
        return renderStatesList('reminderStates', 'Estados de Recordatorios');
      case 'categories':
        return renderStatesList('globalCategories', 'Categorías Globales');
      case 'tags':
        return renderStatesList('customTags', 'Tags Personalizados');
      case 'api-keys':
        return renderApiKeys();
      case 'limits':
        return renderLimits();
      case 'appearance':
        return renderAppearance();
      case 'notifications':
        return renderNotifications();
      case 'backup':
      case 'export':
      case 'import':
      case 'reset':
        return renderSystemActions();
      default:
        return renderWelcome();
    }
  };

  // Renderizar lista de estados/categorías
  const renderStatesList = (type, title) => {
    const items = config[type] || [];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={() => saveConfiguration()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>

        {/* Formulario para agregar nuevo */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Nuevo</h4>
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Nombre"
              value={newItem.label}
              onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
              className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Valor (opcional)"
              value={newItem.value}
              onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
              className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newItem.color}
              onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
              className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableColors.map(color => (
                <option key={color.name} value={color.name}>
                  {color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={() => addItem(type)}
              disabled={!newItem.label}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Lista de items */}
        <div className="space-y-2">
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-${item.color}-100 rounded-lg flex items-center justify-center`}>
                  {React.createElement(availableIcons[item.icon] || Circle, {
                    className: `w-5 h-5 text-${item.color}-600`
                  })}
                </div>
                
                {editingItem === item.id ? (
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(type, item.id, { label: e.target.value })}
                    onBlur={() => setEditingItem(null)}
                    onKeyPress={(e) => e.key === 'Enter' && setEditingItem(null)}
                    className="px-2 py-1 text-gray-900 bg-white border border-blue-500 rounded focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">Valor: {item.value}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 bg-${item.color}-100 text-${item.color}-700 rounded-full text-xs font-medium`}>
                  {item.color}
                </span>
                <button
                  onClick={() => setEditingItem(item.id)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteItem(type, item.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay elementos configurados</p>
            <p className="text-sm text-gray-400 mt-1">Agrega uno nuevo usando el formulario de arriba</p>
          </div>
        )}
      </div>
    );
  };

  // Renderizar API Keys
  const renderApiKeys = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">API Keys</h3>
        <button
          onClick={() => saveConfiguration()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Información de Seguridad</p>
            <p className="text-sm text-yellow-700 mt-1">
              Las API Keys se almacenan localmente en tu navegador. Nunca se envían a servidores externos.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
          <input
            type="password"
            value={config.apiKeys.openai}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              apiKeys: { ...prev.apiKeys, openai: e.target.value }
            }))}
            placeholder="sk-..."
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Para transcripción con Whisper y GPT</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
          <input
            type="password"
            value={config.apiKeys.gemini}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              apiKeys: { ...prev.apiKeys, gemini: e.target.value }
            }))}
            placeholder="AIza..."
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Para transcripción y análisis con Gemini</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Claude API Key</label>
          <input
            type="password"
            value={config.apiKeys.claude}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              apiKeys: { ...prev.apiKeys, claude: e.target.value }
            }))}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Para análisis avanzado con Claude</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telegram Bot Token</label>
          <input
            type="password"
            value={config.apiKeys.telegram}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              apiKeys: { ...prev.apiKeys, telegram: e.target.value }
            }))}
            placeholder="123456789:ABC..."
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Token del bot de Telegram</p>
        </div>
      </div>
    </div>
  );

  // Renderizar límites
  const renderLimits = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Límites de Uso</h3>
        <button
          onClick={() => saveConfiguration()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máximo de Tokens por Solicitud
          </label>
          <input
            type="number"
            value={config.limits.maxTokensPerRequest}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              limits: { ...prev.limits, maxTokensPerRequest: parseInt(e.target.value) }
            }))}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Límite de tokens para cada solicitud de IA</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máximo de Solicitudes por Día
          </label>
          <input
            type="number"
            value={config.limits.maxRequestsPerDay}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              limits: { ...prev.limits, maxRequestsPerDay: parseInt(e.target.value) }
            }))}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Número máximo de solicitudes de IA por día</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración Máxima de Audio (segundos)
          </label>
          <input
            type="number"
            value={config.limits.maxAudioDuration}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              limits: { ...prev.limits, maxAudioDuration: parseInt(e.target.value) }
            }))}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Duración máxima permitida para archivos de audio</p>
        </div>
      </div>
    </div>
  );

  // Renderizar apariencia
  const renderAppearance = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Apariencia</h3>
        <button
          onClick={() => saveConfiguration()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tema</label>
          <div className="grid grid-cols-3 gap-3">
            {['light', 'dark', 'auto'].map(theme => (
              <button
                key={theme}
                onClick={() => setConfig(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, theme }
                }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  config.preferences.theme === theme
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  {theme === 'light' && <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />}
                  {theme === 'dark' && <Moon className="w-8 h-8 mx-auto mb-2 text-gray-700" />}
                  {theme === 'auto' && <Monitor className="w-8 h-8 mx-auto mb-2 text-blue-500" />}
                  <p className="text-sm font-medium">
                    {theme === 'light' && 'Claro'}
                    {theme === 'dark' && 'Oscuro'}
                    {theme === 'auto' && 'Automático'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Modo Compacto</span>
            <button
              onClick={() => setConfig(prev => ({
                ...prev,
                preferences: { ...prev.preferences, compactMode: !prev.preferences.compactMode }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.preferences.compactMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.preferences.compactMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
          <p className="text-xs text-gray-500 mt-1">Reduce el espaciado y tamaño de elementos</p>
        </div>
      </div>
    </div>
  );

  // Renderizar notificaciones
  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Notificaciones</h3>
        <button
          onClick={() => saveConfiguration()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Notificaciones del Sistema</span>
            <button
              onClick={() => setConfig(prev => ({
                ...prev,
                preferences: { ...prev.preferences, notifications: !prev.preferences.notifications }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.preferences.notifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
          <p className="text-xs text-gray-500 mt-1">Recibir notificaciones del navegador</p>
        </div>

        <div>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Alertas de Sonido</span>
            <button
              onClick={() => setConfig(prev => ({
                ...prev,
                preferences: { ...prev.preferences, soundAlerts: !prev.preferences.soundAlerts }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.preferences.soundAlerts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.preferences.soundAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
          <p className="text-xs text-gray-500 mt-1">Reproducir sonidos para eventos importantes</p>
        </div>

        <div>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Guardado Automático</span>
            <button
              onClick={() => setConfig(prev => ({
                ...prev,
                preferences: { ...prev.preferences, autoSave: !prev.preferences.autoSave }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.preferences.autoSave ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
          <p className="text-xs text-gray-500 mt-1">Guardar cambios automáticamente</p>
        </div>
      </div>
    </div>
  );

  // Renderizar acciones del sistema
  const renderSystemActions = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Acciones del Sistema</h3>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={exportConfig}
          className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <Download className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-3" />
          <p className="font-medium text-gray-900">Exportar Configuración</p>
          <p className="text-sm text-gray-500 mt-1">Descargar configuración como JSON</p>
        </button>

        <label className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={importConfig}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-gray-400 group-hover:text-green-500 mx-auto mb-3" />
          <p className="font-medium text-gray-900">Importar Configuración</p>
          <p className="text-sm text-gray-500 mt-1">Cargar configuración desde archivo</p>
        </label>

        <button
          onClick={() => {
            const config = JSON.stringify(config, null, 2);
            navigator.clipboard.writeText(config);
            alert('Configuración copiada al portapapeles');
          }}
          className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
        >
          <Archive className="w-12 h-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-3" />
          <p className="font-medium text-gray-900">Crear Respaldo</p>
          <p className="text-sm text-gray-500 mt-1">Copiar configuración al portapapeles</p>
        </button>

        <button
          onClick={resetConfig}
          className="p-6 bg-white border-2 border-red-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
        >
          <RotateCcw className="w-12 h-12 text-red-400 group-hover:text-red-500 mx-auto mb-3" />
          <p className="font-medium text-red-900">Restablecer Todo</p>
          <p className="text-sm text-red-500 mt-1">Volver a configuración por defecto</p>
        </button>
      </div>
    </div>
  );

  // Renderizar bienvenida
  const renderWelcome = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Centro de Configuración</h3>
        <p className="text-gray-500 max-w-md">
          Personaliza estados, categorías, integraciones y preferencias de JARVI desde aquí.
        </p>
      </div>
    </div>
  );

  // Importar iconos necesarios
  const Sun = () => <div className="w-8 h-8 bg-yellow-400 rounded-full" />;
  const Moon = () => <div className="w-8 h-8 bg-gray-800 rounded-full" />;
  const Monitor = () => <div className="w-8 h-8 bg-blue-400 rounded-lg" />;
  const Eye = () => <div className="w-4 h-4 bg-gray-400 rounded-full" />;

  return (
    <div className="space-y-4">
      {/* Header Horizontal Compacto */}
      <div className="bg-gradient-to-r from-gray-500 to-blue-600 rounded-xl px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          {/* Sección Izquierda: Ícono + Título */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Configuración</h2>
              <p className="text-xs text-gray-100">Personaliza tu sistema JARVI</p>
            </div>
          </div>
          
          {/* Sección Central: Estadísticas */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-200" />
              <span className="text-sm font-medium">
                {config.taskStates.length + config.meetingStates.length + config.reminderStates.length} estados
              </span>
            </div>
            <div className="h-4 w-px bg-gray-400/30"></div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-200" />
              <span className="text-sm font-medium">{config.globalCategories.length} categorías</span>
            </div>
            <div className="h-4 w-px bg-gray-400/30"></div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-200" />
              <span className="text-sm font-medium">{config.customTags.length} tags</span>
            </div>
          </div>
          
          {/* Sección Derecha: Estado de guardado */}
          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Guardando...</span>
              </div>
            )}
            {showSuccess && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
                <Check className="w-4 h-4" />
                <span className="text-sm">Guardado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="bg-white rounded-xl shadow-sm flex h-[calc(100vh-200px)]">
        {/* Panel Izquierdo - Menú */}
        <div className="w-72 border-r border-gray-200 p-4 overflow-y-auto">
          {menuSections.map(section => (
            <div key={section.id} className="mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {React.createElement(section.icon, { className: "w-4 h-4" })}
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.count !== undefined && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {item.count}
                        </span>
                      )}
                      {item.status && (
                        <span className="text-xs text-gray-500">{item.status}</span>
                      )}
                      {item.danger && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Panel Derecho - Contenido */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;