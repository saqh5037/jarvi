#!/bin/bash

# Script para iniciar el bot de Telegram con todas las API keys

echo "🚀 Iniciando JARVI Telegram Bot con transcripción Gemini..."

# Exportar todas las variables de entorno
export TELEGRAM_BOT_TOKEN=8410755699:AAEApXvGNVFRK2En3uIDB27ueUxa-G83Om8
export GEMINI_API_KEY=AIzaSyAGlwn2nDECzKnqRYqHo4hVUlNqGMsp1mw
export OPENAI_API_KEY=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
export CLAUDE_API_KEY=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

# Ejecutar el bot
node telegram-bot.js