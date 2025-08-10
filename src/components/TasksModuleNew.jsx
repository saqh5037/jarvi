import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Plus, Play, Pause, Volume2, Mic } from 'lucide-react';

const TasksModuleNew = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Cargar tareas desde el servidor
  const loadTasks = async () => {
    try {
      console.log('Cargando tareas...');
      const response = await fetch('http://localhost:3003/api/tasks');
      const data = await response.json();
      console.log('Tareas recibidas:', data);
      
      if (data.success) {
        setTasks(data.tasks || []);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setIsLoading(false);
      // Mostrar datos dummy si falla
      setTasks([
        {
          id: 1,
          title: 'Tarea de ejemplo',
          description: 'Esta es una tarea de ejemplo',
          status: 'pending',
          priority: 'medium',
          category: 'personal'
        }
      ]);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setStats({
        total: 0,
        pending: 0,
        completed: 0,
        overdue: 0,
        dueToday: 0
      });
    }
  };

  useEffect(() => {
    console.log('TasksModuleNew montado');
    loadTasks();
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Cargando Tareas...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Centro de Tareas
              </h1>
              <p className="text-gray-600">
                Gestiona tus tareas y recordatorios
              </p>
            </div>
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nueva Tarea
            </button>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                <div className="text-sm text-purple-700">Total</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-yellow-700">Pendientes</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-green-700">Completadas</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-sm text-red-700">Vencidas</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.dueToday}</div>
                <div className="text-sm text-blue-700">Para Hoy</div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Tareas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {task.title}
                    </h3>
                    {task.description && task.description !== task.title && (
                      <p className="text-gray-600 text-sm">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Audio si existe */}
                {task.audioFile && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg mb-4">
                    <button className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                      <Play className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-gray-700">Nota de voz</span>
                        {task.audioDuration && (
                          <span className="text-xs text-gray-500">
                            ({Math.floor(task.audioDuration / 60)}:{(task.audioDuration % 60).toString().padStart(2, '0')})
                          </span>
                        )}
                      </div>
                    </div>
                    {task.createdBy === 'telegram-voice' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Mic className="w-3 h-3" />
                        Telegram
                      </span>
                    )}
                  </div>
                )}

                {/* Meta información */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="capitalize">{task.category}</span>
                  <span className="capitalize">{task.priority}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay tareas disponibles</p>
              <p className="text-gray-500 mt-2">¡Crea tu primera tarea!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksModuleNew;