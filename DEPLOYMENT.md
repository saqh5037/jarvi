# 🚀 JARVI - Guía de Despliegue en Mac Remota

## 📋 Requisitos Previos

- macOS 10.15 o superior
- Acceso SSH a la Mac remota
- Puerto 80 y 443 disponibles
- 4GB RAM mínimo
- 10GB espacio en disco

## 🔧 PASO 1: Conexión SSH

```bash
# Conectarse a la Mac remota
ssh samuelquiroz@192.168.1.141

# Navegar al directorio del proyecto
cd /Users/samuelquiroz/Documents/jarvis
```

## 🐳 PASO 2: Instalación de Docker

### Opción A: Docker Desktop (Recomendado)

```bash
# Descargar Docker Desktop
curl -o Docker.dmg https://desktop.docker.com/mac/main/arm64/Docker.dmg

# Montar el DMG
hdiutil attach Docker.dmg

# Copiar a Applications
cp -R /Volumes/Docker/Docker.app /Applications

# Desmontar DMG
hdiutil detach /Volumes/Docker

# Iniciar Docker Desktop
open /Applications/Docker.app
```

### Opción B: Docker via Homebrew

```bash
# Instalar Homebrew si no está instalado
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Docker
brew install --cask docker

# Iniciar Docker
open /Applications/Docker.app
```

### Verificar instalación

```bash
# Verificar Docker
docker --version
docker-compose --version
```

## 📦 PASO 3: Configuración del Proyecto

### 1. Instalar dependencias Node.js

```bash
# Instalar Node.js si no está instalado
brew install node

# Instalar dependencias del proyecto
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con las credenciales reales
nano .env
```

Añadir las siguientes variables:
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=tu_token_aqui

# API Keys
GEMINI_API_KEY=tu_api_key_aqui
OPENAI_API_KEY=tu_api_key_aqui
CLAUDE_API_KEY=tu_api_key_aqui

# MongoDB
MONGO_PASSWORD=una_contraseña_segura

# DynDNS (se configurará más adelante)
DYNDNS_HOSTNAME=tu_subdominio.ddns.net
DYNDNS_USERNAME=tu_usuario
DYNDNS_PASSWORD=tu_contraseña
```

## 🚀 PASO 4: Iniciar con Docker

### Build y arranque inicial

```bash
# Construir las imágenes
docker-compose build

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar que todos los contenedores estén corriendo
docker ps
```

### Comandos útiles de Docker

```bash
# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs de un servicio específico
docker-compose logs -f jarvi-app

# Ejecutar comandos dentro del contenedor
docker exec -it jarvi-main sh
```

## 🌐 PASO 5: Configuración de DynDNS

### 1. Crear cuenta en No-IP (Gratuito)

1. Ir a https://www.noip.com
2. Crear cuenta gratuita
3. Crear un hostname (ej: jarvi-home.ddns.net)

### 2. Instalar cliente DynDNS

```bash
# Descargar cliente No-IP
cd /tmp
curl -o noip-duc.tar.gz https://www.noip.com/client/linux/noip-duc-linux.tar.gz

# Extraer
tar xzf noip-duc.tar.gz
cd noip-*

# Compilar e instalar
make
sudo make install

# Configurar (te pedirá usuario y contraseña de No-IP)
sudo /usr/local/bin/noip2 -C
```

### 3. Configurar actualización automática

```bash
# Crear servicio launchd para macOS
sudo nano /Library/LaunchDaemons/com.noip.duc.plist
```

Añadir:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.noip.duc</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/noip2</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

```bash
# Cargar el servicio
sudo launchctl load /Library/LaunchDaemons/com.noip.duc.plist

# Verificar que esté corriendo
sudo launchctl list | grep noip
```

## 🔒 PASO 6: Configuración del Router

### Redirección de puertos

Acceder a la configuración del router y configurar:

| Servicio | Puerto Externo | Puerto Interno | Protocolo | IP Destino |
|----------|---------------|----------------|-----------|------------|
| HTTP | 80 | 80 | TCP | 192.168.1.141 |
| HTTPS | 443 | 443 | TCP | 192.168.1.141 |
| Frontend | 5173 | 5173 | TCP | 192.168.1.141 |
| API | 3001-3004 | 3001-3004 | TCP | 192.168.1.141 |

### Configuración de firewall en Mac

```bash
# Permitir conexiones entrantes
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/docker
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/docker
```

## ✅ PASO 7: Verificación

### 1. Verificar servicios localmente

```bash
# Verificar frontend
curl http://localhost:5173

# Verificar APIs
curl http://localhost:3001/api/voice-notes
curl http://localhost:3003/api/tasks

# Verificar MongoDB
docker exec -it jarvi-mongodb mongosh -u jarvi -p
```

### 2. Verificar acceso remoto

Desde otra máquina:
```bash
# Via IP local
curl http://192.168.1.141

# Via DynDNS
curl http://tu-subdominio.ddns.net
```

## 🔄 PASO 8: Mantenimiento

### Actualizar la aplicación

```bash
# Traer cambios del repositorio
git pull

# Reconstruir contenedores
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup de datos

```bash
# Backup de MongoDB
docker exec jarvi-mongodb mongodump --out /backup

# Backup de archivos
tar -czf jarvi-backup-$(date +%Y%m%d).tar.gz \
  voice-notes/ \
  tasks/data/ \
  tasks/audio/ \
  meetings/recordings/
```

### Monitoreo

```bash
# Ver uso de recursos
docker stats

# Ver logs en tiempo real
docker-compose logs -f --tail=100

# Verificar salud de contenedores
docker-compose ps
```

## 🆘 Troubleshooting

### Docker no inicia
```bash
# Reiniciar Docker Desktop
killall Docker
open /Applications/Docker.app
```

### Puerto en uso
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :80
# Matar el proceso si es necesario
sudo kill -9 <PID>
```

### Permisos de archivos
```bash
# Dar permisos correctos
chmod -R 755 .
chmod 600 .env
```

### Contenedor no arranca
```bash
# Ver logs detallados
docker-compose logs jarvi-app
# Reconstruir desde cero
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs`
2. Verifica el estado: `docker-compose ps`
3. Revisa la configuración: `docker-compose config`
4. Consulta OPTIMIZATION_REPORT.md para detalles del sistema

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, JARVI estará disponible en:

- **Local**: http://localhost
- **Red Local**: http://192.168.1.141
- **Internet**: http://tu-subdominio.ddns.net

El sistema estará ejecutándose 24/7 con reinicio automático en caso de fallo.