/**
 * Configuración de variables de entorno para JARVI
 * Centraliza todas las variables de entorno y proporciona valores por defecto
 * 
 * @module config/environment
 */

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isDocker = process.env.DOCKER_ENV === 'true';

const config = {
  // Entorno
  env: process.env.NODE_ENV || 'development',
  isDevelopment,
  isProduction: process.env.NODE_ENV === 'production',
  isDocker,

  // URLs base
  baseUrl: process.env.BASE_URL || (isDevelopment ? 'http://localhost:5173' : window.location.origin),
  apiBaseUrl: process.env.API_BASE_URL || (isDevelopment ? 'http://localhost:3001' : window.location.origin),

  // Servicios API
  services: {
    enhancedNotes: process.env.ENHANCED_NOTES_URL || 'http://localhost:3001',
    meetings: process.env.MEETINGS_URL || 'http://localhost:3002',
    tasks: process.env.TASKS_URL || 'http://localhost:3003',
    voiceNotes: process.env.VOICE_NOTES_URL || 'http://localhost:3004',
    aiClassifier: process.env.AI_CLASSIFIER_URL || 'http://localhost:3005',
    edgeTTS: process.env.EDGE_TTS_URL || 'http://localhost:3007',
  },

  // Rutas de datos (para Docker)
  paths: {
    voiceNotes: process.env.DOCKER_VOICE_PATH || '/app/voice-notes',
    meetings: process.env.DOCKER_MEETINGS_PATH || '/app/meetings',
    tasks: process.env.DOCKER_TASKS_PATH || '/app/tasks',
    data: process.env.DOCKER_DATA_PATH || '/app/data',
  },

  // Configuración de logs
  logging: {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    enableMetrics: process.env.ENABLE_METRICS === 'true',
  },

  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
  },

  // Features flags
  features: {
    enableTelemetry: process.env.ENABLE_TELEMETRY === 'true',
    enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
    enableOfflineMode: process.env.ENABLE_OFFLINE_MODE === 'true',
  },
};

// Logger helper con niveles
const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = logLevels[config.logging.level] || 1;

export const logger = {
  debug: (...args) => {
    if (currentLogLevel <= logLevels.debug) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args) => {
    if (currentLogLevel <= logLevels.info) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args) => {
    if (currentLogLevel <= logLevels.warn) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args) => {
    if (currentLogLevel <= logLevels.error) {
      console.error('[ERROR]', ...args);
    }
  },
};

// Función helper para obtener URL de servicio
export const getServiceUrl = (service) => {
  return config.services[service] || config.apiBaseUrl;
};

// Función helper para verificar si estamos en producción
export const isProduction = () => config.isProduction;

// Función helper para verificar si estamos en Docker
export const isDockerEnvironment = () => config.isDocker;

export default config;