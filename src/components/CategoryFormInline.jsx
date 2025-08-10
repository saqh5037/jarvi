import React from 'react';
import { motion } from 'framer-motion';
import {
  Folder, Plus, Edit2, Save, X, Tag, Palette, 
  ChevronDown, Check, FileText
} from 'lucide-react';

const CategoryFormInline = ({
  isExpanded,
  setIsExpanded,
  editingCategory,
  categoryForm,
  setCategoryForm,
  saveCategory,
  cancelEditingCategory,
  availableColors,
  availableIcons,
  showIconPicker,
  setShowIconPicker,
  showColorPicker,
  setShowColorPicker
}) => {
  
  if (!isExpanded) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsExpanded(true)}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Folder className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 font-medium">Crear nueva categoría</p>
            <p className="text-xs text-gray-500">Haz clic para agregar una categoría</p>
          </div>
          <Plus className="w-5 h-5 text-gray-400" />
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header del formulario expandido */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              {editingCategory ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Folder className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-semibold">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h4>
              <p className="text-xs text-white/80">Completa los detalles de la categoría</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsExpanded(false);
              if (editingCategory) cancelEditingCategory();
            }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenido del formulario */}
      <div className="p-6 space-y-6">
        {/* Sección 1: Información Básica */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-semibold">Información Básica</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre de la Categoría *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: Trabajo, Personal, Salud"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Folder className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
              <input
                type="text"
                placeholder="Describe el propósito de esta categoría"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Configuración Visual */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-semibold">Apariencia</span>
          </div>
          
          {/* Selector de Color y Ícono */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Color de la Categoría</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full bg-${categoryForm.color}-500`} />
                    <span className="text-sm capitalize">{categoryForm.color}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showColorPicker && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-3">
                    <div className="grid grid-cols-6 gap-2">
                      {availableColors.map(color => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            setCategoryForm({ ...categoryForm, color: color.name });
                            setShowColorPicker(false);
                          }}
                          className="group relative"
                        >
                          <div className={`w-8 h-8 rounded-lg ${color.class} hover:scale-110 transition-transform`} />
                          {categoryForm.color === color.name && (
                            <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative icon-picker-container">
              <label className="block text-xs font-medium text-gray-600 mb-2">Ícono de la Categoría</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = availableIcons[categoryForm.icon] || Folder;
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 bg-${categoryForm.color}-100 rounded`}>
                          <IconComponent className={`w-4 h-4 text-${categoryForm.color}-600`} />
                        </div>
                        <span className="text-sm">{categoryForm.icon}</span>
                      </div>
                    );
                  })()}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showIconPicker && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  <div className="p-2 grid grid-cols-1 gap-1">
                    {Object.keys(availableIcons).map(iconName => {
                      const IconComponent = availableIcons[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => {
                            setCategoryForm({ ...categoryForm, icon: iconName });
                            setShowIconPicker(false);
                          }}
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <IconComponent className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-900">{iconName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección 3: Configuración Adicional */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Tag className="w-4 h-4" />
            <span className="text-sm font-semibold">Configuración</span>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Ámbito de aplicación
              <span className="text-gray-400 ml-1">(módulos donde se usará)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: notas, tareas, reuniones"
                value={categoryForm.scope || ''}
                onChange={(e) => setCategoryForm({ ...categoryForm, scope: e.target.value })}
                className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Deja vacío para aplicar a todos los módulos
            </p>
          </div>
        </div>
      </div>

      {/* Footer con botones de acción */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {editingCategory ? (
              <span>Editando: {editingCategory.name}</span>
            ) : (
              <span>Los campos con * son obligatorios</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsExpanded(false);
                if (editingCategory) cancelEditingCategory();
              }}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={saveCategory}
              disabled={!categoryForm.name}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {editingCategory ? (
                <>
                  <Save className="w-4 h-4" />
                  Actualizar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Crear Categoría
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryFormInline;