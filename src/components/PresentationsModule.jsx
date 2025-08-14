import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Mic,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Eye,
  Edit3,
  Trash2,
  Image,
  Film,
  Music,
  Type,
  Layout,
  Layers,
  Settings,
  Save,
  FileText,
  Sparkles,
  Wand2,
  Volume2,
  Copy,
  Move,
  Grid,
  List,
  Search,
  Filter,
  MoreVertical,
  Upload,
  Link,
  Code,
  Palette,
  Zap,
  TrendingUp,
  PresentationIcon,
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  Tag,
  Briefcase,
  GraduationCap,
  Target,
  Users,
  Globe,
  Lock,
  Unlock,
  Star,
  Heart,
  MessageCircle,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Gift,
  Cpu
} from 'lucide-react';
import axios from 'axios';

const PresentationsModule = () => {
  // Estados principales
  const [presentations, setPresentations] = useState([]);
  const [currentPresentation, setCurrentPresentation] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, edit
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Referencias
  const presentationRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Templates de presentación
  const presentationTemplates = [
    {
      id: 'modern',
      name: 'Moderno',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      description: 'Diseño minimalista y elegante'
    },
    {
      id: 'corporate',
      name: 'Corporativo',
      icon: Briefcase,
      color: 'from-blue-500 to-cyan-500',
      description: 'Profesional para negocios'
    },
    {
      id: 'creative',
      name: 'Creativo',
      icon: Palette,
      color: 'from-orange-500 to-red-500',
      description: 'Colorido y dinámico'
    },
    {
      id: 'tech',
      name: 'Tecnología',
      icon: Cpu,
      color: 'from-green-500 to-emerald-500',
      description: 'Futurista y moderno'
    },
    {
      id: 'sales',
      name: 'Ventas',
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-500',
      description: 'Orientado a conversión'
    },
    {
      id: 'marketing',
      name: 'Marketing',
      icon: Target,
      color: 'from-pink-500 to-rose-500',
      description: 'Impactante y persuasivo'
    }
  ];

  // Tipos de slides predefinidos
  const slideTypes = [
    { id: 'title', name: 'Título', icon: Type },
    { id: 'content', name: 'Contenido', icon: FileText },
    { id: 'image', name: 'Imagen', icon: Image },
    { id: 'video', name: 'Video', icon: Film },
    { id: 'chart', name: 'Gráfico', icon: BarChart3 },
    { id: 'quote', name: 'Cita', icon: MessageCircle },
    { id: 'comparison', name: 'Comparación', icon: Layout },
    { id: 'timeline', name: 'Línea de tiempo', icon: Activity }
  ];

  // Animaciones disponibles
  const animations = [
    { id: 'fade', name: 'Desvanecer' },
    { id: 'slide', name: 'Deslizar' },
    { id: 'zoom', name: 'Zoom' },
    { id: 'rotate', name: 'Rotar' },
    { id: 'flip', name: 'Voltear' },
    { id: 'bounce', name: 'Rebotar' }
  ];

  // Cargar presentaciones al montar
  useEffect(() => {
    loadPresentations();
  }, []);

  // Cargar presentaciones guardadas
  const loadPresentations = () => {
    const saved = localStorage.getItem('jarvi_presentations');
    if (saved) {
      setPresentations(JSON.parse(saved));
    }
  };

  // Guardar presentación
  const savePresentation = () => {
    if (!currentPresentation) return;
    
    const updatedPresentation = {
      ...currentPresentation,
      slides,
      updatedAt: new Date().toISOString()
    };
    
    const updatedPresentations = presentations.map(p =>
      p.id === currentPresentation.id ? updatedPresentation : p
    );
    
    setPresentations(updatedPresentations);
    localStorage.setItem('jarvi_presentations', JSON.stringify(updatedPresentations));
  };

  // Crear nueva presentación
  const createPresentation = () => {
    const newPresentation = {
      id: Date.now().toString(),
      title: 'Nueva Presentación',
      description: '',
      template: selectedTemplate,
      slides: [
        {
          id: '1',
          type: 'title',
          title: 'Título de la Presentación',
          subtitle: 'Subtítulo opcional',
          background: 'gradient',
          animation: 'fade',
          duration: 5,
          elements: []
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      category: 'general',
      isPublic: false,
      views: 0,
      likes: 0
    };
    
    const updatedPresentations = [...presentations, newPresentation];
    setPresentations(updatedPresentations);
    setCurrentPresentation(newPresentation);
    setSlides(newPresentation.slides);
    setCurrentSlideIndex(0);
    localStorage.setItem('jarvi_presentations', JSON.stringify(updatedPresentations));
  };

  // Iniciar/detener grabación de voz
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioFile(audioUrl);
          
          // Enviar a transcribir
          await transcribeAudio(audioBlob);
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error al iniciar grabación:', error);
      }
    } else {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Transcribir audio y generar slides
  const transcribeAudio = async (audioBlob) => {
    setIsGenerating(true);
    
    try {
      // Crear FormData para enviar el audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.ogg');
      
      // Transcribir con el servidor
      const response = await axios.post('http://localhost:3004/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { transcription: text } = response.data;
      setTranscription(text);
      
      // Generar slides con IA
      await generateSlidesFromText(text);
    } catch (error) {
      console.error('Error transcribiendo audio:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generar slides desde texto con IA
  const generateSlidesFromText = async (text) => {
    try {
      const response = await axios.post('http://localhost:3005/api/generate-presentation', {
        text,
        template: selectedTemplate,
        context: {
          category: filterCategory,
          style: 'professional',
          audience: 'general'
        }
      });
      
      if (response.data.success) {
        const generatedSlides = response.data.slides.map((slide, index) => ({
          id: Date.now().toString() + index,
          ...slide,
          animation: animations[Math.floor(Math.random() * animations.length)].id,
          duration: 5
        }));
        
        setSlides(generatedSlides);
        
        if (currentPresentation) {
          savePresentation();
        } else {
          createPresentation();
        }
      }
    } catch (error) {
      console.error('Error generando slides:', error);
      
      // Fallback: crear slides básicos desde el texto
      const sentences = text.split('.').filter(s => s.trim());
      const newSlides = sentences.map((sentence, index) => ({
        id: Date.now().toString() + index,
        type: index === 0 ? 'title' : 'content',
        title: index === 0 ? sentence.trim() : `Punto ${index}`,
        content: index > 0 ? sentence.trim() : '',
        animation: 'fade',
        duration: 5,
        elements: []
      }));
      
      setSlides(newSlides);
    }
  };

  // Agregar nuevo slide
  const addSlide = (type = 'content') => {
    const newSlide = {
      id: Date.now().toString(),
      type,
      title: '',
      content: '',
      animation: 'fade',
      duration: 5,
      elements: []
    };
    
    const updatedSlides = [...slides];
    updatedSlides.splice(currentSlideIndex + 1, 0, newSlide);
    setSlides(updatedSlides);
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  // Eliminar slide
  const deleteSlide = (index) => {
    if (slides.length <= 1) return;
    
    const updatedSlides = slides.filter((_, i) => i !== index);
    setSlides(updatedSlides);
    
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    }
  };

  // Duplicar slide
  const duplicateSlide = (index) => {
    const slideToDuplicate = slides[index];
    const newSlide = {
      ...slideToDuplicate,
      id: Date.now().toString(),
      title: slideToDuplicate.title + ' (copia)'
    };
    
    const updatedSlides = [...slides];
    updatedSlides.splice(index + 1, 0, newSlide);
    setSlides(updatedSlides);
  };

  // Navegar entre slides
  const navigateSlide = (direction) => {
    if (direction === 'prev' && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (direction === 'next' && currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  // Entrar/salir de modo presentación
  const togglePresentation = () => {
    if (!isPresenting) {
      if (presentationRef.current.requestFullscreen) {
        presentationRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsPresenting(!isPresenting);
  };

  // Exportar presentación
  const exportPresentation = (format = 'pdf') => {
    // Aquí implementarías la lógica de exportación
    console.log(`Exportando en formato ${format}`);
  };

  // Compartir presentación
  const sharePresentation = () => {
    // Generar link compartible
    const shareUrl = `${window.location.origin}/presentation/${currentPresentation?.id}`;
    navigator.clipboard.writeText(shareUrl);
  };

  // Renderizar slide según su tipo
  const renderSlide = (slide) => {
    const baseClasses = "w-full h-full flex flex-col justify-center items-center p-8 text-white";
    
    switch (slide.type) {
      case 'title':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-purple-600 to-pink-600`}>
            <h1 className="text-6xl font-bold mb-4">{slide.title}</h1>
            {slide.subtitle && (
              <p className="text-2xl opacity-90">{slide.subtitle}</p>
            )}
          </div>
        );
      
      case 'content':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-blue-600 to-cyan-600`}>
            <h2 className="text-4xl font-bold mb-6">{slide.title}</h2>
            <p className="text-xl max-w-3xl text-center">{slide.content}</p>
          </div>
        );
      
      case 'image':
        return (
          <div className={`${baseClasses} bg-black`}>
            {slide.image ? (
              <img src={slide.image} alt={slide.title} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center">
                <Image className="w-32 h-32 text-gray-400 mb-4" />
                <p className="text-gray-400">Haz clic para agregar imagen</p>
              </div>
            )}
            {slide.title && (
              <h3 className="text-2xl font-bold mt-4">{slide.title}</h3>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className={`${baseClasses} bg-black`}>
            {slide.video ? (
              <video controls className="max-w-full max-h-full">
                <source src={slide.video} type="video/mp4" />
              </video>
            ) : (
              <div className="flex flex-col items-center">
                <Film className="w-32 h-32 text-gray-400 mb-4" />
                <p className="text-gray-400">Haz clic para agregar video</p>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-gray-700 to-gray-900`}>
            <p className="text-xl">Slide en construcción</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <PresentationIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Presentaciones</h1>
                <p className="text-gray-400">Crea presentaciones impactantes con IA</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botón de grabación */}
              <button
                onClick={toggleRecording}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                }`}
              >
                <Mic className="w-5 h-5" />
                {isRecording ? 'Detener Grabación' : 'Grabar Presentación'}
              </button>
              
              {/* Botón crear nueva */}
              <button
                onClick={createPresentation}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl text-white font-medium transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nueva Presentación
              </button>
            </div>
          </div>
        </motion.div>

        {/* Vista de presentaciones o editor */}
        {!currentPresentation ? (
          // Lista de presentaciones
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Templates */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700 cursor-pointer hover:border-purple-500 transition-all"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <div className="flex items-center justify-between mb-4">
                <Wand2 className="w-8 h-8 text-purple-400" />
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Plantillas</h3>
              <p className="text-gray-400 text-sm">Elige un diseño para comenzar</p>
            </motion.div>

            {/* Presentaciones existentes */}
            {presentations.map((presentation) => (
              <motion.div
                key={presentation.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700 cursor-pointer hover:border-blue-500 transition-all"
                onClick={() => {
                  setCurrentPresentation(presentation);
                  setSlides(presentation.slides || []);
                  setCurrentSlideIndex(0);
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <PresentationIcon className="w-8 h-8 text-blue-400" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Duplicar presentación
                      }}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Eliminar presentación
                        const updatedPresentations = presentations.filter(p => p.id !== presentation.id);
                        setPresentations(updatedPresentations);
                        localStorage.setItem('jarvi_presentations', JSON.stringify(updatedPresentations));
                      }}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{presentation.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{presentation.description || 'Sin descripción'}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{presentation.slides?.length || 0} slides</span>
                  <span>{new Date(presentation.updatedAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // Editor de presentación
          <div className="grid grid-cols-12 gap-6">
            {/* Panel lateral - Miniaturas de slides */}
            <div className="col-span-3 bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Slides</h3>
                <button
                  onClick={() => addSlide()}
                  className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {slides.map((slide, index) => (
                  <motion.div
                    key={slide.id}
                    whileHover={{ scale: 1.02 }}
                    className={`relative group cursor-pointer p-2 rounded-lg transition-all ${
                      index === currentSlideIndex 
                        ? 'bg-purple-500/20 border-2 border-purple-500' 
                        : 'bg-gray-700/50 border-2 border-transparent hover:border-gray-600'
                    }`}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <div className="aspect-video bg-gray-900 rounded overflow-hidden mb-2">
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        Slide {index + 1}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {slide.type === 'title' ? 'Título' : slide.type}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSlide(index);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSlide(index);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Editor principal */}
            <div className="col-span-6">
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 overflow-hidden">
                {/* Toolbar */}
                <div className="bg-gray-900/50 p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {slideTypes.map(type => (
                        <button
                          key={type.id}
                          onClick={() => addSlide(type.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
                          title={type.name}
                        >
                          <type.icon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={savePresentation}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={togglePresentation}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Maximize2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview del slide actual */}
                <div 
                  ref={presentationRef}
                  className="aspect-video bg-black relative"
                >
                  {slides[currentSlideIndex] && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSlideIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full"
                      >
                        {renderSlide(slides[currentSlideIndex])}
                      </motion.div>
                    </AnimatePresence>
                  )}
                  
                  {/* Controles de navegación */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                    <button
                      onClick={() => navigateSlide('prev')}
                      disabled={currentSlideIndex === 0}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-white text-sm">
                      {currentSlideIndex + 1} / {slides.length}
                    </span>
                    <button
                      onClick={() => navigateSlide('next')}
                      disabled={currentSlideIndex === slides.length - 1}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Editor de contenido del slide */}
              {slides[currentSlideIndex] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700"
                >
                  <h3 className="text-white font-medium mb-4">Editar Slide</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Título</label>
                      <input
                        type="text"
                        value={slides[currentSlideIndex].title || ''}
                        onChange={(e) => {
                          const updatedSlides = [...slides];
                          updatedSlides[currentSlideIndex].title = e.target.value;
                          setSlides(updatedSlides);
                        }}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Título del slide"
                      />
                    </div>
                    
                    {slides[currentSlideIndex].type === 'content' && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Contenido</label>
                        <textarea
                          value={slides[currentSlideIndex].content || ''}
                          onChange={(e) => {
                            const updatedSlides = [...slides];
                            updatedSlides[currentSlideIndex].content = e.target.value;
                            setSlides(updatedSlides);
                          }}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                          rows={4}
                          placeholder="Contenido del slide"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-2">Animación</label>
                        <select
                          value={slides[currentSlideIndex].animation || 'fade'}
                          onChange={(e) => {
                            const updatedSlides = [...slides];
                            updatedSlides[currentSlideIndex].animation = e.target.value;
                            setSlides(updatedSlides);
                          }}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          {animations.map(anim => (
                            <option key={anim.id} value={anim.id}>{anim.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-2">Duración (seg)</label>
                        <input
                          type="number"
                          value={slides[currentSlideIndex].duration || 5}
                          onChange={(e) => {
                            const updatedSlides = [...slides];
                            updatedSlides[currentSlideIndex].duration = parseInt(e.target.value);
                            setSlides(updatedSlides);
                          }}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Panel derecho - Propiedades y elementos */}
            <div className="col-span-3 space-y-4">
              {/* Propiedades de la presentación */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-medium mb-4">Propiedades</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Título</label>
                    <input
                      type="text"
                      value={currentPresentation?.title || ''}
                      onChange={(e) => {
                        setCurrentPresentation({
                          ...currentPresentation,
                          title: e.target.value
                        });
                      }}
                      className="w-full px-3 py-1.5 bg-gray-700 text-white rounded text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Plantilla</label>
                    <select
                      value={currentPresentation?.template || 'modern'}
                      onChange={(e) => {
                        setCurrentPresentation({
                          ...currentPresentation,
                          template: e.target.value
                        });
                      }}
                      className="w-full px-3 py-1.5 bg-gray-700 text-white rounded text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      {presentationTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Elementos multimedia */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-medium mb-4">Elementos</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                    <Image className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400">Imagen</span>
                  </button>
                  <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                    <Film className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400">Video</span>
                  </button>
                  <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                    <Music className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400">Audio</span>
                  </button>
                  <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-1">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400">Gráfico</span>
                  </button>
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-medium mb-4">Acciones</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setIsPresenting(true)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Presentar
                  </button>
                  
                  <button
                    onClick={sharePresentation}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </button>
                  
                  <button
                    onClick={() => exportPresentation('pdf')}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de generación */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">Generando Presentación</h3>
                <p className="text-gray-400 text-center">
                  La IA está creando slides basados en tu audio...
                </p>
                {transcription && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-300">{transcription}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modo presentación */}
        {isPresenting && (
          <div className="fixed inset-0 bg-black z-50">
            <div className="w-full h-full relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlideIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  {slides[currentSlideIndex] && renderSlide(slides[currentSlideIndex])}
                </motion.div>
              </AnimatePresence>
              
              {/* Controles de presentación */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-6">
                <button
                  onClick={() => navigateSlide('prev')}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                
                <div className="flex items-center gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlideIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlideIndex 
                          ? 'w-8 bg-white' 
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => navigateSlide('next')}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
              
              {/* Botón salir */}
              <button
                onClick={() => setIsPresenting(false)}
                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationsModule;