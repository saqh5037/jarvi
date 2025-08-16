import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipForward,
  Rewind,
  Settings,
  ChevronDown,
  ChevronUp,
  Mic,
  Sparkles,
  Brain,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  FileText,
  Zap
} from 'lucide-react';
import useEdgeTTS from '../hooks/useEdgeTTS';
import axios from 'axios';

/**
 * Sistema de lectura de voz con Edge TTS
 * Proporciona lectura de texto con voces neurales de Microsoft
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.text - Texto a leer
 * @param {string} props.title - Título del contenido
 * @param {Function} props.onClose - Callback al cerrar
 * @param {boolean} props.allowSummary - Permitir generación de resumen
 * @param {boolean} props.autoStart - Iniciar lectura automáticamente
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.mode - Modo de visualización: compact, expanded, fullscreen
 */
const VoiceReadingSystem = ({ 
  text, 
  title = '', 
  onClose,
  allowSummary = true,
  autoStart = false,
  className = '',
  mode = 'compact' // compact, expanded, fullscreen
}) => {
  const {
    isReading,
    isPaused,
    readingProgress,
    availableVoices,
    selectedVoice,
    rate,
    pitch,
    volume,
    speak,
    pause,
    resume,
    stop,
    changeRate,
    setPitch,
    setVolume,
    setSelectedVoice,
    getHighlightedText,
    speakWithSummary,
    estimatedTime,
    isLoading
  } = useEdgeTTS();

  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [viewMode, setViewMode] = useState(mode);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [keyPoints, setKeyPoints] = useState([]);
  const contentRef = useRef(null);

  // Auto-start si está configurado
  useEffect(() => {
    if (autoStart && text) {
      handleSpeak();
    }
  }, [autoStart, text]);

  // Obtener resumen del texto con Gemini
  const getSummary = async (textToSummarize) => {
    try {
      setIsLoadingSummary(true);
      const response = await axios.post('http://localhost:3005/api/generate-summary', {
        text: textToSummarize,
        maxLength: 150
      });
      
      const summaryData = response.data;
      setSummary(summaryData.summary);
      setKeyPoints(summaryData.keyPoints || []);
      setShowSummary(true);
      
      return summaryData.summary;
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      return null;
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Iniciar lectura
  const handleSpeak = async () => {
    if (allowSummary && text.length > 500) {
      await speakWithSummary(text, getSummary);
    } else {
      speak(text, {
        voice: selectedVoice?.id,
        onWord: (word, index) => {
          // Auto-scroll al texto actual
          if (contentRef.current && highlightEnabled) {
            const highlightedElement = contentRef.current.querySelector('.voice-highlight');
            if (highlightedElement) {
              highlightedElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }
        }
      });
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isReading) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      handleSpeak();
    }
  };

  // Cambiar velocidad con presets
  const speedPresets = [
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: 'Normal', value: 0.9 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 }
  ];

  // Renderizar texto con resaltado
  const renderHighlightedText = () => {
    if (!highlightEnabled || !isReading) {
      return <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{text}</div>;
    }

    const highlighted = getHighlightedText(text, 'bg-blue-200 dark:bg-blue-700 px-1 rounded transition-all duration-300');
    return <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  // Cambiar modo de vista
  const toggleViewMode = () => {
    const modes = ['compact', 'expanded', 'fullscreen'];
    const currentIndex = modes.indexOf(viewMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setViewMode(nextMode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`
        voice-reading-system rounded-xl shadow-2xl bg-white dark:bg-gray-800 
        ${viewMode === 'fullscreen' ? 'fixed inset-0 z-50' : ''}
        ${viewMode === 'expanded' ? 'w-full max-w-4xl mx-auto' : 'w-full'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              {title || 'Asistente de Lectura'}
              {isLoading && <span className="ml-2 text-sm text-gray-500">Generando audio...</span>}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleViewMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              title={viewMode === 'fullscreen' ? 'Salir de pantalla completa' : 'Cambiar vista'}
            >
              {viewMode === 'fullscreen' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-gray-600 dark:text-gray-400">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${readingProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Estimated Time */}
        {estimatedTime > 0 && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <span>Tiempo estimado: {Math.ceil(estimatedTime)} min</span>
            <span className="border-l pl-2">
              {selectedVoice?.gender === 'Female' ? '👩' : '👨'} {selectedVoice?.name?.split(' - ')[0] || 'Voz'} 
              {selectedVoice?.premium && ' ⭐'}
            </span>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {showSummary && summary && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-2">
            <Brain className="w-5 h-5 text-blue-500 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                Resumen Inteligente
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{summary}</p>
              
              {keyPoints.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Puntos Clave:</h5>
                  <ul className="space-y-1">
                    {keyPoints.map((point, index) => (
                      <li key={index} className="text-xs flex items-start gap-1 text-gray-700 dark:text-gray-300">
                        <Zap className="w-3 h-3 text-yellow-500 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Content Area */}
      <div 
        ref={contentRef}
        className={`
          p-4 overflow-y-auto
          ${viewMode === 'compact' ? 'max-h-64' : ''}
          ${viewMode === 'expanded' ? 'max-h-96' : ''}
          ${viewMode === 'fullscreen' ? 'flex-1' : ''}
        `}
        style={{
          fontSize: viewMode === 'fullscreen' ? '1.2rem' : '1rem',
          lineHeight: viewMode === 'fullscreen' ? '1.8' : '1.6'
        }}
      >
        {renderHighlightedText()}
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => changeRate(Math.max(0.1, rate - 0.1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            title="Reducir velocidad"
          >
            <Rewind className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className={`
              p-3 rounded-full transition-all transform hover:scale-105
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : isReading 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'}
            `}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Volume2 className="w-6 h-6 text-white" />
              </motion.div>
            ) : isReading ? (
              isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={stop}
            disabled={!isReading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 text-gray-700 dark:text-gray-300"
            title="Detener"
          >
            <Square className="w-5 h-5" />
          </button>

          <button
            onClick={() => changeRate(Math.min(2, rate + 0.1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            title="Aumentar velocidad"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Speed Presets */}
        <div className="flex items-center justify-center gap-1">
          {speedPresets.map(preset => (
            <button
              key={preset.value}
              onClick={() => changeRate(preset.value)}
              className={`
                px-2 py-1 text-xs rounded-lg transition-all
                ${Math.abs(rate - preset.value) < 0.05
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighlightEnabled(!highlightEnabled)}
              className={`
                p-2 rounded-lg transition-colors
                ${highlightEnabled 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}
              `}
              title={highlightEnabled ? 'Desactivar resaltado' : 'Activar resaltado'}
            >
              {highlightEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {allowSummary && !summary && (
              <button
                onClick={() => getSummary(text)}
                disabled={isLoadingSummary}
                className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                title="Generar resumen"
              >
                {isLoadingSummary ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Brain className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              {/* Voice Selection */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Voz Premium Neural {selectedVoice?.premium && <span className="text-yellow-500">⭐</span>}
                </label>
                <select
                  value={selectedVoice?.id || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.id === e.target.value);
                    setSelectedVoice(voice);
                    
                    // Si está leyendo, reiniciar con la nueva voz
                    if (isReading && text) {
                      stop();
                      setTimeout(() => {
                        speak(text, { voice: voice.id });
                      }, 100);
                    }
                  }}
                  className="w-full mt-1 p-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:border-gray-600"
                >
                  <optgroup label="🎙️ Voces Femeninas Premium">
                    {availableVoices.filter(v => v.gender === 'Female').map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} {voice.premium && '⭐'}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🎙️ Voces Masculinas Premium">
                    {availableVoices.filter(v => v.gender === 'Male').map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} {voice.premium && '⭐'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Volume Control */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Volumen: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => setVolume(e.target.value / 100)}
                  className="w-full mt-1"
                />
              </div>

              {/* Pitch Control */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Tono: {pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={pitch * 100}
                  onChange={(e) => setPitch(e.target.value / 100)}
                  className="w-full mt-1"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VoiceReadingSystem;