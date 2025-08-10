import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import axios from 'axios';
import { getSocketUrl, getApiUrl } from '../config/api';
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

const DashboardStats = () => {
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
    const socket = io(getSocketUrl(3001));
    
    socket.on('connect', () => {
      setIsConnected(true);
      loadAllStats();
    });
    
    socket.on('disconnect', () => {
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
  }, []);
  
  const loadAllStats = async () => {
    try {
      setLoading(true);
      
      // Cargar todas las estadísticas en paralelo (usando las APIs disponibles)
      const [voiceRes, todosRes] = await Promise.all([
        axios.get(getApiUrl(3001, '/api/voice-notes')).catch(() => ({ data: { notes: [] } })),
        axios.get(getApiUrl(3003, '/api/tasks')).catch(() => ({ data: { tasks: [] } }))
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
        
        {/* Recordatorios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Recordatorios</h3>
            </div>
            <span className="text-2xl font-bold text-orange-600">
              {stats.reminders.total}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pendientes</span>
              <span className="font-medium text-orange-600">{stats.reminders.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completados</span>
              <span className="font-medium text-green-600">{stats.reminders.completed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Alta prioridad</span>
              <span className="font-medium text-red-600">{stats.reminders.high}</span>
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
        
        {/* Reuniones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Reuniones</h3>
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {stats.meetings.total}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duración total</span>
              <span className="font-medium">{formatDuration(stats.meetings.duration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Participantes</span>
              <span className="font-medium">{stats.meetings.participants}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Promedio</span>
              <span className="font-medium">
                {stats.meetings.total > 0 
                  ? formatDuration(Math.round(stats.meetings.duration / stats.meetings.total))
                  : '0m'}
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* Intereses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold">Intereses</h3>
            </div>
            <span className="text-2xl font-bold text-emerald-600">
              {stats.interests.total}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sin leer</span>
              <span className="font-medium text-emerald-600">{stats.interests.unread}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Leídos</span>
              <span className="font-medium text-green-600">{stats.interests.read}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Favoritos</span>
              <span className="font-medium text-yellow-600">{stats.interests.favorites}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${readingRate}%` }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Costos de API */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Costos API</h3>
            </div>
            <span className="text-2xl font-bold text-green-600">
              ${stats.costs.total?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gemini</span>
              <span className="font-medium">${stats.costs.gemini?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">OpenAI</span>
              <span className="font-medium">${stats.costs.openai?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Claude</span>
              <span className="font-medium">${stats.costs.claude?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Actividad reciente */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Actividad Reciente</h3>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Últimos registros</span>
          </div>
        </div>
        
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {stats.voiceNotes.total === 0 && stats.todos.total === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-indigo-600" />
                    Últimas Notas de Voz
                  </h4>
                  {stats.voiceNotes.total > 0 ? (
                    <div className="text-sm text-gray-600">
                      {stats.voiceNotes.total} notas totales<br/>
                      {stats.voiceNotes.transcribed} transcritas<br/>
                      {stats.voiceNotes.today} creadas hoy
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Sin notas de voz</div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    Últimas Tareas
                  </h4>
                  {stats.todos.total > 0 ? (
                    <div className="text-sm text-gray-600">
                      {stats.todos.total} tareas totales<br/>
                      {stats.todos.pending} pendientes<br/>
                      {stats.todos.completed} completadas
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Sin tareas</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Alertas y notificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Tareas urgentes</p>
              <p className="text-sm text-red-700">{stats.reminders.high} recordatorios de alta prioridad</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Pendientes hoy</p>
              <p className="text-sm text-yellow-700">{stats.todos.today} tareas por completar</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Productividad</p>
              <p className="text-sm text-green-700">{completionRate}% de tareas completadas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;