import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Clock,
  Calendar,
  Users,
  Zap,
  Activity,
  FileText,
  Download,
  Filter,
  RefreshCw,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  Brain,
  Sparkles,
  Archive
} from 'lucide-react';

const ArchiveAnalytics = ({ archivedTasks = [], statistics = null, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('completions');
  const [insights, setInsights] = useState([]);
  const [chartType, setChartType] = useState('bar');

  // Debug: Ver qué datos estamos recibiendo
  useEffect(() => {
    console.log('📊 ArchiveAnalytics - Tareas recibidas:', archivedTasks.length);
    console.log('📊 ArchiveAnalytics - Estadísticas:', statistics);
    if (archivedTasks.length > 0) {
      console.log('📊 Muestra de tarea:', archivedTasks[0]);
    }
  }, [archivedTasks, statistics]);

  useEffect(() => {
    generateInsights();
  }, [archivedTasks, selectedPeriod]);

  // Generar insights inteligentes
  const generateInsights = () => {
    const newInsights = [];
    
    // Productividad por día de la semana
    const dayProductivity = calculateDayProductivity();
    const mostProductiveDay = Object.entries(dayProductivity)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostProductiveDay) {
      newInsights.push({
        type: 'success',
        icon: Award,
        title: 'Día más productivo',
        description: `Tu día más productivo es ${mostProductiveDay[0]} con ${mostProductiveDay[1]} tareas completadas en promedio`
      });
    }

    // Tendencia de productividad
    const trend = calculateProductivityTrend();
    newInsights.push({
      type: trend > 0 ? 'success' : 'warning',
      icon: trend > 0 ? TrendingUp : TrendingDown,
      title: 'Tendencia de productividad',
      description: `Tu productividad ha ${trend > 0 ? 'aumentado' : 'disminuido'} un ${Math.abs(trend)}% este mes`
    });

    // Categoría más activa
    if (statistics?.byCategory?.length > 0) {
      const topCategory = statistics.byCategory[0];
      newInsights.push({
        type: 'info',
        icon: Target,
        title: 'Categoría principal',
        description: `La mayoría de tus tareas (${topCategory.count}) son de tipo "${topCategory.category}"`
      });
    }

    // Tiempo promedio de completado
    const avgCompletionTime = calculateAverageCompletionTime();
    if (avgCompletionTime) {
      newInsights.push({
        type: 'info',
        icon: Clock,
        title: 'Tiempo promedio',
        description: `En promedio, completas las tareas en ${avgCompletionTime} días desde su creación`
      });
    }

    setInsights(newInsights);
  };

  // Calcular productividad por día de la semana
  const calculateDayProductivity = () => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayCount = {};
    
    archivedTasks.forEach(task => {
      const date = new Date(task.completed_at || task.archived_at);
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });
    
    return dayCount;
  };

  // Calcular tendencia de productividad
  const calculateProductivityTrend = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthTasks = archivedTasks.filter(t => {
      const date = new Date(t.archived_at);
      return date >= lastMonth && date < thisMonth;
    }).length;
    
    const thisMonthTasks = archivedTasks.filter(t => {
      const date = new Date(t.archived_at);
      return date >= thisMonth;
    }).length;
    
    if (lastMonthTasks === 0) return 0;
    return Math.round(((thisMonthTasks - lastMonthTasks) / lastMonthTasks) * 100);
  };

  // Calcular tiempo promedio de completado
  const calculateAverageCompletionTime = () => {
    const times = archivedTasks
      .filter(t => t.created_at && t.completed_at)
      .map(t => {
        const created = new Date(t.created_at);
        const completed = new Date(t.completed_at);
        return (completed - created) / (1000 * 60 * 60 * 24); // días
      });
    
    if (times.length === 0) return null;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return Math.round(avg * 10) / 10;
  };

  // Preparar datos para gráficos
  const prepareChartData = () => {
    switch (selectedMetric) {
      case 'completions':
        return prepareCompletionsData();
      case 'categories':
        return prepareCategoriesData();
      case 'priorities':
        return preparePrioritiesData();
      case 'projects':
        return prepareProjectsData();
      case 'timeline':
        return prepareTimelineData();
      case 'productivity':
        return prepareProductivityData();
      default:
        return [];
    }
  };

  const prepareCompletionsData = () => {
    const data = {};
    const now = new Date();
    
    if (selectedPeriod === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        data[key] = 0;
      }
    } else if (selectedPeriod === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        data[key] = 0;
      }
    } else if (selectedPeriod === 'year') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const key = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        data[key] = 0;
      }
    }
    
    archivedTasks.forEach(task => {
      const date = new Date(task.completed_at || task.archived_at);
      let key;
      
      if (selectedPeriod === 'week') {
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diff < 7) {
          key = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        }
      } else if (selectedPeriod === 'month') {
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diff < 30) {
          key = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        }
      } else if (selectedPeriod === 'year') {
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diff < 365) {
          key = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        }
      }
      
      if (key && data.hasOwnProperty(key)) {
        data[key]++;
      }
    });
    
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  const prepareCategoriesData = () => {
    const data = {};
    archivedTasks.forEach(task => {
      const category = task.category || 'Sin categoría';
      data[category] = (data[category] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const preparePrioritiesData = () => {
    const priorities = {
      urgent: { name: 'Urgente', value: 0, color: '#ef4444' },
      high: { name: 'Alta', value: 0, color: '#f97316' },
      medium: { name: 'Media', value: 0, color: '#eab308' },
      low: { name: 'Baja', value: 0, color: '#22c55e' }
    };
    
    archivedTasks.forEach(task => {
      if (priorities[task.priority]) {
        priorities[task.priority].value++;
      }
    });
    
    return Object.values(priorities).filter(p => p.value > 0);
  };

  const prepareProjectsData = () => {
    const data = {};
    archivedTasks.forEach(task => {
      const project = task.project || 'Sin proyecto';
      data[project] = (data[project] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const prepareTimelineData = () => {
    const monthlyData = {};
    
    archivedTasks.forEach(task => {
      const date = new Date(task.completed_at || task.archived_at);
      const monthKey = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          name: monthKey,
          completadas: 0,
          urgentes: 0,
          proyectos: new Set()
        };
      }
      
      monthlyData[monthKey].completadas++;
      if (task.priority === 'urgent' || task.priority === 'high') {
        monthlyData[monthKey].urgentes++;
      }
      if (task.project) {
        monthlyData[monthKey].proyectos.add(task.project);
      }
    });
    
    return Object.values(monthlyData)
      .map(d => ({
        ...d,
        proyectos: d.proyectos.size
      }))
      .slice(-12);
  };

  const prepareProductivityData = () => {
    const hourlyData = {};
    
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }
    
    archivedTasks.forEach(task => {
      const date = new Date(task.completed_at || task.archived_at);
      const hour = date.getHours();
      hourlyData[hour]++;
    });
    
    return Object.entries(hourlyData).map(([hour, count]) => ({
      hour: `${hour}:00`,
      tareas: count
    }));
  };

  // Renderizar gráfico según tipo seleccionado
  const renderChart = () => {
    const data = prepareChartData();
    
    if (selectedMetric === 'priorities') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    
    if (selectedMetric === 'timeline') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: '#374151' }} />
            <YAxis tick={{ fill: '#374151' }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            <Legend />
            <Area type="monotone" dataKey="completadas" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
            <Area type="monotone" dataKey="urgentes" stackId="1" stroke="#ef4444" fill="#ef4444" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    if (selectedMetric === 'productivity') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="hour" tick={{ fill: '#374151' }} />
            <YAxis tick={{ fill: '#374151' }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            <Line type="monotone" dataKey="tareas" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    // Gráfico de barras por defecto
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fill: '#374151' }} />
          <YAxis tick={{ fill: '#374151' }} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
          <Bar dataKey="value" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Título', 'Descripción', 'Categoría', 'Proyecto', 'Prioridad', 'Estado', 'Creada', 'Completada', 'Archivada'];
    const rows = archivedTasks.map(task => [
      task.id,
      task.title,
      task.description || '',
      task.category || '',
      task.project || '',
      task.priority || '',
      task.status || '',
      task.created_at || '',
      task.completed_at || '',
      task.archived_at || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tareas_archivadas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calcular KPIs
  const calculateKPIs = () => {
    const total = archivedTasks.length;
    const thisMonth = archivedTasks.filter(t => {
      const date = new Date(t.archived_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    const avgPerDay = total > 0 ? (total / 30).toFixed(1) : 0;
    
    const byPriority = {
      urgent: archivedTasks.filter(t => t.priority === 'urgent').length,
      high: archivedTasks.filter(t => t.priority === 'high').length,
      medium: archivedTasks.filter(t => t.priority === 'medium').length,
      low: archivedTasks.filter(t => t.priority === 'low').length
    };
    
    return { total, thisMonth, avgPerDay, byPriority };
  };

  const kpis = calculateKPIs();

  // Si no hay tareas archivadas, mostrar mensaje
  if (archivedTasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
          <Archive className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No hay tareas archivadas</h2>
          <p className="text-gray-500 mb-6">
            Las estadísticas y gráficos aparecerán cuando archives tareas completadas.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Analytics del Archivo</h1>
                <p className="text-gray-500">Análisis detallado de tu productividad</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Download className="w-5 h-5" />
                Exportar CSV
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Archivadas</span>
                <Activity className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpis.total}</div>
              <div className="text-xs text-gray-500 mt-1">Tareas completadas</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Este Mes</span>
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpis.thisMonth}</div>
              <div className="text-xs text-gray-500 mt-1">Tareas archivadas</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Promedio Diario</span>
                <Zap className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpis.avgPerDay}</div>
              <div className="text-xs text-gray-500 mt-1">Tareas por día</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Urgentes</span>
                <Target className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {kpis.byPriority.urgent + kpis.byPriority.high}
              </div>
              <div className="text-xs text-gray-500 mt-1">Alta prioridad</div>
            </div>
          </div>

          {/* Insights con IA */}
          {insights.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Insights Inteligentes</h3>
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === 'success' ? 'bg-green-50 border-green-200' :
                      insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <insight.icon className={`w-5 h-5 mt-0.5 ${
                        insight.type === 'success' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-800">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gráficos */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Controles */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="completions">Tareas Completadas</option>
              <option value="categories">Por Categoría</option>
              <option value="priorities">Por Prioridad</option>
              <option value="projects">Por Proyecto</option>
              <option value="timeline">Línea de Tiempo</option>
              <option value="productivity">Productividad por Hora</option>
            </select>
            
            {selectedMetric === 'completions' && (
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mes</option>
                <option value="year">Último Año</option>
              </select>
            )}
          </div>

          {/* Gráfico */}
          <div className="bg-gray-50 p-6 rounded-xl">
            {renderChart()}
          </div>

          {/* Resumen por Categorías */}
          {statistics && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {statistics.byCategory?.slice(0, 4).map((cat, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{cat.count}</div>
                  <div className="text-sm text-gray-600">{cat.category || 'Sin categoría'}</div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500"
                      style={{ width: `${(cat.count / statistics.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveAnalytics;