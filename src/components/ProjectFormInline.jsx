import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Plus, Edit2, Save, X, Calendar, Users, Tag,
  FileText, Palette, Clock, Activity, Pause, CheckCircle,
  XCircle, Archive, ChevronDown, Check
} from 'lucide-react';

const ProjectFormInline = ({
  isExpanded,
  setIsExpanded,
  editingProject,
  projectForm,
  setProjectForm,
  saveProject,
  cancelEditingProject,
  availableColors,
  availableIcons,
  showIconPicker,
  setShowIconPicker,
  showColorPicker,
  setShowColorPicker
}) => {
  // Debug: Log cuando cambia isExpanded
  console.log('🔍 ProjectFormInline recibió isExpanded:', isExpanded);
  const projectStatuses = [
    { value: 'planning', label: 'Planificación', color: 'blue', icon: Clock },
    { value: 'active', label: 'Activo', color: 'green', icon: Activity },
    { value: 'paused', label: 'Pausado', color: 'yellow', icon: Pause },
    { value: 'completed', label: 'Completado', color: 'emerald', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelado', color: 'red', icon: XCircle },
    { value: 'archived', label: 'Archivado', color: 'gray', icon: Archive }
  ];

  console.log('🎯 Renderizando ProjectFormInline, isExpanded:', isExpanded);
  
  if (!isExpanded) {
    console.log('👆 Mostrando versión colapsada');
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsExpanded(true)}
        className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200 cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Rocket className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 font-medium">Crear nuevo proyecto</p>
            <p className="text-xs text-gray-500">Haz clic para agregar un proyecto</p>
          </div>
          <Plus className="w-5 h-5 text-gray-400" />
        </div>
      </motion.div>
    );
  }

  console.log('📱 Mostrando versión expandida');
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header del formulario expandido */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              {editingProject ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Rocket className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-semibold">
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h4>
              <p className="text-xs text-white/80">Completa los detalles del proyecto</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsExpanded(false);
              if (editingProject) cancelEditingProject();
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre del Proyecto *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: Proyecto Alpha"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Rocket className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
              <input
                type="text"
                placeholder="Breve descripción del proyecto"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Configuración Visual */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-semibold">Apariencia y Estado</span>
          </div>
          
          <div className="space-y-3">
            {/* Selector de Estado */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Estado del Proyecto</label>
              <div className="flex flex-wrap gap-2">
                {projectStatuses.map(status => {
                  const StatusIcon = status.icon;
                  return (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setProjectForm({ ...projectForm, status: status.value })}
                      className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                        projectForm.status === status.value
                          ? `border-${status.color}-500 bg-${status.color}-50 text-${status.color}-700`
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{status.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Color y Ícono */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Color del Proyecto</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full bg-${projectForm.color}-500`} />
                      <span className="text-sm capitalize">{projectForm.color}</span>
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
                              setProjectForm({ ...projectForm, color: color.name });
                              setShowColorPicker(false);
                            }}
                            className="group relative"
                          >
                            <div className={`w-8 h-8 rounded-lg ${color.class} hover:scale-110 transition-transform`} />
                            {projectForm.color === color.name && (
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
                <label className="block text-xs font-medium text-gray-600 mb-2">Ícono del Proyecto</label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = availableIcons[projectForm.icon] || Rocket;
                      return (
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 bg-${projectForm.color}-100 rounded`}>
                            <IconComponent className={`w-4 h-4 text-${projectForm.color}-600`} />
                          </div>
                          <span className="text-sm">{projectForm.icon}</span>
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
                              setProjectForm({ ...projectForm, icon: iconName });
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

        {/* Sección 3: Fechas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-semibold">Cronograma</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de Inicio</label>
              <input
                type="date"
                value={projectForm.startDate}
                onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de Fin (Opcional)</label>
              <input
                type="date"
                value={projectForm.endDate}
                onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                className="w-full px-3 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 4: Equipo y Tags */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">Equipo y Etiquetas</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Miembros del Equipo
                <span className="text-gray-400 ml-1">(separados por comas)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez, María García"
                  value={projectForm.team}
                  onChange={(e) => setProjectForm({ ...projectForm, team: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {projectForm.team && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {projectForm.team.split(',').filter(t => t.trim()).map((member, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {member.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Etiquetas
                <span className="text-gray-400 ml-1">(separados por comas)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: desarrollo, mvp, react"
                  value={projectForm.tags}
                  onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {projectForm.tags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {projectForm.tags.split(',').filter(t => t.trim()).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      #{tag.trim()}
                    </span>
                  ))}
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
            {editingProject ? (
              <span>Editando: {editingProject.name}</span>
            ) : (
              <span>Los campos con * son obligatorios</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsExpanded(false);
                if (editingProject) cancelEditingProject();
              }}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={saveProject}
              disabled={!projectForm.name}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {editingProject ? (
                <>
                  <Save className="w-4 h-4" />
                  Actualizar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Crear Proyecto
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectFormInline;