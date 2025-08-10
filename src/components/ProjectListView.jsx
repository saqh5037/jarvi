import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Edit2, Trash2, Link, Hash, Calendar, Users, Tag,
  Clock, Activity, Pause, CheckCircle, XCircle, Archive
} from 'lucide-react';

const ProjectListView = ({
  projects,
  availableIcons,
  startEditingProject,
  setIsProjectFormExpanded,
  deleteItem
}) => {
  const statusConfig = {
    planning: { color: 'blue', label: 'Planificación', icon: Clock },
    active: { color: 'green', label: 'Activo', icon: Activity },
    paused: { color: 'yellow', label: 'Pausado', icon: Pause },
    completed: { color: 'emerald', label: 'Completado', icon: CheckCircle },
    cancelled: { color: 'red', label: 'Cancelado', icon: XCircle },
    archived: { color: 'gray', label: 'Archivado', icon: Archive }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Proyectos Existentes ({projects.length})
        </h3>
      </div>
      
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Rocket className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-500">No hay proyectos aún</p>
            <p className="text-sm text-gray-400 mt-2">
              Crea tu primer proyecto usando el formulario de arriba
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-4">
              Mostrando {projects.length} proyectos
            </div>
            <AnimatePresence>
              {projects.map((project, index) => {
                const ProjectIcon = availableIcons[project.icon] || Rocket;
                const status = statusConfig[project.status] || statusConfig.planning;
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Ícono del proyecto */}
                        <div className={`p-3 bg-${project.color}-100 rounded-xl`}>
                          <ProjectIcon className={`w-6 h-6 text-${project.color}-600`} />
                        </div>
                        
                        <div className="flex-1">
                          {/* Info principal del proyecto */}
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {project.name}
                            </h3>
                            <span className="text-sm text-gray-500">•</span>
                            <div className="flex items-center gap-1">
                              <StatusIcon className={`w-4 h-4 text-${status.color}-600`} />
                              <span className={`text-sm font-medium text-${status.color}-700`}>
                                {status.label}
                              </span>
                            </div>
                            {(project.startDate || project.endDate) && (
                              <>
                                <span className="text-sm text-gray-500">•</span>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">
                                    {project.startDate && new Date(project.startDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                    {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Descripción */}
                          {project.description && (
                            <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                          )}
                          
                          {/* Equipo, Tags y ID */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {project.team && project.team.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{project.team.length} miembro{project.team.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                <div className="flex gap-1">
                                  {project.tags.slice(0, 2).map((tag, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-white text-gray-600 text-xs rounded-full border">
                                      #{tag}
                                    </span>
                                  ))}
                                  {project.tags.length > 2 && (
                                    <span className="px-2 py-0.5 bg-white text-gray-600 text-xs rounded-full border">
                                      +{project.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Hash className="w-4 h-4" />
                              <span className="text-xs">ID: {project.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            startEditingProject(project);
                            setIsProjectFormExpanded(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                          title="Editar proyecto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('projects', project.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <button
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-white rounded-lg transition-all"
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

export default ProjectListView;