import { motion } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Cpu, HardDrive, 
  Wifi, Zap, Target, Shield, Database, AlertTriangle,
  CheckCircle, Clock, Battery, Globe
} from 'lucide-react';
import { useState, useEffect } from 'react';
import CircularProgress from '../ui/CircularProgress';
import { cn } from '../../lib/utils';

/**
 * Panel principal de métricas y visualizaciones
 * Interfaz futurista estilo HUD de Iron Man
 */
const MetricsPanel = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('day');
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimationComplete(true), 1500);
  }, []);

  // Datos simulados mejorados
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 67, network: 23, gpu: 55 },
    { time: '04:00', cpu: 52, memory: 70, network: 34, gpu: 62 },
    { time: '08:00', cpu: 68, memory: 72, network: 45, gpu: 78 },
    { time: '12:00', cpu: 85, memory: 78, network: 67, gpu: 89 },
    { time: '16:00', cpu: 72, memory: 75, network: 56, gpu: 71 },
    { time: '20:00', cpu: 58, memory: 71, network: 38, gpu: 65 },
    { time: '24:00', cpu: 48, memory: 68, network: 28, gpu: 58 },
  ];

  const gemPerformance = [
    { gem: 'ALPHA', eficiencia: 92, carga: 78, respuesta: 95, energia: 88 },
    { gem: 'BETA', eficiencia: 88, carga: 65, respuesta: 91, energia: 82 },
    { gem: 'GAMMA', eficiencia: 75, carga: 45, respuesta: 82, energia: 70 },
    { gem: 'DELTA', eficiencia: 85, carga: 70, respuesta: 88, energia: 80 },
    { gem: 'OMEGA', eficiencia: 98, carga: 90, respuesta: 99, energia: 95 },
  ];

  const distributionData = [
    { name: 'Procesamiento', value: 35, color: '#00E5FF' },
    { name: 'Análisis', value: 25, color: '#FF6B35' },
    { name: 'Seguridad', value: 20, color: '#00FFFF' },
    { name: 'Optimización', value: 20, color: '#4ECDC4' },
  ];

  const radialData = [
    { name: 'Sistema', uv: 95, fill: '#00E5FF' },
    { name: 'Red', uv: 87, fill: '#00FFFF' },
    { name: 'Memoria', uv: 72, fill: '#4ECDC4' },
    { name: 'CPU', uv: 68, fill: '#FF6B35' },
  ];

  const systemMetrics = [
    { label: 'CPU', value: 72, icon: Cpu, trend: 'up', change: '+5%', color: '#00E5FF' },
    { label: 'Memoria', value: 68, icon: HardDrive, trend: 'down', change: '-3%', color: '#FF6B35' },
    { label: 'Red', value: 45, icon: Wifi, trend: 'up', change: '+12%', color: '#00FFFF' },
    { label: 'GPU', value: 89, icon: Zap, trend: 'up', change: '+8%', color: '#4ECDC4' },
    { label: 'Batería', value: 95, icon: Battery, trend: 'stable', change: '0%', color: '#10B981' },
    { label: 'Latencia', value: 12, icon: Globe, trend: 'down', change: '-15%', color: '#F59E0B' },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const hudVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  /**
   * Componente de tarjeta de métrica mejorada
   */
  const MetricCard = ({ metric, index }) => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-jarvi-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
      
      <div className="relative p-4 bg-gray-900/60 backdrop-blur-xl rounded-xl border border-jarvi-blue/20 shadow-neon overflow-hidden">
        {/* Efecto de escaneo */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-jarvi-blue to-transparent animate-scan" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-black/30 border border-jarvi-blue/30">
              <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
            </div>
            <span className="text-xs font-tech text-gray-400 uppercase">{metric.label}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {metric.trend === 'up' ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : metric.trend === 'down' ? (
              <TrendingDown className="w-3 h-3 text-red-400" />
            ) : (
              <Activity className="w-3 h-3 text-yellow-400" />
            )}
            <span className={cn(
              "text-xs font-bold",
              metric.trend === 'up' && "text-green-400",
              metric.trend === 'down' && "text-red-400",
              metric.trend === 'stable' && "text-yellow-400"
            )}>
              {metric.change}
            </span>
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold font-tech text-white" style={{ textShadow: `0 0 10px ${metric.color}` }}>
              {metric.value}
              <span className="text-sm text-gray-400 ml-1">
                {metric.label === 'Latencia' ? 'ms' : '%'}
              </span>
            </div>
          </div>
          
          {/* Mini gráfico */}
          <div className="w-16 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData.slice(-4)}>
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke={metric.color} 
                  fill={metric.color}
                  strokeWidth={1}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="mt-3 h-1 bg-black/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metric.value}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ 
              background: `linear-gradient(90deg, ${metric.color}80, ${metric.color})`,
              boxShadow: `0 0 10px ${metric.color}`
            }}
          />
        </div>
      </div>
    </motion.div>
  );

  /**
   * Custom tooltip para gráficos
   */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-jarvi-blue/50 rounded-lg p-3 shadow-neon">
          <p className="text-xs text-jarvi-blue font-tech">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs mt-1" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={hudVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 p-6 relative"
      style={{ backgroundColor: '#0A0E27' }}
    >
      {/* TÍTULO DE PRUEBA GRANDE Y VISIBLE */}
      <div className="text-6xl font-bold text-center mb-8" style={{ color: '#00E5FF', textShadow: '0 0 20px #00E5FF' }}>
        JARVI SISTEMA ACTUALIZADO
      </div>
      
      {/* Efectos de fondo HUD */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 w-32 h-32 border-t-2 border-l-2 border-jarvi-blue/30" />
        <div className="absolute top-4 right-4 w-32 h-32 border-t-2 border-r-2 border-jarvi-blue/30" />
        <div className="absolute bottom-4 left-4 w-32 h-32 border-b-2 border-l-2 border-jarvi-blue/30" />
        <div className="absolute bottom-4 right-4 w-32 h-32 border-b-2 border-r-2 border-jarvi-blue/30" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header con controles de tiempo */}
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-2xl font-bold font-tech text-white text-neon"
          >
            ANÁLISIS DEL SISTEMA
          </motion.h2>
          
          <div className="flex items-center space-x-2">
            {['hour', 'day', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-xs font-tech rounded-lg transition-all uppercase",
                  selectedTimeRange === range
                    ? "bg-jarvi-blue/20 text-jarvi-blue border border-jarvi-blue/50 shadow-neon"
                    : "bg-black/30 text-gray-400 border border-gray-700 hover:border-jarvi-blue/30"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {systemMetrics.map((metric, index) => (
            <MetricCard key={metric.label} metric={metric} index={index} />
          ))}
        </div>

        {/* Fila de gráficos principales */}
        <div className="grid grid-cols-12 gap-4">
          {/* Gráfico de rendimiento principal */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 lg:col-span-8 p-6 bg-gray-900/60 backdrop-blur-xl rounded-xl border border-jarvi-blue/20 shadow-neon"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-tech text-white">RENDIMIENTO MULTISISTEMA</h3>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-jarvi-blue" />
                  <span className="text-gray-400">CPU</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-jarvi-accent" />
                  <span className="text-gray-400">Memoria</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-jarvi-glow" />
                  <span className="text-gray-400">Red</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-gray-400">GPU</span>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00FFFF" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="time" stroke="#666" style={{ fontSize: '10px' }} />
                <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cpu" stroke="#00E5FF" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                <Area type="monotone" dataKey="memory" stroke="#FF6B35" fillOpacity={1} fill="url(#colorMemory)" strokeWidth={2} />
                <Area type="monotone" dataKey="network" stroke="#00FFFF" fillOpacity={1} fill="url(#colorNetwork)" strokeWidth={2} />
                <Area type="monotone" dataKey="gpu" stroke="#10B981" fillOpacity={1} fill="url(#colorGpu)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Panel de estado circular */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 lg:col-span-4 p-6 bg-gray-900/60 backdrop-blur-xl rounded-xl border border-jarvi-blue/20 shadow-neon"
          >
            <h3 className="text-lg font-tech text-white mb-4">ESTADO GLOBAL</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <CircularProgress
                value={87}
                max={100}
                size={100}
                strokeWidth={6}
                label="Sistema"
                color="#00E5FF"
              />
              <CircularProgress
                value={72}
                max={100}
                size={100}
                strokeWidth={6}
                label="Seguridad"
                color="#10B981"
              />
              <CircularProgress
                value={95}
                max={100}
                size={100}
                strokeWidth={6}
                label="Sincronía"
                color="#00FFFF"
              />
              <CircularProgress
                value={68}
                max={100}
                size={100}
                strokeWidth={6}
                label="Eficiencia"
                color="#FF6B35"
              />
            </div>

            {/* Estado de alerta */}
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-tech">TODOS LOS SISTEMAS OPERATIVOS</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Segunda fila de gráficos */}
        <div className="grid grid-cols-12 gap-4">
          {/* Radar de GEMS */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 md:col-span-6 lg:col-span-4 p-6 bg-gray-900/60 backdrop-blur-xl rounded-xl border border-jarvi-blue/20 shadow-neon"
          >
            <h3 className="text-lg font-tech text-white mb-4">ANÁLISIS DE GEMS</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={gemPerformance}>
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="gem" stroke="#666" style={{ fontSize: '10px' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#666" style={{ fontSize: '10px' }} />
                <Radar name="Eficiencia" dataKey="eficiencia" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.3} />
                <Radar name="Energía" dataKey="energia" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Distribución radial */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 md:col-span-6 lg:col-span-4 p-6 bg-gray-900/60 backdrop-blur-xl rounded-xl border border-jarvi-blue/20 shadow-neon"
          >
            <h3 className="text-lg font-tech text-white mb-4">DISTRIBUCIÓN DE CARGA</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData}>
                <RadialBar dataKey="uv" cornerRadius={10} fill="#00E5FF" />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Distribución circular */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 md:col-span-12 lg:col-span-4 p-6 bg-gray-900/60 backdrop-blur-xl rounded-xl border border-jarvi-blue/20 shadow-neon"
          >
            <h3 className="text-lg font-tech text-white mb-4">RECURSOS ACTIVOS</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {distributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}
                    />
                    <span className="text-xs text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-xs font-tech text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Barra de actividad en tiempo real */}
        <motion.div
          variants={cardVariants}
          className="p-6 bg-gray-900/60 backdrop-blur-xl rounded-xl border border-jarvi-blue/20 shadow-neon"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-tech text-white">ACTIVIDAD EN TIEMPO REAL</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">EN VIVO</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={gemPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="gem" stroke="#666" style={{ fontSize: '10px' }} />
              <YAxis stroke="#666" style={{ fontSize: '10px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="carga" fill="#00E5FF">
                {gemPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.carga > 80 ? '#FF6B35' : '#00E5FF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MetricsPanel;