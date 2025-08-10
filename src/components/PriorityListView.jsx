import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag, Edit2, Trash2, Link, Hash, TrendingUp,
  AlertCircle, CheckCircle, Activity
} from 'lucide-react';

const PriorityListView = ({
  priorities,
  availableIcons,
  startEditingPriority,
  setIsPriorityFormExpanded,
  deleteItem
}) => {
  // Ordenar prioridades por nivel (1 = más alta prioridad)
  const sortedPriorities = [...priorities].sort((a, b) => (a.level || 999) - (b.level || 999));

  const getPriorityIntensity = (level) => {
    if (level <= 2) return 'Crítica/Alta';
    if (level <= 4) return 'Media';
    if (level <= 7) return 'Baja';
    return 'Opcional';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Prioridades Existentes ({priorities.length})
        </h3>
      </div>
      
      <div className="p-6">
        {priorities.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Flag className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-gray-500">No hay prioridades aún</p>
            <p className="text-sm text-gray-400 mt-2">
              Crea tu primer nivel de prioridad usando el formulario de arriba
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-4">
              Mostrando {priorities.length} niveles de prioridad (ordenados por importancia)
            </div>
            <AnimatePresence>
              {sortedPriorities.map((priority, index) => {
                const PriorityIcon = availableIcons[priority.icon] || Flag;
                const intensity = getPriorityIntensity(priority.level);
                
                return (
                  <motion.div
                    key={priority.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Ícono de la prioridad */}
                        <div className={`p-3 bg-${priority.color}-100 rounded-xl`}>
                          <PriorityIcon className={`w-6 h-6 text-${priority.color}-600`} />
                        </div>
                        
                        <div className="flex-1">
                          {/* Info principal de la prioridad */}
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {priority.name}
                            </h3>
                            <span className="text-sm text-gray-500">•</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-6 h-6 rounded-full bg-${priority.color}-500 flex items-center justify-center`}>
                                <span className="text-white text-xs font-bold">{priority.level}</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                Nivel {priority.level}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <div className="flex items-center gap-1">
                              {priority.level <= 2 ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : priority.level <= 4 ? (
                                <Activity className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-sm text-gray-600">
                                {intensity}
                              </span>
                            </div>
                          </div>
                          
                          {/* Descripción */}
                          {priority.description && (
                            <p className="text-sm text-gray-600 mb-2">{priority.description}</p>
                          )}
                          
                          {/* Información adicional */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Hash className="w-4 h-4" />
                              <span className="text-xs">ID: {priority.id}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs">
                                {priority.level <= 3 ? 'Alta urgencia' : priority.level <= 6 ? 'Urgencia media' : 'Baja urgencia'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs">Activa</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            startEditingPriority(priority);
                            setIsPriorityFormExpanded(true);
                          }}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-white rounded-lg transition-all"
                          title="Editar prioridad"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('priorities', priority.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                          title="Eliminar prioridad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                          title="Vincular con módulos"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriorityListView;