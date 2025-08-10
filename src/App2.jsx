import React from 'react';
import './index.css';

function App2() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0E27',
      color: 'white',
      padding: '2rem'
    }}>
      <h1 style={{ 
        fontSize: '4rem', 
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#00E5FF',
        textShadow: '0 0 30px #00E5FF, 0 0 60px #00E5FF',
        marginBottom: '2rem'
      }}>
        JARVI - SISTEMA OPERATIVO
      </h1>
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem'
      }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            padding: '2rem',
            background: 'rgba(0, 229, 255, 0.1)',
            border: '2px solid rgba(0, 229, 255, 0.5)',
            borderRadius: '1rem',
            boxShadow: '0 0 30px rgba(0, 229, 255, 0.3)'
          }}>
            <h2 style={{ color: '#00E5FF', marginBottom: '1rem' }}>MÓDULO {i}</h2>
            <p style={{ color: '#ffffff99' }}>Sistema operativo y funcionando correctamente</p>
            <div style={{
              marginTop: '1rem',
              height: '4px',
              background: 'rgba(0, 229, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.random() * 100}%`,
                height: '100%',
                background: '#00E5FF',
                boxShadow: '0 0 10px #00E5FF'
              }} />
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '3rem',
        textAlign: 'center',
        fontSize: '1.5rem',
        color: '#00E5FF',
        animation: 'pulse 2s infinite'
      }}>
        ⚡ TODOS LOS SISTEMAS OPERATIVOS ⚡
      </div>
    </div>
  );
}

export default App2;