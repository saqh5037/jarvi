import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Mic,
  Star,
  Zap,
  Heart,
  Music2,
  SkipForward,
  SkipBack,
  Settings,
  X
} from 'lucide-react';
import useVoiceReader from '../hooks/useVoiceReader';

/**
 * Modo de lectura Karaoke con sincronización visual
 * Resalta las palabras mientras se leen con animaciones estilo karaoke
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.task - Tarea con texto a leer en modo karaoke
 * @param {Function} props.onClose - Callback al cerrar el modo karaoke
 */
const KaraokeReadingMode = ({ task, onClose }) => {
  const {
    isReading,
    isPaused,
    currentWord,
    readingProgress,
    rate,
    speak,
    pause,
    resume,
    stop,
    changeRate,
    wordsCount
  } = useVoiceReader();

  const [words, setWords] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [showEffects, setShowEffects] = useState(true);
  const [bounceEffect, setBounceEffect] = useState(false);
  const [starBurst, setStarBurst] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('from-purple-900 via-pink-800 to-indigo-900');
  const lyricsRef = useRef(null);

  // Preparar el texto de la tarea
  const prepareTaskText = () => {
    const priority = task.priority || 'normal';
    const category = task.category || 'general';
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'sin fecha límite';
    
    return `
      ${task.title}.
      ${task.description ? task.description : ''}.
      Prioridad ${priority === 'urgent' ? 'urgente' : priority === 'high' ? 'alta' : priority === 'medium' ? 'media' : 'baja'}.
      Categoría ${category}.
      Fecha límite ${dueDate}.
    `.trim();
  };

  // Dividir texto en palabras para el efecto karaoke
  useEffect(() => {
    const text = prepareTaskText();
    const wordsArray = text.split(/\s+/).map((word, index) => ({
      text: word,
      id: index,
      line: Math.floor(index / 8) // 8 palabras por línea aproximadamente
    }));
    setWords(wordsArray);
  }, [task]);

  // Actualizar línea actual basado en la palabra actual
  useEffect(() => {
    if (words.length > 0 && currentWord >= 0) {
      const word = words[currentWord];
      if (word && word.line !== currentLine) {
        setCurrentLine(word.line);
        scrollToCurrentLine();
      }

      // Efectos especiales cada cierto número de palabras
      if (currentWord > 0 && currentWord % 10 === 0) {
        triggerSpecialEffect();
      }
    }
  }, [currentWord, words]);

  // Auto-scroll suave
  const scrollToCurrentLine = () => {
    if (lyricsRef.current) {
      const lineElement = lyricsRef.current.querySelector(`.line-${currentLine}`);
      if (lineElement) {
        lineElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  };

  // Efectos especiales aleatorios
  const triggerSpecialEffect = () => {
    setBounceEffect(true);
    setTimeout(() => setBounceEffect(false), 500);

    if (Math.random() > 0.5) {
      setStarBurst(true);
      setTimeout(() => setStarBurst(false), 1000);
    }

    // Cambiar color de fondo ocasionalmente
    if (Math.random() > 0.7) {
      const colors = [
        'from-purple-900 via-pink-800 to-indigo-900',
        'from-blue-900 via-purple-800 to-pink-900',
        'from-indigo-900 via-blue-800 to-purple-900',
        'from-pink-900 via-red-800 to-orange-900'
      ];
      setBackgroundColor(colors[Math.floor(Math.random() * colors.length)]);
    }
  };

  // Iniciar lectura estilo karaoke
  const startKaraokeReading = () => {
    const text = prepareTaskText();
    speak(text, {
      rate: rate,
      onWord: (word, index) => {
        // El hook ya actualiza currentWord automáticamente
      },
      onEnd: () => {
        // Celebración al finalizar
        setStarBurst(true);
        setTimeout(() => setStarBurst(false), 2000);
      }
    });
  };

  // Reiniciar desde el principio
  const restart = () => {
    stop();
    setTimeout(() => startKaraokeReading(), 100);
  };

  // Agrupar palabras por línea
  const getLines = () => {
    const lines = [];
    let currentLineWords = [];
    let currentLineNum = 0;

    words.forEach(word => {
      if (word.line !== currentLineNum) {
        if (currentLineWords.length > 0) {
          lines.push(currentLineWords);
        }
        currentLineWords = [word];
        currentLineNum = word.line;
      } else {
        currentLineWords.push(word);
      }
    });

    if (currentLineWords.length > 0) {
      lines.push(currentLineWords);
    }

    return lines;
  };

  const lines = getLines();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Fondo animado */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${backgroundColor} transition-all duration-3000`}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />

      {/* Efectos de partículas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {showEffects && (
          <>
            {/* Estrellas flotantes */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  opacity: 0
                }}
                animate={{
                  y: window.innerHeight + 20,
                  opacity: [0, 1, 1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  delay: Math.random() * 10
                }}
              >
                <Star className="w-4 h-4 text-yellow-300" fill="currentColor" />
              </motion.div>
            ))}

            {/* Notas musicales flotantes */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={`note-${i}`}
                className="absolute"
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 20
                }}
                animate={{
                  y: -20,
                  x: `${Math.random() * 200 - 100}px`,
                  opacity: [0, 0.8, 0.8, 0]
                }}
                transition={{
                  duration: Math.random() * 15 + 10,
                  repeat: Infinity,
                  delay: Math.random() * 15
                }}
              >
                <Music2 className="w-6 h-6 text-pink-300 opacity-60" />
              </motion.div>
            ))}
          </>
        )}

        {/* Efecto de explosión de estrellas */}
        <AnimatePresence>
          {starBurst && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`burst-${i}`}
                  className="absolute"
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos(i * 30 * Math.PI / 180) * 200,
                    y: Math.sin(i * 30 * Math.PI / 180) * 200,
                    opacity: [1, 0]
                  }}
                  transition={{ duration: 1 }}
                >
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header con controles */}
      <div className="relative z-10 p-4 bg-black/30 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isReading ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Music className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-white">Modo Karaoke</h2>
              <p className="text-sm text-white/70">{task.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Barra de progreso estilo karaoke */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
              style={{ width: `${readingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-white/70">
            <span>{currentWord}/{wordsCount}</span>
            <span>{Math.round(readingProgress)}%</span>
          </div>
        </div>
      </div>

      {/* Área de letras estilo karaoke */}
      <div 
        ref={lyricsRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-8"
      >
        <div className="max-w-4xl mx-auto">
          {lines.map((line, lineIndex) => (
            <motion.div
              key={lineIndex}
              className={`line-${lineIndex} text-center mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: lineIndex <= currentLine + 1 ? 1 : 0.3,
                y: 0,
                scale: lineIndex === currentLine ? 1.1 : 1
              }}
              transition={{ duration: 0.5 }}
            >
              {line.map((word, wordIndex) => {
                const globalIndex = word.id;
                const isActive = globalIndex === currentWord;
                const isPast = globalIndex < currentWord;
                const isFuture = globalIndex > currentWord;

                return (
                  <motion.span
                    key={word.id}
                    className={`inline-block mx-2 text-4xl font-bold transition-all duration-300 ${
                      isActive 
                        ? 'text-yellow-300 drop-shadow-[0_0_30px_rgba(255,255,0,0.8)]' 
                        : isPast 
                        ? 'text-white' 
                        : 'text-white/30'
                    }`}
                    animate={isActive ? {
                      scale: [1, 1.3, 1],
                      y: [0, -10, 0]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {word.text}
                    
                    {/* Efecto de brillo en palabra activa */}
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                        animate={{ x: [-100, 100] }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </motion.span>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controles de reproducción estilo karaoke */}
      <div className="relative z-10 p-6 bg-black/40 backdrop-blur-md">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4">
            {/* Botón de reiniciar */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </motion.button>

            {/* Botón principal Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isReading) {
                  isPaused ? resume() : pause();
                } else {
                  startKaraokeReading();
                }
              }}
              className={`p-5 rounded-full transition-all ${
                isReading 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                  : 'bg-gradient-to-r from-green-500 to-blue-500'
              } shadow-2xl`}
              animate={bounceEffect ? { y: [-10, 0, -10, 0] } : {}}
            >
              {isReading ? (
                isPaused ? <Play className="w-8 h-8 text-white" /> : <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white" />
              )}
            </motion.button>

            {/* Botón de efectos */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEffects(!showEffects)}
              className={`p-3 rounded-full transition-colors ${
                showEffects ? 'bg-yellow-500' : 'bg-white/20'
              }`}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.button>
          </div>

          {/* Control de velocidad estilo karaoke */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="text-white/70 text-sm">Tempo:</span>
            {[0.5, 0.75, 1, 1.25, 1.5].map(speed => (
              <motion.button
                key={speed}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => changeRate(speed)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  Math.abs(rate - speed) < 0.1
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'bg-white/20 text-white/70 hover:bg-white/30'
                }`}
              >
                {speed}x
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores visuales adicionales */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
        {isReading && (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-3 h-3 bg-pink-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
              className="w-3 h-3 bg-purple-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
              className="w-3 h-3 bg-indigo-500 rounded-full"
            />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default KaraokeReadingMode;