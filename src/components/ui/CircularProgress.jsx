import { motion } from 'framer-motion';

/**
 * Componente de progreso circular estilo HUD
 * Muestra porcentajes con animaciones futuristas
 */
const CircularProgress = ({ 
  value = 0, 
  max = 100, 
  size = 120, 
  strokeWidth = 8,
  label,
  sublabel,
  color = '#00E5FF',
  secondaryColor = '#1a1a1a'
}) => {
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Fondo del círculo */}
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={secondaryColor}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.3}
          />
          
          {/* Círculo de progreso */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`
            }}
          />
        </svg>

        {/* Texto central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-2xl font-bold font-tech"
            style={{ color }}
          >
            {Math.round(percentage)}%
          </motion.div>
          {label && (
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          )}
        </div>
      </div>
      
      {sublabel && (
        <div className="text-xs text-gray-500 mt-2 text-center">{sublabel}</div>
      )}
    </div>
  );
};

export default CircularProgress;