import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

const HolographicCard = ({ 
  title, 
  children, 
  icon: Icon,
  status = 'normal', // normal, warning, critical, success
  className = '',
  animate = true
}) => {
  const cardRef = useRef(null);
  const scanlineRef = useRef(null);
  
  const statusColors = {
    normal: '#00FFCC',
    warning: '#FFCC00',
    critical: '#FF3D94',
    success: '#00FFAA'
  };
  
  const color = statusColors[status];
  
  useEffect(() => {
    if (!animate) return;
    
    // Animación de entrada
    gsap.fromTo(cardRef.current,
      { 
        y: 50,
        opacity: 0,
        rotationX: -15
      },
      {
        y: 0,
        opacity: 1,
        rotationX: 0,
        duration: 0.8,
        ease: "power3.out"
      }
    );
    
    // Efecto de escaneo continuo
    gsap.to(scanlineRef.current, {
      y: '200%',
      duration: 3,
      repeat: -1,
      ease: "none"
    });
  }, [animate]);
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: 1.02, translateZ: 20 }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{
        background: `linear-gradient(135deg, ${color}10, ${color}05)`,
        backdropFilter: 'blur(10px) saturate(180%)',
        border: `1px solid ${color}30`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: `
          0 8px 32px 0 ${color}20,
          inset 0 0 20px ${color}10,
          0 0 40px ${color}10
        `,
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Efecto holográfico de fondo */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            linear-gradient(45deg, ${color}10, transparent, ${color}10),
            linear-gradient(-45deg, transparent, ${color}05, transparent)
          `,
          backgroundSize: '200% 200%',
          animation: 'holographic-shift 3s ease infinite'
        }}
      />
      
      {/* Línea de escaneo */}
      <div
        ref={scanlineRef}
        className="absolute left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          top: '-100%',
          filter: 'blur(1px)',
          opacity: 0.5
        }}
      />
      
      {/* Esquinas decorativas */}
      <div className="absolute top-0 left-0 w-4 h-4">
        <div 
          className="absolute top-0 left-0 w-full h-px"
          style={{ background: color }}
        />
        <div 
          className="absolute top-0 left-0 w-px h-full"
          style={{ background: color }}
        />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4">
        <div 
          className="absolute top-0 right-0 w-full h-px"
          style={{ background: color }}
        />
        <div 
          className="absolute top-0 right-0 w-px h-full"
          style={{ background: color }}
        />
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4">
        <div 
          className="absolute bottom-0 left-0 w-full h-px"
          style={{ background: color }}
        />
        <div 
          className="absolute bottom-0 left-0 w-px h-full"
          style={{ background: color }}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4">
        <div 
          className="absolute bottom-0 right-0 w-full h-px"
          style={{ background: color }}
        />
        <div 
          className="absolute bottom-0 right-0 w-px h-full"
          style={{ background: color }}
        />
      </div>
      
      {/* Contenido */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: `${color}20`,
                  border: `1px solid ${color}40`
                }}
              >
                <Icon 
                  size={20} 
                  style={{ 
                    color: color,
                    filter: `drop-shadow(0 0 5px ${color})`
                  }}
                />
              </div>
            )}
            <h3 
              className="text-lg font-bold uppercase tracking-wider"
              style={{
                fontFamily: 'Orbitron, monospace',
                color: color,
                textShadow: `0 0 10px ${color}50`
              }}
            >
              {title}
            </h3>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: status === 'critical' ? 
                    (i === 0 ? '#FF3D94' : '#FF3D9440') : 
                    color,
                  animation: status === 'critical' ? 
                    `pulse ${1 + i * 0.2}s ease-in-out infinite` : 
                    'none'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="relative">
          {children}
        </div>
      </div>
      
      {/* Efecto de ruido/interferencia para estado crítico */}
      {status === 'critical' && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
            animation: 'glitch-2 0.5s infinite'
          }}
        />
      )}
    </motion.div>
  );
};

export default HolographicCard;