import axios from 'axios';
import chalk from 'chalk';
import readline from 'readline';

const TASKS_SERVER = 'http://localhost:3003';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colores
const success = chalk.green;
const error = chalk.red;
const info = chalk.blue;
const warning = chalk.yellow;
const highlight = chalk.cyan.bold;

console.log(chalk.cyan.bold(`
╔════════════════════════════════════════════════╗
║         JARVI TASKS TEST CLIENT                ║
╠════════════════════════════════════════════════╣
║  Sistema de prueba para tareas inteligentes   ║
╚════════════════════════════════════════════════╝
`));

async function testCreateTask(text) {
  try {
    console.log(info('\n📝 Creando tarea desde texto natural...'));
    console.log(info(`Texto: "${text}"`));
    
    const response = await axios.post(`${TASKS_SERVER}/api/tasks/natural`, {
      text,
      source: 'test-cli'
    });
    
    const task = response.data.task;
    
    console.log(success('\n✅ Tarea creada exitosamente:'));
    console.log(highlight('─'.repeat(50)));
    console.log(`📌 Título: ${task.title}`);
    console.log(`📝 Descripción: ${task.description || 'Sin descripción'}`);
    console.log(`🏷️ Categoría: ${task.category}`);
    console.log(`⚡ Prioridad: ${task.priority}`);
    console.log(`📅 Fecha límite: ${task.dueDate ? new Date(task.dueDate).toLocaleString('es-ES') : 'Sin fecha'}`);
    console.log(`🔖 Tags: ${task.tags?.join(', ') || 'Sin tags'}`);
    console.log(`📍 Ubicación: ${task.location || 'Sin ubicación'}`);
    console.log(`🆔 ID: ${task.id}`);
    console.log(highlight('─'.repeat(50)));
    
    return task;
  } catch (err) {
    console.error(error('❌ Error creando tarea:'), err.message);
  }
}

async function listTasks(filter = {}) {
  try {
    console.log(info('\n📋 Obteniendo lista de tareas...'));
    
    const params = new URLSearchParams(filter);
    const response = await axios.get(`${TASKS_SERVER}/api/tasks?${params}`);
    
    const tasks = response.data.tasks;
    
    if (tasks.length === 0) {
      console.log(warning('No hay tareas pendientes'));
      return;
    }
    
    console.log(success(`\n📌 ${tasks.length} tareas encontradas:\n`));
    
    tasks.forEach((task, index) => {
      const priorityEmoji = {
        urgent: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      }[task.priority] || '⚪';
      
      const statusEmoji = {
        completed: '✅',
        in_progress: '🔄',
        pending: '⏳',
        cancelled: '❌'
      }[task.status] || '❓';
      
      console.log(`${index + 1}. ${statusEmoji} ${priorityEmoji} ${task.title}`);
      
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const isOverdue = dueDate < now && task.status !== 'completed';
        
        if (isOverdue) {
          console.log(error(`   ⚠️ VENCIDA: ${dueDate.toLocaleString('es-ES')}`));
        } else {
          console.log(`   📅 Vence: ${dueDate.toLocaleString('es-ES')}`);
        }
      }
      
      if (task.tags && task.tags.length > 0) {
        console.log(`   🔖 Tags: ${task.tags.join(', ')}`);
      }
    });
  } catch (err) {
    console.error(error('❌ Error obteniendo tareas:'), err.message);
  }
}

async function completeTask(taskId) {
  try {
    console.log(info(`\n✅ Marcando tarea ${taskId} como completada...`));
    
    const response = await axios.post(`${TASKS_SERVER}/api/tasks/${taskId}/complete`);
    
    if (response.data.success) {
      console.log(success('✅ Tarea completada exitosamente'));
    }
  } catch (err) {
    console.error(error('❌ Error completando tarea:'), err.message);
  }
}

async function getStats() {
  try {
    console.log(info('\n📊 Obteniendo estadísticas...'));
    
    const response = await axios.get(`${TASKS_SERVER}/api/tasks/stats`);
    const stats = response.data.stats;
    
    console.log(highlight('\n═══════════════════════════════════════════'));
    console.log(highlight('           ESTADÍSTICAS DE TAREAS           '));
    console.log(highlight('═══════════════════════════════════════════'));
    
    console.log(`\n📈 Resumen General:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   ⏳ Pendientes: ${stats.pending}`);
    console.log(`   🔄 En progreso: ${stats.inProgress}`);
    console.log(`   ✅ Completadas: ${stats.completed}`);
    console.log(`   ⚠️ Vencidas: ${stats.overdue}`);
    console.log(`   📅 Vencen hoy: ${stats.dueToday}`);
    console.log(`   📊 Tasa de completación: ${stats.completionRate}%`);
    
    console.log(`\n⚡ Por Prioridad:`);
    console.log(`   🔴 Urgente: ${stats.byPriority.urgent}`);
    console.log(`   🟠 Alta: ${stats.byPriority.high}`);
    console.log(`   🟡 Media: ${stats.byPriority.medium}`);
    console.log(`   🟢 Baja: ${stats.byPriority.low}`);
    
    console.log(`\n🏷️ Por Categoría:`);
    Object.entries(stats.byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
    
    console.log(highlight('═══════════════════════════════════════════'));
  } catch (err) {
    console.error(error('❌ Error obteniendo estadísticas:'), err.message);
  }
}

// Menú interactivo
async function showMenu() {
  console.log(chalk.yellow('\n📋 MENÚ DE OPCIONES:'));
  console.log('1. Crear tarea desde texto');
  console.log('2. Ver todas las tareas');
  console.log('3. Ver tareas pendientes');
  console.log('4. Ver tareas vencidas');
  console.log('5. Completar una tarea');
  console.log('6. Ver estadísticas');
  console.log('7. Pruebas automáticas');
  console.log('0. Salir');
  
  rl.question('\nElige una opción: ', async (option) => {
    switch(option) {
      case '1':
        rl.question('Escribe la tarea (ej: "Necesito ir al mercado a comprar huevos"): ', async (text) => {
          await testCreateTask(text);
          showMenu();
        });
        break;
        
      case '2':
        await listTasks();
        showMenu();
        break;
        
      case '3':
        await listTasks({ status: 'pending' });
        showMenu();
        break;
        
      case '4':
        // Las vencidas se muestran en la lista normal con indicador
        await listTasks({ status: 'pending' });
        showMenu();
        break;
        
      case '5':
        await listTasks({ status: 'pending' });
        rl.question('\nIngresa el ID de la tarea a completar: ', async (taskId) => {
          await completeTask(taskId);
          showMenu();
        });
        break;
        
      case '6':
        await getStats();
        showMenu();
        break;
        
      case '7':
        await runAutomaticTests();
        showMenu();
        break;
        
      case '0':
        console.log(success('\n👋 ¡Hasta luego!'));
        rl.close();
        process.exit(0);
        break;
        
      default:
        console.log(error('Opción no válida'));
        showMenu();
    }
  });
}

// Pruebas automáticas
async function runAutomaticTests() {
  console.log(highlight('\n🚀 EJECUTANDO PRUEBAS AUTOMÁTICAS...\n'));
  
  const testTexts = [
    'Necesito ir al mercado a comprar huevos',
    'Urgente: Llamar al doctor mañana a las 3pm',
    'Recordar pagar la factura de luz antes del viernes',
    'Comprar regalo de cumpleaños para María',
    'Reunión con el equipo de desarrollo el lunes a las 10am',
    'Hacer ejercicio hoy en el gimnasio',
    'Estudiar para el examen de matemáticas',
    'Enviar reporte mensual al jefe',
    'Revisar y responder emails importantes',
    'Planificar las vacaciones de verano'
  ];
  
  console.log(info(`📝 Creando ${testTexts.length} tareas de prueba...\n`));
  
  for (const text of testTexts) {
    await testCreateTask(text);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo entre tareas
  }
  
  console.log(success('\n✅ Pruebas completadas'));
  
  // Mostrar estadísticas
  await getStats();
}

// Iniciar aplicación
console.log(info('Conectando con el servidor de tareas...'));

// Verificar conexión
axios.get(`${TASKS_SERVER}/api/tasks/stats`)
  .then(() => {
    console.log(success('✅ Conectado al servidor de tareas\n'));
    showMenu();
  })
  .catch(() => {
    console.error(error('❌ No se pudo conectar al servidor de tareas'));
    console.log(warning('Asegúrate de que el servidor esté ejecutándose en el puerto 3003'));
    process.exit(1);
  });