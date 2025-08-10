import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

const DataFlowVisualization = ({ 
  title = "Data Visualisation",
  className = "" 
}) => {
  const flowRef = useRef(null);
  const pathRefs = useRef([]);
  
  // Datos del flujo financiero
  const flowData = {
    source: "Finance",
    total: "$43,833",
    change: "+3%",
    nodes: [
      { id: 1, label: "Marketing", value: "$11,419", color: "#FF6B9D" },
      { id: 2, label: "Sales", value: "$5,673", color: "#A8E6CF" },
      { id: 3, label: "Operations", value: "$19,658", color: "#FFB7C5" },
      { id: 4, label: "Processing", value: "$12,965", color: "#C7CEEA" },
      { id: 5, label: "Banking", value: "$23,957", color: "#FFDAB9" },
      { id: 6, label: "Delivery", value: "$800", color: "#B5EAD7" }
    ]
  };
  
  useEffect(() => {
    // Animar las líneas de flujo
    pathRefs.current.forEach((path, index) => {
      if (path) {
        const length = path.getTotalLength();
        
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length
        });
        
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 2,
          delay: index * 0.2,
          ease: "power2.inOut",
          repeat: -1,
          repeatDelay: 3
        });
      }
    });
    
    // Animar los nodos
    gsap.fromTo(".flow-node",
      { scale: 0, opacity: 0 },
      { 
        scale: 1, 
        opacity: 1, 
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.7)"
      }
    );
  }, []);
  
  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-gray-800">{title}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Total pending</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-gray-800">{flowData.total}</span>
            <span className="text-sm text-green-500">{flowData.change}</span>
          </div>
        </div>
      </div>
      
      {/* Flow Visualization */}
      <div ref={flowRef} className="relative">
        <svg 
          width="100%" 
          height="400" 
          viewBox="0 0 800 400" 
          className="w-full h-auto"
          style={{ maxWidth: '800px' }}
        >
          {/* Gradientes */}
          <defs>
            <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#A8E6CF" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="flowGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFB7C5" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#C7CEEA" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="flowGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFDAB9" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#B5EAD7" stopOpacity="0.6" />
            </linearGradient>
            
            {/* Filtro de blur para efecto glow */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Paths de flujo */}
          <g opacity="0.8">
            {/* Flow 1: Finance -> Marketing/Sales */}
            <path
              ref={el => pathRefs.current[0] = el}
              d="M 150 200 Q 300 120 450 100"
              stroke="url(#flowGradient1)"
              strokeWidth="40"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              ref={el => pathRefs.current[1] = el}
              d="M 150 200 Q 300 180 450 170"
              stroke="url(#flowGradient1)"
              strokeWidth="30"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            
            {/* Flow 2: Finance -> Operations/Processing */}
            <path
              ref={el => pathRefs.current[2] = el}
              d="M 150 200 Q 300 200 450 240"
              stroke="url(#flowGradient2)"
              strokeWidth="50"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              ref={el => pathRefs.current[3] = el}
              d="M 150 200 Q 300 250 450 310"
              stroke="url(#flowGradient2)"
              strokeWidth="35"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            
            {/* Flow 3: To Banking/Delivery */}
            <path
              ref={el => pathRefs.current[4] = el}
              d="M 450 100 Q 550 100 650 120"
              stroke="url(#flowGradient3)"
              strokeWidth="25"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              ref={el => pathRefs.current[5] = el}
              d="M 450 310 Q 550 310 650 280"
              stroke="url(#flowGradient3)"
              strokeWidth="15"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>
          
          {/* Nodo origen */}
          <g className="flow-node">
            <rect
              x="50"
              y="170"
              width="100"
              height="60"
              rx="8"
              fill="#6366F1"
              filter="url(#glow)"
            />
            <text
              x="100"
              y="195"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="500"
            >
              {flowData.source}
            </text>
            <text
              x="100"
              y="215"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
            >
              {flowData.total}
            </text>
          </g>
          
          {/* Nodos de destino - Columna 1 */}
          <g className="flow-node">
            <rect x="400" y="70" width="100" height="50" rx="8" fill="#FF6B9D" opacity="0.9" />
            <text x="450" y="90" textAnchor="middle" fill="white" fontSize="11">Marketing</text>
            <text x="450" y="108" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">$11,419</text>
          </g>
          
          <g className="flow-node">
            <rect x="400" y="140" width="100" height="50" rx="8" fill="#A8E6CF" opacity="0.9" />
            <text x="450" y="160" textAnchor="middle" fill="#333" fontSize="11">Sales</text>
            <text x="450" y="178" textAnchor="middle" fill="#333" fontSize="13" fontWeight="bold">$5,673</text>
          </g>
          
          <g className="flow-node">
            <rect x="400" y="210" width="100" height="50" rx="8" fill="#FFB7C5" opacity="0.9" />
            <text x="450" y="230" textAnchor="middle" fill="white" fontSize="11">Operations</text>
            <text x="450" y="248" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">$19,658</text>
          </g>
          
          <g className="flow-node">
            <rect x="400" y="280" width="100" height="50" rx="8" fill="#C7CEEA" opacity="0.9" />
            <text x="450" y="300" textAnchor="middle" fill="#333" fontSize="11">Processing</text>
            <text x="450" y="318" textAnchor="middle" fill="#333" fontSize="13" fontWeight="bold">$12,965</text>
          </g>
          
          {/* Nodos de destino - Columna 2 */}
          <g className="flow-node">
            <rect x="600" y="90" width="100" height="50" rx="8" fill="#FFDAB9" opacity="0.9" />
            <text x="650" y="110" textAnchor="middle" fill="#333" fontSize="11">Banking</text>
            <text x="650" y="128" textAnchor="middle" fill="#333" fontSize="13" fontWeight="bold">$23,957</text>
          </g>
          
          <g className="flow-node">
            <rect x="600" y="250" width="100" height="50" rx="8" fill="#B5EAD7" opacity="0.9" />
            <text x="650" y="270" textAnchor="middle" fill="#333" fontSize="11">Delivery</text>
            <text x="650" y="288" textAnchor="middle" fill="#333" fontSize="13" fontWeight="bold">$800</text>
          </g>
        </svg>
      </div>
      
      {/* Indicadores adicionales */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-800">204</div>
          <div className="text-sm text-gray-500">Total Orders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-800">65,540</div>
          <div className="text-sm text-gray-500">Processed Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-800">324</div>
          <div className="text-sm text-gray-500">Active Clients</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-green-500">+12%</div>
          <div className="text-sm text-gray-500">Growth Rate</div>
        </div>
      </div>
    </div>
  );
};

export default DataFlowVisualization;