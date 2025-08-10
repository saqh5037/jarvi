import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

class NotionService {
  constructor() {
    this.notion = new Client({
      auth: process.env.NOTION_API_TOKEN,
    });
    
    // IDs de las bases de datos (se configuran después de crear las páginas)
    this.databases = {
      voiceNotes: process.env.NOTION_VOICE_NOTES_DB_ID,
      reminders: process.env.NOTION_REMINDERS_DB_ID,
      todos: process.env.NOTION_TODOS_DB_ID,
      meetings: process.env.NOTION_MEETINGS_DB_ID,
      interests: process.env.NOTION_INTERESTS_DB_ID
    };
  }

  // Crear el workspace principal de JARVI
  async createJarviWorkspace() {
    try {
      // Crear página principal de JARVI
      const jarviPage = await this.notion.pages.create({
        parent: {
          type: "page_id",
          page_id: process.env.NOTION_PARENT_PAGE_ID || process.env.NOTION_ROOT_PAGE_ID
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: "🤖 JARVI - Mi Segundo Cerebro"
                }
              }
            ]
          }
        },
        children: [
          {
            object: "block",
            type: "heading_1",
            heading_1: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "🚀 JARVI - Centro de Comando Inteligente"
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "Bienvenido a tu segundo cerebro potenciado por IA. Aquí se organizan automáticamente todas tus notas de voz, recordatorios, tareas, reuniones e intereses desde Telegram."
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "divider",
            divider: {}
          }
        ]
      });

      console.log("✅ Página principal de JARVI creada:", jarviPage.id);
      return jarviPage;
    } catch (error) {
      console.error("Error creando workspace JARVI:", error);
      throw error;
    }
  }

  // Crear base de datos para Notas de Voz
  async createVoiceNotesDatabase(parentPageId) {
    try {
      const database = await this.notion.databases.create({
        parent: {
          type: "page_id",
          page_id: parentPageId
        },
        title: [
          {
            type: "text",
            text: {
              content: "🎙️ Notas de Voz"
            }
          }
        ],
        properties: {
          "Título": {
            title: {}
          },
          "Categoría": {
            select: {
              options: [
                { name: "Idea Rápida", color: "blue" },
                { name: "Recordatorio", color: "yellow" },
                { name: "Trabajo - Dynamtek", color: "purple" },
                { name: "Trabajo - WBI", color: "green" },
                { name: "Proyectos", color: "orange" },
                { name: "Vida Personal", color: "pink" }
              ]
            }
          },
          "Transcripción": {
            rich_text: {}
          },
          "Duración (seg)": {
            number: {}
          },
          "Fecha": {
            date: {}
          },
          "Estado": {
            select: {
              options: [
                { name: "Nuevo", color: "blue" },
                { name: "Transcrito", color: "green" },
                { name: "Procesado", color: "purple" }
              ]
            }
          },
          "Archivo": {
            url: {}
          },
          "Tags": {
            multi_select: {
              options: []
            }
          }
        }
      });

      console.log("✅ Base de datos Notas de Voz creada:", database.id);
      return database;
    } catch (error) {
      console.error("Error creando BD Notas de Voz:", error);
      throw error;
    }
  }

  // Crear base de datos para Recordatorios
  async createRemindersDatabase(parentPageId) {
    try {
      const database = await this.notion.databases.create({
        parent: {
          type: "page_id",
          page_id: parentPageId
        },
        title: [
          {
            type: "text",
            text: {
              content: "⏰ Recordatorios"
            }
          }
        ],
        properties: {
          "Título": {
            title: {}
          },
          "Descripción": {
            rich_text: {}
          },
          "Prioridad": {
            select: {
              options: [
                { name: "Alta", color: "red" },
                { name: "Media", color: "yellow" },
                { name: "Baja", color: "green" }
              ]
            }
          },
          "Categoría": {
            select: {
              options: [
                { name: "Personal", color: "blue" },
                { name: "Trabajo", color: "purple" },
                { name: "Salud", color: "green" },
                { name: "Finanzas", color: "yellow" },
                { name: "Social", color: "pink" }
              ]
            }
          },
          "Fecha Creación": {
            date: {}
          },
          "Fecha Recordatorio": {
            date: {}
          },
          "Estado": {
            checkbox: {}
          },
          "Fuente": {
            select: {
              options: [
                { name: "Telegram", color: "blue" },
                { name: "Dashboard", color: "gray" },
                { name: "API", color: "green" }
              ]
            }
          }
        }
      });

      console.log("✅ Base de datos Recordatorios creada:", database.id);
      return database;
    } catch (error) {
      console.error("Error creando BD Recordatorios:", error);
      throw error;
    }
  }

  // Crear base de datos para Tareas (ToDo)
  async createTodosDatabase(parentPageId) {
    try {
      const database = await this.notion.databases.create({
        parent: {
          type: "page_id",
          page_id: parentPageId
        },
        title: [
          {
            type: "text",
            text: {
              content: "✅ Tareas (ToDo)"
            }
          }
        ],
        properties: {
          "Tarea": {
            title: {}
          },
          "Descripción": {
            rich_text: {}
          },
          "Estado": {
            select: {
              options: [
                { name: "Pendiente", color: "yellow" },
                { name: "En Progreso", color: "blue" },
                { name: "Completada", color: "green" },
                { name: "Cancelada", color: "red" }
              ]
            }
          },
          "Prioridad": {
            select: {
              options: [
                { name: "Alta", color: "red" },
                { name: "Media", color: "yellow" },
                { name: "Baja", color: "green" }
              ]
            }
          },
          "Categoría": {
            select: {
              options: [
                { name: "Trabajo", color: "blue" },
                { name: "Personal", color: "green" },
                { name: "Salud", color: "red" },
                { name: "Finanzas", color: "yellow" },
                { name: "Aprendizaje", color: "purple" }
              ]
            }
          },
          "Proyecto": {
            rich_text: {}
          },
          "Fecha Límite": {
            date: {}
          },
          "Fecha Creación": {
            date: {}
          },
          "Fecha Completada": {
            date: {}
          },
          "Completada": {
            checkbox: {}
          },
          "Tags": {
            multi_select: {
              options: []
            }
          }
        }
      });

      console.log("✅ Base de datos Tareas creada:", database.id);
      return database;
    } catch (error) {
      console.error("Error creando BD Tareas:", error);
      throw error;
    }
  }

  // Crear base de datos para Reuniones
  async createMeetingsDatabase(parentPageId) {
    try {
      const database = await this.notion.databases.create({
        parent: {
          type: "page_id",
          page_id: parentPageId
        },
        title: [
          {
            type: "text",
            text: {
              content: "👥 Reuniones"
            }
          }
        ],
        properties: {
          "Título": {
            title: {}
          },
          "Fecha": {
            date: {}
          },
          "Participantes": {
            multi_select: {
              options: []
            }
          },
          "Duración": {
            rich_text: {}
          },
          "Estado": {
            select: {
              options: [
                { name: "Subida", color: "blue" },
                { name: "Transcribiendo", color: "yellow" },
                { name: "Completada", color: "green" },
                { name: "Error", color: "red" }
              ]
            }
          },
          "Transcripción": {
            rich_text: {}
          },
          "Resumen": {
            rich_text: {}
          },
          "Puntos Clave": {
            rich_text: {}
          },
          "Acciones": {
            rich_text: {}
          },
          "Tags": {
            multi_select: {
              options: []
            }
          },
          "Archivo Audio": {
            url: {}
          },
          "Minuta Enviada": {
            checkbox: {}
          }
        }
      });

      console.log("✅ Base de datos Reuniones creada:", database.id);
      return database;
    } catch (error) {
      console.error("Error creando BD Reuniones:", error);
      throw error;
    }
  }

  // Crear base de datos para Intereses
  async createInterestsDatabase(parentPageId) {
    try {
      const database = await this.notion.databases.create({
        parent: {
          type: "page_id",
          page_id: parentPageId
        },
        title: [
          {
            type: "text",
            text: {
              content: "🔖 Intereses"
            }
          }
        ],
        properties: {
          "Título": {
            title: {}
          },
          "URL": {
            url: {}
          },
          "Descripción": {
            rich_text: {}
          },
          "Tipo": {
            select: {
              options: [
                { name: "Artículo", color: "blue" },
                { name: "Video", color: "red" },
                { name: "Curso", color: "green" },
                { name: "Podcast", color: "purple" },
                { name: "Herramienta", color: "orange" },
                { name: "Investigación", color: "yellow" },
                { name: "Imagen", color: "pink" }
              ]
            }
          },
          "Categoría": {
            select: {
              options: [
                { name: "Tecnología", color: "blue" },
                { name: "Aprendizaje", color: "green" },
                { name: "Diseño", color: "purple" },
                { name: "Negocios", color: "orange" },
                { name: "Ciencia", color: "yellow" },
                { name: "Salud", color: "red" },
                { name: "Entretenimiento", color: "pink" }
              ]
            }
          },
          "Prioridad": {
            select: {
              options: [
                { name: "Alta", color: "red" },
                { name: "Media", color: "yellow" },
                { name: "Baja", color: "green" }
              ]
            }
          },
          "Estado": {
            select: {
              options: [
                { name: "Sin leer", color: "gray" },
                { name: "Leído", color: "green" },
                { name: "En progreso", color: "yellow" }
              ]
            }
          },
          "Rating": {
            select: {
              options: [
                { name: "⭐", color: "yellow" },
                { name: "⭐⭐", color: "yellow" },
                { name: "⭐⭐⭐", color: "yellow" },
                { name: "⭐⭐⭐⭐", color: "yellow" },
                { name: "⭐⭐⭐⭐⭐", color: "yellow" }
              ]
            }
          },
          "Fecha Agregado": {
            date: {}
          },
          "Fecha Leído": {
            date: {}
          },
          "Tiempo Lectura (min)": {
            number: {}
          },
          "Favorito": {
            checkbox: {}
          },
          "Notas": {
            rich_text: {}
          },
          "Tags": {
            multi_select: {
              options: []
            }
          },
          "Fuente": {
            rich_text: {}
          }
        }
      });

      console.log("✅ Base de datos Intereses creada:", database.id);
      return database;
    } catch (error) {
      console.error("Error creando BD Intereses:", error);
      throw error;
    }
  }

  // Configurar el workspace completo
  async setupCompleteWorkspace() {
    try {
      console.log("🚀 Configurando workspace completo de JARVI en Notion...");
      
      // 1. Crear página principal
      const jarviPage = await this.createJarviWorkspace();
      
      // 2. Crear todas las bases de datos
      const voiceNotesDB = await this.createVoiceNotesDatabase(jarviPage.id);
      const remindersDB = await this.createRemindersDatabase(jarviPage.id);
      const todosDB = await this.createTodosDatabase(jarviPage.id);
      const meetingsDB = await this.createMeetingsDatabase(jarviPage.id);
      const interestsDB = await this.createInterestsDatabase(jarviPage.id);

      // Actualizar la página principal con enlaces a las bases de datos
      await this.notion.blocks.children.append({
        block_id: jarviPage.id,
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "📋 Módulos Disponibles"
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "child_database",
            child_database: {
              title: "🎙️ Notas de Voz"
            }
          },
          {
            object: "block",
            type: "child_database",
            child_database: {
              title: "⏰ Recordatorios"
            }
          },
          {
            object: "block",
            type: "child_database",
            child_database: {
              title: "✅ Tareas"
            }
          },
          {
            object: "block",
            type: "child_database",
            child_database: {
              title: "👥 Reuniones"
            }
          },
          {
            object: "block",
            type: "child_database",
            child_database: {
              title: "🔖 Intereses"
            }
          }
        ]
      });

      console.log("🎉 Workspace JARVI configurado exitosamente!");
      
      return {
        jarviPageId: jarviPage.id,
        databases: {
          voiceNotes: voiceNotesDB.id,
          reminders: remindersDB.id,
          todos: todosDB.id,
          meetings: meetingsDB.id,
          interests: interestsDB.id
        }
      };

    } catch (error) {
      console.error("❌ Error configurando workspace:", error);
      throw error;
    }
  }

  // Métodos para sincronizar datos (agregar registros)
  async addVoiceNoteToNotion(voiceNote) {
    try {
      const page = await this.notion.pages.create({
        parent: {
          database_id: this.databases.voiceNotes
        },
        properties: {
          "Título": {
            title: [
              {
                text: {
                  content: `Nota ${new Date(voiceNote.timestamp).toLocaleDateString('es-ES')}`
                }
              }
            ]
          },
          "Categoría": {
            select: {
              name: this.mapVoiceNoteCategory(voiceNote.category)
            }
          },
          "Transcripción": {
            rich_text: [
              {
                text: {
                  content: voiceNote.transcription || 'Sin transcripción'
                }
              }
            ]
          },
          "Duración (seg)": {
            number: voiceNote.duration || 0
          },
          "Fecha": {
            date: {
              start: voiceNote.timestamp
            }
          },
          "Estado": {
            select: {
              name: voiceNote.transcription ? "Transcrito" : "Nuevo"
            }
          }
        }
      });

      console.log("✅ Nota de voz agregada a Notion:", page.id);
      return page;
    } catch (error) {
      console.error("Error agregando nota de voz a Notion:", error);
      throw error;
    }
  }

  mapVoiceNoteCategory(category) {
    const categoryMap = {
      'idea_rapida': 'Idea Rápida',
      'recordatorio': 'Recordatorio',
      'trabajo_dynamtek': 'Trabajo - Dynamtek',
      'trabajo_wbi': 'Trabajo - WBI',
      'proyectos': 'Proyectos',
      'vida_personal': 'Vida Personal'
    };
    
    return categoryMap[category] || 'Idea Rápida';
  }

  // Agregar más métodos según necesidad...
}

export default new NotionService();