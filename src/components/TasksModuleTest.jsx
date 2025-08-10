import React, { useState, useEffect } from 'react';

const TasksModuleTest = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Test básico de carga
    setTimeout(() => {
      setTasks([
        { id: 1, title: 'Tarea de prueba', description: 'Esta es una tarea de prueba' }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  if (isLoading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cargando Tareas...</h1>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-100 min-h-screen fixed inset-0 overflow-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Módulo de Tareas - Prueba</h1>
      
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Lista de Tareas</h2>
        {tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="p-3 border rounded bg-gray-50">
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-gray-600 text-sm">{task.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No hay tareas disponibles</p>
        )}
      </div>
    </div>
  );
};

export default TasksModuleTest;