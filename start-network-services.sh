#!/bin/bash

echo "🚀 Iniciando servicios JARVI en modo red..."
echo "================================================"
echo "IP Local: 192.168.1.125"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para iniciar servicio
start_service() {
    echo -e "${YELLOW}Iniciando $1...${NC}"
    $2 > /dev/null 2>&1 &
    sleep 2
    if ps aux | grep -v grep | grep -q "$3"; then
        echo -e "${GREEN}✅ $1 iniciado${NC}"
    else
        echo -e "${RED}❌ Error iniciando $1${NC}"
    fi
}

# Iniciar servicios backend
start_service "Servidor Principal (3001)" "node server.js" "server.js"
start_service "Servidor de Tareas (3003)" "node server-tasks.js" "server-tasks.js"
start_service "Servidor de Notas de Voz (3004)" "node server-voice-notes.js" "server-voice-notes.js"
start_service "Servidor de Reuniones (3002)" "node server-meetings.js" "server-meetings.js"

# Iniciar bot de Telegram con token
echo -e "${YELLOW}Iniciando Bot de Telegram...${NC}"
TELEGRAM_BOT_TOKEN='8410755699:AAEApXvGNVFRK2En3uIDB27ueUxa-G83Om8' node telegram-bot.js > /dev/null 2>&1 &
sleep 2
echo -e "${GREEN}✅ Bot de Telegram iniciado${NC}"

# Iniciar frontend
echo -e "${YELLOW}Iniciando Frontend Vite...${NC}"
npm run dev > /dev/null 2>&1 &
sleep 3
echo -e "${GREEN}✅ Frontend iniciado${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Todos los servicios iniciados${NC}"
echo "================================================"
echo ""
echo "📱 Acceso Local:"
echo "   - http://localhost:5173"
echo "   - http://192.168.1.125:5173"
echo ""
echo "🌐 Servicios Backend:"
echo "   - API Principal: http://192.168.1.125:3001"
echo "   - API Tareas: http://192.168.1.125:3003"
echo "   - API Notas: http://192.168.1.125:3004"
echo "   - API Reuniones: http://192.168.1.125:3002"
echo ""
echo "🤖 Bot de Telegram: @JarviSamu_bot"
echo ""
echo "Para detener todos los servicios: pkill -f node && pkill -f vite"
echo "================================================"