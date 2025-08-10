# 🚀 Instrucciones de Despliegue Manual para JARVI

## ⚠️ Problema de SSH detectado
No se pudo establecer conexión SSH automática. Sigue estos pasos manualmente:

## 📦 Paso 1: Transferir archivos

### Opción A: Usando AirDrop o USB
1. El archivo `jarvi-deploy.tar.gz` (69MB) está listo en:
   ```
   /Users/samuelquiroz/Documents/proyectos/jarvi/jarvi-deploy.tar.gz
   ```
2. Transfiérelo a tu Mac remota usando AirDrop o USB

### Opción B: Usando SCP con contraseña
```bash
scp jarvi-deploy.tar.gz samuelquiroz@192.168.1.141:/Users/samuelquiroz/Documents/
```

## 💻 Paso 2: En la Mac Remota (192.168.1.141)

### 1. Extraer archivos
```bash
# Crear directorio y navegar
mkdir -p /Users/samuelquiroz/Documents/jarvis
cd /Users/samuelquiroz/Documents/jarvis

# Mover y extraer el archivo
mv ~/Documents/jarvi-deploy.tar.gz .
tar -xzf jarvi-deploy.tar.gz
rm jarvi-deploy.tar.gz

# Dar permisos a scripts
chmod +x start-all.sh
chmod +x start-bot.sh
chmod +x deploy-to-remote.sh
```

### 2. Instalar Docker Desktop
```bash
# Descargar e instalar Docker Desktop para Mac
open https://www.docker.com/products/docker-desktop/

# O usando Homebrew:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install --cask docker

# Iniciar Docker Desktop
open /Applications/Docker.app
```

### 3. Instalar Node.js (si no está instalado)
```bash
# Con Homebrew
brew install node

# Verificar instalación
node --version
npm --version
```

### 4. Configurar variables de entorno
```bash
# Crear archivo .env
cat > .env << 'EOF'
# Telegram Bot
TELEGRAM_BOT_TOKEN=tu_token_aqui

# API Keys
GEMINI_API_KEY=tu_api_key_aqui
OPENAI_API_KEY=tu_api_key_opcional
CLAUDE_API_KEY=tu_api_key_opcional

# MongoDB Password
MONGO_PASSWORD=jarvi_secure_password_2024

# Configuración local
NODE_ENV=production
PORT=5173
EOF
```

### 5. Instalar dependencias
```bash
npm install
```

### 6. Iniciar con Docker
```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 7. O iniciar sin Docker (más simple)
```bash
# Iniciar todos los servicios
npm run start:all

# O manualmente uno por uno:
npm run dev &                    # Frontend en puerto 5173
node server-enhanced-notes.js &  # Puerto 3001
node server-meetings.js &         # Puerto 3002  
node server-tasks.js &           # Puerto 3003
node server-voice-notes.js &     # Puerto 3004
./start-bot.sh &                 # Telegram Bot
```

## 🌐 Paso 3: Configurar DynDNS

### 1. Crear cuenta en No-IP
1. Ir a https://www.noip.com
2. Registrarse (gratis)
3. Crear hostname (ej: jarvi-home.ddns.net)

### 2. Instalar cliente No-IP en Mac
```bash
# Descargar desde
open https://www.noip.com/download?page=mac

# O manual:
cd /tmp
curl -o noip-duc-mac.dmg https://www.noip.com/client/mac/noip-duc-mac.dmg
hdiutil attach noip-duc-mac.dmg
cp -R /Volumes/No-IP\ DUC/NoIP\ DUC.app /Applications/
open /Applications/NoIP\ DUC.app
```

### 3. Configurar en la app:
- Usuario y contraseña de No-IP
- Seleccionar el hostname creado
- Activar inicio automático

## 🔧 Paso 4: Configurar Router

Accede a tu router (generalmente 192.168.1.1) y configura:

### Port Forwarding / Virtual Server:
| Nombre | Puerto Externo | Puerto Interno | IP Local | Protocolo |
|--------|---------------|----------------|----------|-----------|
| JARVI-Web | 80 | 80 | 192.168.1.141 | TCP |
| JARVI-SSL | 443 | 443 | 192.168.1.141 | TCP |
| JARVI-Frontend | 5173 | 5173 | 192.168.1.141 | TCP |
| JARVI-API1 | 3001 | 3001 | 192.168.1.141 | TCP |
| JARVI-API2 | 3002 | 3002 | 192.168.1.141 | TCP |
| JARVI-API3 | 3003 | 3003 | 192.168.1.141 | TCP |
| JARVI-API4 | 3004 | 3004 | 192.168.1.141 | TCP |

## ✅ Paso 5: Verificación

### Local (en la Mac remota):
```bash
# Frontend
curl http://localhost:5173

# APIs
curl http://localhost:3001/api/voice-notes
curl http://localhost:3003/api/tasks
```

### Desde otra computadora en la red local:
```bash
curl http://192.168.1.141:5173
```

### Desde Internet (después de configurar DynDNS):
```bash
curl http://tu-hostname.ddns.net:5173
```

## 🔥 Firewall de macOS

Si hay problemas de conexión, verifica el firewall:
```bash
# Desactivar temporalmente para pruebas
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# O permitir aplicaciones específicas
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

## 🆘 Troubleshooting

### Si Docker no funciona:
```bash
# Usa el método sin Docker
npm run start:all
```

### Si los puertos están ocupados:
```bash
# Ver qué usa el puerto
sudo lsof -i :5173
# Matar proceso
sudo kill -9 [PID]
```

### Si no hay conexión desde Internet:
1. Verifica que el router tenga los puertos abiertos
2. Verifica que DynDNS esté actualizado
3. Verifica el firewall de macOS

## 📞 Soporte

Si todo falla, el sistema puede ejecutarse localmente sin Docker:
```bash
cd /Users/samuelquiroz/Documents/jarvis
npm install
npm run dev
```

Esto iniciará al menos el frontend en http://localhost:5173

---

**Archivo de despliegue preparado:** `jarvi-deploy.tar.gz` (69MB)