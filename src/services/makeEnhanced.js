import axios from 'axios';

/**
 * Servicio mejorado de integración con Make.com (Integromat)
 * Permite ejecutar escenarios y webhooks desde JARVI
 */
class MakeEnhancedService {
  constructor() {
    // Configuración de Make.com
    this.config = {
      // Lista de webhooks configurados
      webhooks: {
        'welcome': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_1',
        'process-data': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_2',
        'send-notification': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_3',
        'claude-command': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_4',
        'jarvi-action': 'https://hook.us2.make.com/YOUR_WEBHOOK_URL_5'
      },
      
      // API Key de Make (si usas la API)
      apiKey: process.env.MAKE_API_KEY || '',
      apiUrl: 'https://us2.make.com/api/v2',
      
      // Timeout para las peticiones
      timeout: 30000
    };
    
    // Historial de ejecuciones
    this.executionHistory = [];
    
    // Cache de resultados
    this.resultsCache = new Map();
  }

  /**
   * Registra un nuevo webhook
   */
  registerWebhook(name, url) {
    if (!name || !url) {
      throw new Error('Se requiere nombre y URL del webhook');
    }
    
    this.config.webhooks[name] = url;
    console.log(`✅ Webhook '${name}' registrado`);
    
    return {
      success: true,
      message: `Webhook '${name}' registrado correctamente`,
      name,
      url
    };
  }

  /**
   * Lista todos los webhooks disponibles
   */
  listWebhooks() {
    return {
      success: true,
      webhooks: Object.keys(this.config.webhooks).map(name => ({
        name,
        url: this.config.webhooks[name],
        configured: this.config.webhooks[name].includes('YOUR_WEBHOOK_URL') ? false : true
      }))
    };
  }

  /**
   * Ejecuta un webhook específico
   */
  async executeWebhook(webhookName, payload = {}) {
    try {
      const webhookUrl = this.config.webhooks[webhookName];
      
      if (!webhookUrl) {
        throw new Error(`Webhook '${webhookName}' no encontrado`);
      }
      
      if (webhookUrl.includes('YOUR_WEBHOOK_URL')) {
        return {
          success: false,
          message: `⚠️ Webhook '${webhookName}' no está configurado. Necesitas actualizar la URL.`,
          demo: true,
          instructions: 'Actualiza la URL del webhook en makeEnhanced.js con tu URL real de Make.com'
        };
      }
      
      // Enriquecer payload con metadata
      const enrichedPayload = {
        ...payload,
        metadata: {
          source: 'JARVI',
          timestamp: new Date().toISOString(),
          webhookName,
          sessionId: `jarvi-${Date.now()}`
        }
      };
      
      console.log(`🚀 Ejecutando webhook '${webhookName}'...`);
      
      // Hacer la petición
      const response = await axios.post(webhookUrl, enrichedPayload, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'JARVI-System/2.0'
        }
      });
      
      // Guardar en historial
      this.addToHistory({
        webhookName,
        payload: enrichedPayload,
        response: response.data,
        status: 'success',
        timestamp: new Date().toISOString()
      });
      
      // Cachear resultado
      this.resultsCache.set(webhookName, {
        data: response.data,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: `✅ Webhook '${webhookName}' ejecutado exitosamente`,
        data: response.data,
        executionId: enrichedPayload.metadata.sessionId
      };
      
    } catch (error) {
      console.error(`❌ Error ejecutando webhook:`, error.message);
      
      // Guardar error en historial
      this.addToHistory({
        webhookName,
        payload,
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        message: `❌ Error ejecutando webhook '${webhookName}'`,
        error: error.message
      };
    }
  }

  /**
   * Ejecuta un escenario de Make usando comandos especiales
   */
  async executeScenario(command, params = {}) {
    const scenarios = {
      'test': async () => {
        return {
          success: true,
          message: '🧪 Escenario de prueba ejecutado',
          data: {
            test: true,
            timestamp: new Date().toISOString(),
            params
          }
        };
      },
      
      'claude-task': async () => {
        return await this.executeWebhook('claude-command', {
          task: params.task || 'Procesar comando',
          priority: params.priority || 'normal',
          instructions: params.instructions || ''
        });
      },
      
      'notification': async () => {
        return await this.executeWebhook('send-notification', {
          message: params.message || 'Notificación desde JARVI',
          type: params.type || 'info',
          recipient: params.recipient || 'commander'
        });
      },
      
      'process': async () => {
        return await this.executeWebhook('process-data', {
          data: params.data || {},
          action: params.action || 'default',
          options: params.options || {}
        });
      },
      
      'jarvi-action': async () => {
        return await this.executeWebhook('jarvi-action', {
          action: params.action || 'default',
          target: params.target || 'system',
          params: params
        });
      }
    };
    
    const scenario = scenarios[command.toLowerCase()];
    
    if (!scenario) {
      return {
        success: false,
        message: `❓ Escenario '${command}' no reconocido`,
        availableScenarios: Object.keys(scenarios)
      };
    }
    
    return await scenario();
  }

  /**
   * Obtiene el historial de ejecuciones
   */
  getHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Limpia el historial
   */
  clearHistory() {
    this.executionHistory = [];
    this.resultsCache.clear();
    return {
      success: true,
      message: '🗑️ Historial limpiado'
    };
  }

  /**
   * Añade entrada al historial
   */
  addToHistory(entry) {
    this.executionHistory.push(entry);
    
    // Limitar historial a 100 entradas
    if (this.executionHistory.length > 100) {
      this.executionHistory.shift();
    }
  }

  /**
   * Obtiene el último resultado cacheado
   */
  getLastResult(webhookName) {
    if (webhookName) {
      return this.resultsCache.get(webhookName);
    }
    
    // Obtener el último resultado de cualquier webhook
    const lastEntry = Array.from(this.resultsCache.entries()).pop();
    return lastEntry ? lastEntry[1] : null;
  }

  /**
   * Verifica el estado de Make.com
   */
  async checkStatus() {
    try {
      // Aquí podrías verificar la API de Make si tienes acceso
      const configuredWebhooks = Object.values(this.config.webhooks)
        .filter(url => !url.includes('YOUR_WEBHOOK_URL')).length;
      
      return {
        success: true,
        status: 'operational',
        webhooksConfigured: configuredWebhooks,
        totalWebhooks: Object.keys(this.config.webhooks).length,
        historyCount: this.executionHistory.length,
        cacheSize: this.resultsCache.size
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message
      };
    }
  }
}

// Exportar instancia única
const makeService = new MakeEnhancedService();
export default makeService;