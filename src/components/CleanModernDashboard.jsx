import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ApexCharts from 'react-apexcharts';
import EnhancedVoiceNotesModule from './EnhancedVoiceNotesModule';
import RemindersModule from './RemindersModule';
import TodoModule from './TodoModule';
import MeetingsModule from './MeetingsModule';
import InterestsModule from './InterestsModule';

const CleanModernDashboard = () => {
  const [stats, setStats] = useState(null);
  const [costData, setCostData] = useState(null);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      const statsResponse = await fetch('http://localhost:3001/api/stats');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      const costsResponse = await fetch('http://localhost:3001/api/costs');
      const costsData = await costsResponse.json();
      if (costsData.success) {
        setCostData(costsData.costs);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };
  
  // Configuración para el gráfico circular limpio
  const circularChartOptions = {
    chart: {
      type: 'radialBar',
      background: 'transparent',
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 270,
        hollow: {
          size: '70%',
          background: 'transparent',
        },
        track: {
          background: '#E5E7EB',
          strokeWidth: '100%',
        },
        dataLabels: {
          show: true,
          name: {
            show: false,
          },
          value: {
            offsetY: 5,
            fontSize: '24px',
            fontWeight: '600',
            color: '#1F2937',
            formatter: function(val) {
              return val + '%';
            }
          }
        }
      }
    },
    fill: {
      type: 'solid',
      colors: ['#10B981']
    },
    stroke: {
      lineCap: 'round'
    }
  };
  
  // Configuración para el gráfico de líneas (Dynamics)
  const dynamicsChartOptions = {
    chart: {
      type: 'line',
      sparkline: {
        enabled: true
      },
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: ['#6366F1']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    grid: {
      show: false
    },
    xaxis: {
      labels: {
        show: false
      }
    },
    yaxis: {
      labels: {
        show: false
      }
    },
    tooltip: {
      enabled: false
    }
  };
  
  const dynamicsData = [{
    data: [30, 40, 35, 50, 49, 60, 70, 65, 75, 72, 78, 75, 80, 85, 82]
  }];
  
  // Datos para el flujo Sankey
  const sankeyData = {
    source: { label: "Finance", value: "$43,833", change: "+3%" },
    targets: [
      { label: "Marketing", value: "$11,419", color: "#FDA4AF" },
      { label: "Sales", value: "$5,673", color: "#FDA4AF" },
      { label: "Operations", value: "$19,658", color: "#DDA5E9" },
      { label: "Processing", value: "$12,965", color: "#DDA5E9" },
      { label: "Banking", value: "$23,957", color: "#A5B4FC" },
      { label: "Delivery", value: "$800", color: "#A5B4FC" }
    ]
  };
  
  const [activeModule, setActiveModule] = useState('dashboard');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-sm mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveModule('dashboard')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeModule === 'dashboard'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveModule('voice')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeModule === 'voice'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Notas de Voz
            </button>
            <button
              onClick={() => setActiveModule('reminders')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeModule === 'reminders'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Recordatorios
            </button>
            <button
              onClick={() => setActiveModule('todo')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeModule === 'todo'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              To-Do
            </button>
            <button
              onClick={() => setActiveModule('meetings')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeModule === 'meetings'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Reuniones
            </button>
            <button
              onClick={() => setActiveModule('interests')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeModule === 'interests'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Intereses
            </button>
          </div>
        </div>
        
        {/* Content */}
        {activeModule === 'dashboard' ? (
          /* Grid Principal */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda - Cards de estadísticas */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Card de Usuarios Activos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats?.total || 0}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Notas de Voz</div>
                </div>
                <div className="relative w-24 h-24">
                  <ApexCharts
                    options={circularChartOptions}
                    series={[stats ? Math.round((stats.transcribed / stats.total) * 100) || 0 : 0]}
                    type="radialBar"
                    height={96}
                    width={96}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-gray-500 mt-8">{stats ? Math.round((stats.transcribed / stats.total) * 100) || 0 : 0}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card de Costos API */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-sm text-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm opacity-90">Costos API</div>
                  <div className="text-3xl font-bold mt-1">${(costData?.totalCost || 0).toFixed(4)}</div>
                </div>
                <div className="text-sm opacity-90">Mes</div>
              </div>
              <div className="text-xs opacity-75 mt-2">
                Gemini: {costData?.apiUsage.gemini.calls || 0} calls | OpenAI: {costData?.apiUsage.openai.calls || 0} calls
              </div>
            </div>
            
            {/* Card de Estadísticas por Categoría */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Notas por Categoría</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Total categorizadas</span>
                    <span className="text-sm text-green-500">{stats?.categorized || 0}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
                </div>
                
                <div className="space-y-3 pt-2">
                  {stats?.categories && Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center py-2 border-t">
                      <span className="text-sm text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Columna Central - Visualización de Flujo */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl p-8 shadow-sm h-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-light text-gray-900">Data visualisation</h2>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                  <option>Overview</option>
                  <option>Voice Notes</option>
                  <option>Detailed</option>
                  <option>Summary</option>
                </select>
              </div>
              
              {/* Voice Notes Dashboard Integration */}
              <EnhancedVoiceNotesModule />
              
              {/* Sankey Diagram Simplificado */}
              <div className="relative h-96">
                <svg viewBox="0 0 800 400" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#FDA4AF', stopOpacity: 0.3 }} />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#DDA5E9', stopOpacity: 0.3 }} />
                    </linearGradient>
                    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#A5B4FC', stopOpacity: 0.3 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Flujos */}
                  <path d="M 100 200 Q 250 150 400 120" fill="none" stroke="url(#grad1)" strokeWidth="40" opacity="0.6" />
                  <path d="M 100 200 Q 250 180 400 180" fill="none" stroke="url(#grad1)" strokeWidth="30" opacity="0.6" />
                  <path d="M 100 200 Q 250 200 400 240" fill="none" stroke="url(#grad2)" strokeWidth="50" opacity="0.6" />
                  <path d="M 100 200 Q 250 220 400 300" fill="none" stroke="url(#grad2)" strokeWidth="35" opacity="0.6" />
                  <path d="M 400 120 Q 500 120 600 140" fill="none" stroke="url(#grad3)" strokeWidth="45" opacity="0.6" />
                  <path d="M 400 300 Q 500 300 600 280" fill="none" stroke="url(#grad3)" strokeWidth="20" opacity="0.6" />
                  
                  {/* Nodo Origen */}
                  <g>
                    <rect x="40" y="170" width="120" height="60" rx="8" fill="#6366F1" />
                    <text x="100" y="195" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">
                      {sankeyData.source.label}
                    </text>
                    <text x="100" y="215" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      {sankeyData.source.value}
                    </text>
                  </g>
                  
                  {/* Nodos Destino - Primera columna */}
                  <g>
                    <rect x="350" y="90" width="100" height="50" rx="6" fill="#FDA4AF" />
                    <text x="400" y="110" textAnchor="middle" fill="white" fontSize="11">Marketing</text>
                    <text x="400" y="128" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">$11,419</text>
                  </g>
                  
                  <g>
                    <rect x="350" y="155" width="100" height="50" rx="6" fill="#FDA4AF" />
                    <text x="400" y="175" textAnchor="middle" fill="white" fontSize="11">Sales</text>
                    <text x="400" y="193" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">$5,673</text>
                  </g>
                  
                  <g>
                    <rect x="350" y="220" width="100" height="50" rx="6" fill="#DDA5E9" />
                    <text x="400" y="240" textAnchor="middle" fill="white" fontSize="11">Operations</text>
                    <text x="400" y="258" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">$19,658</text>
                  </g>
                  
                  <g>
                    <rect x="350" y="285" width="100" height="50" rx="6" fill="#DDA5E9" />
                    <text x="400" y="305" textAnchor="middle" fill="white" fontSize="11">Processing</text>
                    <text x="400" y="323" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">$12,965</text>
                  </g>
                  
                  {/* Nodos Destino - Segunda columna */}
                  <g>
                    <rect x="550" y="115" width="100" height="50" rx="6" fill="#A5B4FC" />
                    <text x="600" y="135" textAnchor="middle" fill="white" fontSize="11">Banking</text>
                    <text x="600" y="153" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">$23,957</text>
                  </g>
                  
                  <g>
                    <rect x="550" y="255" width="100" height="50" rx="6" fill="#A5B4FC" />
                    <text x="600" y="275" textAnchor="middle" fill="white" fontSize="11">Delivery</text>
                    <text x="600" y="293" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">$800</text>
                  </g>
                </svg>
              </div>
              
              {/* Métricas inferiores */}
              <div className="grid grid-cols-4 gap-8 mt-8 pt-8 border-t">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-900">204</div>
                  <div className="text-sm text-gray-500 mt-1">Total orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-900">65,540</div>
                  <div className="text-sm text-gray-500 mt-1">Total sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-900">324</div>
                  <div className="text-sm text-gray-500 mt-1">Active clients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-500">+12%</div>
                  <div className="text-sm text-gray-500 mt-1">Growth rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : activeModule === 'voice' ? (
          /* Voice Notes Module */
          <EnhancedVoiceNotesModule />
        ) : activeModule === 'reminders' ? (
          /* Reminders Module */
          <RemindersModule />
        ) : activeModule === 'todo' ? (
          /* Todo Module */
          <TodoModule />
        ) : activeModule === 'meetings' ? (
          /* Meetings Module */
          <MeetingsModule />
        ) : activeModule === 'interests' ? (
          /* Interests Module */
          <InterestsModule />
        ) : (
          /* Default fallback */
          <EnhancedVoiceNotesModule />
        )}
      </div>
    </div>
  );
};

export default CleanModernDashboard;