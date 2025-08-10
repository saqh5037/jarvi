import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Edit2, Trash2, Link, Hash, CheckCircle,
  Activity, Play, Square, Lock
} from 'lucide-react';

const StateListView = ({
  states,
  availableIcons,
  startEditingState,
  setIsStateFormExpanded,
  deleteItem
}) => {
  const getStateTypeInfo = (type) => {
    switch (type) {
      case 'initial':
        return { icon: Play, label: 'Estado inicial', color: 'green' };
      case 'final':
        return { icon: CheckCircle, label: 'Estado final', color: 'emerald' };
      case 'blocked':
        return { icon: Lock, label: 'Estado bloqueado', color: 'red' };
      default:
        return { icon: Square, label: 'Estado estándar', color: 'blue' };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Estados Existentes ({states.length})
        </h3>
      </div>
      
      <div className="p-6">
        {states.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-500">No hay estados aún</p>
            <p className="text-sm text-gray-400 mt-2">
              Crea tu primer estado de flujo usando el formulario de arriba
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-4">
              Mostrando {states.length} estados de flujo de trabajo
            </div>
            <AnimatePresence>
              {states.map((state, index) => {
                const StateIcon = availableIcons[state.icon] || Layers;
                const typeInfo = getStateTypeInfo(state.type);
                const TypeIcon = typeInfo.icon;
                
                return (
                  <motion.div
                    key={state.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Ícono del estado */}
                        <div className={`p-3 bg-${state.color}-100 rounded-xl`}>
                          <StateIcon className={`w-6 h-6 text-${state.color}-600`} />
                        </div>
                        
                        <div className="flex-1">
                          {/* Info principal del estado */}
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {state.name}
                            </h3>
                            <span className="text-sm text-gray-500">•</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded-full bg-${state.color}-500`} />
                              <span className="text-sm text-gray-600 capitalize">
                                {state.color}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <div className="flex items-center gap-1">
                              <TypeIcon className={`w-4 h-4 text-${typeInfo.color}-500`} />
                              <span className="text-sm text-gray-600">
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                          
                          {/* Descripción */}
                          {state.description && (
                            <p className="text-sm text-gray-600 mb-2">{state.description}</p>
                          )}
                          
                          {/* Información adicional */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Hash className="w-4 h-4" />
                              <span className="text-xs">ID: {state.id}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              <span className="text-xs">
                                {state.type === 'initial' ? 'Estado de entrada' : 
                                 state.type === 'final' ? 'Estado de salida' :
                                 state.type === 'blocked' ? 'Requiere acción' : 'Flujo normal'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs">Activo en flujo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            startEditingState(state);
                            setIsStateFormExpanded(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                          title="Editar estado"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('states', state.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                          title="Eliminar estado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                          title="Configurar transiciones"
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

export default StateListView;