import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers, Plus, Edit2, Save, X, Palette, 
  ChevronDown, Check, FileText, Activity
} from 'lucide-react';

const StateFormInline = ({
  isExpanded,
  setIsExpanded,
  editingState,
  stateForm,
  setStateForm,
  saveState,
  cancelEditingState,
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
        className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 font-medium">Crear nuevo estado</p>
            <p className="text-xs text-gray-500">Haz clic para agregar un estado de flujo</p>
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
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              {editingState ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Layers className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-semibold">
                {editingState ? 'Editar Estado' : 'Nuevo Estado'}
              </h4>
              <p className="text-xs text-white/80">Define estados de flujo de trabajo</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsExpanded(false);
              if (editingState) cancelEditingState();
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre del Estado *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: En Progreso, Completado, Pendiente"
                  value={stateForm.name}
                  onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
              <input
                type="text"
                placeholder="Describe cuándo usar este estado"
                value={stateForm.description}
                onChange={(e) => setStateForm({ ...stateForm, description: e.target.value })}
                className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-xs font-medium text-gray-600 mb-2">Color del Estado</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full bg-${stateForm.color}-500`} />
                    <span className="text-sm capitalize">{stateForm.color}</span>
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
                            setStateForm({ ...stateForm, color: color.name });
                            setShowColorPicker(false);
                          }}
                          className="group relative"
                        >
                          <div className={`w-8 h-8 rounded-lg ${color.class} hover:scale-110 transition-transform`} />
                          {stateForm.color === color.name && (
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
              <label className="block text-xs font-medium text-gray-600 mb-2">Ícono del Estado</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = availableIcons[stateForm.icon] || Layers;
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 bg-${stateForm.color}-100 rounded`}>
                          <IconComponent className={`w-4 h-4 text-${stateForm.color}-600`} />
                        </div>
                        <span className="text-sm">{stateForm.icon}</span>
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
                            setStateForm({ ...stateForm, icon: iconName });
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

        {/* Sección 3: Configuración de Flujo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-semibold">Configuración de Flujo</span>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Tipo de estado
            </label>
            <select
              value={stateForm.type || 'standard'}
              onChange={(e) => setStateForm({ ...stateForm, type: e.target.value })}
              className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Estándar</option>
              <option value="initial">Estado inicial</option>
              <option value="final">Estado final</option>
              <option value="blocked">Estado bloqueado</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Define el comportamiento del estado en el flujo de trabajo
            </p>
          </div>
        </div>
      </div>

      {/* Footer con botones de acción */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {editingState ? (
              <span>Editando: {editingState.name}</span>
            ) : (
              <span>Los campos con * son obligatorios</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsExpanded(false);
                if (editingState) cancelEditingState();
              }}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={saveState}
              disabled={!stateForm.name}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {editingState ? (
                <>
                  <Save className="w-4 h-4" />
                  Actualizar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Crear Estado
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StateFormInline;