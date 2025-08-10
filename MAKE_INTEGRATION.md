# 🚀 INTEGRACIÓN JARVI-MAKE.COM

## 📋 CONFIGURACIÓN RÁPIDA

### Paso 1: Crear Webhooks en Make.com

1. Ve a [Make.com](https://www.make.com) e inicia sesión
2. Crea un nuevo escenario
3. Añade un módulo "Webhooks" > "Custom webhook"
4. Copia la URL del webhook generada
5. Repite para cada tipo de webhook que necesites

### Paso 2: Actualizar URLs en JARVI

Edita el archivo `server-simple.js` y reemplaza las URLs de ejemplo:

```javascript
this.makeWebhooks = {
  'test': 'https://hook.us2.make.com/TU_URL_REAL_AQUI',
  'claude': 'https://hook.us2.make.com/TU_URL_REAL_AQUI',
  'notification': 'https://hook.us2.make.com/TU_URL_REAL_AQUI',
  'process': 'https://hook.us2.make.com/TU_URL_REAL_AQUI',
  'jarvi': 'https://hook.us2.make.com/TU_URL_REAL_AQUI'
};
```

## 🎮 COMANDOS DISPONIBLES

### Desde JARVI Chat (http://localhost:5173)

```bash
# Autenticarse primero
AUTH

# Comandos de Make.com
MAKE TEST              # Probar integración
MAKE LIST              # Ver webhooks disponibles
MAKE STATUS            # Estado de Make.com
MAKE HISTORY           # Ver últimas ejecuciones
MAKE RUN test          # Ejecutar webhook de prueba
MAKE RUN claude        # Ejecutar webhook para Claude
MAKE RUN notification  # Enviar notificación
MAKE RUN process       # Procesar datos
MAKE RUN jarvi         # Acción personalizada de JARVI
```

## 🔄 FLUJO DE DATOS

```
Usuario (JARVI Chat)
    ↓
Comando: "MAKE RUN notification"
    ↓
JARVI Server (puerto 3001)
    ↓
Webhook Make.com
    ↓
Escenario en Make.com
    ↓
[Ejecuta acciones configuradas]
    ↓
Respuesta a JARVI
    ↓
Muestra resultado al usuario
```

## 📦 ESTRUCTURA DE DATOS ENVIADOS

Cuando ejecutas un webhook, JARVI envía:

```json
{
  "source": "JARVI",
  "webhook": "nombre_del_webhook",
  "timestamp": "2024-01-09T...",
  "authenticated": true,
  "payload": "datos_adicionales",
  "metadata": {
    "command": "MAKE RUN nombre",
    "user": "Commander"
  }
}
```

## 🎯 CASOS DE USO

### 1. Notificaciones Automáticas
```bash
MAKE RUN notification "Sistema actualizado correctamente"
```

### 2. Procesamiento de Datos
```bash
MAKE RUN process "analizar logs del sistema"
```

### 3. Integración con Claude
```bash
MAKE RUN claude "necesito ayuda con Python"
```

### 4. Acciones Personalizadas
```bash
MAKE RUN jarvi "ejecutar backup diario"
```

## 🔧 CONFIGURACIÓN AVANZADA EN MAKE.COM

### Ejemplo de Escenario: Notificación

1. **Webhook** → Recibe datos de JARVI
2. **Router** → Decide qué hacer según el tipo
3. **Email** → Envía notificación por email
4. **Slack** → Publica en canal de Slack
5. **Google Sheets** → Registra en hoja de cálculo
6. **HTTP Response** → Devuelve confirmación a JARVI

### Ejemplo de Escenario: Procesamiento

1. **Webhook** → Recibe comando de JARVI
2. **Parse JSON** → Extrae datos del payload
3. **API Call** → Llama a servicio externo
4. **Transform** → Procesa respuesta
5. **Store** → Guarda en base de datos
6. **Response** → Envía resultado a JARVI

## 🔒 SEGURIDAD

### Recomendaciones:

1. **Validación en Make.com**: Añade filtros para validar origen
2. **API Keys**: Usa autenticación adicional si es necesario
3. **Rate Limiting**: Configura límites en Make.com
4. **Logs**: Mantén registro de todas las ejecuciones

### Añadir Seguridad Extra:

En Make.com, añade un módulo de validación:
```javascript
// Validar que viene de JARVI
if (source !== 'JARVI') {
  throw new Error('Origen no autorizado');
}
```

## 🧪 MODO DEMO

Si no tienes URLs configuradas, JARVI funciona en modo demo:
- Simula las ejecuciones
- Muestra qué datos se enviarían
- Útil para testing sin gastar operaciones en Make

## 📈 MONITOREO

### Ver Estado:
```bash
MAKE STATUS
```

### Ver Historial:
```bash
MAKE HISTORY
```

### Logs en Servidor:
El servidor muestra en consola:
- 🚀 Cuando ejecuta un webhook
- ✅ Cuando tiene éxito
- ❌ Si hay errores

## 🆘 TROUBLESHOOTING

### Error: "Webhook no configurado"
→ Actualiza la URL en `server-simple.js`

### Error: "Network timeout"
→ Verifica tu conexión a Internet
→ Comprueba que Make.com esté activo

### Error: "401 Unauthorized"
→ Verifica la URL del webhook
→ Asegúrate de estar autenticado en JARVI

### No recibe datos Make.com
→ Revisa el escenario en Make.com
→ Verifica que el webhook esté activo
→ Comprueba los logs en Make.com

## 🎉 EJEMPLOS FUNCIONANDO

### Comando Simple:
```
Tú: AUTH
JARVI: ✅ Autenticación exitosa

Tú: MAKE TEST
JARVI: 🧪 PRUEBA DE MAKE.COM: Integración lista

Tú: MAKE RUN test
JARVI: 🎭 MODO DEMO - Webhook 'test'
```

### Con URL Real Configurada:
```
Tú: MAKE RUN notification "Backup completado"
JARVI: ✅ WEBHOOK EJECUTADO: notification
       📤 Datos enviados a Make.com
       📥 Respuesta: {"success": true}
```

## 🚀 PRÓXIMOS PASOS

1. Configura tus webhooks en Make.com
2. Actualiza las URLs en el servidor
3. Reinicia el servidor: `npm run server`
4. Prueba desde http://localhost:5173
5. ¡Empieza a automatizar!

---

**Desarrollado por el Comandante con JARVI System**