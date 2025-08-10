import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProjectFormInline from './ProjectFormInline';
import ProjectListView from './ProjectListView';
import CategoryFormInline from './CategoryFormInline';
import CategoryListView from './CategoryListView';
import PriorityFormInline from './PriorityFormInline';
import PriorityListView from './PriorityListView';
import StateFormInline from './StateFormInline';
import StateListView from './StateListView';
import TagFormInline from './TagFormInline';
import TagListView from './TagListView';
import {
  Settings,
  Tag,
  Layers,
  Key,
  Bell,
  Database,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  Pause,
  AlertCircle,
  Shield,
  Globe,
  Zap,
  Archive,
  Hash,
  Circle,
  Square,
  Triangle,
  Star,
  Heart,
  Flag,
  Bookmark,
  Clock,
  Calendar,
  User,
  Users,
  Briefcase,
  Home,
  Book,
  DollarSign,
  Activity,
  Coffee,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  ThumbsUp,
  Cpu,
  GraduationCap,
  TrendingUp,
  MessageCircle,
  Folder,
  CheckSquare,
  FileText,
  Mic,
  File,
  Link,
  Lightbulb,
  Target,
  RefreshCw,
  Sliders,
  Package,
  Rocket,
  FolderOpen,
  ChevronUp,
  Palette,
  AlignLeft,
  Building
} from 'lucide-react';

const SettingsModule = () => {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isProjectFormExpanded, setIsProjectFormExpanded] = useState(false);
  const [isCategoryFormExpanded, setIsCategoryFormExpanded] = useState(false);
  const [isPriorityFormExpanded, setIsPriorityFormExpanded] = useState(false);
  const [isStateFormExpanded, setIsStateFormExpanded] = useState(false);
  const [isTagFormExpanded, setIsTagFormExpanded] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Estados para edición de proyectos
  const [editingProject, setEditingProject] = useState(null);
  
  // Estados para edición de categorías
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: 'purple',
    icon: 'Folder',
    scope: ''
  });

  // Estados para edición de prioridades
  const [editingPriority, setEditingPriority] = useState(null);
  const [priorityForm, setPriorityForm] = useState({
    name: '',
    description: '',
    color: 'orange',
    icon: 'Flag',
    level: ''
  });

  // Estados para edición de estados
  const [editingState, setEditingState] = useState(null);
  const [stateForm, setStateForm] = useState({
    name: '',
    description: '',
    color: 'blue',
    icon: 'Layers',
    type: 'standard'
  });

  // Estados para edición de tags
  const [editingTag, setEditingTag] = useState(null);
  const [tagForm, setTagForm] = useState({
    name: '',
    description: '',
    color: 'yellow',
    frequency: 'normal',
    category: 'general'
  });
  
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    color: 'blue',
    icon: 'Rocket',
    status: 'planning',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    team: '',
    tags: ''
  });

  // Configuración Global del Sistema
  const [config, setConfig] = useState({
    // Estados Globales - Aplicables a TODOS los módulos
    globalStates: [
      { id: 'pending', name: 'Pendiente', color: 'yellow', icon: 'Clock', description: 'Esperando acción' },
      { id: 'in-progress', name: 'En Progreso', color: 'blue', icon: 'Loader2', description: 'Actualmente trabajando' },
      { id: 'completed', name: 'Completado', color: 'green', icon: 'CheckCircle', description: 'Finalizado exitosamente' },
      { id: 'cancelled', name: 'Cancelado', color: 'red', icon: 'XCircle', description: 'Cancelado o descartado' },
      { id: 'archived', name: 'Archivado', color: 'gray', icon: 'Archive', description: 'Guardado para referencia' },
      { id: 'draft', name: 'Borrador', color: 'purple', icon: 'Edit2', description: 'En edición' },
      { id: 'review', name: 'En Revisión', color: 'orange', icon: 'Eye', description: 'Pendiente de revisión' },
      { id: 'approved', name: 'Aprobado', color: 'emerald', icon: 'ThumbsUp', description: 'Aprobado y validado' }
    ],
    
    // Prioridades Globales
    globalPriorities: [
      { id: 'critical', name: 'Crítica', color: 'red', level: 1, icon: 'AlertCircle' },
      { id: 'high', name: 'Alta', color: 'orange', level: 2, icon: 'Flag' },
      { id: 'medium', name: 'Media', color: 'yellow', level: 3, icon: 'Circle' },
      { id: 'low', name: 'Baja', color: 'green', level: 4, icon: 'Square' },
      { id: 'optional', name: 'Opcional', color: 'gray', level: 5, icon: 'Triangle' }
    ],
    
    // Categorías Globales - Usables por cualquier módulo
    globalCategories: [
      { id: 'work', name: 'Trabajo', color: 'indigo', icon: 'Briefcase', description: 'Asuntos laborales' },
      { id: 'personal', name: 'Personal', color: 'pink', icon: 'User', description: 'Asuntos personales' },
      { id: 'health', name: 'Salud', color: 'green', icon: 'Heart', description: 'Salud y bienestar' },
      { id: 'finance', name: 'Finanzas', color: 'yellow', icon: 'DollarSign', description: 'Temas financieros' },
      { id: 'education', name: 'Educación', color: 'purple', icon: 'GraduationCap', description: 'Aprendizaje y estudio' },
      { id: 'technology', name: 'Tecnología', color: 'blue', icon: 'Cpu', description: 'Tech y desarrollo' },
      { id: 'business', name: 'Negocios', color: 'emerald', icon: 'TrendingUp', description: 'Proyectos de negocio' },
      { id: 'family', name: 'Familia', color: 'rose', icon: 'Users', description: 'Asuntos familiares' },
      { id: 'social', name: 'Social', color: 'cyan', icon: 'MessageCircle', description: 'Actividades sociales' },
      { id: 'projects', name: 'Proyectos', color: 'violet', icon: 'Folder', description: 'Gestión de proyectos' }
    ],
    
    // Proyectos - Sistema especial de agrupación
    globalProjects: [
      { 
        id: 'jarvi-system', 
        name: 'JARVI System', 
        color: 'blue', 
        icon: 'Cpu', 
        description: 'Sistema principal de asistente IA',
        status: 'active',
        startDate: '2025-01-01',
        endDate: null,
        team: ['Samuel Quiroz'],
        tags: ['ia', 'desarrollo', 'react']
      },
      { 
        id: 'proyecto-alpha', 
        name: 'Proyecto Alpha', 
        color: 'purple', 
        icon: 'Rocket', 
        description: 'Proyecto de ejemplo',
        status: 'planning',
        startDate: '2025-02-01',
        endDate: '2025-06-01',
        team: ['Usuario 1', 'Usuario 2'],
        tags: ['mvp', 'startup']
      }
    ],
    
    // Tags Globales - Sistema de etiquetado universal
    globalTags: [
      { id: 'urgent', name: 'Urgente', color: 'red' },
      { id: 'important', name: 'Importante', color: 'orange' },
      { id: 'follow-up', name: 'Seguimiento', color: 'blue' },
      { id: 'delegated', name: 'Delegado', color: 'purple' },
      { id: 'waiting', name: 'En Espera', color: 'yellow' },
      { id: 'someday', name: 'Algún Día', color: 'gray' },
      { id: 'reference', name: 'Referencia', color: 'indigo' },
      { id: 'quick', name: 'Rápido', color: 'green' },
      { id: 'recurring', name: 'Recurrente', color: 'cyan' },
      { id: 'milestone', name: 'Hito', color: 'emerald' }
    ],
    
    // API Keys
    apiKeys: {
      openai: '',
      gemini: '',
      claude: '',
      telegram: '',
      deepgram: '',
      elevenlabs: ''
    },
    
    // Preferencias Globales
    preferences: {
      language: 'es',
      theme: 'light',
      notifications: true,
      soundAlerts: true,
      autoSave: true,
      autoSync: true,
      compactView: false,
      showTutorials: true,
      debugMode: false,
      timezone: 'America/Mexico_City',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    
    // Límites del Sistema
    limits: {
      maxFileSize: 500, // MB
      maxRecordingLength: 60, // minutos
      maxItemsPerPage: 20,
      maxConcurrentUploads: 3,
      sessionTimeout: 30, // minutos
      undoHistorySize: 50,
      maxTagsPerItem: 10,
      maxAttachmentsPerItem: 5
    }
  });

  // Estados para edición

  // Colores disponibles
  const availableColors = [
    { name: 'gray', class: 'bg-gray-500' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'yellow', class: 'bg-yellow-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'emerald', class: 'bg-emerald-500' },
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'cyan', class: 'bg-cyan-500' },
    { name: 'indigo', class: 'bg-indigo-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'violet', class: 'bg-violet-500' },
    { name: 'pink', class: 'bg-pink-500' },
    { name: 'rose', class: 'bg-rose-500' }
  ];

  // Iconos disponibles
  const availableIcons = {
    Circle, Square, Triangle, Star, Heart, Flag, Bookmark, Clock, Calendar,
    User, Users, Briefcase, Home, Book, DollarSign, Activity, Coffee,
    CheckCircle, XCircle, Eye, ThumbsUp, Cpu, GraduationCap, TrendingUp,
    MessageCircle, Folder, CheckSquare, FileText, Bell, Mic, File, Link,
    Lightbulb, Target, RefreshCw, Archive, Edit2, Loader2, AlertCircle,
    Rocket, FolderOpen, Package
  };

  // Tabs de navegación
  const tabs = [
    { id: 'overview', label: 'Inicio', icon: Home },
    { id: 'states', label: 'Estados', icon: Layers, count: config.globalStates.length },
    { id: 'priorities', label: 'Prioridades', icon: Flag, count: config.globalPriorities.length },
    { id: 'categories', label: 'Categorías', icon: Folder, count: config.globalCategories.length },
    { id: 'projects', label: 'Proyectos', icon: Rocket, count: config.globalProjects.length },
    { id: 'tags', label: 'Tags', icon: Tag, count: config.globalTags.length },
    { id: 'apikeys', label: 'API Keys', icon: Key },
    { id: 'preferences', label: 'Preferencias', icon: Sliders },
    { id: 'limits', label: 'Límites', icon: Shield },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  // Cargar configuración desde localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('jarvi-global-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }, []);

  // Exponer el estado actual de la configuración globalmente
  useEffect(() => {
    if (config) {
      window.jarviCurrentConfig = config;
    }
  }, [config]);

  // Cerrar selectores de íconos cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.icon-picker-container')) {
        setShowIconPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debug: Monitorear cambios en isProjectFormExpanded
  useEffect(() => {
    console.log('🔄 Estado isProjectFormExpanded cambió a:', isProjectFormExpanded);
  }, [isProjectFormExpanded]);

  // Escuchar eventos de guardar/descartar desde el dashboard principal
  useEffect(() => {
    const handleSaveAndContinue = () => {
      setIsSaving(true);
      try {
        localStorage.setItem('jarvi-global-config', JSON.stringify(config));
        window.dispatchEvent(new CustomEvent('global-config-updated', { 
          detail: config 
        }));
        setShowSuccess(true);
        setHasChanges(false);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        console.error('Error saving config:', error);
      } finally {
        setIsSaving(false);
      }
    };

    const handleDiscardChanges = () => {
      const savedConfig = localStorage.getItem('jarvi-global-config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
      setHasChanges(false);
    };

    window.addEventListener('save-settings-and-continue', handleSaveAndContinue);
    window.addEventListener('discard-settings-changes', handleDiscardChanges);

    return () => {
      window.removeEventListener('save-settings-and-continue', handleSaveAndContinue);
      window.removeEventListener('discard-settings-changes', handleDiscardChanges);
    };
  }, [config]);

  // Detectar cambios
  useEffect(() => {
    const savedConfig = localStorage.getItem('jarvi-global-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        const hasChanges = JSON.stringify(parsed) !== JSON.stringify(config);
        setHasChanges(hasChanges);
      } catch {
        setHasChanges(true);
      }
    } else {
      setHasChanges(true);
    }
  }, [config]);

  // Guardar configuración
  const saveConfig = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('jarvi-global-config', JSON.stringify(config));
      
      // Disparar evento global para que otros módulos se actualicen
      window.dispatchEvent(new CustomEvent('global-config-updated', { 
        detail: config 
      }));
      
      setShowSuccess(true);
      setHasChanges(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Función para manejar cambio de pestaña con confirmación
  const handleTabChange = (newTab) => {
    if (hasChanges && activeTab !== newTab) {
      setPendingAction(() => () => setActiveTab(newTab));
      setShowExitModal(true);
    } else {
      setActiveTab(newTab);
    }
  };

  // Funciones del modal de confirmación
  const handleConfirmSaveAndContinue = () => {
    saveConfig();
    setTimeout(() => {
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
      setShowExitModal(false);
    }, 500);
  };

  const handleDiscardChanges = () => {
    const savedConfig = localStorage.getItem('jarvi-global-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    setHasChanges(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowExitModal(false);
  };

  const handleCancelAction = () => {
    setShowExitModal(false);
    setPendingAction(null);
  };

  // Agregar nuevo item

  // Eliminar item
  const deleteItem = (type, id) => {
    if (type === 'states') {
      setConfig(prev => ({
        ...prev,
        globalStates: prev.globalStates.filter(item => item.id !== id)
      }));
    } else if (type === 'priorities') {
      setConfig(prev => ({
        ...prev,
        globalPriorities: prev.globalPriorities.filter(item => item.id !== id)
      }));
    } else if (type === 'categories') {
      setConfig(prev => ({
        ...prev,
        globalCategories: prev.globalCategories.filter(item => item.id !== id)
      }));
    } else if (type === 'projects') {
      setConfig(prev => ({
        ...prev,
        globalProjects: prev.globalProjects.filter(item => item.id !== id)
      }));
    } else if (type === 'tags') {
      setConfig(prev => ({
        ...prev,
        globalTags: prev.globalTags.filter(item => item.id !== id)
      }));
    }
  };

  // Función para exportar configuración (movida antes del renderizado)
  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `jarvi-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Importar configuración
  const importConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setConfig(imported);
          saveConfig();
        } catch (error) {
          console.error('Error importing config:', error);
          alert('Error al importar la configuración');
        }
      };
      reader.readAsText(file);
    }
  };


  // Función para agregar o actualizar proyecto
  const saveProject = () => {
    console.log('🚀 Ejecutando saveProject...');
    console.log('📝 Datos del formulario:', projectForm);
    console.log('🔧 Estado actual isProjectFormExpanded:', isProjectFormExpanded);
    
    if (!projectForm.name) {
      console.log('❌ Nombre vacío, saliendo...');
      return;
    }
    
    const projectData = {
      id: editingProject ? editingProject.id : projectForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: projectForm.name,
      description: projectForm.description,
      color: projectForm.color,
      icon: projectForm.icon,
      status: projectForm.status,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate || null,
      team: projectForm.team ? projectForm.team.split(',').map(t => t.trim()).filter(t => t) : [],
      tags: projectForm.tags ? projectForm.tags.split(',').map(t => t.trim()).filter(t => t) : []
    };

    console.log('💾 Guardando proyecto:', projectData);

    if (editingProject) {
      // Actualizar proyecto existente
      console.log('✏️ Actualizando proyecto existente');
      setConfig(prev => ({
        ...prev,
        globalProjects: prev.globalProjects.map(p => 
          p.id === editingProject.id ? projectData : p
        )
      }));
      setEditingProject(null);
    } else {
      // Agregar nuevo proyecto
      console.log('➕ Creando nuevo proyecto');
      setConfig(prev => ({
        ...prev,
        globalProjects: [...prev.globalProjects, projectData]
      }));
    }

    // Limpiar formulario
    console.log('🧹 Limpiando formulario...');
    setProjectForm({
      name: '',
      description: '',
      color: 'blue',
      icon: 'Rocket',
      status: 'planning',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      team: '',
      tags: ''
    });

    // Colapsar el formulario después de guardar
    console.log('📉 Colapsando formulario... Estado antes:', isProjectFormExpanded);
    
    // Forzar el colapso de manera más directa
    setTimeout(() => {
      console.log('📉 Ejecutando colapso con timeout...');
      setIsProjectFormExpanded(false);
      console.log('✅ Comando de colapso ejecutado');
      
      // Verificar después de otro momento
      setTimeout(() => {
        console.log('🔍 Estado final después del colapso:', isProjectFormExpanded);
      }, 100);
    }, 50);
  };

  // Función para editar proyecto
  const startEditingProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      color: project.color,
      icon: project.icon,
      status: project.status || 'planning',
      startDate: project.startDate || new Date().toISOString().split('T')[0],
      endDate: project.endDate || '',
      team: project.team ? project.team.join(', ') : '',
      tags: project.tags ? project.tags.join(', ') : ''
    });
  };

  // Función para cancelar edición
  const cancelEditingProject = () => {
    setEditingProject(null);
    setProjectForm({
      name: '',
      description: '',
      color: 'blue',
      icon: 'Rocket',
      status: 'planning',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      team: '',
      tags: ''
    });
    // Colapsar el formulario al cancelar
    setTimeout(() => {
      setIsProjectFormExpanded(false);
    }, 100);
  };

  // Función para agregar o actualizar categoría
  const saveCategory = () => {
    if (!categoryForm.name) return;
    
    const categoryData = {
      id: editingCategory ? editingCategory.id : categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: categoryForm.name,
      description: categoryForm.description,
      color: categoryForm.color,
      icon: categoryForm.icon,
      scope: categoryForm.scope || null
    };

    if (editingCategory) {
      // Actualizar categoría existente
      setConfig(prev => ({
        ...prev,
        globalCategories: prev.globalCategories.map(c => 
          c.id === editingCategory.id ? categoryData : c
        )
      }));
      setEditingCategory(null);
    } else {
      // Agregar nueva categoría
      setConfig(prev => ({
        ...prev,
        globalCategories: [...prev.globalCategories, categoryData]
      }));
    }

    // Limpiar formulario
    setCategoryForm({
      name: '',
      description: '',
      color: 'purple',
      icon: 'Folder',
      scope: ''
    });

    // Colapsar el formulario después de guardar
    setTimeout(() => {
      setIsCategoryFormExpanded(false);
    }, 50);
  };

  // Función para editar categoría
  const startEditingCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon,
      scope: category.scope || ''
    });
  };

  // Función para cancelar edición de categoría
  const cancelEditingCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      color: 'purple',
      icon: 'Folder',
      scope: ''
    });
    // Colapsar el formulario al cancelar
    setTimeout(() => {
      setIsCategoryFormExpanded(false);
    }, 100);
  };

  // Funciones para manejar prioridades
  const savePriority = () => {
    if (!priorityForm.name || !priorityForm.level) return;
    
    const priorityData = {
      id: editingPriority ? editingPriority.id : priorityForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: priorityForm.name,
      description: priorityForm.description,
      color: priorityForm.color,
      icon: priorityForm.icon,
      level: priorityForm.level
    };

    if (editingPriority) {
      setConfig(prev => ({
        ...prev,
        globalPriorities: prev.globalPriorities.map(p => 
          p.id === editingPriority.id ? priorityData : p
        )
      }));
      setEditingPriority(null);
    } else {
      setConfig(prev => ({
        ...prev,
        globalPriorities: [...prev.globalPriorities, priorityData]
      }));
    }

    setPriorityForm({ name: '', description: '', color: 'orange', icon: 'Flag', level: '' });
    setTimeout(() => { setIsPriorityFormExpanded(false); }, 50);
  };

  const startEditingPriority = (priority) => {
    setEditingPriority(priority);
    setPriorityForm({
      name: priority.name,
      description: priority.description || '',
      color: priority.color,
      icon: priority.icon,
      level: priority.level
    });
  };

  const cancelEditingPriority = () => {
    setEditingPriority(null);
    setPriorityForm({ name: '', description: '', color: 'orange', icon: 'Flag', level: '' });
    setTimeout(() => { setIsPriorityFormExpanded(false); }, 100);
  };

  // Funciones para manejar estados
  const saveState = () => {
    if (!stateForm.name) return;
    
    const stateData = {
      id: editingState ? editingState.id : stateForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: stateForm.name,
      description: stateForm.description,
      color: stateForm.color,
      icon: stateForm.icon,
      type: stateForm.type
    };

    if (editingState) {
      setConfig(prev => ({
        ...prev,
        globalStates: prev.globalStates.map(s => 
          s.id === editingState.id ? stateData : s
        )
      }));
      setEditingState(null);
    } else {
      setConfig(prev => ({
        ...prev,
        globalStates: [...prev.globalStates, stateData]
      }));
    }

    setStateForm({ name: '', description: '', color: 'blue', icon: 'Layers', type: 'standard' });
    setTimeout(() => { setIsStateFormExpanded(false); }, 50);
  };

  const startEditingState = (state) => {
    setEditingState(state);
    setStateForm({
      name: state.name,
      description: state.description || '',
      color: state.color,
      icon: state.icon,
      type: state.type || 'standard'
    });
  };

  const cancelEditingState = () => {
    setEditingState(null);
    setStateForm({ name: '', description: '', color: 'blue', icon: 'Layers', type: 'standard' });
    setTimeout(() => { setIsStateFormExpanded(false); }, 100);
  };

  // Funciones para manejar tags
  const saveTag = () => {
    if (!tagForm.name) return;
    
    const tagData = {
      id: editingTag ? editingTag.id : tagForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: tagForm.name,
      description: tagForm.description,
      color: tagForm.color,
      frequency: tagForm.frequency,
      category: tagForm.category
    };

    if (editingTag) {
      setConfig(prev => ({
        ...prev,
        globalTags: prev.globalTags.map(t => 
          t.id === editingTag.id ? tagData : t
        )
      }));
      setEditingTag(null);
    } else {
      setConfig(prev => ({
        ...prev,
        globalTags: [...prev.globalTags, tagData]
      }));
    }

    setTagForm({ name: '', description: '', color: 'yellow', frequency: 'normal', category: 'general' });
    setTimeout(() => { setIsTagFormExpanded(false); }, 50);
  };

  const startEditingTag = (tag) => {
    setEditingTag(tag);
    setTagForm({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
      frequency: tag.frequency || 'normal',
      category: tag.category || 'general'
    });
  };

  const cancelEditingTag = () => {
    setEditingTag(null);
    setTagForm({ name: '', description: '', color: 'yellow', frequency: 'normal', category: 'general' });
    setTimeout(() => { setIsTagFormExpanded(false); }, 100);
  };

  // Renderizar lista de categorías con funcionalidad mejorada
  const renderCategoryList = () => {
    return (
      <div className="space-y-6">
        {/* Formulario inline expandible para agregar/editar categoría */}
        <CategoryFormInline
          isExpanded={isCategoryFormExpanded}
          setIsExpanded={setIsCategoryFormExpanded}
          editingCategory={editingCategory}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          saveCategory={saveCategory}
          cancelEditingCategory={cancelEditingCategory}
          availableColors={availableColors}
          availableIcons={availableIcons}
          showIconPicker={showIconPicker}
          setShowIconPicker={setShowIconPicker}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
        />

        {/* Lista de categorías existentes */}
        <CategoryListView
          categories={config.globalCategories}
          availableIcons={availableIcons}
          startEditingCategory={startEditingCategory}
          setIsCategoryFormExpanded={setIsCategoryFormExpanded}
          deleteItem={deleteItem}
        />

        {/* Estadísticas de categorías */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Folder className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">
                {config.globalCategories.length}
              </span>
            </div>
            <p className="text-sm text-purple-700 font-medium">Total Categorías</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold text-indigo-900">
                {config.globalCategories.filter(c => !c.scope).length}
              </span>
            </div>
            <p className="text-sm text-indigo-700 font-medium">Globales</p>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
            <div className="flex items-center justify-between mb-2">
              <Building className="w-5 h-5 text-cyan-600" />
              <span className="text-2xl font-bold text-cyan-900">
                {config.globalCategories.filter(c => c.scope).length}
              </span>
            </div>
            <p className="text-sm text-cyan-700 font-medium">Específicas</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-900">
                {[...new Set(config.globalCategories.map(c => c.color))].length}
              </span>
            </div>
            <p className="text-sm text-emerald-700 font-medium">Colores Usados</p>
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-purple-900 mb-1">Sistema de Categorías Inteligente</h4>
              <p className="text-sm text-purple-700">
                Las categorías te permiten organizar y clasificar todo tu contenido de forma consistente 
                across todos los módulos. Puedes crear categorías globales o específicas para ciertos módulos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-800">Clasificación automática</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-800">Aplicación por módulo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-800">Filtrado inteligente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar lista de prioridades
  const renderPriorityList = () => {
    return (
      <div className="space-y-6">
        <PriorityFormInline
          isExpanded={isPriorityFormExpanded}
          setIsExpanded={setIsPriorityFormExpanded}
          editingPriority={editingPriority}
          priorityForm={priorityForm}
          setPriorityForm={setPriorityForm}
          savePriority={savePriority}
          cancelEditingPriority={cancelEditingPriority}
          availableColors={availableColors}
          availableIcons={availableIcons}
          showIconPicker={showIconPicker}
          setShowIconPicker={setShowIconPicker}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
        />
        <PriorityListView
          priorities={config.globalPriorities}
          availableIcons={availableIcons}
          startEditingPriority={startEditingPriority}
          setIsPriorityFormExpanded={setIsPriorityFormExpanded}
          deleteItem={deleteItem}
        />
      </div>
    );
  };

  // Renderizar lista de estados
  const renderStateList = () => {
    return (
      <div className="space-y-6">
        <StateFormInline
          isExpanded={isStateFormExpanded}
          setIsExpanded={setIsStateFormExpanded}
          editingState={editingState}
          stateForm={stateForm}
          setStateForm={setStateForm}
          saveState={saveState}
          cancelEditingState={cancelEditingState}
          availableColors={availableColors}
          availableIcons={availableIcons}
          showIconPicker={showIconPicker}
          setShowIconPicker={setShowIconPicker}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
        />
        <StateListView
          states={config.globalStates}
          availableIcons={availableIcons}
          startEditingState={startEditingState}
          setIsStateFormExpanded={setIsStateFormExpanded}
          deleteItem={deleteItem}
        />
      </div>
    );
  };

  // Renderizar lista de tags
  const renderTagList = () => {
    return (
      <div className="space-y-6">
        <TagFormInline
          isExpanded={isTagFormExpanded}
          setIsExpanded={setIsTagFormExpanded}
          editingTag={editingTag}
          tagForm={tagForm}
          setTagForm={setTagForm}
          saveTag={saveTag}
          cancelEditingTag={cancelEditingTag}
          availableColors={availableColors}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
        />
        <TagListView
          tags={config.globalTags}
          startEditingTag={startEditingTag}
          setIsTagFormExpanded={setIsTagFormExpanded}
          deleteItem={deleteItem}
        />
      </div>
    );
  };

  // Renderizar lista de proyectos con funcionalidad mejorada
  const renderProjectList = () => {
    return (
      <div className="space-y-6">
        {/* Formulario inline expandible para agregar/editar proyecto */}
        <ProjectFormInline
          isExpanded={isProjectFormExpanded}
          setIsExpanded={setIsProjectFormExpanded}
          editingProject={editingProject}
          projectForm={projectForm}
          setProjectForm={setProjectForm}
          saveProject={saveProject}
          cancelEditingProject={cancelEditingProject}
          availableColors={availableColors}
          availableIcons={availableIcons}
          showIconPicker={showIconPicker}
          setShowIconPicker={setShowIconPicker}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
        />

        {/* Lista de proyectos existentes */}
        <ProjectListView
          projects={config.globalProjects}
          availableIcons={availableIcons}
          startEditingProject={startEditingProject}
          setIsProjectFormExpanded={setIsProjectFormExpanded}
          deleteItem={deleteItem}
        />

        {/* Estadísticas de proyectos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Rocket className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">
                {config.globalProjects.filter(p => p.status === 'active').length}
              </span>
            </div>
            <p className="text-sm text-blue-700 font-medium">Proyectos Activos</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-900">
                {config.globalProjects.filter(p => p.status === 'planning').length}
              </span>
            </div>
            <p className="text-sm text-yellow-700 font-medium">En Planificación</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-900">
                {config.globalProjects.filter(p => p.status === 'completed').length}
              </span>
            </div>
            <p className="text-sm text-green-700 font-medium">Completados</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">
                {[...new Set(config.globalProjects.flatMap(p => p.team || []))].length}
              </span>
            </div>
            <p className="text-sm text-purple-700 font-medium">Miembros del Equipo</p>
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Sistema de Proyectos Inteligente</h4>
              <p className="text-sm text-blue-700">
                Los proyectos te permiten organizar y vincular todo tu contenido: notas de voz, reuniones, 
                recordatorios y tareas. Cada proyecto puede tener su propio equipo, fechas límite y estado de progreso.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-800">Etiquetas personalizadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-800">Gestión de equipo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-800">Control de fechas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-gray-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Configuración Global</h2>
              <p className="text-sm text-gray-100 mt-1">Personaliza estados, prioridades y categorías para todos los módulos</p>
            </div>
          </div>
          
          {/* Indicador de cambios */}
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur px-3 py-1.5 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Cambios sin guardar</span>
            </motion.div>
          )}
        </div>

        {/* Tabs de navegación */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-lg' 
                    : 'bg-white/10 backdrop-blur text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-white/20 text-white'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <AnimatePresence mode="wait">
        {/* Vista General / Inicio */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header de bienvenida */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Centro de Configuración Global
                  </h2>
                  <p className="text-gray-600">
                    Personaliza y administra todos los aspectos de tu sistema JARVI desde un solo lugar.
                    Las configuraciones que realices aquí se aplicarán a todos los módulos de la aplicación.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de opciones de configuración */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Estados */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('states')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                    <Layers className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {config.globalStates.length} items
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Estados</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Define los estados que pueden tener tus tareas, notas y proyectos.
                </p>
                <div className="flex flex-wrap gap-1">
                  {config.globalStates.slice(0, 3).map(state => (
                    <span key={state.id} className={`px-2 py-1 bg-${state.color}-100 text-${state.color}-700 text-xs rounded-full`}>
                      {state.name}
                    </span>
                  ))}
                  {config.globalStates.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{config.globalStates.length - 3} más
                    </span>
                  )}
                </div>
                <div className="mt-4 text-blue-600 text-sm font-medium group-hover:text-blue-700 flex items-center gap-1">
                  Configurar <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Prioridades */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('priorities')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                    <Flag className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                    {config.globalPriorities.length} niveles
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Prioridades</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Establece niveles de prioridad para organizar mejor tu trabajo.
                </p>
                <div className="flex flex-wrap gap-1">
                  {config.globalPriorities.slice(0, 3).map(priority => (
                    <span key={priority.id} className={`px-2 py-1 bg-${priority.color}-100 text-${priority.color}-700 text-xs rounded-full`}>
                      {priority.name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-orange-600 text-sm font-medium group-hover:text-orange-700 flex items-center gap-1">
                  Configurar <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Categorías */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('categories')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                    <Folder className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    {config.globalCategories.length} items
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Categorías</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Organiza tu contenido en categorías personalizadas.
                </p>
                <div className="flex flex-wrap gap-1">
                  {config.globalCategories.slice(0, 3).map(cat => (
                    <span key={cat.id} className={`px-2 py-1 bg-${cat.color}-100 text-${cat.color}-700 text-xs rounded-full`}>
                      {cat.name}
                    </span>
                  ))}
                  {config.globalCategories.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{config.globalCategories.length - 3} más
                    </span>
                  )}
                </div>
                <div className="mt-4 text-purple-600 text-sm font-medium group-hover:text-purple-700 flex items-center gap-1">
                  Configurar <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Proyectos */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('projects')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                    <Rocket className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {config.globalProjects.length} activos
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Proyectos</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Crea y gestiona proyectos para agrupar tu trabajo.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Activos</span>
                    <span className="font-semibold text-gray-700">
                      {config.globalProjects.filter(p => p.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">En planificación</span>
                    <span className="font-semibold text-gray-700">
                      {config.globalProjects.filter(p => p.status === 'planning').length}
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-green-600 text-sm font-medium group-hover:text-green-700 flex items-center gap-1">
                  Configurar <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Tags */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('tags')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
                    <Tag className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                    {config.globalTags.length} tags
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Etiquetas</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Sistema de etiquetado para clasificar rápidamente.
                </p>
                <div className="flex flex-wrap gap-1">
                  {config.globalTags.slice(0, 4).map(tag => (
                    <span key={tag.id} className="text-xs text-gray-600">
                      #{tag.name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-yellow-600 text-sm font-medium group-hover:text-yellow-700 flex items-center gap-1">
                  Configurar <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* API Keys */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('apikeys')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                    <Key className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    Seguro
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">API Keys</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Configura las claves de API para servicios externos.
                </p>
                <div className="space-y-1">
                  {Object.entries(config.apiKeys).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-600 capitalize">{key}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-red-600 text-sm font-medium group-hover:text-red-700 flex items-center gap-1">
                  Configurar <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            </div>

            {/* Sección de configuración avanzada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preferencias */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('preferences')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl">
                    <Sliders className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Preferencias</h3>
                    <p className="text-sm text-gray-600">
                      Personaliza el comportamiento general del sistema.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                </div>
              </motion.div>

              {/* Límites */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('limits')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl">
                    <Shield className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Límites del Sistema</h3>
                    <p className="text-sm text-gray-600">
                      Define límites y restricciones de uso.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-600" />
                </div>
              </motion.div>
            </div>

            {/* Backup y restauración */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Database className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Backup y Restauración</h3>
                    <p className="text-sm text-gray-600">Guarda y restaura tu configuración completa</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('backup')}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Gestionar Backups
                </button>
                <button
                  onClick={exportConfig}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Ahora
                </button>
              </div>
            </div>

            {/* Información del sistema */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Consejo</h4>
                  <p className="text-sm text-blue-700">
                    Todas las configuraciones se sincronizan automáticamente con todos los módulos. 
                    Los cambios que realices aquí se aplicarán inmediatamente en Notas, Tareas, Reuniones y más.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Estados */}
        {activeTab === 'states' && (
          <motion.div
            key="states"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderStateList()}
          </motion.div>
        )}

        {/* Prioridades */}
        {activeTab === 'priorities' && (
          <motion.div
            key="priorities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderPriorityList()}
          </motion.div>
        )}

        {/* Categorías */}
        {activeTab === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderCategoryList()}
          </motion.div>
        )}

        {/* Proyectos */}
        {activeTab === 'projects' && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderProjectList()}
          </motion.div>
        )}

        {/* Tags */}
        {activeTab === 'tags' && (
          <motion.div
            key="tags"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderTagList()}
          </motion.div>
        )}

        {/* API Keys */}
        {activeTab === 'apikeys' && (
          <motion.div
            key="apikeys"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {Object.entries(config.apiKeys).map(([key, value]) => (
              <div key={key} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Key className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                </div>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    apiKeys: { ...prev.apiKeys, [key]: e.target.value }
                  }))}
                  placeholder={`Ingresa tu API key de ${key}`}
                  className="w-full px-3 py-2 text-gray-900 bg-gray-50 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </motion.div>
        )}

        {/* Preferencias */}
        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Object.entries(config.preferences).map(([key, value]) => (
              <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {typeof value === 'boolean' ? (
                    <button
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, [key]: !value }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, [key]: e.target.value }
                      }))}
                      className="ml-2 px-2 py-1 text-gray-900 bg-gray-50 border border-gray-300 rounded text-sm w-24"
                    />
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Límites */}
        {activeTab === 'limits' && (
          <motion.div
            key="limits"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Object.entries(config.limits).map(([key, value]) => (
              <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 capitalize mb-2 block">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        limits: { ...prev.limits, [key]: parseInt(e.target.value) }
                      }))}
                      className="flex-1 px-3 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">
                      {key.includes('Size') ? 'MB' : key.includes('Length') || key.includes('Timeout') ? 'min' : ''}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </motion.div>
        )}

        {/* Backup */}
        {activeTab === 'backup' && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Download className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Exportar Configuración</h3>
              <p className="text-sm text-gray-600 mb-4">
                Descarga tu configuración actual como archivo JSON para respaldo
              </p>
              <button
                onClick={exportConfig}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Exportar
              </button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Upload className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Importar Configuración</h3>
              <p className="text-sm text-gray-600 mb-4">
                Carga un archivo JSON con configuración previa para restaurar
              </p>
              <label className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer inline-block">
                Importar
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfig}
                  className="hidden"
                />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante de guardar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 hover:shadow-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificación de éxito */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Configuración guardada exitosamente
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación para cambios sin guardar */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCancelAction}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Cambios sin guardar
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tienes cambios sin guardar en la configuración
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Qué deseas hacer con los cambios realizados?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmSaveAndContinue}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Guardar y continuar
                </button>

                <button
                  onClick={handleDiscardChanges}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Descartar cambios
                </button>

                <button
                  onClick={handleCancelAction}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsModule;