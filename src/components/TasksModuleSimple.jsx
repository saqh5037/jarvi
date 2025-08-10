import React from 'react';

const TasksModuleSimple = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Módulo de Tareas
        </h1>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            Este es el módulo de tareas funcionando correctamente.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Tarea 1</h3>
              <p className="text-gray-600 text-sm">Esta es una tarea de ejemplo</p>
              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Completada
              </span>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Tarea 2</h3>
              <p className="text-gray-600 text-sm">Otra tarea de ejemplo</p>
              <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                Pendiente
              </span>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Tarea 3</h3>
              <p className="text-gray-600 text-sm">Una tercera tarea</p>
              <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                En progreso
              </span>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Agregar Nueva Tarea
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksModuleSimple;