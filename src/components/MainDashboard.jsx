import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Mic,
  Bell,
  CheckSquare,
  Users,
  BookOpen,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  Home
} from 'lucide-react';

// Importar todos los módulos
import DashboardStats from './DashboardStats';
import VoiceNotesModule from './VoiceNotesModule';
import RemindersModule from './RemindersModule';
import TodoModule from './TodoModule';
import MeetingsModule from './MeetingsModule';
import InterestsModule from './InterestsModule';

const MainDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const modules = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      component: DashboardStats,
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-500'
    },
    { 
      id: 'voice-notes', 
      name: 'Notas de Voz', 
      icon: Mic, 
      component: VoiceNotesModule,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500'
    },
    { 
      id: 'reminders', 
      name: 'Recordatorios', 
      icon: Bell, 
      component: RemindersModule,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-500'
    },
    { 
      id: 'todos', 
      name: 'Tareas', 
      icon: CheckSquare, 
      component: TodoModule,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500'
    },
    { 
      id: 'meetings', 
      name: 'Reuniones', 
      icon: Users, 
      component: MeetingsModule,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      borderColor: 'border-green-500'
    },
    { 
      id: 'interests', 
      name: 'Intereses', 
      icon: BookOpen, 
      component: InterestsModule,
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-500'
    }
  ];

  const currentModule = modules.find(m => m.id === activeModule);
  const ModuleComponent = currentModule?.component;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-40"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">JARVI</h1>
                <p className="text-xs text-gray-500">Sistema Inteligente</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          <div className="space-y-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? `${module.bgColor} ${module.textColor} shadow-md`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? module.textColor : 'text-gray-400'}`} />
                  <span className="font-medium">{module.name}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Estadísticas rápidas en el sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Estado</span>
              <span className="text-green-600 font-medium">● Activo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Módulos</span>
              <span className="text-gray-900 font-medium">6 activos</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sincronización</span>
              <span className="text-blue-600 font-medium">Telegram ✓</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Botón para abrir sidebar cuando está cerrado */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 p-3 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {/* Contenido principal */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        {/* Header del módulo actual */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Menu className="w-6 h-6 text-gray-700" />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <div className={`p-3 ${currentModule.bgColor} rounded-xl`}>
                    {React.createElement(currentModule.icon, {
                      className: `w-6 h-6 ${currentModule.textColor}`
                    })}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentModule.name}</h2>
                    <p className="text-sm text-gray-500">
                      {activeModule === 'dashboard' && 'Vista general del sistema'}
                      {activeModule === 'voice-notes' && 'Gestiona tus notas de voz'}
                      {activeModule === 'reminders' && 'Administra tus recordatorios'}
                      {activeModule === 'todos' && 'Organiza tus tareas pendientes'}
                      {activeModule === 'meetings' && 'Registro de reuniones'}
                      {activeModule === 'interests' && 'Guarda contenido interesante'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Actualizar
                </button>
                <button className={`px-4 py-2 ${currentModule.bgColor} ${currentModule.textColor} rounded-lg hover:opacity-90 transition-opacity`}>
                  Nueva Entrada
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido del módulo */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {ModuleComponent && <ModuleComponent />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Overlay para móviles cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainDashboard;