import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MetricsPanel from '../dashboard/MetricsPanel';
import MakeConfigPanel from '../dashboard/MakeConfigPanel';
import ActivityLogsPanel from '../dashboard/ActivityLogsPanel';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

/**
 * Layout principal del Centro de Comando Jarvi
 * Organiza todos los componentes en una estructura responsiva
 */
const MainLayout = () => {
  const [showMakeConfig, setShowMakeConfig] = useState(false);
  const [activeView, setActiveView] = useState('metrics'); // metrics, logs
  return (
    <div className="min-h-screen w-full flex flex-col jarvi-grid">
      {/* Efectos de fondo animados */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-jarvi-blue/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-jarvi-accent/10 rounded-full blur-3xl"
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <Header />

        {/* Contenedor principal con Sidebar y Panel de Métricas */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar onOpenConfig={() => setShowMakeConfig(true)} />
          <main className="flex-1 overflow-y-auto">
            {/* Tabs de navegación */}
            <div className="border-b border-jarvi-blue/20 px-6 py-2">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveView('metrics')}
                  className={`px-3 py-1.5 text-sm font-tech transition-all ${
                    activeView === 'metrics'
                      ? 'text-jarvi-blue border-b-2 border-jarvi-blue'
                      : 'text-gray-400 hover:text-jarvi-blue'
                  }`}
                >
                  MÉTRICAS
                </button>
                <button
                  onClick={() => setActiveView('logs')}
                  className={`px-3 py-1.5 text-sm font-tech transition-all ${
                    activeView === 'logs'
                      ? 'text-jarvi-blue border-b-2 border-jarvi-blue'
                      : 'text-gray-400 hover:text-jarvi-blue'
                  }`}
                >
                  ACTIVIDAD
                </button>
              </div>
            </div>
            
            {/* Vistas */}
            {activeView === 'metrics' && <MetricsPanel />}
            {activeView === 'logs' && <ActivityLogsPanel />}
          </main>
        </div>

        {/* Modal de configuración de Make */}
        <MakeConfigPanel 
          isOpen={showMakeConfig} 
          onClose={() => setShowMakeConfig(false)} 
        />

        {/* Sistema de notificaciones */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0A0E27',
              color: '#fff',
              border: '1px solid #00E5FF',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#00E5FF',
                secondary: '#0A0E27',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF6B35',
                secondary: '#0A0E27',
              },
            },
          }}
        />

        {/* Footer con información adicional */}
        <motion.footer
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="h-10 jarvi-glass jarvi-border px-6 flex items-center justify-between"
        >
          <div className="flex items-center space-x-6">
            <span className="text-xs text-jarvi-blue/70 font-tech">v1.0.0</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-jarvi-blue/70">Modo: PRODUCCIÓN</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-jarvi-blue/70">Latencia: 12ms</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-tech">TODOS LOS SISTEMAS OPERATIVOS</span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default MainLayout;