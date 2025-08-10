import axios from 'axios';

/**
 * Servicio de integración con Make (Integromat)
 * Maneja webhooks y automatizaciones
 */
class MakeService {
  constructor() {
    this.webhooks = new Map();
    this.history = [];
    this.config = this.loadConfig();
  }

  /**
   * Carga configuración desde localStorage
   */
  loadConfig() {
    const saved = localStorage.getItem('makeConfig');
    return saved ? JSON.parse(saved) : {
      webhooks: [],
      apiKey: '',
      organizationId: '',
      teamId: ''
    };
  }

  /**
   * Guarda configuración en localStorage
   */
  saveConfig(config) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('makeConfig', JSON.stringify(this.config));
    return this.config;
  }

  /**
   * Registra un nuevo webhook
   */
  registerWebhook(name, url, description = '', headers = {}) {
    const webhook = {
      id: Date.now().toString(),
      name,
      url,
      description,
      headers,
      active: true,
      createdAt: new Date().toISOString(),
      executionCount: 0,
      lastExecution: null
    };

    this.webhooks.set(webhook.id, webhook);
    this.config.webhooks.push(webhook);
    this.saveConfig(this.config);
    
    return webhook;
  }

  /**
   * Ejecuta un webhook específico
   */
  async executeWebhook(webhookId, payload = {}) {
    const webhook = this.webhooks.get(webhookId) || 
                   this.config.webhooks.find(w => w.id === webhookId);
    
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} no encontrado`);
    }

    if (!webhook.active) {
      throw new Error(`Webhook ${webhook.name} está desactivado`);
    }

    const execution = {
      id: Date.now().toString(),
      webhookId,
      webhookName: webhook.name,
      timestamp: new Date().toISOString(),
      payload,
      status: 'pending'
    };

    try {
      // Añadir metadata del sistema
      const enrichedPayload = {
        ...payload,
        metadata: {
          source: 'JARVI Command Center',
          timestamp: new Date().toISOString(),
          webhookName: webhook.name,
          executionId: execution.id
        }
      };

      // Ejecutar webhook
      const response = await axios.post(webhook.url, enrichedPayload, {
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        timeout: 30000 // 30 segundos timeout
      });

      // Actualizar estadísticas
      webhook.executionCount++;
      webhook.lastExecution = new Date().toISOString();
      
      // Guardar en historial
      execution.status = 'success';
      execution.response = response.data;
      execution.statusCode = response.status;
      
      this.history.unshift(execution);
      if (this.history.length > 100) {
        this.history = this.history.slice(0, 100); // Mantener solo últimas 100 ejecuciones
      }

      this.saveConfig(this.config);
      
      return {
        success: true,
        execution,
        response: response.data
      };

    } catch (error) {
      execution.status = 'error';
      execution.error = error.message;
      execution.statusCode = error.response?.status;
      
      this.history.unshift(execution);
      
      return {
        success: false,
        execution,
        error: error.message
      };
    }
  }

  /**
   * Ejecuta un comando que puede disparar múltiples webhooks
   */
  async executeCommand(command, context = {}) {
    const commandMap = {
      'START_ANALYSIS': ['data-analysis-webhook'],
      'SECURITY_SCAN': ['security-webhook', 'alert-webhook'],
      'GENERATE_REPORT': ['report-webhook'],
      'SYNC_DATA': ['sync-webhook', 'backup-webhook'],
      'EMERGENCY': ['emergency-webhook', 'alert-webhook', 'notification-webhook']
    };

    const webhookNames = commandMap[command] || [];
    const results = [];

    for (const webhookName of webhookNames) {
      const webhook = Array.from(this.webhooks.values()).find(w => w.name === webhookName) ||
                     this.config.webhooks.find(w => w.name === webhookName);
      
      if (webhook) {
        const result = await this.executeWebhook(webhook.id, {
          command,
          context,
          timestamp: new Date().toISOString()
        });
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Obtiene el historial de ejecuciones
   */
  getHistory(limit = 50) {
    return this.history.slice(0, limit);
  }

  /**
   * Obtiene estadísticas de uso
   */
  getStatistics() {
    const stats = {
      totalWebhooks: this.config.webhooks.length,
      activeWebhooks: this.config.webhooks.filter(w => w.active).length,
      totalExecutions: this.history.length,
      successfulExecutions: this.history.filter(h => h.status === 'success').length,
      failedExecutions: this.history.filter(h => h.status === 'error').length,
      lastExecution: this.history[0]?.timestamp || null
    };

    return stats;
  }

  /**
   * Prueba la conexión con un webhook
   */
  async testWebhook(webhookId) {
    return this.executeWebhook(webhookId, {
      test: true,
      message: 'Prueba de conexión desde JARVI'
    });
  }

  /**
   * Elimina un webhook
   */
  removeWebhook(webhookId) {
    this.webhooks.delete(webhookId);
    this.config.webhooks = this.config.webhooks.filter(w => w.id !== webhookId);
    this.saveConfig(this.config);
  }

  /**
   * Actualiza un webhook
   */
  updateWebhook(webhookId, updates) {
    const webhook = this.webhooks.get(webhookId) || 
                   this.config.webhooks.find(w => w.id === webhookId);
    
    if (webhook) {
      Object.assign(webhook, updates);
      this.saveConfig(this.config);
      return webhook;
    }
    
    return null;
  }
}

// Exportar instancia única (Singleton)
const makeService = new MakeService();
export default makeService;