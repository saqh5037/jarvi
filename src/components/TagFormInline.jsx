import React from 'react';
import { motion } from 'framer-motion';
import {
  Tag, Plus, Edit2, Save, X, Palette, 
  ChevronDown, Check, FileText, Hash
} from 'lucide-react';

const TagFormInline = ({
  isExpanded,
  setIsExpanded,
  editingTag,
  tagForm,
  setTagForm,
  saveTag,
  cancelEditingTag,
  availableColors,
  showColorPicker,
  setShowColorPicker
}) => {
  
  if (!isExpanded) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsExpanded(true)}
        className="bg-gradient-to-r from-yellow-50 to-lime-50 rounded-xl p-4 border border-yellow-200 cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Tag className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 font-medium">Crear nuevo tag</p>
            <p className="text-xs text-gray-500">Haz clic para agregar una etiqueta</p>
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
      <div className="bg-gradient-to-r from-yellow-500 to-lime-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              {editingTag ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Tag className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-semibold">
                {editingTag ? 'Editar Tag' : 'Nuevo Tag'}
              </h4>
              <p className="text-xs text-white/80">Crea etiquetas para clasificar contenido</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsExpanded(false);
              if (editingTag) cancelEditingTag();
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre del Tag *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: urgente, importante, seguimiento"
                  value={tagForm.name}
                  onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Se mostrará como #{tagForm.name || 'tag'}
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
              <input
                type="text"
                placeholder="Describe el propósito de esta etiqueta"
                value={tagForm.description || ''}
                onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Color del Tag</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full bg-${tagForm.color}-500`} />
                    <span className="text-sm capitalize">{tagForm.color}</span>
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
                            setTagForm({ ...tagForm, color: color.name });
                            setShowColorPicker(false);
                          }}
                          className="group relative"
                        >
                          <div className={`w-8 h-8 rounded-lg ${color.class} hover:scale-110 transition-transform`} />
                          {tagForm.color === color.name && (
                            <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Vista previa</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Se verá como:</span>
                <span className={`px-2 py-1 bg-${tagForm.color}-100 text-${tagForm.color}-700 text-sm rounded-full`}>
                  #{tagForm.name || 'tag'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Configuración de Uso */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Tag className="w-4 h-4" />
            <span className="text-sm font-semibold">Configuración de Uso</span>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Frecuencia de uso
            </label>
            <select
              value={tagForm.frequency || 'normal'}
              onChange={(e) => setTagForm({ ...tagForm, frequency: e.target.value })}
              className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="high">Alta - Se sugiere frecuentemente</option>
              <option value="normal">Normal - Disponible en sugerencias</option>
              <option value="low">Baja - Solo aparece al buscar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Categoría del tag
            </label>
            <select
              value={tagForm.category || 'general'}
              onChange={(e) => setTagForm({ ...tagForm, category: e.target.value })}
              className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="general">General</option>
              <option value="priority">Prioridad</option>
              <option value="status">Estado</option>
              <option value="project">Proyecto</option>
              <option value="context">Contexto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer con botones de acción */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {editingTag ? (
              <span>Editando: #{editingTag.name}</span>
            ) : (
              <span>Los campos con * son obligatorios</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsExpanded(false);
                if (editingTag) cancelEditingTag();
              }}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={saveTag}
              disabled={!tagForm.name}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-lime-500 text-white rounded-lg hover:from-yellow-600 hover:to-lime-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {editingTag ? (
                <>
                  <Save className="w-4 h-4" />
                  Actualizar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Crear Tag
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TagFormInline;