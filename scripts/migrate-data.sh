#!/bin/bash

# ===================================
# JARVI Data Migration Script
# ===================================
# Script para migrar datos locales a Docker
# Autor: JARVI System
# Versión: 1.0.0

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
SOURCE_DIR="$(pwd)"
BACKUP_DIR="${SOURCE_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
DOCKER_VOLUME="jarvi_data"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     JARVI Data Migration Tool v1.0.0      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Función para mostrar progreso
show_progress() {
    echo -e "${GREEN}✓${NC} $1"
}

# Función para mostrar error
show_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Función para mostrar advertencia
show_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Verificar directorios de datos
echo -e "${BLUE}[1/6] Verificando directorios de datos...${NC}"

DATA_DIRS=(
    "voice-notes"
    "meetings"
    "tasks"
    "data"
    "logs"
)

TOTAL_SIZE=0
for dir in "${DATA_DIRS[@]}"; do
    if [ -d "${SOURCE_DIR}/${dir}" ]; then
        SIZE=$(du -sh "${SOURCE_DIR}/${dir}" 2>/dev/null | cut -f1)
        FILE_COUNT=$(find "${SOURCE_DIR}/${dir}" -type f 2>/dev/null | wc -l | xargs)
        show_progress "Encontrado ${dir}: ${SIZE} (${FILE_COUNT} archivos)"
        TOTAL_SIZE=$((TOTAL_SIZE + $(du -s "${SOURCE_DIR}/${dir}" 2>/dev/null | cut -f1)))
    else
        show_warning "Directorio ${dir} no encontrado"
    fi
done

echo -e "${GREEN}Total de datos a migrar: $(echo "scale=2; $TOTAL_SIZE/1024" | bc) MB${NC}"
echo ""

# 2. Crear backup local
echo -e "${BLUE}[2/6] Creando backup de seguridad...${NC}"

mkdir -p "${BACKUP_DIR}"

for dir in "${DATA_DIRS[@]}"; do
    if [ -d "${SOURCE_DIR}/${dir}" ]; then
        echo -n "  Respaldando ${dir}... "
        cp -r "${SOURCE_DIR}/${dir}" "${BACKUP_DIR}/" 2>/dev/null || true
        echo -e "${GREEN}✓${NC}"
    fi
done

# Backup de archivos de configuración (sin credenciales)
echo -n "  Respaldando configuración... "
cp "${SOURCE_DIR}/package.json" "${BACKUP_DIR}/" 2>/dev/null || true
cp "${SOURCE_DIR}/package-lock.json" "${BACKUP_DIR}/" 2>/dev/null || true
[ -f "${SOURCE_DIR}/.env.example" ] && cp "${SOURCE_DIR}/.env.example" "${BACKUP_DIR}/"
echo -e "${GREEN}✓${NC}"

show_progress "Backup creado en: ${BACKUP_DIR}"
echo ""

# 3. Preparar estructura para Docker
echo -e "${BLUE}[3/6] Preparando estructura para Docker...${NC}"

DOCKER_DATA_DIR="${SOURCE_DIR}/docker-data"
mkdir -p "${DOCKER_DATA_DIR}"

# Copiar datos preservando estructura
for dir in "${DATA_DIRS[@]}"; do
    if [ -d "${SOURCE_DIR}/${dir}" ]; then
        echo -n "  Preparando ${dir}... "
        mkdir -p "${DOCKER_DATA_DIR}/${dir}"
        rsync -a --quiet "${SOURCE_DIR}/${dir}/" "${DOCKER_DATA_DIR}/${dir}/" 2>/dev/null || \
            cp -r "${SOURCE_DIR}/${dir}/"* "${DOCKER_DATA_DIR}/${dir}/" 2>/dev/null || true
        echo -e "${GREEN}✓${NC}"
    fi
done

# 4. Crear archivos de configuración Docker
echo -e "${BLUE}[4/6] Generando configuración Docker...${NC}"

# Verificar si existe docker-compose.yml, si no, crearlo
if [ ! -f "${SOURCE_DIR}/docker-compose.prod.yml" ]; then
    cat > "${SOURCE_DIR}/docker-compose.prod.yml" << 'EOF'
version: '3.8'

services:
  jarvi-app:
    build:
      context: .
      dockerfile: Dockerfile.production
    container_name: jarvi-production
    ports:
      - "80:5173"
      - "3001-3007:3001-3007"
    volumes:
      - ./docker-data/voice-notes:/app/voice-notes
      - ./docker-data/meetings:/app/meetings
      - ./docker-data/tasks:/app/tasks
      - ./docker-data/data:/app/data
      - ./docker-data/logs:/app/logs
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - DOCKER_ENV=true
    restart: unless-stopped
    networks:
      - jarvi-network

  redis:
    image: redis:7-alpine
    container_name: jarvi-redis
    volumes:
      - redis-data:/data
    networks:
      - jarvi-network
    restart: unless-stopped

networks:
  jarvi-network:
    driver: bridge

volumes:
  redis-data:
EOF
    show_progress "docker-compose.prod.yml creado"
else
    show_progress "docker-compose.prod.yml ya existe"
fi

# 5. Crear script de inicio para Docker
echo -e "${BLUE}[5/6] Creando scripts de utilidad...${NC}"

# Script para iniciar en Docker
cat > "${SOURCE_DIR}/scripts/start-docker.sh" << 'EOF'
#!/bin/bash
echo "🚀 Iniciando JARVI en Docker..."

# Verificar que existe .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró archivo .env"
    echo "📝 Copia .env.example a .env y configura tus credenciales"
    exit 1
fi

# Construir y levantar contenedores
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verificar estado
sleep 5
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ JARVI está corriendo en Docker"
    echo "🌐 Accede en: http://localhost"
    docker-compose -f docker-compose.prod.yml logs --tail=50
else
    echo "❌ Error al iniciar JARVI"
    docker-compose -f docker-compose.prod.yml logs
fi
EOF

chmod +x "${SOURCE_DIR}/scripts/start-docker.sh"
show_progress "Script start-docker.sh creado"

# Script para detener Docker
cat > "${SOURCE_DIR}/scripts/stop-docker.sh" << 'EOF'
#!/bin/bash
echo "🛑 Deteniendo JARVI en Docker..."
docker-compose -f docker-compose.prod.yml down
echo "✅ JARVI detenido"
EOF

chmod +x "${SOURCE_DIR}/scripts/stop-docker.sh"
show_progress "Script stop-docker.sh creado"

# Script para ver logs
cat > "${SOURCE_DIR}/scripts/logs-docker.sh" << 'EOF'
#!/bin/bash
docker-compose -f docker-compose.prod.yml logs -f --tail=100
EOF

chmod +x "${SOURCE_DIR}/scripts/logs-docker.sh"
show_progress "Script logs-docker.sh creado"

# 6. Generar reporte de migración
echo -e "${BLUE}[6/6] Generando reporte de migración...${NC}"

REPORT_FILE="${SOURCE_DIR}/MIGRATION_REPORT.md"
cat > "${REPORT_FILE}" << EOF
# JARVI Migration Report
Generated: $(date)

## Data Migration Summary

### Directories Migrated:
$(for dir in "${DATA_DIRS[@]}"; do
    if [ -d "${SOURCE_DIR}/${dir}" ]; then
        echo "- ✅ ${dir}: $(du -sh "${SOURCE_DIR}/${dir}" 2>/dev/null | cut -f1)"
    else
        echo "- ⚠️  ${dir}: Not found"
    fi
done)

### Backup Location:
\`${BACKUP_DIR}\`

### Docker Data Location:
\`${DOCKER_DATA_DIR}\`

## Next Steps:

1. **Configure Environment:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your credentials
   \`\`\`

2. **Start Docker Services:**
   \`\`\`bash
   ./scripts/start-docker.sh
   \`\`\`

3. **Monitor Logs:**
   \`\`\`bash
   ./scripts/logs-docker.sh
   \`\`\`

4. **Stop Services:**
   \`\`\`bash
   ./scripts/stop-docker.sh
   \`\`\`

## Important Notes:

- All your data has been backed up to: \`${BACKUP_DIR}\`
- Docker will use data from: \`${DOCKER_DATA_DIR}\`
- Make sure to configure your .env file before starting
- Default port is 80 (can be changed in docker-compose.prod.yml)

EOF

show_progress "Reporte generado: ${REPORT_FILE}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Migración Completada con Éxito     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "1. Configura tu archivo .env con las credenciales"
echo "2. Ejecuta: ${GREEN}./scripts/start-docker.sh${NC}"
echo "3. Accede a JARVI en: ${BLUE}http://localhost${NC}"
echo ""
echo -e "${YELLOW}Backup guardado en: ${BACKUP_DIR}${NC}"
echo -e "${YELLOW}Datos Docker en: ${DOCKER_DATA_DIR}${NC}"