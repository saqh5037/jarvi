import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  LayoutDashboard,
  Mic,
  Bell,
  CheckSquare,
  Users,
  BookOpen,
  Activity,
  TrendingUp,
  Calendar,
  Settings,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Monitor,
  Archive,
  Timer,
  Layout
} from 'lucide-react';

// Importar todos los módulos
import DashboardStats from './DashboardStats';
import EnhancedVoiceNotesModule from './EnhancedVoiceNotesModule';
import RemindersModule from './RemindersModule';
import TodoModule from './TodoModule';
import EnhancedMeetingsModule from './EnhancedMeetingsModule';
import InterestsModule from './InterestsModule';
import SettingsModule from './SettingsModule';
import ProjectChronologyModule from './ProjectChronologyModule';
import PresentationsModule from './PresentationsModule';
import GeneralArchiveModule from './GeneralArchiveModule';
import PomodoroModuleV2 from './PomodoroModuleV2';
import KanbanModule from './KanbanModule';
import { PomodoroProvider } from './PomodoroWidget';

// Componente Badge tipo iOS con animaciones mejoradas
const NotificationBadge = ({ count, color = 'bg-red-500', maxCount = 99 }) => {
  const [prevCount, setPrevCount] = useState(count);
  
  useEffect(() => {
    if (count !== prevCount && count > prevCount) {
      // Trigger pulse animation when count increases
      setPrevCount(count);
    }
  }, [count, prevCount]);
  
  if (count <= 0) return null;
  
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  
  return (
    <motion.div
      key={count} // Force re-animation when count changes
      initial={{ scale: 0 }}
      animate={{ 
        scale: [1, 1.2, 1],
        transition: { 
          scale: {
            times: [0, 0.5, 1],
            duration: 0.3
          }
        }
      }}
      exit={{ scale: 0 }}
      className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1 ${color} text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white`}
      style={{
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
      }}
    >
      <motion.span
        key={displayCount}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {displayCount}
      </motion.span>
    </motion.div>
  );
};

const ModernMainDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingModuleChange, setPendingModuleChange] = useState(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [moduleStats, setModuleStats] = useState({
    todos: { pending: 0, today: 0 },
    reminders: { active: 0 },
    voiceNotes: { count: 0, unprocessed: 0 },
    meetings: { upcoming: 0 },
    interests: { unread: 0 },
    dashboard: { notifications: 0 },
    chronology: { new: 0 },
    settings: { updates: 0 },
    archived: { total: 0 },
    pomodoro: { active: false },
    kanban: { inProgress: 0 }
  });

  const modules = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      component: DashboardStats,
      description: 'Vista general y estadísticas',
      gradient: 'from-blue-500 to-indigo-600',
      stats: moduleStats.dashboard.notifications > 0 
        ? `${moduleStats.dashboard.notifications} notificaciones`
        : 'Vista general'
    },
    { 
      id: 'voice-notes', 
      name: 'Notas de Voz', 
      icon: Mic, 
      component: EnhancedVoiceNotesModule,
      description: 'Transcripción automática con IA',
      gradient: 'from-purple-500 to-pink-600',
      stats: moduleStats.voiceNotes.unprocessed > 0
        ? `${moduleStats.voiceNotes.unprocessed} sin procesar`
        : `${moduleStats.voiceNotes.count} notas`
    },
    { 
      id: 'reminders', 
      name: 'Recordatorios', 
      icon: Bell, 
      component: RemindersModule,
      description: 'Alertas y notificaciones',
      gradient: 'from-orange-500 to-red-600',
      stats: moduleStats.reminders.active > 0
        ? `${moduleStats.reminders.active} activos`
        : 'Sin recordatorios'
    },
    { 
      id: 'todos', 
      name: 'Tareas', 
      icon: CheckSquare, 
      component: TodoModule,
      description: 'Lista de tareas pendientes',
      gradient: 'from-green-500 to-emerald-600',
      stats: moduleStats.todos.pending > 0
        ? `${moduleStats.todos.pending} por hacer`
        : 'Sin tareas'
    },
    { 
      id: 'meetings', 
      name: 'Reuniones', 
      icon: Users, 
      component: EnhancedMeetingsModule,
      description: 'Gestión de reuniones',
      gradient: 'from-cyan-500 to-blue-600',
      stats: moduleStats.meetings.upcoming > 0
        ? `${moduleStats.meetings.upcoming} esta semana`
        : 'Sin reuniones'
    },
    { 
      id: 'interests', 
      name: 'Intereses', 
      icon: BookOpen, 
      component: InterestsModule,
      description: 'Artículos y contenido guardado',
      gradient: 'from-yellow-500 to-orange-600',
      stats: moduleStats.interests.unread > 0
        ? `${moduleStats.interests.unread} sin leer`
        : 'Todo leído'
    },
    { 
      id: 'chronology', 
      name: 'Cronología', 
      icon: Clock, 
      component: ProjectChronologyModule,
      description: 'Historial de proyectos y aprendizajes',
      gradient: 'from-indigo-500 to-purple-600',
      stats: moduleStats.chronology.new > 0
        ? `${moduleStats.chronology.new} nuevos`
        : 'Historial'
    },
    { 
      id: 'presentations', 
      name: 'Presentaciones', 
      icon: Monitor, 
      component: PresentationsModule,
      description: 'Crea presentaciones impactantes con IA',
      gradient: 'from-purple-500 to-pink-500',
      stats: '0 presentaciones'
    },
    { 
      id: 'pomodoro', 
      name: 'Pomodoro', 
      icon: Timer, 
      component: PomodoroModuleV2,
      description: 'Gestión del tiempo con técnica Pomodoro',
      gradient: 'from-red-500 to-orange-600',
      stats: moduleStats.pomodoro?.active 
        ? 'Sesión activa'
        : 'Iniciar sesión'
    },
    { 
      id: 'kanban', 
      name: 'Kanban', 
      icon: Layout, 
      component: KanbanModule,
      description: 'Tablero visual para seguimiento de tareas',
      gradient: 'from-indigo-500 to-purple-600',
      stats: moduleStats.kanban?.inProgress > 0 
        ? `${moduleStats.kanban.inProgress} en progreso`
        : 'Ver tablero'
    },
    { 
      id: 'archived', 
      name: 'Archivo', 
      icon: Archive, 
      component: GeneralArchiveModule,
      description: 'Centro de archivos: tareas y notas de voz',
      gradient: 'from-gray-500 to-gray-700',
      stats: moduleStats.archived?.total > 0 
        ? `${moduleStats.archived.total} archivadas`
        : 'Historial de tareas'
    },
    { 
      id: 'settings', 
      name: 'Configuración', 
      icon: Settings, 
      component: SettingsModule,
      description: 'Personaliza tu sistema',
      gradient: 'from-gray-500 to-blue-600',
      stats: moduleStats.settings.updates > 0
        ? `${moduleStats.settings.updates} actualizaciones`
        : 'Sistema'
    }
  ];

  // Función para cargar estadísticas
  const loadStats = async () => {
    console.log('🔄 Cargando estadísticas de módulos...');
    try {
        // Cargar tareas
        const tasksResponse = await fetch('http://localhost:3003/api/tasks');
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          if (tasksData.success && tasksData.tasks) {
            const pendingTasks = tasksData.tasks.filter(t => t.status !== 'completed');
            const todayTasks = tasksData.tasks.filter(t => {
              if (!t.dueDate || t.status === 'completed') return false;
              const today = new Date().toDateString();
              const taskDate = new Date(t.dueDate).toDateString();
              return today === taskDate;
            });
            
            setModuleStats(prev => ({
              ...prev,
              todos: {
                pending: pendingTasks.length,
                today: todayTasks.length
              }
            }));
          }
        }

        // Cargar recordatorios
        const remindersResponse = await fetch('http://localhost:3002/api/reminders');
        if (remindersResponse.ok) {
          const remindersData = await remindersResponse.json();
          if (remindersData.reminders) {
            const activeReminders = remindersData.reminders.filter(r => r.active !== false);
            setModuleStats(prev => ({
              ...prev,
              reminders: { active: activeReminders.length }
            }));
          }
        }

        // Cargar reuniones
        const meetingsResponse = await fetch('http://localhost:3002/api/meetings');
        if (meetingsResponse.ok) {
          const meetingsData = await meetingsResponse.json();
          if (meetingsData.meetings) {
            const now = new Date();
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const upcomingMeetings = meetingsData.meetings.filter(m => {
              const meetingDate = new Date(m.date);
              return meetingDate >= now && meetingDate <= weekFromNow;
            });
            setModuleStats(prev => ({
              ...prev,
              meetings: { upcoming: upcomingMeetings.length }
            }));
          }
        }

        // Cargar notas de voz
        const voiceNotesResponse = await fetch('http://localhost:3001/api/voice-notes');
        if (voiceNotesResponse.ok) {
          const voiceNotesData = await voiceNotesResponse.json();
          if (voiceNotesData.notes) {
            const unprocessedNotes = voiceNotesData.notes.filter(n => !n.processed);
            console.log('📊 Notas de voz - Total:', voiceNotesData.notes.length, 'Pendientes:', unprocessedNotes.length);
            setModuleStats(prev => ({
              ...prev,
              voiceNotes: {
                count: voiceNotesData.notes.length,
                unprocessed: unprocessedNotes.length
              }
            }));
          }
        }

        // Cargar intereses
        const interestsResponse = await fetch('http://localhost:3001/api/interests');
        if (interestsResponse.ok) {
          const interestsData = await interestsResponse.json();
          if (interestsData.interests) {
            const unreadInterests = interestsData.interests.filter(i => !i.read);
            setModuleStats(prev => ({
              ...prev,
              interests: { unread: unreadInterests.length }
            }));
          }
        }

        // Cargar estadísticas de tareas archivadas
        const archivedStatsResponse = await fetch('http://localhost:3003/api/tasks/archived/stats');
        if (archivedStatsResponse.ok) {
          const archivedData = await archivedStatsResponse.json();
          if (archivedData.stats) {
            setModuleStats(prev => ({
              ...prev,
              archived: { total: archivedData.stats.total || 0 }
            }));
          }
        }

        // Simular notificaciones del dashboard
        setModuleStats(prev => ({
          ...prev,
          dashboard: { 
            notifications: Math.max(0, 
              prev.todos.pending + 
              prev.reminders.active + 
              (prev.meetings.upcoming > 0 ? 1 : 0)
            )
          }
        }));

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Cargar estadísticas reales
  useEffect(() => {
    // Cargar estadísticas al inicio
    loadStats();

    // Actualizar cada 30 segundos
    const interval = setInterval(loadStats, 30000);

    // Conectar con WebSocket para actualizaciones en tiempo real
    const socket = io('http://localhost:3003');
    const voiceSocket = io('http://localhost:3001');
    
    socket.on('task-created', loadStats);
    socket.on('task-updated', loadStats);
    socket.on('task-deleted', loadStats);
    socket.on('task-completed', loadStats);
    
    // Eventos de notas de voz
    voiceSocket.on('new-voice-note', loadStats);
    voiceSocket.on('voice-note-processed-updated', loadStats);
    voiceSocket.on('voice-note-deleted', loadStats);

    return () => {
      clearInterval(interval);
      socket.disconnect();
      voiceSocket.disconnect();
    };
  }, []);
  
  // Recargar estadísticas cuando cambia el estado del sidebar
  useEffect(() => {
    if (sidebarCollapsed) {
      // Pequeño delay para asegurar que el DOM esté actualizado
      setTimeout(loadStats, 100);
    }
  }, [sidebarCollapsed]);

  const currentModule = modules.find(m => m.id === activeModule);
  const ModuleComponent = currentModule?.component;

  // Filtrar módulos por búsqueda
  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PomodoroProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex relative" style={{backgroundColor: '#f9fafb'}}>
        {/* Sidebar - Fixed/Sticky */}
      <motion.div 
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-lg fixed top-0 left-0 h-screen z-40`}
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 288 }}
      >
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex-shrink-0">
                <Activity className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    JARVI System
                  </h1>
                  <p className="text-xs text-gray-500">Control Inteligente</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${sidebarCollapsed ? 'mx-auto mt-2' : ''}`}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda en Sidebar */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar módulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* Módulos en Sidebar */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {filteredModules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              
              return (
                <motion.button
                  key={module.id}
                  onClick={() => {
                    // Verificar si estamos saliendo del módulo de Settings con cambios sin guardar
                    if (activeModule === 'settings' && module.id !== 'settings') {
                      // Verificar si hay cambios sin guardar en Settings
                      try {
                        const savedConfig = localStorage.getItem('jarvi-global-config');
                        const currentConfig = window.jarviCurrentConfig;
                        
                        if (currentConfig && savedConfig) {
                          const hasChanges = JSON.stringify(JSON.parse(savedConfig)) !== JSON.stringify(currentConfig);
                          if (hasChanges) {
                            setPendingModuleChange(module.id);
                            setShowUnsavedChangesModal(true);
                            return;
                          }
                        }
                      } catch (error) {
                        console.error('Error checking for unsaved changes:', error);
                      }
                    }
                    setActiveModule(module.id);
                  }}
                  whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Indicador activo */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"
                    />
                  )}
                  
                  <div className={`p-2 bg-gradient-to-r ${module.gradient} rounded-lg flex-shrink-0 relative`}>
                    <Icon className="w-5 h-5 text-white" />
                    
                    {/* Badge de notificación tipo iOS para menú contraído */}
                    <AnimatePresence>
                      {sidebarCollapsed && (
                        <>
                          {/* Dashboard - Notificaciones totales */}
                          {module.id === 'dashboard' && (
                            <NotificationBadge 
                              count={moduleStats.dashboard.notifications} 
                              color="bg-blue-500" 
                            />
                          )}
                          
                          {/* Tareas pendientes */}
                          {module.id === 'todos' && (
                            <NotificationBadge 
                              count={moduleStats.todos.pending} 
                              color="bg-red-500" 
                            />
                          )}
                          
                          {/* Recordatorios activos */}
                          {module.id === 'reminders' && (
                            <NotificationBadge 
                              count={moduleStats.reminders.active} 
                              color="bg-orange-500" 
                            />
                          )}
                          
                          {/* Reuniones próximas */}
                          {module.id === 'meetings' && (
                            <NotificationBadge 
                              count={moduleStats.meetings.upcoming} 
                              color="bg-cyan-500" 
                            />
                          )}
                          
                          {/* Notas de voz sin procesar */}
                          {module.id === 'voice-notes' && (
                            <NotificationBadge 
                              count={moduleStats.voiceNotes.unprocessed} 
                              color="bg-purple-500" 
                            />
                          )}
                          
                          {/* Intereses no leídos */}
                          {module.id === 'interests' && (
                            <NotificationBadge 
                              count={moduleStats.interests.unread} 
                              color="bg-yellow-500" 
                            />
                          )}
                          
                          {/* Cronología - nuevos items */}
                          {module.id === 'chronology' && moduleStats.chronology.new > 0 && (
                            <NotificationBadge 
                              count={moduleStats.chronology.new} 
                              color="bg-indigo-500" 
                            />
                          )}
                          
                          {/* Configuración - actualizaciones disponibles */}
                          {module.id === 'settings' && moduleStats.settings.updates > 0 && (
                            <NotificationBadge 
                              count={moduleStats.settings.updates} 
                              color="bg-gray-600" 
                            />
                          )}
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <h3 className={`font-semibold text-sm ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                        {module.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {module.description}
                      </p>
                    </div>
                  )}

                  {!sidebarCollapsed && (
                    <div className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      {module.stats}
                    </div>
                  )}

                  {/* Tooltip para sidebar colapsado */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      <div className="font-medium">{module.name}</div>
                      <div className="text-xs text-gray-300">{module.stats}</div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

      </motion.div>

      {/* Área Principal de Contenido - con margen para el sidebar fijo */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        {/* Contenido del Módulo - Sin headers redundantes */}
        <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {/* Contenido del módulo directamente */}
              {ModuleComponent && <ModuleComponent />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de cambios sin guardar */}
      <AnimatePresence>
        {showUnsavedChangesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowUnsavedChangesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Bell className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Cambios sin guardar
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tienes cambios sin guardar en la configuración
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Qué deseas hacer con los cambios realizados?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    // Disparar evento para que Settings guarde
                    window.dispatchEvent(new CustomEvent('save-settings-and-continue'));
                    setTimeout(() => {
                      setActiveModule(pendingModuleChange);
                      setShowUnsavedChangesModal(false);
                      setPendingModuleChange(null);
                    }, 500);
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <CheckSquare className="w-5 h-5" />
                  Guardar y continuar
                </button>

                <button
                  onClick={() => {
                    // Descartar cambios y continuar
                    window.dispatchEvent(new CustomEvent('discard-settings-changes'));
                    setActiveModule(pendingModuleChange);
                    setShowUnsavedChangesModal(false);
                    setPendingModuleChange(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Descartar cambios
                </button>

                <button
                  onClick={() => {
                    setShowUnsavedChangesModal(false);
                    setPendingModuleChange(null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PomodoroProvider>
  );
};

export default ModernMainDashboard;