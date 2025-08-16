import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Pause,
  Play,
  SkipForward,
  SkipBack,
  Settings,
  Eye,
  Users,
  Sparkles,
  Brain,
  Zap,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Hash,
  Clock,
  Target,
  Info
} from 'lucide-react';
import useVoiceReader from '../hooks/useVoiceReader';

/**
 * Modo de lectura colaborativa con análisis contextual
 * Proporciona lectura detallada con información adicional y estadísticas
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.content - Contenido para lectura colaborativa
 */
const CollaborativeReadingMode = ({ 
  content, 
  title = 'Lectura Colaborativa',
  metadata = {},
  onClose 
}) => {
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
    getHighlightedText
  } = useVoiceReader();

  const [sentences, setSentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState('text-lg');
  const [lineHeight, setLineHeight] = useState('leading-relaxed');
  const [highlightColor, setHighlightColor] = useState('bg-blue-200');
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  // Dividir contenido en oraciones
  useEffect(() => {
    if (content) {
      // Dividir por puntos, signos de exclamación e interrogación
      const sentenceArray = content.match(/[^.!?]+[.!?]+/g) || [content];
      setSentences(sentenceArray.map(s => s.trim()));
    }
  }, [content]);

  // Actualizar oración actual basado en el progreso
  useEffect(() => {
    if (sentences.length > 0 && readingProgress > 0) {
      const index = Math.floor((readingProgress / 100) * sentences.length);
      if (index !== currentSentenceIndex && index < sentences.length) {
        setCurrentSentenceIndex(index);
        scrollToCurrentSentence();
      }
    }
  }, [readingProgress, sentences.length]);

  // Auto-scroll a la oración actual
  const scrollToCurrentSentence = () => {
    if (contentRef.current) {
      const sentenceElement = contentRef.current.querySelector(`.sentence-${currentSentenceIndex}`);
      if (sentenceElement) {
        sentenceElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  };

  // Iniciar lectura colaborativa
  const startCollaborativeReading = () => {
    speak(content, {
      onWord: (word, index) => {
        // Actualizar UI con cada palabra
        scrollToCurrentSentence();
      },
      onBoundary: (event) => {
        // Manejar límites de oraciones
        if (event.name === 'sentence') {
          setCurrentSentenceIndex(prev => Math.min(prev + 1, sentences.length - 1));
        }
      }
    });
  };

  // Saltar a oración específica
  const jumpToSentence = (index) => {
    if (index >= 0 && index < sentences.length) {
      setCurrentSentenceIndex(index);
      const textToRead = sentences.slice(index).join(' ');
      stop();
      setTimeout(() => speak(textToRead), 100);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Calcular estadísticas
  const wordCount = content.split(/\s+/).length;
  const estimatedReadingTime = Math.ceil(wordCount / (150 * rate));
  const charactersRead = Math.floor((content.length * readingProgress) / 100);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${
        isFullscreen 
          ? 'fixed inset-0 z-50' 
          : 'relative w-full h-full'
      } bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800`}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Modo Colaborativo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progreso de lectura</span>
            <span>{Math.round(readingProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
              style={{ width: `${readingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 h-[calc(100%-200px)]">
        {/* Reading Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div 
            ref={contentRef}
            className={`max-w-4xl mx-auto ${fontSize} ${lineHeight}`}
          >
            {sentences.map((sentence, index) => (
              <motion.span
                key={index}
                className={`sentence-${index} inline ${
                  index === currentSentenceIndex
                    ? `${highlightColor} dark:bg-blue-700 px-1 rounded`
                    : index < currentSentenceIndex
                    ? 'text-gray-500 dark:text-gray-500'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
                initial={{ opacity: 0.5 }}
                animate={{ 
                  opacity: index <= currentSentenceIndex ? 1 : 0.5,
                  scale: index === currentSentenceIndex ? 1.02 : 1
                }}
                transition={{ duration: 0.3 }}
                onClick={() => jumpToSentence(index)}
                style={{ cursor: 'pointer' }}
              >
                {sentence}{' '}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Analysis Panel */}
        {showAnalysis && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            className="w-80 bg-white dark:bg-gray-800 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto"
          >
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Análisis de Lectura
            </h3>

            {/* Estadísticas */}
            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Palabras totales</span>
                  <span className="font-medium">{wordCount}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo estimado</span>
                  <span className="font-medium">{estimatedReadingTime} min</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Caracteres leídos</span>
                  <span className="font-medium">{charactersRead}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Oración actual</span>
                  <span className="font-medium">{currentSentenceIndex + 1}/{sentences.length}</span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {Object.keys(metadata).length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Información adicional
                </h4>
                <div className="space-y-2">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <span className="font-medium capitalize">{key}:</span>
                        <span className="ml-1 text-gray-600 dark:text-gray-400">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Puntos Clave (simulados) */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">
                Puntos clave detectados
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span className="text-sm">Introducción completada</span>
                </div>
                {currentSentenceIndex > sentences.length / 4 && (
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span className="text-sm">25% del contenido procesado</span>
                  </div>
                )}
                {currentSentenceIndex > sentences.length / 2 && (
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span className="text-sm">Punto medio alcanzado</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-lg p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => jumpToSentence(currentSentenceIndex - 1)}
              disabled={currentSentenceIndex === 0}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                if (isReading) {
                  isPaused ? resume() : pause();
                } else {
                  startCollaborativeReading();
                }
              }}
              className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors"
            >
              {isReading ? (
                isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={() => jumpToSentence(currentSentenceIndex + 1)}
              disabled={currentSentenceIndex >= sentences.length - 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Velocidad:</span>
            <div className="flex items-center gap-1">
              {[0.5, 0.75, 1, 1.25, 1.5].map(speed => (
                <button
                  key={speed}
                  onClick={() => changeRate(speed)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    Math.abs(rate - speed) < 0.1
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={`p-2 rounded-lg transition-colors ${
                showAnalysis
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>

            <button
              onClick={stop}
              disabled={!isReading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CollaborativeReadingMode;