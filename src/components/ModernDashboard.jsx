import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart,
  Activity,
  Globe,
  Zap,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import ApexCharts from 'react-apexcharts';
import DataFlowVisualization from './Charts/DataFlowVisualization';
import JarviChat from './JarviChat';

const ModernDashboard = () => {
  const [activeUsers, setActiveUsers] = useState(92980);
  const [activePercentage, setActivePercentage] = useState(27);
  const [dynamics, setDynamics] = useState(875);
  
  // Configuración para el gráfico circular de usuarios activos
  const circularChartOptions = {
    chart: {
      type: 'radialBar',
      background: 'transparent',
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: '65%',
          background: 'transparent',
          image: undefined,
          imageOffsetX: 0,
          imageOffsetY: 0,
          position: 'front',
          dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            blur: 4,
            opacity: 0.24
          }
        },
        track: {
          background: 'rgba(255, 255, 255, 0.1)',
          strokeWidth: '100%',
          dropShadow: {
            enabled: true,
            top: -3,
            left: 0,
            blur: 4,
            opacity: 0.35
          }
        },
        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: true,
            color: '#888',
            fontSize: '13px'
          },
          value: {
            formatter: function(val) {
              return parseInt(val) + '%';
            },
            color: '#111',
            fontSize: '30px',
            fontWeight: 'bold',
            show: true,
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#4ADE80'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: 'round'
    },
    colors: ['#10B981'],
    labels: ['Active']
  };
  
  // Configuración para el gráfico de dynamics
  const dynamicsChartOptions = {
    chart: {
      type: 'area',
      height: 100,
      sparkline: {
        enabled: true
      },
      animations: {
        enabled: true,
        easing: 'linear',
        speed: 800
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 100],
        colorStops: [
          {
            offset: 0,
            color: '#6366F1',
            opacity: 0.8
          },
          {
            offset: 50,
            color: '#8B5CF6',
            opacity: 0.6
          },
          {
            offset: 100,
            color: '#A78BFA',
            opacity: 0.4
          }
        ]
      }
    },
    colors: ['#6366F1'],
    xaxis: {
      crosshairs: {
        width: 1
      }
    },
    yaxis: {
      min: 0
    }
  };
  
  const [dynamicsData] = useState([{
    data: [30, 40, 35, 50, 49, 60, 70, 65, 75, 80, 85, 90, 95, 88, 92]
  }]);
  
  // Stats cards data
  const statsCards = [
    {
      icon: Users,
      label: "Total Users",
      value: "204",
      change: "+12%",
      color: "bg-blue-500"
    },
    {
      icon: ShoppingCart,
      label: "Total Orders",
      value: "65,540",
      change: "+8%",
      color: "bg-purple-500"
    },
    {
      icon: Target,
      label: "Conversion",
      value: "324",
      change: "+23%",
      color: "bg-green-500"
    }
  ];
  
  // General statistics data
  const generalStats = {
    totalPending: "$43,833",
    change: "+3%",
    products: [
      { name: "Product A", value: "$12,876", chart: [4, 6, 7, 5, 8, 7, 9] },
      { name: "Product B", value: "$8,432", chart: [3, 5, 6, 4, 7, 8, 6] },
      { name: "Product C", value: "$6,123", chart: [5, 4, 6, 7, 5, 8, 7] }
    ]
  };
  
  useEffect(() => {
    // Simular actualización de datos
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 100 - 50));
      setDynamics(prev => prev + Math.floor(Math.random() * 20 - 10));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="px-8 py-6 bg-white/70 backdrop-blur-md border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, Commander</p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg shadow-lg hover:bg-indigo-600 transition-colors"
            >
              Export Data
            </motion.button>
          </div>
        </div>
      </header>
      
      {/* Main Grid */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats Cards */}
          <div className="space-y-6">
            {/* Active Users Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {activeUsers.toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Active users</p>
                </div>
                <div className="w-32 h-32">
                  <ApexCharts
                    options={circularChartOptions}
                    series={[activePercentage]}
                    type="radialBar"
                    height={128}
                  />
                </div>
              </div>
            </motion.div>
            
            {/* Dynamics Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-xl text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90">Dynamics</p>
                  <h3 className="text-3xl font-bold mt-1">{dynamics}</h3>
                </div>
                <div className="text-right">
                  <span className="text-sm opacity-90">34%</span>
                </div>
              </div>
              <div className="h-20">
                <ApexCharts
                  options={dynamicsChartOptions}
                  series={dynamicsData}
                  type="area"
                  height={80}
                />
              </div>
            </motion.div>
            
            {/* General Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">General statistics</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Total pending</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-800">{generalStats.totalPending}</span>
                  <span className="text-sm text-green-500">{generalStats.change}</span>
                </div>
              </div>
              <div className="space-y-3">
                {generalStats.products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{product.value}</p>
                    </div>
                    <div className="w-16 h-8">
                      <ApexCharts
                        options={{
                          chart: {
                            type: 'line',
                            sparkline: { enabled: true }
                          },
                          stroke: {
                            curve: 'smooth',
                            width: 2
                          },
                          colors: ['#10B981']
                        }}
                        series={[{ data: product.chart }]}
                        type="line"
                        height={32}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Middle Column - Data Flow Visualization */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100"
            >
              <DataFlowVisualization />
            </motion.div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {statsCards.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-sm text-green-500 mt-1">{stat.change}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                      <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Chat Component */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100"
            >
              <JarviChat />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;