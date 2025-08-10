import React, { useState, useEffect, useRef } from 'react';
import ApexCharts from 'react-apexcharts';
import { motion } from 'framer-motion';

const RealtimeChart = ({ 
  title = 'SYSTEM METRICS',
  dataStreams = 1,
  updateInterval = 1000,
  maxDataPoints = 20,
  height = 300,
  type = 'area' // area, line, bar
}) => {
  const [series, setSeries] = useState(
    Array.from({ length: dataStreams }, (_, i) => ({
      name: `Stream ${i + 1}`,
      data: Array(10).fill(0).map(() => Math.random() * 100)
    }))
  );
  
  const intervalRef = useRef(null);
  
  const chartOptions = {
    theme: {
      mode: 'dark',
      palette: 'palette1',
      monochrome: {
        enabled: false,
        color: '#00FFCC',
        shadeTo: 'dark',
        shadeIntensity: 0.65
      }
    },
    chart: {
      background: 'transparent',
      foreColor: '#FFFFFF',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'linear',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      dropShadow: {
        enabled: true,
        color: '#00FFCC',
        top: 0,
        left: 0,
        blur: 10,
        opacity: 0.2
      }
    },
    colors: ['#00FFCC', '#FF3D94', '#FFCC00', '#00CCFF', '#FF6B6B'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      lineCap: 'round'
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100],
        colorStops: [
          {
            offset: 0,
            color: '#00FFCC',
            opacity: 0.8
          },
          {
            offset: 100,
            color: '#00FFCC',
            opacity: 0.1
          }
        ]
      }
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    xaxis: {
      type: 'category',
      categories: Array(10).fill('').map((_, i) => `T-${9-i}`),
      labels: {
        style: {
          colors: '#FFFFFF',
          fontSize: '10px',
          fontFamily: 'Space Mono, monospace'
        }
      },
      axisBorder: {
        show: true,
        color: '#00FFCC30'
      },
      axisTicks: {
        show: true,
        color: '#00FFCC30'
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        style: {
          colors: '#FFFFFF',
          fontSize: '10px',
          fontFamily: 'Space Mono, monospace'
        },
        formatter: (value) => `${Math.round(value)}%`
      },
      axisBorder: {
        show: true,
        color: '#00FFCC30'
      }
    },
    legend: {
      show: dataStreams > 1,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '10px',
      fontFamily: 'Orbitron, monospace',
      labels: {
        colors: '#FFFFFF'
      },
      markers: {
        width: 8,
        height: 8,
        radius: 2
      }
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: 'Space Mono, monospace'
      },
      x: {
        show: true
      },
      y: {
        formatter: (value) => `${Math.round(value)}%`
      },
      marker: {
        show: true
      },
      custom: undefined
    }
  };
  
  useEffect(() => {
    // Actualizar datos en tiempo real
    intervalRef.current = setInterval(() => {
      setSeries(prevSeries => {
        return prevSeries.map(stream => {
          const newData = [...stream.data.slice(1), Math.random() * 100];
          return {
            ...stream,
            data: newData.slice(-maxDataPoints)
          };
        });
      });
    }, updateInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval, maxDataPoints]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 
          className="text-sm font-bold uppercase tracking-wider"
          style={{
            fontFamily: 'Orbitron, monospace',
            color: '#00FFCC',
            textShadow: '0 0 10px rgba(0, 255, 204, 0.5)'
          }}
        >
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400 font-mono">LIVE</span>
          </div>
        </div>
      </div>
      
      {/* Chart Container */}
      <div 
        className="relative overflow-hidden rounded-lg"
        style={{
          background: 'rgba(0, 255, 204, 0.02)',
          border: '1px solid rgba(0, 255, 204, 0.2)',
          boxShadow: 'inset 0 0 20px rgba(0, 255, 204, 0.05)'
        }}
      >
        {/* Efecto de brillo animado */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0, 255, 204, 0.2), transparent)',
            animation: 'slide 3s linear infinite'
          }}
        />
        
        <ApexCharts
          options={chartOptions}
          series={series}
          type={type}
          height={height}
        />
      </div>
      
      {/* Indicadores de estado */}
      <div className="flex justify-between items-center mt-2 px-2">
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400 font-mono">
            UPDATE: {updateInterval}ms
          </div>
          <div className="text-xs text-gray-400 font-mono">
            POINTS: {maxDataPoints}
          </div>
        </div>
        <div className="text-xs text-cyan-400 font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default RealtimeChart;