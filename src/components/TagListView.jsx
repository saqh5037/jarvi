import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Edit2, Trash2, Link, Hash, TrendingUp,
  CheckCircle, Activity, BarChart3, Zap
} from 'lucide-react';

const TagListView = ({
  tags,
  startEditingTag,
  setIsTagFormExpanded,
  deleteItem
}) => {
  const getFrequencyInfo = (frequency) => {
    switch (frequency) {
      case 'high':
        return { icon: TrendingUp, label: 'Alta frecuencia', color: 'green', description: 'Se sugiere frecuentemente' };
      case 'low':
        return { icon: BarChart3, label: 'Baja frecuencia', color: 'gray', description: 'Solo aparece al buscar' };
      default:
        return { icon: Activity, label: 'Frecuencia normal', color: 'blue', description: 'Disponible en sugerencias' };
    }
  };

  const getCategoryInfo = (category) => {
    switch (category) {
      case 'priority':
        return { label: 'Prioridad', color: 'red' };
      case 'status':
        return { label: 'Estado', color: 'blue' };
      case 'project':
        return { label: 'Proyecto', color: 'purple' };
      case 'context':
        return { label: 'Contexto', color: 'indigo' };
      default:
        return { label: 'General', color: 'gray' };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Tags Existentes ({tags.length})
        </h3>
      </div>
      
      <div className="p-6">
        {tags.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <Tag className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-gray-500">No hay tags aún</p>
            <p className="text-sm text-gray-400 mt-2">
              Crea tu primer tag usando el formulario de arriba
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-4">
              Mostrando {tags.length} etiquetas de clasificación
            </div>
            <AnimatePresence>
              {tags.map((tag, index) => {
                const frequencyInfo = getFrequencyInfo(tag.frequency);
                const categoryInfo = getCategoryInfo(tag.category);
                const FrequencyIcon = frequencyInfo.icon;
                
                return (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Tag visual */}
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-2 bg-${tag.color}-100 rounded-xl`}>
                            <span className={`text-${tag.color}-700 font-semibold`}>
                              #{tag.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          {/* Info principal del tag */}
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {tag.name}
                            </h3>
                            <span className="text-sm text-gray-500">•</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded-full bg-${tag.color}-500`} />
                              <span className="text-sm text-gray-600 capitalize">
                                {tag.color}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <div className="flex items-center gap-1">
                              <FrequencyIcon className={`w-4 h-4 text-${frequencyInfo.color}-500`} />
                              <span className="text-sm text-gray-600">
                                {frequencyInfo.label}
                              </span>
                            </div>
                          </div>
                          
                          {/* Descripción */}
                          {tag.description && (
                            <p className="text-sm text-gray-600 mb-2">{tag.description}</p>
                          )}
                          
                          {/* Información adicional */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Hash className="w-4 h-4" />
                              <span className="text-xs">ID: {tag.id}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full bg-${categoryInfo.color}-500`} />
                              <span className="text-xs">
                                Categoría: {categoryInfo.label}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4" />
                              <span className="text-xs">
                                {frequencyInfo.description}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs">Activo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            startEditingTag(tag);
                            setIsTagFormExpanded(true);
                          }}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-white rounded-lg transition-all"
                          title="Editar tag"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('tags', tag.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                          title="Eliminar tag"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                          title="Ver uso en módulos"
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

export default TagListView;