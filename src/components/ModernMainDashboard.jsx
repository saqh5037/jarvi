import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight
} from 'lucide-react';

// Importar todos los módulos
import DashboardStats from './DashboardStats';
import EnhancedVoiceNotesModule from './EnhancedVoiceNotesModule';
import RemindersModule from './RemindersModule';
import TodoModuleFixed from './TodoModuleFixed';
import EnhancedMeetingsModule from './EnhancedMeetingsModule';
import InterestsModule from './InterestsModule';
import SettingsModule from './SettingsModule';

const ModernMainDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const modules = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      component: DashboardStats,
      description: 'Vista general y estadísticas',
      gradient: 'from-blue-500 to-indigo-600',
      stats: '15 actualizaciones'
    },
    { 
      id: 'voice-notes', 
      name: 'Notas de Voz', 
      icon: Mic, 
      component: EnhancedVoiceNotesModule,
      description: 'Transcripción automática con IA',
      gradient: 'from-purple-500 to-pink-600',
      stats: 'IA activa'
    },
    { 
      id: 'reminders', 
      name: 'Recordatorios', 
      icon: Bell, 
      component: RemindersModule,
      description: 'Alertas y notificaciones',
      gradient: 'from-orange-500 to-red-600',
      stats: '3 pendientes'
    },
    { 
      id: 'todos', 
      name: 'Tareas', 
      icon: CheckSquare, 
      component: TodoModuleFixed,
      description: 'Lista de tareas pendientes',
      gradient: 'from-green-500 to-emerald-600',
      stats: '12 por hacer'
    },
    { 
      id: 'meetings', 
      name: 'Reuniones', 
      icon: Users, 
      component: EnhancedMeetingsModule,
      description: 'Gestión de reuniones',
      gradient: 'from-cyan-500 to-blue-600',
      stats: '2 esta semana'
    },
    { 
      id: 'interests', 
      name: 'Intereses', 
      icon: BookOpen, 
      component: InterestsModule,
      description: 'Artículos y contenido guardado',
      gradient: 'from-yellow-500 to-orange-600',
      stats: '24 guardados'
    },
    { 
      id: 'settings', 
      name: 'Configuración', 
      icon: Settings, 
      component: SettingsModule,
      description: 'Personaliza tu sistema',
      gradient: 'from-gray-500 to-blue-600',
      stats: 'Sistema'
    }
  ];

  const currentModule = modules.find(m => m.id === activeModule);
  const ModuleComponent = currentModule?.component;

  // Filtrar módulos por búsqueda
  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex" style={{backgroundColor: '#f9fafb'}}>
      {/* Sidebar */}
      <motion.div 
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-lg`}
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
                  onClick={() => setActiveModule(module.id)}
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
                  
                  <div className={`p-2 bg-gradient-to-r ${module.gradient} rounded-lg flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
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

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col">
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
    </div>
  );
};

export default ModernMainDashboard;