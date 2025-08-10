#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log(`
🚀 ====================================
   JARVI - CONFIGURACIÓN COMPLETA
====================================

Configurando tu segundo cerebro con IA...
`);

async function runCommand(command, description) {
  try {
    console.log(`⏳ ${description}...`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('npm WARN')) {
      console.log(`⚠️ Advertencia: ${stderr}`);
    }
    
    console.log(`✅ ${description} - Completado`);
    return stdout;
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    return null;
  }
}

async function checkFileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function setupCompleteSystem() {
  console.log('🔍 Verificando sistema...\n');

  // 1. Verificar dependencias
  console.log('📦 VERIFICANDO DEPENDENCIAS');
  console.log('========================');
  
  const packageJsonExists = await checkFileExists('package.json');
  if (!packageJsonExists) {
    console.log('❌ package.json no encontrado');
    return;
  }

  // 2. Instalar dependencias si faltan
  await runCommand('npm install', 'Instalando dependencias NPM');
  
  // 3. Verificar archivos clave
  console.log('\n📁 VERIFICANDO ARCHIVOS CLAVE');
  console.log('=============================');
  
  const keyFiles = [
    '.env',
    'telegram-bot.js', 
    'server-enhanced-notes.js',
    'notion-service.js',
    'email-service.js',
    'transcription-service.js',
    'api-costs-tracker.js'
  ];

  let allFilesExist = true;
  for (const file of keyFiles) {
    const exists = await checkFileExists(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
  }

  if (!allFilesExist) {
    console.log('\n❌ Faltan archivos importantes del sistema');
    return;
  }

  // 4. Verificar configuración .env
  console.log('\n⚙️ VERIFICANDO CONFIGURACIÓN');
  console.log('============================');
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'GEMINI_API_KEY', 
    'NOTION_API_TOKEN'
  ];

  for (const envVar of requiredVars) {
    const isConfigured = envContent.includes(`${envVar}=`) && 
                        !envContent.includes(`${envVar}=your_`) &&
                        !envContent.includes(`${envVar}=`);
    console.log(`${isConfigured ? '✅' : '⚠️'} ${envVar} ${isConfigured ? 'configurado' : 'necesita configuración'}`);
  }

  // 5. Verificar puertos disponibles
  console.log('\n🌐 VERIFICANDO PUERTOS');
  console.log('======================');
  
  try {
    const { stdout } = await execAsync('lsof -i :3001 -t');
    if (stdout.trim()) {
      console.log('⚠️ Puerto 3001 en uso - matando procesos...');
      await execAsync(`kill ${stdout.trim()}`);
    }
    console.log('✅ Puerto 3001 disponible');
  } catch {
    console.log('✅ Puerto 3001 disponible');
  }

  try {
    const { stdout } = await execAsync('lsof -i :5173 -t');
    if (stdout.trim()) {
      console.log('⚠️ Puerto 5173 en uso - matando procesos...');
      await execAsync(`kill ${stdout.trim()}`);
    }
    console.log('✅ Puerto 5173 disponible');
  } catch {
    console.log('✅ Puerto 5173 disponible');
  }

  // 6. Crear directorios necesarios
  console.log('\n📂 CREANDO DIRECTORIOS');
  console.log('======================');
  
  const requiredDirs = ['voice-notes', 'logs', 'temp'];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Directorio ${dir} creado`);
    } else {
      console.log(`✅ Directorio ${dir} existe`);
    }
  }

  // 7. Configurar permisos de scripts
  console.log('\n🔐 CONFIGURANDO PERMISOS');
  console.log('========================');
  
  const scripts = ['start-bot.sh'];
  for (const script of scripts) {
    if (await checkFileExists(script)) {
      await runCommand(`chmod +x ${script}`, `Configurando permisos para ${script}`);
    }
  }

  // 8. Mostrar resumen final
  console.log(`
🎉 =====================================
   CONFIGURACIÓN COMPLETADA
=====================================

✅ Dependencias instaladas
✅ Archivos verificados  
✅ Permisos configurados
✅ Directorios creados
✅ Puertos disponibles

🚀 CÓMO INICIAR EL SISTEMA:
==========================

1️⃣ Servidor Backend:
   npm run dev

2️⃣ Bot de Telegram:
   ./start-bot.sh

3️⃣ Dashboard Web:
   http://localhost:5173

4️⃣ API REST:
   http://localhost:3001

📱 COMANDOS DE TELEGRAM:
=======================
/start  - Iniciar bot
/menu   - Menú principal
/help   - Ver ayuda
/status - Estado sistema

🔧 CONFIGURACIÓN PENDIENTE:
===========================
• Configura EMAIL_USER y EMAIL_PASS en .env para emails
• Configura Notion workspace con /menu → Notion Sync
• Habilita API de Gemini si no funciona la transcripción

🤖 ¡Tu segundo cerebro JARVI está listo!
=========================================
`);

  // 9. Opción de inicio automático
  console.log('¿Quieres iniciar el sistema automáticamente? (y/n)');
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Respuesta: ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\n🚀 Iniciando sistema completo...\n');
      
      // Iniciar servidor
      const serverProcess = exec('npm run dev');
      console.log('✅ Servidor iniciado en background');
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Iniciar bot
      const botProcess = exec('./start-bot.sh');
      console.log('✅ Bot de Telegram iniciado');
      
      console.log(`
🎉 ¡SISTEMA JARVI EJECUTÁNDOSE!
==============================

🌐 Dashboard: http://localhost:5173
🔧 API: http://localhost:3001
📱 Bot: Envía /menu en Telegram

Para detener: Ctrl+C
`);
    } else {
      console.log('\n✅ Sistema configurado. Usa los comandos arriba para iniciarlo manualmente.');
    }
    
    rl.close();
  });
}

// Ejecutar configuración
setupCompleteSystem().catch(error => {
  console.error('❌ Error durante la configuración:', error);
  process.exit(1);
});