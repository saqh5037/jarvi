// Configuración CORS para permitir acceso desde múltiples orígenes
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir estos orígenes específicos
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://192.168.1.125:5173',
      'http://189.172.8.175:1745',
      // Permitir también sin origen (para Postman, apps móviles, etc)
      undefined
    ];
    
    // Si el origen está en la lista o no hay origen, permitir
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // También permitir cualquier IP local
      if (origin && (origin.includes('192.168.') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        callback(null, true);
      } else {
        callback(null, true); // Por ahora permitir todos para facilitar el desarrollo
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};

module.exports = corsOptions;