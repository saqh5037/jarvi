import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Servicio de Archivo de Tareas con SQLite
 * Sistema híbrido: tareas activas en JSON, archivadas en SQLite
 */
class ArchiveService {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'data', 'archives.db');
    this.backupDir = path.join(__dirname, '..', 'data', 'archives-backup');
    this.db = null;
    this.initialized = false;
  }

  /**
   * Inicializar base de datos y crear tablas si no existen
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Asegurar que existe el directorio
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });

      // Abrir conexión a SQLite
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Crear tabla de tareas archivadas
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS archived_tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          project TEXT,
          priority TEXT,
          status TEXT,
          due_date TEXT,
          reminder TEXT,
          recurring TEXT,
          tags TEXT,
          attachments TEXT,
          notes TEXT,
          created_at TEXT,
          updated_at TEXT,
          completed_at TEXT,
          archived_at TEXT NOT NULL,
          created_by TEXT,
          completed_by TEXT,
          search_text TEXT,
          metadata TEXT
        )
      `);

      // Crear índices para búsquedas rápidas
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_project ON archived_tasks(project);
        CREATE INDEX IF NOT EXISTS idx_category ON archived_tasks(category);
        CREATE INDEX IF NOT EXISTS idx_completed_at ON archived_tasks(completed_at);
        CREATE INDEX IF NOT EXISTS idx_archived_at ON archived_tasks(archived_at);
        CREATE INDEX IF NOT EXISTS idx_priority ON archived_tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_created_by ON archived_tasks(created_by);
      `);

      // Crear tabla virtual para búsqueda de texto completo
      await this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS archived_tasks_fts USING fts5(
          id UNINDEXED,
          title,
          description,
          tags,
          notes,
          search_text,
          content=archived_tasks
        );
      `);

      // Trigger para mantener sincronizada la tabla FTS
      await this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS archived_tasks_ai AFTER INSERT ON archived_tasks BEGIN
          INSERT INTO archived_tasks_fts(id, title, description, tags, notes, search_text)
          VALUES (new.id, new.title, new.description, new.tags, new.notes, new.search_text);
        END;
      `);

      this.initialized = true;
      console.log('✅ Servicio de archivo SQLite inicializado');
    } catch (error) {
      console.error('❌ Error inicializando servicio de archivo:', error);
      throw error;
    }
  }

  /**
   * Archivar una tarea completada
   */
  async archiveTask(task) {
    await this.initialize();

    try {
      // Generar texto de búsqueda
      const searchText = this.generateSearchText(task);
      
      // Preparar datos para inserción
      const archivedTask = {
        ...task,
        archived_at: new Date().toISOString(),
        tags: JSON.stringify(task.tags || []),
        attachments: JSON.stringify(task.attachments || []),
        notes: JSON.stringify(task.notes || []),
        search_text: searchText,
        metadata: JSON.stringify({
          original_status: task.status,
          archive_reason: 'completed',
          archive_version: '1.0'
        })
      };

      // Insertar en SQLite
      const stmt = await this.db.prepare(`
        INSERT INTO archived_tasks (
          id, title, description, category, project, priority, status,
          due_date, reminder, recurring, tags, attachments, notes,
          created_at, updated_at, completed_at, archived_at,
          created_by, completed_by, search_text, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      await stmt.run(
        archivedTask.id,
        archivedTask.title,
        archivedTask.description,
        archivedTask.category,
        archivedTask.project,
        archivedTask.priority,
        archivedTask.status,
        archivedTask.dueDate,
        archivedTask.reminder,
        archivedTask.recurring,
        archivedTask.tags,
        archivedTask.attachments,
        archivedTask.notes,
        archivedTask.createdAt,
        archivedTask.updatedAt,
        archivedTask.completedAt,
        archivedTask.archived_at,
        archivedTask.createdBy,
        archivedTask.completedBy,
        archivedTask.search_text,
        archivedTask.metadata
      );

      await stmt.finalize();

      // Crear backup mensual en JSON
      await this.createMonthlyBackup(archivedTask);

      console.log(`📦 Tarea archivada: ${task.title}`);
      return { success: true, task: archivedTask };
    } catch (error) {
      console.error('❌ Error archivando tarea:', error);
      throw error;
    }
  }

  /**
   * Buscar tareas archivadas
   */
  async searchArchived(options = {}) {
    await this.initialize();

    try {
      let query = 'SELECT * FROM archived_tasks WHERE 1=1';
      const params = [];

      // Búsqueda por texto
      if (options.search) {
        query = `
          SELECT a.* FROM archived_tasks a
          JOIN archived_tasks_fts f ON a.id = f.id
          WHERE archived_tasks_fts MATCH ?
        `;
        params.push(options.search);
      }

      // Filtros adicionales
      if (options.project) {
        query += ' AND project = ?';
        params.push(options.project);
      }

      if (options.category) {
        query += ' AND category = ?';
        params.push(options.category);
      }

      if (options.priority) {
        query += ' AND priority = ?';
        params.push(options.priority);
      }

      if (options.startDate) {
        query += ' AND completed_at >= ?';
        params.push(options.startDate);
      }

      if (options.endDate) {
        query += ' AND completed_at <= ?';
        params.push(options.endDate);
      }

      // Ordenamiento
      const orderBy = options.orderBy || 'archived_at';
      const order = options.order || 'DESC';
      query += ` ORDER BY ${orderBy} ${order}`;

      // Paginación
      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
        
        if (options.offset) {
          query += ' OFFSET ?';
          params.push(options.offset);
        }
      }

      const tasks = await this.db.all(query, params);

      // Parsear campos JSON
      return tasks.map(task => ({
        ...task,
        tags: JSON.parse(task.tags || '[]'),
        attachments: JSON.parse(task.attachments || '[]'),
        notes: JSON.parse(task.notes || '[]'),
        metadata: JSON.parse(task.metadata || '{}')
      }));
    } catch (error) {
      console.error('❌ Error buscando tareas archivadas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del archivo
   */
  async getStatistics(options = {}) {
    await this.initialize();

    try {
      const stats = {};

      // Total de tareas archivadas
      const totalResult = await this.db.get('SELECT COUNT(*) as total FROM archived_tasks');
      stats.total = totalResult.total;

      // Por categoría
      stats.byCategory = await this.db.all(`
        SELECT category, COUNT(*) as count 
        FROM archived_tasks 
        GROUP BY category
      `);

      // Por proyecto
      stats.byProject = await this.db.all(`
        SELECT project, COUNT(*) as count 
        FROM archived_tasks 
        GROUP BY project
        ORDER BY count DESC
      `);

      // Por prioridad
      stats.byPriority = await this.db.all(`
        SELECT priority, COUNT(*) as count 
        FROM archived_tasks 
        GROUP BY priority
      `);

      // Por mes
      stats.byMonth = await this.db.all(`
        SELECT 
          strftime('%Y-%m', completed_at) as month,
          COUNT(*) as count
        FROM archived_tasks
        WHERE completed_at IS NOT NULL
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `);

      // Productividad por usuario
      stats.byUser = await this.db.all(`
        SELECT created_by, COUNT(*) as count 
        FROM archived_tasks 
        GROUP BY created_by
        ORDER BY count DESC
      `);

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Desarchivar una tarea (restaurarla a activa)
   */
  async unarchiveTask(taskId) {
    await this.initialize();

    try {
      // Obtener la tarea archivada
      const task = await this.db.get('SELECT * FROM archived_tasks WHERE id = ?', taskId);
      
      if (!task) {
        throw new Error('Tarea no encontrada en archivo');
      }

      // Eliminar de archivo
      await this.db.run('DELETE FROM archived_tasks WHERE id = ?', taskId);
      await this.db.run('DELETE FROM archived_tasks_fts WHERE id = ?', taskId);

      // Parsear campos JSON
      task.tags = JSON.parse(task.tags || '[]');
      task.attachments = JSON.parse(task.attachments || '[]');
      task.notes = JSON.parse(task.notes || '[]');

      // Cambiar estado a pending si estaba completada
      if (task.status === 'completed') {
        task.status = 'pending';
        task.completedAt = null;
      }

      console.log(`📤 Tarea desarchivada: ${task.title}`);
      return { success: true, task };
    } catch (error) {
      console.error('❌ Error desarchivando tarea:', error);
      throw error;
    }
  }

  /**
   * Crear backup mensual en JSON
   */
  async createMonthlyBackup(task) {
    try {
      const date = new Date();
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const backupFile = path.join(this.backupDir, `${yearMonth}.json`);

      let backup = [];
      try {
        const existing = await fs.readFile(backupFile, 'utf8');
        backup = JSON.parse(existing);
      } catch (error) {
        // Archivo no existe, crear nuevo
      }

      backup.push(task);
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
    } catch (error) {
      console.error('⚠️ Error creando backup:', error);
      // No fallar si el backup falla
    }
  }

  /**
   * Generar texto de búsqueda optimizado
   */
  generateSearchText(task) {
    const parts = [
      task.title,
      task.description,
      task.category,
      task.project,
      task.priority,
      ...(task.tags || []),
      ...(task.notes || []).map(note => note.content || note)
    ];

    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  /**
   * Cerrar conexión a base de datos
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.initialized = false;
    }
  }
}

// Exportar singleton
const archiveService = new ArchiveService();
export default archiveService;