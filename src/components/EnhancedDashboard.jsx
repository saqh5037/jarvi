import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  Shield, 
  Zap,
  Terminal,
  Brain,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import CircularProgress from './HUD/CircularProgress';
import HolographicCard from './HUD/HolographicCard';
import RealtimeChart from './Charts/RealtimeChart';
import JarviChat from './JarviChat';
import '../styles/jarvis-theme.css';

const EnhancedDashboard = () => {
  const [systemStatus, setSystemStatus] = useState('INITIALIZING');
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 67,
    network: 82,
    security: 95,
    aiStatus: 78,
    performance: 89
  });
  
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'High network traffic detected', time: '2 min ago' },
    { id: 2, type: 'info', message: 'System update available', time: '5 min ago' },
    { id: 3, type: 'success', message: 'AI Gem connected successfully', time: '10 min ago' }
  ]);
  
  const [aiGems, setAiGems] = useState([
    { name: 'Claude', status: 'online', tasks: 12, efficiency: 98 },
    { name: 'GPT-4', status: 'online', tasks: 8, efficiency: 95 },
    { name: 'Gemini', status: 'idle', tasks: 3, efficiency: 92 },
    { name: 'LLaMA', status: 'processing', tasks: 15, efficiency: 88 },
    { name: 'Mistral', status: 'online', tasks: 6, efficiency: 94 }
  ]);
  
  useEffect(() => {
    // Sistema de inicialización
    const initTimer = setTimeout(() => {
      setSystemStatus('ONLINE');
    }, 2000);
    
    // Actualización de métricas
    const metricsInterval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(20, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(100, prev.memory + (Math.random() - 0.5) * 8)),
        network: Math.max(40, Math.min(100, prev.network + (Math.random() - 0.5) * 15)),
        security: Math.max(80, Math.min(100, prev.security + (Math.random() - 0.5) * 5)),
        aiStatus: Math.max(60, Math.min(100, prev.aiStatus + (Math.random() - 0.5) * 12)),
        performance: Math.max(70, Math.min(100, prev.performance + (Math.random() - 0.5) * 7))
      }));
    }, 3000);
    
    return () => {
      clearTimeout(initTimer);
      clearInterval(metricsInterval);
    };
  }, []);
  
  return (
    <div className="min-h-screen scanline-effect" style={{
      background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 100%)',
      fontFamily: 'Exo 2, sans-serif'
    }}>
      {/* Header Principal */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden"
      >
        <div className="glass-panel m-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="loading-arc"
                style={{ width: 50, height: 50 }}
              />
              <div>
                <h1 className="text-display glitch" data-text="J.A.R.V.I.S.">
                  J.A.R.V.I.S.
                </h1>
                <p className="text-label">MULTI-AI COMMAND CENTER</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-data">{new Date().toLocaleDateString()}</div>
                <div className="text-data">{new Date().toLocaleTimeString()}</div>
              </div>
              <div className={`px-4 py-2 rounded-lg neon-border ${
                systemStatus === 'ONLINE' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                <span className="text-label">STATUS:</span>
                <span className="ml-2 font-bold">{systemStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Grid Principal */}
      <div className="hud-grid hud-grid-3 px-4">
        {/* Panel de Métricas */}
        <HolographicCard 
          title="SYSTEM METRICS" 
          icon={Activity}
          status={metrics.cpu > 80 ? 'warning' : 'normal'}
        >
          <div className="grid grid-cols-3 gap-4">
            <CircularProgress 
              value={Math.round(metrics.cpu)} 
              label="CPU" 
              color="#00FFCC"
              criticalThreshold={80}
              size={100}
            />
            <CircularProgress 
              value={Math.round(metrics.memory)} 
              label="MEMORY" 
              color="#00CCFF"
              criticalThreshold={85}
              size={100}
            />
            <CircularProgress 
              value={Math.round(metrics.network)} 
              label="NETWORK" 
              color="#FFCC00"
              criticalThreshold={90}
              size={100}
            />
          </div>
        </HolographicCard>
        
        {/* Panel de AI Gems */}
        <HolographicCard 
          title="AI GEMS STATUS" 
          icon={Brain}
          status="normal"
        >
          <div className="space-y-3">
            {aiGems.map((gem, index) => (
              <motion.div
                key={gem.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 rounded-lg"
                style={{
                  background: 'rgba(0, 255, 204, 0.05)',
                  border: '1px solid rgba(0, 255, 204, 0.2)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    gem.status === 'online' ? 'bg-green-400' :
                    gem.status === 'processing' ? 'bg-yellow-400' :
                    'bg-gray-400'
                  } animate-pulse`} />
                  <span className="text-sm font-mono">{gem.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">Tasks: {gem.tasks}</span>
                  <span className="text-cyan-400">{gem.efficiency}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </HolographicCard>
        
        {/* Panel de Alertas */}
        <HolographicCard 
          title="SYSTEM ALERTS" 
          icon={AlertTriangle}
          status={alerts.some(a => a.type === 'warning') ? 'warning' : 'normal'}
        >
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <AnimatePresence>
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                    alert.type === 'warning' ? 'alert-critical' :
                    alert.type === 'success' ? 'bg-green-900/20 border border-green-500/30' :
                    'bg-blue-900/20 border border-blue-500/30'
                  }`}
                >
                  <div className={`w-1 h-full ${
                    alert.type === 'warning' ? 'bg-yellow-400' :
                    alert.type === 'success' ? 'bg-green-400' :
                    'bg-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-gray-200">{alert.message}</p>
                    <p className="text-gray-500 text-xs mt-1">{alert.time}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </HolographicCard>
      </div>
      
      {/* Gráficos en Tiempo Real */}
      <div className="hud-grid hud-grid-2 px-4 mt-4">
        <div className="glass-panel p-4">
          <RealtimeChart 
            title="NETWORK TRAFFIC" 
            dataStreams={2}
            updateInterval={1000}
            height={250}
          />
        </div>
        
        <div className="glass-panel p-4">
          <RealtimeChart 
            title="AI PROCESSING LOAD" 
            type="line"
            dataStreams={3}
            updateInterval={1500}
            height={250}
          />
        </div>
      </div>
      
      {/* Panel de Control y Chat */}
      <div className="hud-grid hud-grid-2 px-4 mt-4">
        <HolographicCard 
          title="COMMAND TERMINAL" 
          icon={Terminal}
          status="normal"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-neon text-sm">SCAN NETWORK</button>
              <button className="btn-neon text-sm">UPDATE SYSTEM</button>
              <button className="btn-neon text-sm">RUN DIAGNOSTICS</button>
              <button className="btn-neon text-sm">DEPLOY AI</button>
            </div>
            
            <div className="mt-4 p-3 rounded-lg" style={{
              background: 'rgba(0, 255, 204, 0.05)',
              border: '1px solid rgba(0, 255, 204, 0.2)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-mono">QUICK STATS</span>
                <Zap size={14} className="text-cyan-400" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Uptime: 99.9%</div>
                <div>Response: 12ms</div>
                <div>Requests: 1.2K/s</div>
                <div>Errors: 0.01%</div>
              </div>
            </div>
          </div>
        </HolographicCard>
        
        {/* Chat Component */}
        <div className="glass-panel p-4">
          <JarviChat />
        </div>
      </div>
      
      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 p-4 text-center"
      >
        <div className="text-xs text-gray-500 font-mono">
          JARVIS SYSTEM v2.0 | IRON MAN INTERFACE | MAKE.COM INTEGRATED
        </div>
      </motion.footer>
    </div>
  );
};

export default EnhancedDashboard;