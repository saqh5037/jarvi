import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, Edit2, Trash2, Link, Hash, Activity, 
  Building, Users, Tag, CheckCircle
} from 'lucide-react';

const CategoryListView = ({
  categories,
  availableIcons,
  startEditingCategory,
  setIsCategoryFormExpanded,
  deleteItem
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Categorías Existentes ({categories.length})
        </h3>
      </div>
      
      <div className="p-6">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Folder className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-500">No hay categorías aún</p>
            <p className="text-sm text-gray-400 mt-2">
              Crea tu primera categoría usando el formulario de arriba
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-4">
              Mostrando {categories.length} categorías
            </div>
            <AnimatePresence>
              {categories.map((category, index) => {
                const CategoryIcon = availableIcons[category.icon] || Folder;
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Ícono de la categoría */}
                        <div className={`p-3 bg-${category.color}-100 rounded-xl`}>
                          <CategoryIcon className={`w-6 h-6 text-${category.color}-600`} />
                        </div>
                        
                        <div className="flex-1">
                          {/* Info principal de la categoría */}
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {category.name}
                            </h3>
                            <span className="text-sm text-gray-500">•</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded-full bg-${category.color}-500`} />
                              <span className="text-sm text-gray-600 capitalize">
                                {category.color}
                              </span>
                            </div>
                          </div>
                          
                          {/* Descripción */}
                          {category.description && (
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                          )}
                          
                          {/* Información adicional */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Hash className="w-4 h-4" />
                              <span className="text-xs">ID: {category.id}</span>
                            </div>
                            
                            {category.scope && (
                              <div className="flex items-center gap-1">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs">Ámbito: {category.scope}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs">Activa</span>
                            </div>
                            
                            {/* Indicador de uso en módulos */}
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span className="text-xs">
                                {category.scope ? category.scope.split(',').length : 'Todos'} módulos
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            startEditingCategory(category);
                            setIsCategoryFormExpanded(true);
                          }}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-white rounded-lg transition-all"
                          title="Editar categoría"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('categories', category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                          title="Eliminar categoría"
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

export default CategoryListView;