import notionService from './notion-service.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function setupNotionWorkspace() {
  console.log('🚀 Configurando workspace JARVI en Notion...\n');
  
  try {
    // Configurar workspace completo
    const result = await notionService.setupCompleteWorkspace();
    
    console.log('\n📋 Información del workspace creado:');
    console.log('=====================================');
    console.log(`🏠 Página principal JARVI: ${result.jarviPageId}`);
    console.log(`🎙️ Base de datos Notas de Voz: ${result.databases.voiceNotes}`);
    console.log(`⏰ Base de datos Recordatorios: ${result.databases.reminders}`);
    console.log(`✅ Base de datos Tareas: ${result.databases.todos}`);
    console.log(`👥 Base de datos Reuniones: ${result.databases.meetings}`);
    console.log(`🔖 Base de datos Intereses: ${result.databases.interests}`);

    // Actualizar el archivo .env con los IDs de las bases de datos
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(
      /NOTION_VOICE_NOTES_DB_ID=.*/,
      `NOTION_VOICE_NOTES_DB_ID=${result.databases.voiceNotes}`
    );
    
    envContent = envContent.replace(
      /NOTION_REMINDERS_DB_ID=.*/,
      `NOTION_REMINDERS_DB_ID=${result.databases.reminders}`
    );
    
    envContent = envContent.replace(
      /NOTION_TODOS_DB_ID=.*/,
      `NOTION_TODOS_DB_ID=${result.databases.todos}`
    );
    
    envContent = envContent.replace(
      /NOTION_MEETINGS_DB_ID=.*/,
      `NOTION_MEETINGS_DB_ID=${result.databases.meetings}`
    );
    
    envContent = envContent.replace(
      /NOTION_INTERESTS_DB_ID=.*/,
      `NOTION_INTERESTS_DB_ID=${result.databases.interests}`
    );
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Archivo .env actualizado con los IDs de las bases de datos');
    
    console.log('\n🎉 ¡Workspace JARVI configurado exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Ve a Notion y revisa tu nuevo workspace JARVI');
    console.log('2. Las bases de datos están listas para recibir datos desde Telegram');
    console.log('3. Usa /menu en Telegram y selecciona "Notion Sync" para sincronizar');
    
  } catch (error) {
    console.error('❌ Error configurando workspace:', error);
    
    if (error.code === 'object_not_found') {
      console.log('\n🔧 Solución sugerida:');
      console.log('1. Verifica que tu token de Notion tenga los permisos correctos');
      console.log('2. Asegúrate de haber compartido una página padre con la integración');
      console.log('3. Configura NOTION_ROOT_PAGE_ID en el .env si usas una página específica');
    }
  }
}

// Ejecutar configuración
setupNotionWorkspace();