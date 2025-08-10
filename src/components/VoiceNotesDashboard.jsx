import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ApexCharts from 'react-apexcharts';
import { 
  Mic, 
  FileText, 
  Folder,
  Clock,
  Zap,
  Bell,
  Briefcase,
  Heart,
  Building,
  Code,
  Filter,
  ChevronDown,
  TrendingUp,
  Activity
} from 'lucide-react';
import axios from 'axios';

// Categorías con colores específicos
const CATEGORIES = {
  QUICK_IDEA: { 
    id: 'quick_idea', 
    name: 'Idea Rápida', 
    icon: Zap, 
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200'
  },
  REMINDER: { 
    id: 'reminder', 
    name: 'Recordatorio', 
    icon: Bell, 
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200'
  },
  WORK: { 
    id: 'work', 
    name: 'Trabajo', 
    icon: Briefcase, 
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    subcategories: {
      DYNAMTEK: { id: 'dynamtek', name: 'Dynamtek', icon: Building, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
      WBI: { id: 'wbi', name: 'WBI', icon: Code, color: 'cyan', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' },
      PROJECTS: { id: 'projects', name: 'Proyectos', icon: Folder, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' }
    }
  },
  PERSONAL: { 
    id: 'personal', 
    name: 'Vida Personal', 
    icon: Heart, 
    color: 'pink',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-800',
    borderColor: 'border-pink-200'
  }
};

const VoiceNotesDashboard = () => {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadVoiceNotes();
    loadStats();
  }, []);

  const loadVoiceNotes = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/voice-notes');
      if (response.data.success) {
        setVoiceNotes(response.data.notes);
      }
    } catch (error) {
      console.error('Error cargando notas de voz:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Datos para el gráfico de categorías
  const getCategoryChartData = () => {
    const categoryData = Object.entries(stats.categories || {}).map(([category, count]) => {
      const categoryInfo = Object.values(CATEGORIES).find(c => c.id === category);
      return {
        name: categoryInfo?.name || category,
        count,
        color: categoryInfo?.color || 'gray'
      };
    });

    return {
      series: categoryData.map(item => item.count),
      options: {
        chart: {
          type: 'donut',
          background: 'transparent'
        },
        labels: categoryData.map(item => item.name),
        colors: ['#F59E0B', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6'],
        plotOptions: {
          pie: {
            donut: {
              size: '70%'
            }
          }
        },
        legend: {
          position: 'bottom'
        },
        dataLabels: {
          enabled: true,
          formatter: function(val, opts) {
            return opts.w.config.series[opts.seriesIndex];
          }
        }
      }
    };
  };

  // Datos para el gráfico de actividad por día
  const getActivityChartData = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayNotes = voiceNotes.filter(note => {
        const noteDate = new Date(note.timestamp);
        return noteDate.toDateString() === date.toDateString();
      });
      
      last7Days.push({
        date: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        count: dayNotes.length
      });
    }

    return {
      series: [{
        name: 'Notas de Voz',
        data: last7Days.map(day => day.count)
      }],
      options: {
        chart: {
          type: 'bar',
          background: 'transparent',
          toolbar: { show: false }
        },
        xaxis: {
          categories: last7Days.map(day => day.date)
        },
        colors: ['#6366F1'],
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '60%'
          }
        },
        dataLabels: {
          enabled: false
        },
        grid: {
          show: false
        }
      }
    };
  };

  const filteredNotes = selectedCategory 
    ? voiceNotes.filter(note => note.category === selectedCategory)
    : voiceNotes;

  const getCategoryInfo = (categoryId, subcategoryId) => {
    const category = Object.values(CATEGORIES).find(c => c.id === categoryId);
    if (!category) return null;
    
    if (subcategoryId && category.subcategories) {
      const subcategory = Object.values(category.subcategories).find(s => s.id === subcategoryId);
      return { ...category, subcategory };
    }
    
    return category;
  };

  const chartData = getCategoryChartData();
  const activityData = getActivityChartData();

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-gray-900">Notas de Voz - Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Análisis y métricas de tus notas de voz</p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {selectedCategory ? CATEGORIES[Object.keys(CATEGORIES).find(k => CATEGORIES[k].id === selectedCategory)]?.name : 'Todas las categorías'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {showFilters && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-20">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowFilters(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-900">Todas las categorías</span>
              </button>
              
              {Object.values(CATEGORIES).map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowFilters(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
                      selectedCategory === category.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${category.bgColor.replace('bg-', 'bg-').replace('-100', '-400')}`}></div>
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">{category.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Total Notas</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Mic className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+{stats.today || 0} hoy</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.transcribed || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Transcritas</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">
              {stats.total > 0 ? Math.round((stats.transcribed / stats.total) * 100) : 0}% completado
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.categorized || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Categorizadas</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Folder className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">
              {stats.total > 0 ? Math.round((stats.categorized / stats.total) * 100) : 0}% organizadas
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.categories || {}).length}</p>
              <p className="text-sm text-gray-500 mt-1">Categorías</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-xl">
              <Activity className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">En uso</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Distribución por Categorías */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Categorías</h3>
          {chartData.series.length > 0 ? (
            <ApexCharts
              options={chartData.options}
              series={chartData.series}
              type="donut"
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Folder className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No hay datos de categorías</p>
              </div>
            </div>
          )}
        </div>

        {/* Actividad por Día */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad (Últimos 7 días)</h3>
          <ApexCharts
            options={activityData.options}
            series={activityData.series}
            type="bar"
            height={300}
          />
        </div>
      </div>

      {/* Notas recientes con categorías coloridas */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notas Recientes {selectedCategory && `- ${CATEGORIES[Object.keys(CATEGORIES).find(k => CATEGORIES[k].id === selectedCategory)]?.name}`}
        </h3>
        
        <div className="space-y-3">
          {filteredNotes.slice(0, 5).map(note => {
            const categoryInfo = note.category ? getCategoryInfo(note.category, note.subcategory) : null;
            const CategoryIcon = categoryInfo?.icon || Mic;
            
            return (
              <div key={note.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Mic className="w-4 h-4 text-indigo-600" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">{note.sender.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(note.timestamp).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {categoryInfo && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${categoryInfo.bgColor} ${categoryInfo.textColor} border ${categoryInfo.borderColor}`}>
                      <CategoryIcon className="w-3 h-3" />
                      <span className="text-xs font-medium">{categoryInfo.name}</span>
                      {categoryInfo.subcategory && (
                        <>
                          <span className="text-xs">/</span>
                          <span className="text-xs">{categoryInfo.subcategory.name}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {note.transcription && (
                    <div className="p-1 bg-green-100 rounded">
                      <FileText className="w-3 h-3 text-green-600" />
                    </div>
                  )}
                  <span className="text-sm text-gray-400">
                    {Math.floor(note.duration / 60)}:{(note.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredNotes.length === 0 && (
          <div className="text-center py-8">
            <Mic className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No hay notas en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceNotesDashboard;