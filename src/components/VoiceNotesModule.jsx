import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Volume2,
  Send,
  Clock,
  User,
  MessageSquare,
  FileText,
  Loader2,
  Brain,
  Wand2,
  Sparkles
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import VoiceNotesProcessor from './VoiceNotesProcessor';
import PromptGenerator from './PromptGenerator';

const VoiceNotesModule = () => {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [transcribingNotes, setTranscribingNotes] = useState(new Set());
  const [selectedNoteForProcessing, setSelectedNoteForProcessing] = useState(null);
  const [showProcessor, setShowProcessor] = useState(false);
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);
  const [selectedNoteForPrompt, setSelectedNoteForPrompt] = useState(null);
  
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    // Conectar con Socket.io
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      console.log('✅ Conectado al servidor');
      setIsConnected(true);
      loadVoiceNotes();
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setIsConnected(false);
    });
    
    // Escuchar nuevas notas de voz
    socketRef.current.on('new-voice-note', (voiceNote) => {
      console.log('🎙️ Nueva nota de voz:', voiceNote);
      setVoiceNotes(prev => [voiceNote, ...prev]);
      
      // Mostrar notificación
      showNotification('Nueva nota de voz', `De: ${voiceNote.sender.name}`);
    });
    
    // Escuchar mensajes de Telegram
    socketRef.current.on('telegram-message', (message) => {
      console.log('📝 Mensaje de Telegram:', message);
      setMessages(prev => [message, ...prev].slice(0, 10)); // Mantener solo los últimos 10
    });
    
    // Escuchar transcripciones completadas
    socketRef.current.on('transcription-complete', ({ noteId, transcription }) => {
      console.log('✅ Transcripción completada:', noteId, transcription);
      setVoiceNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, transcription } : note
      ));
      setTranscribingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  const loadVoiceNotes = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/voice-notes');
      console.log('Respuesta del servidor:', response.data);
      if (response.data.success) {
        console.log('Notas cargadas:', response.data.notes);
        setVoiceNotes(response.data.notes || []);
      }
    } catch (error) {
      console.error('Error cargando notas de voz:', error);
    }
  };
  
  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };
  
  const playVoiceNote = (note) => {
    if (audioRef.current) {
      if (currentlyPlaying === note.id) {
        // Pausar si ya está reproduciendo
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      } else {
        // Reproducir nueva nota
        audioRef.current.src = `http://localhost:3001/voice-notes/${note.fileName}`;
        audioRef.current.play();
        setCurrentlyPlaying(note.id);
      }
    }
  };
  
  const downloadVoiceNote = (note) => {
    const link = document.createElement('a');
    link.href = `http://localhost:3001/voice-notes/${note.fileName}`;
    link.download = note.fileName;
    link.click();
  };
  
  const transcribeVoiceNote = async (note) => {
    if (transcribingNotes.has(note.id)) {
      console.log('Ya se está transcribiendo esta nota');
      return;
    }
    
    try {
      setTranscribingNotes(prev => new Set([...prev, note.id]));
      
      const response = await axios.post('http://localhost:3001/api/transcribe', {
        noteId: note.id,
        fileName: note.fileName
      });
      
      if (response.data.success) {
        // La transcripción se actualizará vía WebSocket
        console.log('Transcripción iniciada');
      } else {
        throw new Error(response.data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error transcribiendo:', error);
      setTranscribingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note.id);
        return newSet;
      });
      
      // Mostrar error al usuario
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Error en transcripción', { 
          body: 'No se pudo transcribir la nota de voz', 
          icon: '/favicon.ico' 
        });
      }
    }
  };
  
  const deleteVoiceNote = async (note) => {
    if (confirm('¿Estás seguro de eliminar esta nota de voz?')) {
      try {
        const response = await axios.delete(`http://localhost:3001/api/voice-notes/${note.id}`);
        if (response.data.success) {
          setVoiceNotes(prev => prev.filter(n => n.id !== note.id));
        }
      } catch (error) {
        console.error('Error eliminando nota:', error);
      }
    }
  };
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} horas`;
    return date.toLocaleDateString();
  };
  
  // Solicitar permisos de notificación
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Mic className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notas de Voz</h2>
              <p className="text-sm text-gray-500">Telegram Voice Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
            >
              Configurar Bot
            </button>
          </div>
        </div>
        
        {/* Setup Instructions */}
        {showSetup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 rounded-xl"
          >
            <h3 className="font-semibold text-gray-900 mb-2">📱 Configuración de Telegram Bot</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Abre Telegram y busca <code className="bg-gray-200 px-1 rounded">@BotFather</code></li>
              <li>2. Envía <code className="bg-gray-200 px-1 rounded">/newbot</code> y sigue las instrucciones</li>
              <li>3. Copia el token del bot</li>
              <li>4. Crea un archivo <code className="bg-gray-200 px-1 rounded">.env</code> con:</li>
              <pre className="bg-gray-800 text-green-400 p-2 rounded mt-2">
                TELEGRAM_BOT_TOKEN=tu_token_aqui
              </pre>
              <li>5. Ejecuta: <code className="bg-gray-200 px-1 rounded">node telegram-bot.js</code></li>
              <li>6. Busca tu bot en Telegram y envía <code className="bg-gray-200 px-1 rounded">/start</code></li>
            </ol>
          </motion.div>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{voiceNotes.length}</p>
              <p className="text-sm text-gray-500">Total Notas</p>
            </div>
            <Mic className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {voiceNotes.reduce((acc, note) => acc + (note.duration || 0), 0)}s
              </p>
              <p className="text-sm text-gray-500">Duración Total</p>
            </div>
            <Clock className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              <p className="text-sm text-gray-500">Mensajes</p>
            </div>
            <MessageSquare className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {voiceNotes.filter(n => {
                  const date = new Date(n.timestamp);
                  const now = new Date();
                  return now - date < 86400000;
                }).length}
              </p>
              <p className="text-sm text-gray-500">Hoy</p>
            </div>
            <Volume2 className="w-8 h-8 text-pink-200" />
          </div>
        </div>
      </div>
      
      {/* Voice Notes List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas de Voz Recientes</h3>
        <p className="text-xs text-gray-400 mb-2">Total: {voiceNotes.length} notas</p>
        
        {voiceNotes.length === 0 ? (
          <div className="text-center py-12">
            <Mic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay notas de voz aún</p>
            <p className="text-sm text-gray-400 mt-2">
              Envía una nota de voz desde Telegram para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {voiceNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => playVoiceNote(note)}
                      className={`p-3 rounded-full transition-all ${
                        currentlyPlaying === note.id
                          ? 'bg-indigo-500 text-white'
                          : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                      }`}
                    >
                      {currentlyPlaying === note.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {note.sender.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          @{note.sender.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatDuration(note.duration)}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatTime(note.timestamp)}
                        </span>
                      </div>
                      {note.transcription && (
                        <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                          <p className="text-sm text-gray-700 italic">
                            "{note.transcription}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Botón de transcripción */}
                    {!note.transcription && (
                      <button
                        onClick={() => transcribeVoiceNote(note)}
                        disabled={transcribingNotes.has(note.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          transcribingNotes.has(note.id)
                            ? 'text-indigo-600 bg-indigo-100 cursor-not-allowed'
                            : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                        title={transcribingNotes.has(note.id) ? 'Transcribiendo...' : 'Transcribir con Gemini'}
                      >
                        {transcribingNotes.has(note.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    {/* Botón de procesamiento inteligente */}
                    <button
                      onClick={() => {
                        setSelectedNoteForProcessing(note);
                        setShowProcessor(true);
                      }}
                      className="p-2 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Procesar con IA"
                    >
                      <Brain className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedNoteForPrompt(note);
                        setShowPromptGenerator(true);
                      }}
                      className="p-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                      title="Generar Prompt Optimizado"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => downloadVoiceNote(note)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteVoiceNote(note)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Recent Messages */}
      {messages.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mensajes Recientes</h3>
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {msg.sender.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-gray-600">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Audio Player (hidden) */}
      <audio 
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        className="hidden"
      />

      {/* Modal de Procesador Inteligente */}
      {showProcessor && selectedNoteForProcessing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-400" />
                Procesador Inteligente de Nota de Voz
              </h2>
              <button
                onClick={() => {
                  setShowProcessor(false);
                  setSelectedNoteForProcessing(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Mostrar información de la nota */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-white font-medium">
                  {selectedNoteForProcessing.sender.name}
                </span>
                <span className="text-gray-400 text-sm">
                  {new Date(selectedNoteForProcessing.timestamp).toLocaleString('es-ES')}
                </span>
              </div>
              {selectedNoteForProcessing.transcription ? (
                <div className="text-gray-300 italic">
                  "{selectedNoteForProcessing.transcription}"
                </div>
              ) : (
                <div className="text-yellow-400 italic">
                  ⚠️ Esta nota aún no ha sido transcrita. Transcribe primero la nota con Gemini para poder procesarla.
                </div>
              )}
            </div>

            {/* Componente procesador - solo si hay transcripción */}
            {selectedNoteForProcessing.transcription ? (
              <VoiceNotesProcessor 
                voiceNote={{
                  id: selectedNoteForProcessing.id,
                  transcription: selectedNoteForProcessing.transcription,
                  text: selectedNoteForProcessing.transcription
                }} 
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  Primero transcribe la nota de voz para poder procesarla con IA
                </p>
                <button
                  onClick={() => {
                    transcribeVoiceNote(selectedNoteForProcessing);
                    setShowProcessor(false);
                    setSelectedNoteForProcessing(null);
                  }}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Transcribir ahora
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Modal de Generador de Prompts */}
      {showPromptGenerator && (
        <AnimatePresence>
          <PromptGenerator
            transcription={selectedNoteForPrompt?.transcription || ''}
            onClose={() => {
              setShowPromptGenerator(false);
              setSelectedNoteForPrompt(null);
            }}
          />
        </AnimatePresence>
      )}
    </div>
  );
};

export default VoiceNotesModule;