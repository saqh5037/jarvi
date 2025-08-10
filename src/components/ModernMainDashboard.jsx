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

const ModernMainDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{backgroundColor: '#f9fafb'}}>
      {/* Header Superior */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  JARVI System
                </h1>
                <p className="text-sm text-gray-500">Centro de Control Inteligente</p>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar módulo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de Módulos - Estilo Tarjetas */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            
            return (
              <motion.button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-4 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white shadow-xl ring-2 ring-blue-500 ring-offset-2'
                    : 'bg-white shadow-md hover:shadow-lg'
                }`}
              >
                {/* Indicador activo */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                  />
                )}
                
                <div className={`p-3 bg-gradient-to-r ${module.gradient} rounded-lg mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {module.name}
                </h3>
                
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {module.description}
                </p>
                
                <div className="text-xs font-medium text-blue-600">
                  {module.stats}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Breadcrumb / Ruta actual */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span>Inicio</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-gray-900">{currentModule?.name}</span>
        </div>

        {/* Contenido del Módulo Actual */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            {/* Header del módulo con acciones */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-gradient-to-r ${currentModule.gradient} rounded-xl`}>
                  {React.createElement(currentModule.icon, {
                    className: "w-6 h-6 text-white"
                  })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{currentModule.name}</h2>
                  <p className="text-sm text-gray-500">{currentModule.description}</p>
                </div>
              </div>

              {/* Acciones del módulo se manejan dentro de cada componente */}
            </div>

            {/* Contenido del módulo */}
            <div className="min-h-[500px]">
              {ModuleComponent && <ModuleComponent />}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer con estadísticas rápidas */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Registros</p>
                <p className="text-2xl font-bold text-gray-900">247</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completados Hoy</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <CheckSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">34</p>
              </div>
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sincronizado</p>
                <p className="text-2xl font-bold text-green-600">✓</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernMainDashboard;