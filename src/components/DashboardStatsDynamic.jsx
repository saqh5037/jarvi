import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
  Activity,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Mic,
  Bell,
  CheckSquare,
  BookOpen,
  Video,
  FileText,
  BarChart3,
  PieChart,
  Target,
  Brain,
  Zap,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  MessageSquare,
  Database,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';

// Dynamic URL configuration
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost';
  }
  return `http://${hostname}`;
};

const DashboardStatsDynamic = () => {
  const baseUrl = useMemo(() => getBaseUrl(), []);
  
  const [stats, setStats] = useState({
    voiceNotes: { total: 0, transcribed: 0, today: 0 },
    reminders: { total: 0, completed: 0, pending: 0, high: 0 },
    todos: { total: 0, completed: 0, pending: 0, today: 0 },
    meetings: { total: 0, duration: 0, participants: 0 },
    interests: { total: 0, read: 0, unread: 0, favorites: 0 },
    costs: { total: 0, gemini: 0, openai: 0, claude: 0 }
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Connecting to:', `${baseUrl}:3001`);
    const socket = io(`${baseUrl}:3001`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      loadAllStats();
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      setIsConnected(false);
    });
    
    // Escuchar actualizaciones en tiempo real
    socket.on('new-voice-note', () => {
      setStats(prev => ({
        ...prev,
        voiceNotes: {
          ...prev.voiceNotes,
          total: prev.voiceNotes.total + 1,
          today: prev.voiceNotes.today + 1
        }
      }));
      setLastUpdate(new Date());
    });
    
    socket.on('new-reminder', () => {
      setStats(prev => ({
        ...prev,
        reminders: {
          ...prev.reminders,
          total: prev.reminders.total + 1,
          pending: prev.reminders.pending + 1
        }
      }));
      setLastUpdate(new Date());
    });
    
    socket.on('new-todo', () => {
      setStats(prev => ({
        ...prev,
        todos: {
          ...prev.todos,
          total: prev.todos.total + 1,
          pending: prev.todos.pending + 1
        }
      }));
      setLastUpdate(new Date());
    });
    
    socket.on('new-meeting-audio', () => {
      setStats(prev => ({
        ...prev,
        meetings: {
          ...prev.meetings,
          total: prev.meetings.total + 1
        }
      }));
      setLastUpdate(new Date());
    });
    
    socket.on('new-interest', () => {
      setStats(prev => ({
        ...prev,
        interests: {
          ...prev.interests,
          total: prev.interests.total + 1,
          unread: prev.interests.unread + 1
        }
      }));
      setLastUpdate(new Date());
    });
    
    // Cargar estadísticas iniciales
    loadAllStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadAllStats, 30000);
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [baseUrl]);
  
  const loadAllStats = async () => {
    try {
      setLoading(true);
      console.log('Loading stats from:', baseUrl);
      
      // Cargar todas las estadísticas en paralelo (usando las APIs disponibles)
      const [voiceRes, todosRes] = await Promise.all([
        axios.get(`${baseUrl}:3001/api/voice-notes`).catch((err) => {
          console.error('Voice notes error:', err);
          return { data: { notes: [] } };
        }),
        axios.get(`${baseUrl}:3003/api/tasks`).catch((err) => {
          console.error('Tasks error:', err);
          return { data: { tasks: [] } };
        })
      ]);

      // APIs no disponibles - usar datos vacíos por ahora
      const remindersRes = { data: { reminders: [] } };
      const meetingsRes = { data: { meetings: [] } };
      const interestsRes = { data: { interests: [] } };
      const costsRes = { data: { costs: { total: 0, gemini: 0, openai: 0, claude: 0 } } };
      
      // Procesar notas de voz
      const voiceNotes = voiceRes.data.notes || [];
      const today = new Date().toDateString();
      const voiceToday = voiceNotes.filter(n => 
        new Date(n.timestamp).toDateString() === today
      ).length;
      const voiceTranscribed = voiceNotes.filter(n => n.transcription).length;
      
      // Procesar recordatorios
      const reminders = remindersRes.data.reminders || [];
      const remindersCompleted = reminders.filter(r => r.completed).length;
      const remindersPending = reminders.filter(r => !r.completed).length;
      const remindersHigh = reminders.filter(r => r.priority === 'high' && !r.completed).length;
      
      // Procesar tareas (usando la estructura real de la API)
      const todos = todosRes.data.tasks || [];
      const todosCompleted = todos.filter(t => t.status === 'completed').length;
      const todosPending = todos.filter(t => t.status === 'pending').length;
      const todosToday = todos.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === today;
      }).length;
      
      // Procesar reuniones
      const meetings = meetingsRes.data.meetings || [];
      const totalDuration = meetings.reduce((acc, m) => acc + (m.duration || 0), 0);
      const totalParticipants = meetings.reduce((acc, m) => 
        acc + (m.participants ? m.participants.length : 0), 0
      );
      
      // Procesar intereses
      const interests = interestsRes.data.interests || [];
      const interestsRead = interests.filter(i => i.dateRead).length;
      const interestsUnread = interests.filter(i => !i.dateRead).length;
      const interestsFavorites = interests.filter(i => i.favorite).length;
      
      // Procesar costos (calculados desde las notas de voz)
      const totalCost = voiceNotes.reduce((acc, note) => acc + (note.cost || 0), 0);
      const costs = { 
        total: totalCost, 
        gemini: totalCost, // Todo el costo viene de Gemini por ahora
        openai: 0, 
        claude: 0 
      };
      
      setStats({
        voiceNotes: {
          total: voiceNotes.length,
          transcribed: voiceTranscribed,
          today: voiceToday
        },
        reminders: {
          total: reminders.length,
          completed: remindersCompleted,
          pending: remindersPending,
          high: remindersHigh
        },
        todos: {
          total: todos.length,
          completed: todosCompleted,
          pending: todosPending,
          today: todosToday
        },
        meetings: {
          total: meetings.length,
          duration: totalDuration,
          participants: totalParticipants
        },
        interests: {
          total: interests.length,
          read: interestsRead,
          unread: interestsUnread,
          favorites: interestsFavorites
        },
        costs: costs
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setLoading(false);
    }
  };
  
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calcular porcentajes
  const completionRate = stats.todos.total > 0 
    ? Math.round((stats.todos.completed / stats.todos.total) * 100) 
    : 0;
    
  const transcriptionRate = stats.voiceNotes.total > 0
    ? Math.round((stats.voiceNotes.transcribed / stats.voiceNotes.total) * 100)
    : 0;
    
  const readingRate = stats.interests.total > 0
    ? Math.round((stats.interests.read / stats.interests.total) * 100)
    : 0;
  
  return (
    <div className="space-y-6 min-h-screen bg-gray-100 p-6">
      {/* Debug info */}
      <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
        <div>Host: {window.location.hostname}</div>
        <div>API: {baseUrl}</div>
        <div>Socket: {isConnected ? '✅' : '❌'}</div>
      </div>

      {/* Header con estado de conexión */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard JARVI</h1>
            <p className="text-indigo-100">Sistema de Gestión Inteligente</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">Desconectado</span>
                </>
              )}
            </div>
            
            <div className="text-sm text-indigo-100">
              Última actualización: {formatTime(lastUpdate)}
            </div>
          </div>
        </div>
        
        {/* Estadísticas principales */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8" />
              <span className="text-2xl font-bold">
                {stats.voiceNotes.total + stats.reminders.total + stats.todos.total + 
                 stats.meetings.total + stats.interests.total}
              </span>
            </div>
            <p className="text-sm text-indigo-100">Total Registros</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8" />
              <span className="text-2xl font-bold">{completionRate}%</span>
            </div>
            <p className="text-sm text-indigo-100">Completado</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-8 h-8" />
              <span className="text-2xl font-bold">{transcriptionRate}%</span>
            </div>
            <p className="text-sm text-indigo-100">Transcrito</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8" />
              <span className="text-2xl font-bold">
                {stats.voiceNotes.today + stats.todos.today}
              </span>
            </div>
            <p className="text-sm text-indigo-100">Hoy</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
              <span className="text-2xl font-bold">
                ${stats.costs.total?.toFixed(2) || '0.00'}
              </span>
            </div>
            <p className="text-sm text-indigo-100">Costo APIs</p>
          </div>
        </div>
      </div>
      
      {/* Grid de módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Notas de Voz */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Mic className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold">Notas de Voz</h3>
            </div>
            <span className="text-2xl font-bold text-indigo-600">
              {stats.voiceNotes.total}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transcritas</span>
              <span className="font-medium">{stats.voiceNotes.transcribed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Hoy</span>
              <span className="font-medium">{stats.voiceNotes.today}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${transcriptionRate}%` }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Tareas ToDo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CheckSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Tareas</h3>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {stats.todos.total}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pendientes</span>
              <span className="font-medium text-blue-600">{stats.todos.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completadas</span>
              <span className="font-medium text-green-600">{stats.todos.completed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Para hoy</span>
              <span className="font-medium text-purple-600">{stats.todos.today}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Otros módulos... */}
        {/* Simplified for brevity - add other modules as needed */}
      </div>
    </div>
  );
};

export default DashboardStatsDynamic;