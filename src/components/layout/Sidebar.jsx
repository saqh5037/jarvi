import { motion } from 'framer-motion';
import { Bot, Terminal, Activity, Settings, Database, Shield, Cpu, Zap, Send, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useJarvi } from '../../context/JarviContext';
import toast from 'react-hot-toast';

/**
 * Sidebar con lista de Gems (IA especializadas) y panel de comandos
 * Integrado con Make para ejecutar webhooks
 */
const Sidebar = ({ onOpenConfig }) => {
  const { 
    gems, 
    selectedGem, 
    setSelectedGem,
    executeCommand,
    executeGemAction,
    commandQueue,
    isLoading 
  } = useJarvi();

  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Mapeo de iconos
  const iconMap = {
    Database,
    Shield,
    Cpu,
    Zap,
    Settings
  };

  // Comandos disponibles
  const availableCommands = [
    { cmd: 'START_ANALYSIS', desc: 'Inicia análisis de datos' },
    { cmd: 'SECURITY_SCAN', desc: 'Ejecuta escaneo de seguridad' },
    { cmd: 'GENERATE_REPORT', desc: 'Genera reporte' },
    { cmd: 'SYNC_DATA', desc: 'Sincroniza datos' },
    { cmd: 'EMERGENCY', desc: 'Protocolo de emergencia' },
    { cmd: 'STATUS', desc: 'Estado del sistema' },
    { cmd: 'HELP', desc: 'Muestra comandos disponibles' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'text-green-400 animate-pulse';
      case 'idle': return 'text-yellow-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  /**
   * Procesa y ejecuta comando
   */
  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.toUpperCase().trim();
    
    // Añadir al historial
    const historyEntry = {
      text: command,
      timestamp: new Date().toLocaleTimeString(),
      status: 'executing'
    };
    
    setCommandHistory(prev => [historyEntry, ...prev.slice(0, 19)]);
    setCommand('');
    setIsExecuting(true);

    try {
      // Comandos especiales
      if (cmd === 'HELP') {
        toast.success('Comandos disponibles mostrados');
        availableCommands.forEach(c => {
          console.log(`${c.cmd}: ${c.desc}`);
        });
        historyEntry.status = 'success';
        historyEntry.response = 'Lista de comandos mostrada en consola';
      } 
      else if (cmd === 'STATUS') {
        historyEntry.status = 'success';
        historyEntry.response = `${gems.filter(g => g.status === 'active').length} Gems activas`;
        toast.success('Estado del sistema verificado');
      }
      else if (cmd === 'CLEAR') {
        setCommandHistory([]);
        historyEntry.status = 'success';
        toast.success('Terminal limpiada');
      }
      // Ejecutar comando en Make
      else if (availableCommands.find(c => c.cmd === cmd)) {
        const results = await executeCommand(cmd, {
          timestamp: new Date().toISOString(),
          source: 'terminal',
          gem: selectedGem ? gems.find(g => g.id === selectedGem)?.name : 'SYSTEM'
        });

        if (results && results.length > 0) {
          historyEntry.status = 'success';
          historyEntry.response = `${results.filter(r => r.success).length} webhooks ejecutados`;
        } else {
          historyEntry.status = 'warning';
          historyEntry.response = 'No hay webhooks configurados';
        }
      }
      // Comando no reconocido
      else {
        historyEntry.status = 'error';
        historyEntry.response = 'Comando no reconocido. Use HELP';
        toast.error('Comando no reconocido');
      }
    } catch (error) {
      historyEntry.status = 'error';
      historyEntry.response = error.message;
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsExecuting(false);
      // Actualizar el historial con el resultado
      setCommandHistory(prev => {
        const updated = [...prev];
        updated[0] = historyEntry;
        return updated;
      });
    }
  };

  /**
   * Ejecuta acción de una Gem
   */
  const handleGemAction = async (gemId, action) => {
    try {
      await executeGemAction(gemId, action);
      toast.success(`Acción ${action} ejecutada en ${gemId.toUpperCase()}`);
    } catch (error) {
      toast.error(`Error en Gem: ${error.message}`);
    }
  };

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-80 h-full jarvi-glass jarvi-border flex flex-col"
    >
      {/* Header del Sidebar */}
      <div className="p-4 border-b border-jarvi-blue/20">
        <div className="flex items-center justify-between">
          <h2 className="font-tech text-lg text-jarvi-blue flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>GEMS ACTIVAS</span>
          </h2>
          <button
            onClick={onOpenConfig}
            className="p-1.5 hover:bg-jarvi-blue/10 rounded-lg transition-colors"
            title="Configurar Make"
          >
            <Settings className="w-4 h-4 text-jarvi-blue" />
          </button>
        </div>
      </div>

      {/* Lista de Gems */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {gems.map((gem) => (
          <motion.div
            key={gem.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedGem(gem.id)}
            onDoubleClick={() => handleGemAction(gem.id, 'activate')}
            className={cn(
              "p-3 rounded-lg cursor-pointer transition-all",
              "jarvi-border hover:jarvi-glow",
              selectedGem === gem.id && "jarvi-glow bg-jarvi-blue/10"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(() => {
                  const Icon = iconMap[gem.icon] || Activity;
                  return <Icon className={cn("w-5 h-5", getStatusColor(gem.status))} />;
                })()}
                <div>
                  <h3 className="font-tech font-bold text-sm">{gem.name}</h3>
                  <p className="text-xs text-gray-400">{gem.role}</p>
                  {gem.webhooks && gem.webhooks.length > 0 && (
                    <p className="text-xs text-jarvi-blue/50 mt-1">
                      {gem.webhooks.length} webhook{gem.webhooks.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-jarvi-blue">
                  {gem.activity}%
                </div>
                <div className="w-12 h-1 bg-gray-700 rounded-full mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${gem.activity}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-jarvi-blue rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Panel de Comandos */}
      <div className="border-t border-jarvi-blue/20 p-4">
        <h3 className="font-tech text-sm text-jarvi-blue mb-3 flex items-center space-x-2">
          <Terminal className="w-4 h-4" />
          <span>TERMINAL DE COMANDOS</span>
          {isExecuting && <Loader className="w-3 h-3 animate-spin" />}
        </h3>

        {/* Comandos rápidos */}
        <div className="flex flex-wrap gap-1 mb-2">
          {availableCommands.slice(0, 4).map((cmd) => (
            <button
              key={cmd.cmd}
              onClick={() => setCommand(cmd.cmd)}
              className="px-2 py-1 text-xs bg-jarvi-blue/10 hover:bg-jarvi-blue/20 border border-jarvi-blue/30 rounded transition-all"
              title={cmd.desc}
            >
              {cmd.cmd}
            </button>
          ))}
        </div>

        {/* Historial de comandos */}
        <div className="h-32 bg-black/30 rounded-lg p-2 mb-3 overflow-y-auto">
          {commandHistory.length > 0 ? (
            <div className="space-y-1">
              {commandHistory.map((cmd, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-mono"
                >
                  <span className="text-jarvi-blue/50">[{cmd.timestamp}]</span>
                  <span className={cn(
                    "ml-2",
                    cmd.status === 'success' && "text-green-400",
                    cmd.status === 'error' && "text-red-400",
                    cmd.status === 'warning' && "text-yellow-400",
                    cmd.status === 'executing' && "text-jarvi-blue animate-pulse",
                    !cmd.status && "text-green-400"
                  )}>
                    {'>'}
                  </span>
                  <span className="text-white ml-1">{cmd.text}</span>
                  {cmd.response && (
                    <div className="ml-4 text-jarvi-blue/70 mt-1">
                      → {cmd.response}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 font-mono">
              <p>Sistema JARVI iniciado...</p>
              <p className="mt-1 text-jarvi-blue/50">Escriba HELP para ver comandos</p>
            </div>
          )}
        </div>

        {/* Input de comandos */}
        <form onSubmit={handleCommand}>
          <div className="flex items-center space-x-2">
            <span className="text-jarvi-blue">{'>'}</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Ingrese comando..."
              disabled={isExecuting}
              className="flex-1 bg-black/30 border border-jarvi-blue/30 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-jarvi-blue disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isExecuting || !command.trim()}
              className="p-1.5 bg-jarvi-blue/10 hover:bg-jarvi-blue/20 border border-jarvi-blue/30 rounded transition-all disabled:opacity-30"
            >
              <Send className="w-3 h-3 text-jarvi-blue" />
            </button>
          </div>
        </form>
      </div>
    </motion.aside>
  );
};

export default Sidebar;