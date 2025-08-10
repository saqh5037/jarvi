# Guía de Configuración - Acceso Externo JARVI

## Estado Actual ✅

Los servicios de JARVI están funcionando correctamente y son accesibles desde:

### Acceso Local
- **Localhost**: http://localhost:5173
- **Red Local (iPad)**: http://192.168.1.125:5173

### Servicios Backend
- **Notas Mejoradas**: Puerto 3001
- **Reuniones**: Puerto 3002
- **Tareas**: Puerto 3003
- **Notas de Voz**: Puerto 3004
- **Bot Telegram**: Activo

## Configuración de Port Forwarding en tu Router

Para acceder desde tu IP pública (189.172.8.175:1745), necesitas configurar el port forwarding en tu router:

### Pasos para configurar:

1. **Accede a tu router**:
   - Abre navegador y ve a: http://192.168.1.1 o http://192.168.1.254
   - Ingresa con tus credenciales de administrador

2. **Busca la sección de Port Forwarding**:
   - Puede estar en: NAT, Virtual Server, Port Forwarding, o Application & Gaming

3. **Crea una nueva regla**:
   ```
   Nombre: JARVI Frontend
   Puerto Externo: 1745
   Puerto Interno: 5173
   IP Local: 192.168.1.125
   Protocolo: TCP
   Estado: Activo
   ```

4. **Para los servicios backend** (opcional):
   ```
   Puerto Externo: 3001 → Puerto Interno: 3001 → IP: 192.168.1.125
   Puerto Externo: 3002 → Puerto Interno: 3002 → IP: 192.168.1.125
   Puerto Externo: 3003 → Puerto Interno: 3003 → IP: 192.168.1.125
   Puerto Externo: 3004 → Puerto Interno: 3004 → IP: 192.168.1.125
   ```

5. **Guarda y reinicia el router** si es necesario

## Verificación

Una vez configurado el port forwarding:

1. **Desde tu red local**: http://192.168.1.125:5173
2. **Desde internet**: http://189.172.8.175:1745

## Seguridad Recomendada

⚠️ **IMPORTANTE**: Exponer servicios a internet tiene riesgos de seguridad.

### Medidas recomendadas:

1. **Autenticación**: Implementa un sistema de login
2. **HTTPS**: Configura certificados SSL
3. **Firewall**: Solo abre los puertos necesarios
4. **VPN**: Considera usar VPN en lugar de exposición directa
5. **Actualizaciones**: Mantén el código actualizado

## Scripts útiles

### Iniciar servicios (red local):
```bash
./start-network.sh
```

### Detener servicios:
```bash
# Presiona Ctrl+C en la terminal donde ejecutaste start-network.sh
# O ejecuta:
pkill -f "node server"
pkill -f "npm run dev"
pkill -f "telegram-bot"
```

## Troubleshooting

### Si no puedes acceder desde el iPad:

1. Verifica que estés en la misma red WiFi
2. Desactiva temporalmente el firewall de macOS:
   ```bash
   sudo pfctl -d  # Desactivar
   sudo pfctl -e  # Reactivar
   ```

### Si no funciona el acceso externo:

1. Verifica tu IP pública actual:
   ```bash
   curl ifconfig.me
   ```

2. Verifica que el puerto esté abierto:
   - Usa herramientas como: https://www.yougetsignal.com/tools/open-ports/

3. Algunos ISP bloquean puertos, contacta a tu proveedor si es necesario

## Soporte

Si necesitas ayuda adicional, los logs están en:
- Frontend: Terminal donde ejecutaste `./start-network.sh`
- Backend: Misma terminal, mensajes de cada servicio