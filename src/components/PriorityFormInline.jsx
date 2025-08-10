import React from 'react';
import { motion } from 'framer-motion';
import {
  Flag, Plus, Edit2, Save, X, Palette, 
  ChevronDown, Check, FileText, Hash
} from 'lucide-react';

const PriorityFormInline = ({
  isExpanded,
  setIsExpanded,
  editingPriority,
  priorityForm,
  setPriorityForm,
  savePriority,
  cancelEditingPriority,
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
        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200 cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Flag className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 font-medium">Crear nueva prioridad</p>
            <p className="text-xs text-gray-500">Haz clic para agregar un nivel de prioridad</p>
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
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              {editingPriority ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Flag className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-semibold">
                {editingPriority ? 'Editar Prioridad' : 'Nueva Prioridad'}
              </h4>
              <p className="text-xs text-white/80">Define el nivel de importancia</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsExpanded(false);
              if (editingPriority) cancelEditingPriority();
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre de la Prioridad *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: Crítica, Alta, Media"
                  value={priorityForm.name}
                  onChange={(e) => setPriorityForm({ ...priorityForm, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Flag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nivel Numérico *</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="1-5"
                  min="1"
                  max="10"
                  value={priorityForm.level || ''}
                  onChange={(e) => setPriorityForm({ ...priorityForm, level: parseInt(e.target.value) || '' })}
                  className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">1 = Máxima prioridad, 10 = Mínima</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
              <input
                type="text"
                placeholder="Describe cuándo usar esta prioridad"
                value={priorityForm.description}
                onChange={(e) => setPriorityForm({ ...priorityForm, description: e.target.value })}
                className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-xs font-medium text-gray-600 mb-2">Color de la Prioridad</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full bg-${priorityForm.color}-500`} />
                    <span className="text-sm capitalize">{priorityForm.color}</span>
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
                            setPriorityForm({ ...priorityForm, color: color.name });
                            setShowColorPicker(false);
                          }}
                          className="group relative"
                        >
                          <div className={`w-8 h-8 rounded-lg ${color.class} hover:scale-110 transition-transform`} />
                          {priorityForm.color === color.name && (
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
              <label className="block text-xs font-medium text-gray-600 mb-2">Ícono de la Prioridad</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = availableIcons[priorityForm.icon] || Flag;
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 bg-${priorityForm.color}-100 rounded`}>
                          <IconComponent className={`w-4 h-4 text-${priorityForm.color}-600`} />
                        </div>
                        <span className="text-sm">{priorityForm.icon}</span>
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
                            setPriorityForm({ ...priorityForm, icon: iconName });
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
      </div>

      {/* Footer con botones de acción */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {editingPriority ? (
              <span>Editando: {editingPriority.name}</span>
            ) : (
              <span>Los campos con * son obligatorios</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsExpanded(false);
                if (editingPriority) cancelEditingPriority();
              }}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={savePriority}
              disabled={!priorityForm.name || !priorityForm.level}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {editingPriority ? (
                <>
                  <Save className="w-4 h-4" />
                  Actualizar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Crear Prioridad
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PriorityFormInline;