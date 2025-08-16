/**
 * Hook personalizado para lectura de voz con Web Speech API
 * Proporciona funcionalidad de text-to-speech nativa del navegador
 * 
 * @module useVoiceReader
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para lectura de voz con control avanzado
 * @returns {Object} Estado y funciones de control de lectura
 */
const useVoiceReader = () => {
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  
  const utteranceRef = useRef(null);
  const textRef = useRef('');
  const wordsRef = useRef([]);
  const boundaryCallbackRef = useRef(null);

  // Cargar voces disponibles
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(voice => 
        voice.lang.includes('es') || voice.lang.includes('ES')
      );
      
      setAvailableVoices(spanishVoices.length > 0 ? spanishVoices : voices);
      
      // Seleccionar la mejor voz en español por defecto
      const preferredVoice = spanishVoices.find(v => 
        v.name.includes('Monica') || v.name.includes('Jorge') || v.name.includes('Paulina')
      ) || spanishVoices[0] || voices[0];
      
      setSelectedVoice(preferredVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Función para dividir texto en palabras con posiciones
  const processText = (text) => {
    const words = [];
    const regex = /\S+/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      words.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return words;
  };

  // Función principal de habla
  const speak = useCallback((text, options = {}) => {
    // Cancelar cualquier lectura en curso
    window.speechSynthesis.cancel();
    
    // Guardar texto y palabras
    textRef.current = text;
    wordsRef.current = processText(text);
    
    // Crear utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'es-ES';
    utterance.rate = options.rate || rate;
    utterance.pitch = options.pitch || pitch;
    utterance.volume = options.volume || volume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Configurar callbacks
    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
      setCurrentWord(0);
      setReadingProgress(0);
      if (options.onStart) options.onStart();
    };
    
    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      setCurrentWord(0);
      setReadingProgress(100);
      if (options.onEnd) options.onEnd();
    };
    
    utterance.onerror = (event) => {
      console.error('Error en síntesis de voz:', event);
      setIsReading(false);
      setIsPaused(false);
      if (options.onError) options.onError(event);
    };
    
    utterance.onpause = () => {
      setIsPaused(true);
      if (options.onPause) options.onPause();
    };
    
    utterance.onresume = () => {
      setIsPaused(false);
      if (options.onResume) options.onResume();
    };
    
    // Evento boundary para tracking de palabras
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const wordIndex = wordsRef.current.findIndex(w => 
          w.start <= event.charIndex && w.end > event.charIndex
        );
        
        if (wordIndex !== -1) {
          setCurrentWord(wordIndex);
          const progress = ((wordIndex + 1) / wordsRef.current.length) * 100;
          setReadingProgress(progress);
          
          if (options.onWord) {
            options.onWord(wordsRef.current[wordIndex], wordIndex);
          }
        }
      }
      
      if (options.onBoundary) options.onBoundary(event);
    };
    
    utteranceRef.current = utterance;
    boundaryCallbackRef.current = options.onBoundary;
    
    // Iniciar síntesis
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, rate, pitch, volume]);

  // Función para pausar
  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  // Función para reanudar
  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  // Función para detener
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setCurrentWord(0);
    setReadingProgress(0);
  }, []);

  // Función para cambiar velocidad
  const changeRate = useCallback((newRate) => {
    setRate(Math.max(0.1, Math.min(2, newRate)));
    
    // Si está leyendo, reiniciar con nueva velocidad
    if (isReading && utteranceRef.current) {
      const currentText = textRef.current;
      const currentWordIndex = currentWord;
      
      stop();
      
      // Continuar desde la palabra actual
      const remainingWords = wordsRef.current.slice(currentWordIndex);
      const remainingText = remainingWords.map(w => w.word).join(' ');
      
      setTimeout(() => {
        speak(remainingText, {
          rate: newRate,
          onBoundary: boundaryCallbackRef.current
        });
      }, 100);
    }
  }, [isReading, currentWord, speak, stop]);

  // Función para obtener texto con resaltado
  const getHighlightedText = useCallback((text, className = 'voice-highlight') => {
    if (!isReading || currentWord < 0) return text;
    
    const words = processText(text);
    if (words.length === 0) return text;
    
    let result = '';
    let lastEnd = 0;
    
    words.forEach((word, index) => {
      // Añadir texto entre palabras
      result += text.substring(lastEnd, word.start);
      
      // Añadir palabra con o sin resaltado
      if (index === currentWord) {
        result += `<span class="${className}">${word.word}</span>`;
      } else {
        result += word.word;
      }
      
      lastEnd = word.end;
    });
    
    // Añadir texto restante
    result += text.substring(lastEnd);
    
    return result;
  }, [isReading, currentWord]);

  // Función para leer con resumen previo
  const speakWithSummary = useCallback(async (text, getSummary) => {
    try {
      // Si el texto es muy largo, obtener resumen primero
      if (text.length > 500 && getSummary) {
        const summary = await getSummary(text);
        
        // Leer primero el resumen
        speak(`Resumen del contenido: ${summary}. Ahora procederé con el texto completo.`, {
          onEnd: () => {
            // Después del resumen, leer el texto completo
            setTimeout(() => speak(text), 1000);
          }
        });
      } else {
        speak(text);
      }
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      speak(text);
    }
  }, [speak]);

  return {
    // Estado
    isReading,
    isPaused,
    currentWord,
    currentSentence,
    readingProgress,
    availableVoices,
    selectedVoice,
    rate,
    pitch,
    volume,
    
    // Funciones
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
    
    // Utilidades
    wordsCount: wordsRef.current.length,
    estimatedTime: textRef.current.length / (rate * 150) // Estimación en minutos
  };
};

export default useVoiceReader;