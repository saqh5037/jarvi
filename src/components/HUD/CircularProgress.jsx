import React, { useEffect, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { gsap } from 'gsap';

const CircularProgress = ({ 
  value, 
  label, 
  maxValue = 100, 
  unit = '%',
  color = '#00FFCC',
  criticalThreshold = 80,
  size = 150
}) => {
  const containerRef = useRef(null);
  const percentage = (value / maxValue) * 100;
  const isCritical = percentage >= criticalThreshold;
  
  useEffect(() => {
    // Animación de entrada con GSAP
    gsap.fromTo(containerRef.current, 
      { 
        scale: 0.8, 
        opacity: 0,
        rotation: -180
      },
      { 
        scale: 1, 
        opacity: 1,
        rotation: 0,
        duration: 1,
        ease: "power2.out"
      }
    );
    
    // Pulso si es crítico
    if (isCritical) {
      gsap.to(containerRef.current, {
        scale: 1.05,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  }, [isCritical]);
  
  const progressColor = isCritical ? '#FF3D94' : color;
  
  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {/* Efecto de brillo de fondo */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${progressColor}20 0%, transparent 70%)`,
          filter: 'blur(20px)',
          animation: 'pulse-neon 2s ease-in-out infinite'
        }}
      />
      
      {/* Progress circular */}
      <CircularProgressbar
        value={percentage}
        text={`${value}${unit}`}
        styles={buildStyles({
          rotation: 0.25,
          strokeLinecap: 'round',
          textSize: '16px',
          pathTransitionDuration: 0.5,
          pathColor: progressColor,
          textColor: progressColor,
          trailColor: 'rgba(255, 255, 255, 0.1)',
          backgroundColor: 'transparent',
        })}
      />
      
      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 text-center mt-2">
        <span 
          className="text-xs font-mono uppercase tracking-wider"
          style={{ 
            color: progressColor,
            textShadow: `0 0 10px ${progressColor}`,
            fontFamily: 'Orbitron, monospace'
          }}
        >
          {label}
        </span>
      </div>
      
      {/* Indicador de estado crítico */}
      {isCritical && (
        <div className="absolute -top-2 -right-2">
          <div 
            className="w-4 h-4 bg-red-500 rounded-full animate-pulse"
            style={{
              boxShadow: '0 0 10px #FF3D94, 0 0 20px #FF3D94'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CircularProgress;