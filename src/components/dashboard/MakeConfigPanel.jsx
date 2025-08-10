import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Trash2, TestTube, Link, AlertCircle, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react';
import { useJarvi } from '../../context/JarviContext';
import { cn } from '../../lib/utils';

/**
 * Panel de configuración de webhooks de Make
 * Permite registrar, probar y gestionar webhooks
 */
const MakeConfigPanel = ({ isOpen, onClose }) => {
  const { 
    webhooks, 
    registerWebhook, 
    testWebhook, 
    removeWebhook,
    updateWebhook,
    isLoading 
  } = useJarvi();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    headers: '{}'
  });

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let headers = {};
      if (formData.headers) {
        headers = JSON.parse(formData.headers);
      }

      await registerWebhook({
        ...formData,
        headers
      });

      // Limpiar formulario
      setFormData({
        name: '',
        url: '',
        description: '',
        headers: '{}'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error al registrar webhook:', error);
    }
  };

  /**
   * Prueba un webhook
   */
  const handleTest = async (webhookId) => {
    await testWebhook(webhookId);
  };

  /**
   * Copia URL del webhook
   */
  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
  };

  /**
   * Activa/desactiva un webhook
   */
  const toggleWebhook = (webhookId, currentStatus) => {
    updateWebhook(webhookId, { active: !currentStatus });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[80vh] jarvi-glass jarvi-border rounded-xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-jarvi-blue/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-jarvi-blue" />
                <h2 className="font-tech text-xl text-jarvi-blue">CONFIGURACIÓN DE MAKE</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-jarvi-blue/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-jarvi-blue" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Botón añadir webhook */}
            <div className="mb-6">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-jarvi-blue/10 hover:bg-jarvi-blue/20 border border-jarvi-blue/30 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4 text-jarvi-blue" />
                <span className="font-tech text-sm text-jarvi-blue">AÑADIR WEBHOOK</span>
              </button>
            </div>

            {/* Formulario de nuevo webhook */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <form onSubmit={handleSubmit} className="space-y-4 p-4 jarvi-border rounded-lg">
                    <div>
                      <label className="block text-xs text-jarvi-blue/70 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="ej: data-analysis-webhook"
                        className="w-full px-3 py-2 bg-black/30 border border-jarvi-blue/30 rounded-lg text-sm focus:outline-none focus:border-jarvi-blue"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-jarvi-blue/70 mb-1">URL del Webhook</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        required
                        placeholder="https://hook.make.com/..."
                        className="w-full px-3 py-2 bg-black/30 border border-jarvi-blue/30 rounded-lg text-sm focus:outline-none focus:border-jarvi-blue"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-jarvi-blue/70 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descripción del webhook"
                        className="w-full px-3 py-2 bg-black/30 border border-jarvi-blue/30 rounded-lg text-sm focus:outline-none focus:border-jarvi-blue"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-jarvi-blue/70 mb-1">Headers (JSON)</label>
                      <textarea
                        value={formData.headers}
                        onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                        placeholder='{"Authorization": "Bearer token"}'
                        rows={3}
                        className="w-full px-3 py-2 bg-black/30 border border-jarvi-blue/30 rounded-lg text-sm font-mono focus:outline-none focus:border-jarvi-blue"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-jarvi-blue/20 hover:bg-jarvi-blue/30 border border-jarvi-blue/50 rounded-lg text-sm font-tech text-jarvi-blue transition-all disabled:opacity-50"
                      >
                        Registrar Webhook
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lista de webhooks */}
            <div className="space-y-3">
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-jarvi-blue/30" />
                  <p className="text-sm">No hay webhooks configurados</p>
                  <p className="text-xs mt-1">Añade tu primer webhook para comenzar</p>
                </div>
              ) : (
                webhooks.map((webhook) => (
                  <motion.div
                    key={webhook.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 jarvi-border rounded-lg hover:jarvi-glow transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-tech font-bold text-sm text-jarvi-blue">
                            {webhook.name}
                          </h3>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            webhook.active 
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          )}>
                            {webhook.active ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </div>
                        
                        {webhook.description && (
                          <p className="text-xs text-gray-400 mb-2">{webhook.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <Link className="w-3 h-3 text-jarvi-blue/50" />
                          <code className="text-xs text-jarvi-blue/70 bg-black/30 px-2 py-1 rounded">
                            {webhook.url.substring(0, 50)}...
                          </code>
                          <button
                            onClick={() => copyUrl(webhook.url)}
                            className="p-1 hover:bg-jarvi-blue/10 rounded"
                            title="Copiar URL"
                          >
                            <Copy className="w-3 h-3 text-jarvi-blue/50" />
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Ejecuciones: {webhook.executionCount || 0}</span>
                          {webhook.lastExecution && (
                            <span>Última: {new Date(webhook.lastExecution).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={() => handleTest(webhook.id)}
                          disabled={isLoading || !webhook.active}
                          className="p-2 hover:bg-jarvi-blue/10 rounded-lg transition-colors disabled:opacity-30"
                          title="Probar webhook"
                        >
                          <TestTube className="w-4 h-4 text-jarvi-blue" />
                        </button>
                        
                        <button
                          onClick={() => toggleWebhook(webhook.id, webhook.active)}
                          className="p-2 hover:bg-jarvi-blue/10 rounded-lg transition-colors"
                          title={webhook.active ? 'Desactivar' : 'Activar'}
                        >
                          {webhook.active ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => removeWebhook(webhook.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Footer con instrucciones */}
          <div className="p-4 border-t border-jarvi-blue/20 bg-jarvi-blue/5">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-jarvi-blue mt-0.5" />
              <div className="text-xs text-jarvi-blue/70">
                <p className="font-bold mb-1">Cómo obtener tu webhook de Make:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Accede a tu escenario en Make.com</li>
                  <li>Añade un módulo "Webhooks {'>'} Custom webhook"</li>
                  <li>Copia la URL generada y pégala aquí</li>
                  <li>Configura las acciones que deseas ejecutar en Make</li>
                </ol>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MakeConfigPanel;