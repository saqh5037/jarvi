/**
 * Hook personalizado para integración con Edge TTS
 * Proporciona funcionalidad de text-to-speech con voces neurales de Microsoft
 * 
 * @module useEdgeTTS
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const EDGE_TTS_URL = 'http://localhost:3007';

// Voces de alta calidad recomendadas - Mujeres y Hombres
const RECOMMENDED_VOICES = [
  // Voces Femeninas Premium
  { id: 'es-ES-ElviraNeural', name: 'Elvira - Mujer (España)', gender: 'Female', locale: 'es-ES', recommended: true, premium: true },
  { id: 'es-MX-DaliaNeural', name: 'Dalia - Mujer (México)', gender: 'Female', locale: 'es-MX', recommended: true, premium: true },
  { id: 'es-ES-XimenaNeural', name: 'Ximena - Mujer (España)', gender: 'Female', locale: 'es-ES', recommended: true, premium: true },
  { id: 'es-CO-SalomeNeural', name: 'Salomé - Mujer (Colombia)', gender: 'Female', locale: 'es-CO', recommended: true },
  
  // Voces Masculinas Premium
  { id: 'es-ES-AlvaroNeural', name: 'Álvaro - Hombre (España)', gender: 'Male', locale: 'es-ES', recommended: true, premium: true },
  { id: 'es-MX-JorgeNeural', name: 'Jorge - Hombre (México)', gender: 'Male', locale: 'es-MX', recommended: true, premium: true },
  { id: 'es-CO-GonzaloNeural', name: 'Gonzalo - Hombre (Colombia)', gender: 'Male', locale: 'es-CO', recommended: true }
];

const useEdgeTTS = () => {
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [availableVoices, setAvailableVoices] = useState(RECOMMENDED_VOICES);
  const [selectedVoice, setSelectedVoice] = useState(RECOMMENDED_VOICES[0]); // Elvira por defecto
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [currentWord, setCurrentWord] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef(null);
  const textRef = useRef('');
  const wordsRef = useRef([]);
  const progressIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cargar voces disponibles desde Edge TTS
  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await axios.get(`${EDGE_TTS_URL}/api/voices`);
      if (response.data.voices && response.data.voices.length > 0) {
        // Usar solo las voces de alta calidad recomendadas
        const highQualityVoiceIds = RECOMMENDED_VOICES.map(v => v.id);
        const filteredVoices = response.data.voices.filter(v => 
          highQualityVoiceIds.includes(v.id)
        );
        
        // Si encontramos las voces, combinar con la información adicional
        if (filteredVoices.length > 0) {
          const enrichedVoices = RECOMMENDED_VOICES.map(recVoice => {
            const foundVoice = filteredVoices.find(v => v.id === recVoice.id);
            return foundVoice ? { ...recVoice, ...foundVoice } : recVoice;
          });
          setAvailableVoices(enrichedVoices);
        } else {
          // Si no, usar las predefinidas
          setAvailableVoices(RECOMMENDED_VOICES);
        }
        
        // Voz por defecto: Elvira (mujer española)
        const defaultVoice = RECOMMENDED_VOICES[0]; // Elvira
        setSelectedVoice(defaultVoice);
      } else {
        // Usar voces predefinidas
        setAvailableVoices(RECOMMENDED_VOICES);
        setSelectedVoice(RECOMMENDED_VOICES[0]);
      }
    } catch (error) {
      console.log('Usando voces predefinidas de alta calidad');
      setAvailableVoices(RECOMMENDED_VOICES);
      setSelectedVoice(RECOMMENDED_VOICES[0]);
    }
  };

  // Función para dividir texto en palabras
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

  // Convertir rate a formato Edge TTS
  const getRateString = (rateValue) => {
    const percentage = Math.round((rateValue - 1) * 100);
    return percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
  };

  // Convertir pitch a formato Edge TTS
  const getPitchString = (pitchValue) => {
    const hz = Math.round((pitchValue - 1) * 50);
    return hz >= 0 ? `+${hz}Hz` : `${hz}Hz`;
  };

  // Convertir volume a formato Edge TTS
  const getVolumeString = (volumeValue) => {
    const percentage = Math.round((volumeValue - 1) * 100);
    return percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
  };

  // Función principal de síntesis de voz
  const speak = useCallback(async (text, options = {}) => {
    try {
      // Detener cualquier lectura en curso
      stop();
      
      setIsLoading(true);
      setIsReading(false);
      
      // Guardar texto y palabras
      textRef.current = text;
      wordsRef.current = processText(text);
      
      // Crear abort controller para cancelación
      abortControllerRef.current = new AbortController();
      
      // Usar la voz seleccionada actual o la especificada en opciones
      const voiceToUse = options.voice || selectedVoice?.id || 'es-ES-ElviraNeural';
      
      console.log('Usando voz:', voiceToUse); // Debug
      
      // Solicitar síntesis de voz a Edge TTS
      const response = await axios.post(
        `${EDGE_TTS_URL}/api/synthesize`,
        {
          text,
          voice: voiceToUse,
          rate: getRateString(options.rate || rate),
          pitch: getPitchString(options.pitch || pitch),
          volume: getVolumeString(options.volume || volume),
          format: 'mp3'
        },
        {
          responseType: 'blob',
          signal: abortControllerRef.current.signal
        }
      );
      
      // Crear URL del blob de audio
      const audioUrl = URL.createObjectURL(response.data);
      
      // Crear elemento de audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.playbackRate = 1; // Velocidad ya controlada en síntesis
      
      // Configurar callbacks
      audioRef.current.onplay = () => {
        setIsReading(true);
        setIsPaused(false);
        setIsLoading(false);
        startProgressTracking();
        if (options.onStart) options.onStart();
      };
      
      audioRef.current.onended = () => {
        setIsReading(false);
        setIsPaused(false);
        setReadingProgress(100);
        stopProgressTracking();
        if (options.onEnd) options.onEnd();
        
        // Limpiar recursos
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.onerror = (error) => {
        console.error('Error en reproducción de audio:', error);
        setIsReading(false);
        setIsPaused(false);
        setIsLoading(false);
        stopProgressTracking();
        if (options.onError) options.onError(error);
      };
      
      audioRef.current.onpause = () => {
        if (audioRef.current.currentTime < audioRef.current.duration) {
          setIsPaused(true);
          if (options.onPause) options.onPause();
        }
      };
      
      // Iniciar reproducción
      await audioRef.current.play();
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Síntesis cancelada');
      } else {
        console.error('Error en síntesis de voz:', error);
        // Fallback a Web Speech API si Edge TTS falla
        fallbackToWebSpeech(text, options);
      }
      setIsLoading(false);
    }
  }, [selectedVoice, rate, pitch, volume]);

  // Fallback a Web Speech API
  const fallbackToWebSpeech = (text, options) => {
    console.log('Usando Web Speech API como fallback');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    // Buscar voz en español
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    
    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
      if (options.onStart) options.onStart();
    };
    
    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      setReadingProgress(100);
      if (options.onEnd) options.onEnd();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Tracking del progreso
  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.duration) {
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setReadingProgress(progress);
        
        // Calcular palabra actual basado en progreso
        const wordIndex = Math.floor((progress / 100) * wordsRef.current.length);
        setCurrentWord(wordIndex);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Control de reproducción
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    // Detener Edge TTS
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    
    // Cancelar solicitud pendiente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Detener Web Speech API
    window.speechSynthesis.cancel();
    
    // Resetear estado
    setIsReading(false);
    setIsPaused(false);
    setReadingProgress(0);
    setCurrentWord(0);
    setIsLoading(false);
    stopProgressTracking();
  }, []);

  // Cambiar velocidad (requiere re-síntesis)
  const changeRate = useCallback((newRate) => {
    const clampedRate = Math.max(0.5, Math.min(2, newRate));
    setRate(clampedRate);
    
    // Si está leyendo, reiniciar con nueva velocidad
    if (isReading && textRef.current) {
      const currentProgress = readingProgress / 100;
      const wordsToSkip = Math.floor(wordsRef.current.length * currentProgress);
      const remainingWords = wordsRef.current.slice(wordsToSkip);
      const remainingText = remainingWords.map(w => w.word).join(' ');
      
      if (remainingText) {
        stop();
        setTimeout(() => {
          speak(remainingText, { rate: clampedRate });
        }, 100);
      }
    }
  }, [isReading, readingProgress, speak, stop]);

  // Obtener texto con resaltado
  const getHighlightedText = useCallback((text, className = 'bg-blue-200 dark:bg-blue-700') => {
    if (!isReading || currentWord < 0) return text;
    
    const words = processText(text);
    if (words.length === 0) return text;
    
    let result = '';
    let lastEnd = 0;
    
    words.forEach((word, index) => {
      result += text.substring(lastEnd, word.start);
      
      if (index === currentWord) {
        result += `<span class="${className} px-1 rounded transition-all duration-300">${word.word}</span>`;
      } else {
        result += word.word;
      }
      
      lastEnd = word.end;
    });
    
    result += text.substring(lastEnd);
    return result;
  }, [isReading, currentWord]);

  // Leer con resumen previo
  const speakWithSummary = useCallback(async (text, getSummary) => {
    try {
      if (text.length > 500 && getSummary) {
        const summary = await getSummary(text);
        
        // Leer primero el resumen
        await speak(`Resumen del contenido: ${summary}. Ahora procederé con el texto completo.`);
        
        // Esperar a que termine el resumen antes de leer el texto completo
        setTimeout(() => speak(text), 2000);
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
    readingProgress,
    availableVoices,
    selectedVoice,
    rate,
    pitch,
    volume,
    currentWord,
    isLoading,
    
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
    estimatedTime: textRef.current.length / (rate * 200) // Estimación en minutos
  };
};

export default useEdgeTTS;