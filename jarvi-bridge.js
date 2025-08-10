import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

/**
 * JARVI Bridge - Sistema de control remoto seguro
 * Permite ejecutar comandos de forma remota con autenticación
 */
class JarviBridge {
  constructor() {
    // Clave secreta para autenticación (en producción usar variables de entorno)
    this.SECRET_KEY = 'JARVI-COMMANDER-2024-SECURE';
    this.commandLog = [];
    this.isAuthenticated = false;
    this.commandQueue = [];
    
    // Directorio de trabajo
    this.workDir = '/Users/samuelquiroz/Documents/proyectos/jarvi';
    
    // Comandos permitidos por seguridad
    this.allowedCommands = [
      'ls', 'pwd', 'echo', 'cat', 'grep', 'find',
      'git status', 'git log', 'npm list',
      'node --version', 'npm --version'
    ];
    
    // Comandos especiales de Claude
    this.claudeCommands = {
      'CLAUDE_STATUS': 'Verificar estado de Claude',
      'CLAUDE_HELP': 'Mostrar ayuda de comandos',
      'CLAUDE_EXECUTE': 'Ejecutar comando en Claude',
      'CLAUDE_CODE': 'Escribir código',
      'CLAUDE_ANALYZE': 'Analizar código',
      'CLAUDE_EXPLAIN': 'Explicar algo'
    };
  }

  /**
   * Autentica al usuario con contraseña
   */
  authenticate(password) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const validHash = crypto.createHash('sha256').update(this.SECRET_KEY).digest('hex');
    
    this.isAuthenticated = hash === validHash;
    
    if (this.isAuthenticated) {
      this.log('info', 'Autenticación exitosa');
      return { success: true, message: '✅ Autenticación exitosa. Bienvenido, Comandante.' };
    } else {
      this.log('error', 'Intento de autenticación fallido');
      return { success: false, message: '❌ Contraseña incorrecta' };
    }
  }

  /**
   * Procesa comandos especiales para Claude
   */
  async processClaudeCommand(command, params = {}) {
    if (!this.isAuthenticated) {
      return {
        success: false,
        message: '🔒 Requiere autenticación',
        requiresAuth: true
      };
    }

    const cmd = command.toUpperCase();
    
    switch(cmd) {
      case 'CLAUDE_STATUS':
        return {
          success: true,
          message: '🤖 Claude está activo y listo para recibir comandos',
          data: {
            status: 'online',
            mode: 'interactive',
            capabilities: Object.keys(this.claudeCommands)
          }
        };
        
      case 'CLAUDE_HELP':
        return {
          success: true,
          message: '📚 Comandos disponibles para Claude:',
          data: this.claudeCommands
        };
        
      case 'CLAUDE_EXECUTE':
        if (params.code) {
          return await this.executeCode(params.code, params.language || 'javascript');
        }
        return {
          success: false,
          message: '⚠️ Necesitas proporcionar código para ejecutar'
        };
        
      case 'CLAUDE_ANALYZE':
        return {
          success: true,
          message: '🔍 Análisis solicitado. Claude procesará tu solicitud.',
          action: 'analyze',
          params
        };
        
      default:
        return {
          success: true,
          message: `🤖 Comando Claude: ${cmd}`,
          action: 'forward_to_claude',
          originalCommand: command,
          params
        };
    }
  }

  /**
   * Ejecuta comandos del sistema de forma segura
   */
  async executeSystemCommand(command) {
    if (!this.isAuthenticated) {
      return {
        success: false,
        message: '🔒 Requiere autenticación'
      };
    }

    // Verificar si el comando es seguro
    const isAllowed = this.allowedCommands.some(allowed => 
      command.startsWith(allowed)
    );

    if (!isAllowed && !command.startsWith('CLAUDE_')) {
      return {
        success: false,
        message: `⚠️ Comando no permitido por seguridad: ${command}`
      };
    }

    try {
      // Si es un comando de Claude, procesarlo especialmente
      if (command.startsWith('CLAUDE_')) {
        return await this.processClaudeCommand(command);
      }

      // Ejecutar comando del sistema
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workDir,
        timeout: 30000 // 30 segundos timeout
      });

      this.log('command', `Ejecutado: ${command}`);

      return {
        success: true,
        command,
        output: stdout || stderr,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.log('error', `Error ejecutando: ${command} - ${error.message}`);
      
      return {
        success: false,
        command,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Ejecuta código de forma segura
   */
  async executeCode(code, language = 'javascript') {
    if (!this.isAuthenticated) {
      return {
        success: false,
        message: '🔒 Requiere autenticación'
      };
    }

    try {
      const tempFile = path.join(this.workDir, `temp_${Date.now()}.${language === 'python' ? 'py' : 'js'}`);
      
      // Escribir código a archivo temporal
      await fs.writeFile(tempFile, code);
      
      // Ejecutar según el lenguaje
      let command;
      if (language === 'python') {
        command = `python3 ${tempFile}`;
      } else {
        command = `node ${tempFile}`;
      }
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workDir,
        timeout: 10000 // 10 segundos timeout
      });
      
      // Limpiar archivo temporal
      await fs.unlink(tempFile);
      
      return {
        success: true,
        message: '✅ Código ejecutado',
        output: stdout || stderr,
        language
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Error ejecutando código',
        error: error.message
      };
    }
  }

  /**
   * Registra actividad
   */
  log(type, message) {
    const entry = {
      type,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.commandLog.push(entry);
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Guardar en archivo
    this.saveLog(entry);
  }

  /**
   * Guarda logs en archivo
   */
  async saveLog(entry) {
    const logFile = path.join(this.workDir, 'jarvi-bridge.log');
    const logLine = `${entry.timestamp} [${entry.type}] ${entry.message}\n`;
    
    try {
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('Error guardando log:', error);
    }
  }

  /**
   * Obtiene el historial de comandos
   */
  getHistory(limit = 50) {
    return this.commandLog.slice(-limit);
  }

  /**
   * Limpia el historial
   */
  clearHistory() {
    this.commandLog = [];
    return { success: true, message: 'Historial limpiado' };
  }
}

// Exportar instancia única
const jarviBridge = new JarviBridge();
export default jarviBridge;