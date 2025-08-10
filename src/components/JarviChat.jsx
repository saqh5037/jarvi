import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Terminal, Bot, User, Wifi, WifiOff } from 'lucide-react';
import io from 'socket.io-client';

/**
 * Componente de Chat Interactivo con JARVI
 * Permite comunicación en tiempo real con el sistema JARVI
 */
const JarviChat = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Conectar con el servidor al montar el componente
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    
    newSocket.on('connect', () => {
      console.log('Conectado a JARVI Server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado de JARVI Server');
      setConnected(false);
    });

    // Recibir mensaje de bienvenida
    newSocket.on('jarvi-message', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: data.response,
        sender: 'jarvi',
        type: data.type,
        timestamp: data.timestamp
      }]);
    });

    // Recibir respuestas de JARVI
    newSocket.on('jarvi-response', (data) => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: data.response,
        sender: 'jarvi',
        type: data.type,
        timestamp: data.timestamp
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    // Añadir mensaje del usuario
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: message,
      sender: 'user',
      type: 'command',
      timestamp: new Date().toISOString()
    }]);

    // Enviar comando al servidor
    socket.emit('user-command', message);
    
    // Simular que JARVI está escribiendo
    setIsTyping(true);
    
    // Limpiar input
    setMessage('');
    inputRef.current?.focus();
  };

  // Comandos rápidos
  const quickCommands = [
    'HOLA JARVI',
    'STATUS',
    'ANALYZE',
    'REPORT',
    'HELP'
  ];

  const handleQuickCommand = (cmd) => {
    setMessage(cmd);
    setTimeout(() => {
      const form = document.getElementById('chat-form');
      form?.requestSubmit();
    }, 100);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Efectos de fondo */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 30% 50%, rgba(0, 229, 255, 0.1) 0%, transparent 50%)',
        zIndex: 1
      }} />

      {/* Contenedor principal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '900px',
          height: '80vh',
          background: 'rgba(10, 14, 39, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(0, 229, 255, 0.3)',
          borderRadius: '1.5rem',
          boxShadow: '0 0 50px rgba(0, 229, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #00E5FF, #0080FF)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(0, 229, 255, 0.5)'
              }}
            >
              <Bot size={28} color="white" />
            </motion.div>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#00E5FF',
                textShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
                margin: 0
              }}>
                JARVI SYSTEM
              </h1>
              <p style={{ color: '#888', fontSize: '0.875rem', margin: 0 }}>
                Centro de Comando Interactivo
              </p>
            </div>
          </div>

          {/* Estado de conexión */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${connected ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
            borderRadius: '2rem'
          }}>
            {connected ? <Wifi size={16} color="#10B981" /> : <WifiOff size={16} color="#EF4444" />}
            <span style={{ fontSize: '0.75rem', color: connected ? '#10B981' : '#EF4444' }}>
              {connected ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
          </div>
        </div>

        {/* Área de mensajes */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '1rem',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 128, 255, 0.2))'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${msg.sender === 'user' ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: msg.sender === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                  boxShadow: msg.sender === 'user' 
                    ? '0 0 20px rgba(0, 229, 255, 0.2)'
                    : '0 0 20px rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    {msg.sender === 'user' ? (
                      <User size={16} color="#00E5FF" />
                    ) : (
                      <Bot size={16} color="#FFB800" />
                    )}
                    <span style={{
                      fontSize: '0.75rem',
                      color: msg.sender === 'user' ? '#00E5FF' : '#FFB800',
                      fontWeight: 'bold'
                    }}>
                      {msg.sender === 'user' ? 'COMANDANTE' : 'JARVI'}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    color: 'white',
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                  }}>
                    {msg.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Indicador de escritura */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#888'
              }}
            >
              <Bot size={16} />
              <span style={{ fontSize: '0.875rem' }}>JARVI está procesando...</span>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⚡
              </motion.div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Comandos rápidos */}
        <div style={{
          padding: '0.5rem 1.5rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleQuickCommand(cmd)}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                borderRadius: '0.5rem',
                color: '#00E5FF',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 229, 255, 0.2)';
                e.target.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 229, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input de mensaje */}
        <form
          id="chat-form"
          onSubmit={sendMessage}
          style={{
            padding: '1.5rem',
            borderTop: '1px solid rgba(0, 229, 255, 0.2)',
            display: 'flex',
            gap: '1rem'
          }}
        >
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            borderRadius: '0.75rem',
            padding: '0 1rem',
            transition: 'all 0.3s'
          }}>
            <Terminal size={20} color="#00E5FF" style={{ marginRight: '0.75rem' }} />
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un comando... (ej: HOLA JARVI)"
              disabled={!connected}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '0.875rem',
                padding: '0.75rem 0'
              }}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!connected || !message.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '0 1.5rem',
              background: connected ? 'linear-gradient(135deg, #00E5FF, #0080FF)' : '#333',
              border: 'none',
              borderRadius: '0.75rem',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: connected ? 'pointer' : 'not-allowed',
              boxShadow: connected ? '0 0 30px rgba(0, 229, 255, 0.3)' : 'none',
              transition: 'all 0.3s'
            }}
          >
            <Send size={20} />
            ENVIAR
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default JarviChat;