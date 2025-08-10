# 🎙️ JARVI Voice Notes - Configuración de Telegram Bot

## 📱 Configuración Rápida (5 minutos)

### Paso 1: Crear el Bot en Telegram

1. **Abre Telegram** en tu teléfono o computadora
2. **Busca** `@BotFather` (es el bot oficial de Telegram)
3. **Envía** `/newbot`
4. **Elige un nombre** para tu bot (ej: "JARVI Voice Assistant")
5. **Elige un username** único (debe terminar en 'bot', ej: `jarvi_voice_bot`)
6. **Copia el TOKEN** que te da BotFather (algo como: `7654321:ABCdef123...`)

### Paso 2: Configurar el Token

Crea un archivo `.env` en la carpeta del proyecto:

```bash
echo "TELEGRAM_BOT_TOKEN=TU_TOKEN_AQUI" > .env
```

O edita manualmente:
```env
TELEGRAM_BOT_TOKEN=7654321:ABCdef123...
```

### Paso 3: Iniciar el Bot

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar el bot de Telegram
node telegram-bot.js
```

Deberías ver:
```
╔════════════════════════════════════════════════╗
║        JARVI TELEGRAM VOICE ASSISTANT         ║
╠════════════════════════════════════════════════╣
║  🤖 Bot iniciado y esperando mensajes...      ║
╚════════════════════════════════════════════════╝
```

### Paso 4: Usar el Bot

1. **Busca tu bot** en Telegram por su username
2. **Envía** `/start` para comenzar
3. **Graba una nota de voz** y envíala
4. **Ve a JARVI** en http://localhost:5173
5. **Click en "Notas de Voz"** en el dashboard
6. ¡Tu nota aparecerá automáticamente!

## 🎯 Características

### Lo que puedes enviar:
- 🎙️ **Notas de voz** - Se guardan y reproducen en JARVI
- 📝 **Mensajes de texto** - Aparecen en el dashboard
- 📍 **Ubicación** - Se registra tu posición

### Comandos disponibles:
- `/start` - Iniciar el bot
- `/help` - Ver ayuda
- `/status` - Ver estado del sistema
- `/list` - Ver últimas 5 notas
- `/clear` - Limpiar notas antiguas

## 🔧 Solución de Problemas

### Error: "Bot token is incorrect"
- Verifica que copiaste bien el token
- Asegúrate que el archivo `.env` está en la carpeta correcta
- El token NO debe tener espacios o comillas extras

### Error: "Cannot connect to server"
- Asegúrate que el servidor está corriendo: `npm run server`
- Verifica que está en el puerto 3001

### Las notas no aparecen en JARVI
- Refresca la página
- Verifica que el servidor muestra: "🎙️ Nueva nota de voz recibida"
- Revisa la consola del navegador

## 🚀 Características Avanzadas

### Múltiples usuarios
Edita `telegram-bot.js` y agrega IDs de chat autorizados:
```javascript
const authorizedUsers = [123456789, 987654321]; // Chat IDs
```

### Cambiar carpeta de audios
```javascript
const audioDir = path.join(__dirname, 'mi-carpeta-audios');
```

### Transcripción automática (próximamente)
Integración con Whisper API para transcribir las notas de voz

## 📦 Estructura de Archivos

```
jarvi/
├── telegram-bot.js      # Bot de Telegram
├── voice-notes/         # Carpeta de audios
│   ├── voice_*.ogg     # Archivos de audio
│   └── voice_*.json    # Metadata de cada nota
├── server-simple.js     # Servidor con endpoints
└── src/
    └── components/
        └── VoiceNotesModule.jsx  # Interfaz en React
```

## 🎉 ¡Listo!

Ahora puedes:
1. Grabar notas de voz desde cualquier lugar con Telegram
2. Escucharlas en tu dashboard JARVI
3. Ver transcripciones (próximamente)
4. Recibir notificaciones en tiempo real

---

**Tip Pro:** Puedes crear accesos directos en Telegram para grabar notas rápidamente. En iOS/Android, mantén presionado el ícono del bot y selecciona "Agregar a pantalla de inicio".

**Seguridad:** El bot solo responde a usuarios autorizados. Nunca compartas tu token del bot públicamente.