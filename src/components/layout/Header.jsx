import { motion } from 'framer-motion';
import { Activity, Wifi, Battery, Clock, Cpu, Shield, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useJarvi } from '../../context/JarviContext';

/**
 * Header principal del Centro de Comando Jarvi
 * Interfaz HUD futurista con información del sistema en tiempo real
 */
const Header = () => {
  const { statistics, gems } = useJarvi();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const [networkPing, setNetworkPing] = useState(12);
  const [cpuUsage, setCpuUsage] = useState(72);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simular cambios en métricas
      setNetworkPing(Math.floor(Math.random() * 20) + 5);
      setCpuUsage(Math.floor(Math.random() * 30) + 60);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const activeGems = gems?.filter(g => g.status === 'active').length || 0;
  const totalWebhooks = statistics?.totalWebhooks || 0;

  const headerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3
      }
    }
  };

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full h-20 overflow-hidden"
    >
      {/* Fondo con efecto glassmorphism */}
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl border-b border-jarvi-blue/20" />
      
      {/* Efecto de escaneo superior */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-jarvi-blue to-transparent animate-scan" />
      
      {/* Contenido del header */}
      <div className="relative h-full px-6 flex items-center justify-between">
        {/* Logo y nombre del sistema */}
        <motion.div
          variants={itemVariants}
          className="flex items-center space-x-4"
        >
          {/* Logo animado */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-r from-jarvi-blue to-jarvi-glow opacity-30 blur-xl"
            />
            <div className="relative w-14 h-14 rounded-full bg-black/50 border-2 border-jarvi-blue/50 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-jarvi-blue/20 to-transparent" />
              <span className="relative font-tech font-bold text-2xl text-jarvi-blue text-neon">J</span>
              
              {/* Anillos orbitales */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-jarvi-blue/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border border-jarvi-glow/20 rounded-full"
              />
            </div>
          </div>
          
          <div>
            <h1 className="font-tech text-2xl font-bold text-white text-neon">
              JARVI
            </h1>
            <p className="text-xs text-jarvi-blue/70 uppercase tracking-wider">
              Centro de Comando Multi-IA
            </p>
          </div>
        </motion.div>

        {/* Panel central de estado */}
        <motion.div
          variants={itemVariants}
          className="hidden lg:flex items-center space-x-8"
        >
          {/* Estado del sistema */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Activity className="w-5 h-5 text-jarvi-blue" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <span className="text-sm font-tech text-jarvi-blue">SISTEMA</span>
              </div>
              <span className="text-xs text-green-400 mt-1">{systemStatus}</span>
            </div>

            <div className="w-px h-8 bg-jarvi-blue/20" />

            {/* GEMS activas */}
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-jarvi-glow" />
                <span className="text-sm font-tech text-jarvi-glow">GEMS</span>
              </div>
              <span className="text-xs text-white mt-1">{activeGems}/5 Activas</span>
            </div>

            <div className="w-px h-8 bg-jarvi-blue/20" />

            {/* Webhooks */}
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-jarvi-accent" />
                <span className="text-sm font-tech text-jarvi-accent">WEBHOOKS</span>
              </div>
              <span className="text-xs text-white mt-1">{totalWebhooks} Configurados</span>
            </div>

            <div className="w-px h-8 bg-jarvi-blue/20" />

            {/* Métricas en vivo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs font-tech text-green-400">{networkPing}ms</span>
              </div>
              <div className="flex items-center space-x-1">
                <Cpu className="w-4 h-4 text-jarvi-blue" />
                <span className="text-xs font-tech text-jarvi-blue">{cpuUsage}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Battery className="w-4 h-4 text-jarvi-glow" />
                <span className="text-xs font-tech text-jarvi-glow">100%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fecha y hora */}
        <motion.div
          variants={itemVariants}
          className="text-right"
        >
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-jarvi-blue animate-pulse-slow" />
              <span className="font-tech text-xl text-white text-neon">
                {formatTime(currentTime)}
              </span>
            </div>
            <p className="text-xs text-jarvi-blue/70 capitalize mt-1">
              {formatDate(currentTime)}
            </p>
            
            {/* Indicador de estado global */}
            <div className="flex items-center space-x-1 mt-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400 uppercase">Operativo</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Líneas decorativas HUD */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-jarvi-blue/50 to-transparent" />
      <div className="absolute top-1/2 left-0 w-20 h-px bg-jarvi-blue/20 transform -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-20 h-px bg-jarvi-blue/20 transform -translate-y-1/2" />
    </motion.header>
  );
};

export default Header;