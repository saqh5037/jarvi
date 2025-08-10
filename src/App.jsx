import React, { useState } from 'react'
import MainLayout from './components/layout/MainLayout'
import { JarviProvider } from './context/JarviContext'
import JarviChat from './components/JarviChat'
import EnhancedDashboard from './components/EnhancedDashboard'
import ModernDashboard from './components/ModernDashboard'
import CleanModernDashboard from './components/CleanModernDashboard'
import DashboardStatsDynamic from './components/DashboardStatsDynamic'
import DashboardStats from './components/DashboardStats'
import MainDashboard from './components/MainDashboard'
import ModernMainDashboard from './components/ModernMainDashboard'
import TasksModule from './components/TasksModule'
import TasksModuleTest from './components/TasksModuleTest'
import TasksModuleNew from './components/TasksModuleNew'
import TasksModuleSimple from './components/TasksModuleSimple'

/**
 * Componente principal de la aplicación Jarvi
 * Centro de Comando Empresarial Multi-IA
 */
function App() {
  const [view, setView] = useState('main') // 'chat', 'dashboard', 'enhanced', 'modern', 'clean', 'stats', 'main', 'tasks'
  
  // Botones de navegación
  const NavigationButtons = () => (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => setView('tasks')}
        className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
          view === 'tasks' 
            ? 'bg-green-500/30 border border-green-500 text-green-300' 
            : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-700/50'
        }`}
      >
        TAREAS
      </button>
      <button
        onClick={() => setView('stats')}
        className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
          view === 'stats' 
            ? 'bg-purple-500/30 border border-purple-500 text-purple-300' 
            : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-700/50'
        }`}
      >
        ESTADÍSTICAS
      </button>
      <button
        onClick={() => setView('modern')}
        className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
          view === 'modern' 
            ? 'bg-indigo-500/30 border border-indigo-500 text-indigo-300' 
            : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-700/50'
        }`}
      >
        MODERN
      </button>
      <button
        onClick={() => setView('chat')}
        className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
          view === 'chat' 
            ? 'bg-cyan-500/30 border border-cyan-500 text-cyan-300' 
            : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-700/50'
        }`}
      >
        CHAT
      </button>
      <button
        onClick={() => setView('enhanced')}
        className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
          view === 'enhanced' 
            ? 'bg-cyan-500/30 border border-cyan-500 text-cyan-300' 
            : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-700/50'
        }`}
      >
        IRON MAN
      </button>
      <button
        onClick={() => setView('dashboard')}
        className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
          view === 'dashboard' 
            ? 'bg-cyan-500/30 border border-cyan-500 text-cyan-300' 
            : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-700/50'
        }`}
      >
        CLASSIC
      </button>
    </div>
  )
  
  return (
    <>
      {/* <NavigationButtons /> */}
      {view === 'tasks' && <TasksModuleSimple />}
      {view === 'main' && <ModernMainDashboard />}
      {view === 'stats' && <DashboardStatsDynamic />}
      {view === 'clean' && <CleanModernDashboard />}
      {view === 'modern' && <ModernDashboard />}
      {view === 'chat' && <JarviChat />}
      {view === 'enhanced' && <EnhancedDashboard />}
      {view === 'dashboard' && (
        <JarviProvider>
          <MainLayout />
        </JarviProvider>
      )}
    </>
  )
}

export default App
