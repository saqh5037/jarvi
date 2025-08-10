import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import makeService from '../services/makeService';
import toast from 'react-hot-toast';

/**
 * Contexto global de JARVI
 * Gestiona estado de la aplicación e integraciones
 */
const JarviContext = createContext();

export const useJarvi = () => {
  const context = useContext(JarviContext);
  if (!context) {
    throw new Error('useJarvi debe usarse dentro de JarviProvider');
  }
  return context;
};

export const JarviProvider = ({ children }) => {
  // Estados principales
  const [webhooks, setWebhooks] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [selectedGem, setSelectedGem] = useState(null);
  const [commandQueue, setCommandQueue] = useState([]);
  
  // Estado de configuración
  const [config, setConfig] = useState({
    makeEnabled: true,
    autoExecute: false,
    debugMode: false
  });

  // Gems del sistema
  const [gems, setGems] = useState([
    { 
      id: 'alpha', 
      name: 'ALPHA', 
      role: 'Análisis de Datos', 
      status: 'active', 
      activity: 87,
      icon: 'Database',
      capabilities: ['data-processing', 'analytics', 'reporting'],
      webhooks: []
    },
    { 
      id: 'beta', 
      name: 'BETA', 
      role: 'Seguridad', 
      status: 'active', 
      activity: 92,
      icon: 'Shield',
      capabilities: ['security-scan', 'threat-detection', 'firewall'],
      webhooks: []
    },
    { 
      id: 'gamma', 
      name: 'GAMMA', 
      role: 'Procesamiento', 
      status: 'idle', 
      activity: 45,
      icon: 'Cpu',
      capabilities: ['batch-processing', 'queue-management', 'scheduling'],
      webhooks: []
    },
    { 
      id: 'delta', 
      name: 'DELTA', 
      role: 'Optimización', 
      status: 'active', 
      activity: 78,
      icon: 'Zap',
      capabilities: ['performance-tuning', 'resource-optimization', 'caching'],
      webhooks: []
    },
    { 
      id: 'omega', 
      name: 'OMEGA', 
      role: 'Control Central', 
      status: 'active', 
      activity: 100,
      icon: 'Settings',
      capabilities: ['orchestration', 'monitoring', 'alerting'],
      webhooks: []
    }
  ]);

  // Cargar datos iniciales
  useEffect(() => {
    loadWebhooks();
    loadHistory();
    updateStatistics();
  }, []);

  /**
   * Carga webhooks desde el servicio
   */
  const loadWebhooks = useCallback(() => {
    const config = makeService.loadConfig();
    setWebhooks(config.webhooks || []);
  }, []);

  /**
   * Carga historial de ejecuciones
   */
  const loadHistory = useCallback(() => {
    const history = makeService.getHistory();
    setExecutionHistory(history);
  }, []);

  /**
   * Actualiza estadísticas
   */
  const updateStatistics = useCallback(() => {
    const stats = makeService.getStatistics();
    setStatistics(stats);
  }, []);

  /**
   * Registra un nuevo webhook
   */
  const registerWebhook = useCallback(async (webhookData) => {
    try {
      setIsLoading(true);
      const webhook = makeService.registerWebhook(
        webhookData.name,
        webhookData.url,
        webhookData.description,
        webhookData.headers
      );
      
      loadWebhooks();
      toast.success(`Webhook ${webhook.name} registrado exitosamente`);
      return webhook;
    } catch (error) {
      toast.error(`Error al registrar webhook: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadWebhooks]);

  /**
   * Ejecuta un webhook
   */
  const executeWebhook = useCallback(async (webhookId, payload = {}) => {
    try {
      setIsLoading(true);
      
      const result = await makeService.executeWebhook(webhookId, payload);
      
      if (result.success) {
        toast.success('Webhook ejecutado exitosamente');
      } else {
        toast.error(`Error en webhook: ${result.error}`);
      }
      
      loadHistory();
      updateStatistics();
      
      return result;
    } catch (error) {
      toast.error(`Error al ejecutar webhook: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadHistory, updateStatistics]);

  /**
   * Ejecuta un comando del sistema
   */
  const executeCommand = useCallback(async (command, context = {}) => {
    try {
      setIsLoading(true);
      
      // Añadir a la cola de comandos
      const commandEntry = {
        id: Date.now().toString(),
        command,
        context,
        timestamp: new Date().toISOString(),
        status: 'executing'
      };
      
      setCommandQueue(prev => [commandEntry, ...prev].slice(0, 50));
      
      // Ejecutar comando
      const results = await makeService.executeCommand(command, context);
      
      // Actualizar estado del comando
      commandEntry.status = results.some(r => !r.success) ? 'partial' : 'success';
      commandEntry.results = results;
      
      if (results.length > 0) {
        const successCount = results.filter(r => r.success).length;
        toast.success(`Comando ejecutado: ${successCount}/${results.length} webhooks exitosos`);
      } else {
        toast.warning('No hay webhooks configurados para este comando');
      }
      
      loadHistory();
      updateStatistics();
      
      return results;
    } catch (error) {
      toast.error(`Error al ejecutar comando: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadHistory, updateStatistics]);

  /**
   * Prueba un webhook
   */
  const testWebhook = useCallback(async (webhookId) => {
    try {
      setIsLoading(true);
      const result = await makeService.testWebhook(webhookId);
      
      if (result.success) {
        toast.success('Prueba exitosa');
      } else {
        toast.error('Prueba fallida');
      }
      
      loadHistory();
      return result;
    } catch (error) {
      toast.error(`Error en prueba: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadHistory]);

  /**
   * Elimina un webhook
   */
  const removeWebhook = useCallback((webhookId) => {
    try {
      makeService.removeWebhook(webhookId);
      loadWebhooks();
      toast.success('Webhook eliminado');
    } catch (error) {
      toast.error(`Error al eliminar webhook: ${error.message}`);
    }
  }, [loadWebhooks]);

  /**
   * Actualiza un webhook
   */
  const updateWebhook = useCallback((webhookId, updates) => {
    try {
      makeService.updateWebhook(webhookId, updates);
      loadWebhooks();
      toast.success('Webhook actualizado');
    } catch (error) {
      toast.error(`Error al actualizar webhook: ${error.message}`);
    }
  }, [loadWebhooks]);

  /**
   * Asigna webhooks a una Gem
   */
  const assignWebhooksToGem = useCallback((gemId, webhookIds) => {
    setGems(prev => prev.map(gem => 
      gem.id === gemId 
        ? { ...gem, webhooks: webhookIds }
        : gem
    ));
    toast.success('Webhooks asignados a ' + gemId.toUpperCase());
  }, []);

  /**
   * Ejecuta acciones de una Gem
   */
  const executeGemAction = useCallback(async (gemId, action, payload = {}) => {
    const gem = gems.find(g => g.id === gemId);
    if (!gem) {
      toast.error('Gem no encontrada');
      return;
    }

    // Simular actividad de la Gem
    setGems(prev => prev.map(g => 
      g.id === gemId 
        ? { ...g, status: 'active', activity: Math.min(100, g.activity + 10) }
        : g
    ));

    // Ejecutar webhooks asociados
    const results = [];
    for (const webhookId of gem.webhooks) {
      const result = await executeWebhook(webhookId, {
        gem: gem.name,
        action,
        payload
      });
      results.push(result);
    }

    // Restaurar estado de la Gem
    setTimeout(() => {
      setGems(prev => prev.map(g => 
        g.id === gemId 
          ? { ...g, status: gem.status, activity: gem.activity }
          : g
      ));
    }, 3000);

    return results;
  }, [gems, executeWebhook]);

  const value = {
    // Estados
    webhooks,
    executionHistory,
    isLoading,
    statistics,
    gems,
    selectedGem,
    commandQueue,
    config,
    
    // Acciones
    registerWebhook,
    executeWebhook,
    executeCommand,
    testWebhook,
    removeWebhook,
    updateWebhook,
    assignWebhooksToGem,
    executeGemAction,
    setSelectedGem,
    setConfig,
    
    // Utilidades
    loadWebhooks,
    loadHistory,
    updateStatistics
  };

  return (
    <JarviContext.Provider value={value}>
      {children}
    </JarviContext.Provider>
  );
};

export default JarviContext;