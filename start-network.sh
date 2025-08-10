#!/bin/bash

# Script para iniciar JARVI con acceso desde red local y externa
echo "========================================="
echo "    INICIANDO JARVI - MODO NETWORK"
echo "========================================="
echo ""
echo "🌐 Configurando acceso desde:"
echo "   • Localhost: http://localhost:5173"
echo "   • Red Local: http://192.168.1.125:5173"
echo "   • IP Pública: http://189.172.8.175:1745"
echo ""
echo "========================================="

# Verificar que el puerto 5173 esté libre
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  El puerto 5173 ya está en uso. Deteniendo proceso anterior..."
    kill $(lsof -Pi :5173 -sTCP:LISTEN -t)
    sleep 2
fi

echo "📦 Iniciando servicios backend..."

# Iniciar servicios backend
node server-enhanced-notes.js &
BACKEND_PID1=$!
echo "   ✅ Servidor de notas mejoradas (3001)"

node server-meetings.js &
BACKEND_PID2=$!
echo "   ✅ Servidor de reuniones (3002)"

node server-tasks.js &
BACKEND_PID3=$!
echo "   ✅ Servidor de tareas (3003)"

node server-voice-notes.js &
BACKEND_PID4=$!
echo "   ✅ Servidor de notas de voz (3004)"

# Esperar un momento para que los backends inicien
sleep 3

# Iniciar bot de Telegram
echo ""
echo "🤖 Iniciando bot de Telegram..."
./start-bot.sh &
BOT_PID=$!

# Iniciar frontend con Vite
echo ""
echo "🚀 Iniciando aplicación frontend..."
npm run dev &
FRONTEND_PID=$!

# Esperar a que el frontend esté listo
sleep 5

echo ""
echo "========================================="
echo "         ✨ JARVI ESTÁ LISTO ✨"
echo "========================================="
echo ""
echo "📱 Acceso desde tu iPad:"
echo "   http://192.168.1.125:5173"
echo ""
echo "🌍 Acceso externo (configura port forwarding):"
echo "   Router: 189.172.8.175:1745 → 192.168.1.125:5173"
echo ""
echo "⚠️  Recuerda configurar el port forwarding en tu router:"
echo "   • Puerto externo: 1745"
echo "   • Puerto interno: 5173"
echo "   • IP local: 192.168.1.125"
echo ""
echo "🛑 Para detener todos los servicios: Ctrl+C"
echo "========================================="

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios JARVI..."
    kill $FRONTEND_PID $BACKEND_PID1 $BACKEND_PID2 $BACKEND_PID3 $BACKEND_PID4 $BOT_PID 2>/dev/null
    pkill -f "node server" 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    pkill -f "telegram-bot" 2>/dev/null
    echo "✅ Todos los servicios detenidos"
    exit 0
}

# Capturar señales de interrupción
trap cleanup SIGINT SIGTERM

# Mantener el script ejecutándose
wait