import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, CheckCircle, XCircle, AlertCircle, Loader, Filter, Download, RefreshCw } from 'lucide-react';
import { useJarvi } from '../../context/JarviContext';
import { cn } from '../../lib/utils';

/**
 * Panel de logs de actividad y respuestas de Make
 * Muestra historial de ejecuciones y resultados
 */
const ActivityLogsPanel = () => {
  const { executionHistory, statistics, loadHistory, updateStatistics } = useJarvi();
  const [filter, setFilter] = useState('all'); // all, success, error
  const [expandedLog, setExpandedLog] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh cada 5 segundos
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadHistory();
        updateStatistics();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadHistory, updateStatistics]);

  /**
   * Filtra logs según el estado
   */
  const filteredLogs = executionHistory.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  /**
   * Obtiene color según el estado
   */
  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  /**
   * Obtiene icono según el estado
   */
  const getStatusIcon = (status) => {
    switch(status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Loader className="w-4 h-4 animate-spin" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  /**
   * Exporta logs a JSON
   */
  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `jarvi-logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  /**
   * Formatea tiempo relativo
   */
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);
    
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  };

  return (
    <div className="p-6">
      {/* Header con estadísticas */}
      <div className="mb-6">
        <h2 className="font-tech text-xl text-jarvi-blue mb-4 flex items-center space-x-2">
          <Activity className="w-6 h-6" />
          <span>REGISTRO DE ACTIVIDAD</span>
        </h2>

        {/* Tarjetas de estadísticas */}
        {statistics && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="jarvi-border jarvi-glass p-3 rounded-lg"
            >
              <div className="text-2xl font-bold text-jarvi-blue">
                {statistics.totalExecutions}
              </div>
              <div className="text-xs text-gray-400">Total Ejecuciones</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="jarvi-border jarvi-glass p-3 rounded-lg"
            >
              <div className="text-2xl font-bold text-green-400">
                {statistics.successfulExecutions}
              </div>
              <div className="text-xs text-gray-400">Exitosas</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="jarvi-border jarvi-glass p-3 rounded-lg"
            >
              <div className="text-2xl font-bold text-red-400">
                {statistics.failedExecutions}
              </div>
              <div className="text-xs text-gray-400">Fallidas</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="jarvi-border jarvi-glass p-3 rounded-lg"
            >
              <div className="text-2xl font-bold text-jarvi-blue">
                {statistics.activeWebhooks}
              </div>
              <div className="text-xs text-gray-400">Webhooks Activos</div>
            </motion.div>
          </div>
        )}

        {/* Controles de filtrado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg transition-all",
                filter === 'all' 
                  ? "bg-jarvi-blue/20 text-jarvi-blue border border-jarvi-blue/50"
                  : "bg-black/20 text-gray-400 border border-gray-700 hover:border-jarvi-blue/30"
              )}
            >
              Todos ({executionHistory.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg transition-all",
                filter === 'success'
                  ? "bg-green-500/20 text-green-400 border border-green-500/50"
                  : "bg-black/20 text-gray-400 border border-gray-700 hover:border-green-500/30"
              )}
            >
              Exitosos
            </button>
            <button
              onClick={() => setFilter('error')}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg transition-all",
                filter === 'error'
                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                  : "bg-black/20 text-gray-400 border border-gray-700 hover:border-red-500/30"
              )}
            >
              Errores
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                autoRefresh
                  ? "bg-jarvi-blue/10 text-jarvi-blue"
                  : "bg-black/20 text-gray-400"
              )}
              title={autoRefresh ? "Auto-refresh activado" : "Auto-refresh desactivado"}
            >
              <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin-slow")} />
            </button>
            <button
              onClick={exportLogs}
              className="p-1.5 bg-black/20 hover:bg-jarvi-blue/10 text-jarvi-blue rounded-lg transition-all"
              title="Exportar logs"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {filteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <Activity className="w-12 h-12 mx-auto mb-3 text-jarvi-blue/30" />
              <p className="text-sm">No hay actividad registrada</p>
              <p className="text-xs mt-1">Los logs aparecerán aquí cuando se ejecuten webhooks</p>
            </motion.div>
          ) : (
            filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="jarvi-border rounded-lg overflow-hidden hover:jarvi-glow transition-all"
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={getStatusColor(log.status)}>
                        {getStatusIcon(log.status)}
                      </span>
                      <div>
                        <h4 className="font-tech text-sm text-white">
                          {log.webhookName || 'Webhook Ejecutado'}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(log.timestamp)}</span>
                          {log.statusCode && (
                            <>
                              <span>•</span>
                              <span>HTTP {log.statusCode}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        log.status === 'success' && "bg-green-500/20 text-green-400",
                        log.status === 'error' && "bg-red-500/20 text-red-400",
                        log.status === 'pending' && "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalles expandidos */}
                <AnimatePresence>
                  {expandedLog === log.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-jarvi-blue/20 bg-black/20"
                    >
                      <div className="p-4 space-y-3">
                        {/* Payload */}
                        {log.payload && (
                          <div>
                            <h5 className="text-xs text-jarvi-blue/70 mb-1">PAYLOAD:</h5>
                            <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Response */}
                        {log.response && (
                          <div>
                            <h5 className="text-xs text-green-400/70 mb-1">RESPUESTA:</h5>
                            <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto">
                              {typeof log.response === 'string' 
                                ? log.response 
                                : JSON.stringify(log.response, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Error */}
                        {log.error && (
                          <div>
                            <h5 className="text-xs text-red-400/70 mb-1">ERROR:</h5>
                            <pre className="text-xs bg-red-900/10 border border-red-500/20 p-2 rounded">
                              {log.error}
                            </pre>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>ID: {log.id}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityLogsPanel;