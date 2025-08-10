import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Upload, 
  FileAudio,
  Play,
  Pause,
  Download,
  Trash2,
  FileText,
  Mail,
  Edit,
  Save,
  X,
  Clock,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Copy,
  Share,
  Eye,
  EyeOff,
  Star,
  Filter,
  Search,
  Plus,
  Mic,
  Volume2,
  RotateCcw,
  Settings,
  User,
  MapPin
} from 'lucide-react';
import axios from 'axios';

const MeetingsModule = () => {
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      title: "Reunión de Planning Sprint 2025-Q1",
      date: "2025-01-09T14:00:00",
      duration: 3600, // segundos
      participants: ["Juan Pérez", "María García", "Carlos López"],
      audioFile: "meeting_1_planning.mp3",
      status: "completed", // uploaded, transcribing, completed, error
      transcription: "En esta reunión discutimos los objetivos del primer trimestre de 2025. Se establecieron las prioridades del sprint, incluyendo la implementación del módulo de transcripción automática y la mejora de la interfaz de usuario. Juan propuso optimizar el rendimiento del sistema...",
      summary: "Reunión de planificación donde se definieron objetivos Q1 2025, prioridades del sprint y mejoras de rendimiento.",
      keyPoints: [
        "Implementar módulo de transcripción automática",
        "Mejorar interfaz de usuario",
        "Optimizar rendimiento del sistema",
        "Establecer métricas de calidad"
      ],
      actionItems: [
        { task: "Crear mockups de nueva UI", assignee: "María García", deadline: "2025-01-15" },
        { task: "Investigar APIs de transcripción", assignee: "Juan Pérez", deadline: "2025-01-12" },
        { task: "Definir métricas de rendimiento", assignee: "Carlos López", deadline: "2025-01-18" }
      ],
      emailDraft: null,
      starred: true,
      tags: ["sprint", "planning", "Q1"]
    }
  ]);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    participants: '',
    tags: ''
  });

  const [emailTemplate, setEmailTemplate] = useState({
    to: '',
    cc: '',
    subject: '',
    body: ''
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Por favor selecciona un archivo de audio válido');
      return;
    }

    // Simular upload y procesamiento
    setUploadingFile({
      name: file.name,
      size: file.size,
      progress: 0
    });

    // Simular progreso de upload
    const uploadInterval = setInterval(() => {
      setUploadingFile(prev => {
        if (prev.progress >= 100) {
          clearInterval(uploadInterval);
          
          // Crear nueva reunión
          const meeting = {
            id: Date.now(),
            title: newMeeting.title || `Reunión ${new Date().toLocaleDateString()}`,
            date: newMeeting.date || new Date().toISOString(),
            duration: 0,
            participants: newMeeting.participants.split(',').map(p => p.trim()).filter(p => p),
            audioFile: file.name,
            status: 'transcribing',
            transcription: '',
            summary: '',
            keyPoints: [],
            actionItems: [],
            emailDraft: null,
            starred: false,
            tags: newMeeting.tags.split(',').map(t => t.trim()).filter(t => t)
          };

          setMeetings(prev => [meeting, ...prev]);
          
          // Simular transcripción
          setTimeout(() => {
            processTranscription(meeting.id);
          }, 3000);

          setUploadingFile(null);
          setShowUploadForm(false);
          setNewMeeting({ title: '', date: '', participants: '', tags: '' });
          
          return prev;
        }
        return { ...prev, progress: prev.progress + 10 };
      });
    }, 200);
  };

  const processTranscription = (meetingId) => {
    setMeetings(prev => prev.map(meeting => {
      if (meeting.id === meetingId) {
        const sampleTranscription = `Transcripción automática de la reunión. En esta sesión se discutieron varios temas importantes relacionados con el desarrollo del proyecto. Los participantes intercambiaron ideas sobre las mejoras propuestas y se establecieron los próximos pasos a seguir. Se identificaron las prioridades clave y se asignaron responsabilidades específicas a cada miembro del equipo.`;
        
        const sampleSummary = "Reunión de seguimiento del proyecto donde se definieron prioridades y asignaron tareas específicas al equipo.";
        
        const sampleKeyPoints = [
          "Revisión del progreso actual del proyecto",
          "Identificación de mejoras necesarias",
          "Asignación de responsabilidades",
          "Establecimiento de próximos pasos"
        ];

        const sampleActionItems = [
          { task: "Revisar documentación técnica", assignee: "Pendiente asignar", deadline: "2025-01-20" },
          { task: "Preparar presentación de avances", assignee: "Pendiente asignar", deadline: "2025-01-25" }
        ];

        return {
          ...meeting,
          status: 'completed',
          transcription: sampleTranscription,
          summary: sampleSummary,
          keyPoints: sampleKeyPoints,
          actionItems: sampleActionItems,
          duration: 2400 // 40 minutos
        };
      }
      return meeting;
    }));
  };

  const generateEmailDraft = (meeting) => {
    const subject = `Minuta: ${meeting.title}`;
    const body = `
Estimados participantes,

Adjunto encuentran la minuta de la reunión "${meeting.title}" realizada el ${new Date(meeting.date).toLocaleDateString('es-ES')}.

## Resumen
${meeting.summary}

## Puntos Clave Discutidos
${meeting.keyPoints.map(point => `• ${point}`).join('\n')}

## Acciones a Realizar
${meeting.actionItems.map(item => `• ${item.task} (Responsable: ${item.assignee}, Fecha: ${item.deadline})`).join('\n')}

## Transcripción Completa
${meeting.transcription}

Saludos,
Generado automáticamente por JARVI
`;

    return {
      to: meeting.participants.join(', '),
      cc: '',
      subject,
      body
    };
  };

  const openEmailModal = (meeting) => {
    const draft = generateEmailDraft(meeting);
    setEmailTemplate(draft);
    setShowEmailModal(meeting.id);
  };

  const playAudio = (meeting) => {
    if (audioRef.current) {
      if (currentlyPlaying === meeting.id) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      } else {
        // Simular reproducción de audio
        setCurrentlyPlaying(meeting.id);
        // En una implementación real, aquí cargarías el archivo de audio
        console.log(`Reproduciendo: ${meeting.audioFile}`);
      }
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || meeting.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    uploaded: 'blue',
    transcribing: 'yellow',
    completed: 'green',
    error: 'red'
  };

  const statusLabels = {
    uploaded: 'Subido',
    transcribing: 'Transcribiendo',
    completed: 'Completado',
    error: 'Error'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Reuniones</h2>
              <p className="text-sm text-gray-500">Transcribe, resume y genera minutas de tus reuniones</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Subir Audio de Reunión
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{meetings.length}</div>
            <div className="text-sm text-purple-700">Total Reuniones</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{meetings.filter(m => m.status === 'completed').length}</div>
            <div className="text-sm text-green-700">Procesadas</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600">{meetings.filter(m => m.status === 'transcribing').length}</div>
            <div className="text-sm text-yellow-700">En Proceso</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{meetings.filter(m => m.starred).length}</div>
            <div className="text-sm text-blue-700">Favoritas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar reuniones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos los estados</option>
            <option value="completed">Completadas</option>
            <option value="transcribing">En proceso</option>
            <option value="uploaded">Subidas</option>
            <option value="error">Con errores</option>
          </select>
        </div>
      </div>

      {/* Formulario de subida */}
      {showUploadForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir Audio de Reunión</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Reunión</label>
              <input
                type="text"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                placeholder="Ej: Reunión de Planning Q1 2025"
                className="w-full px-3 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                className="w-full px-3 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Participantes (separados por comas)</label>
              <input
                type="text"
                value={newMeeting.participants}
                onChange={(e) => setNewMeeting({...newMeeting, participants: e.target.value})}
                placeholder="Juan Pérez, María García, Carlos López"
                className="w-full px-3 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por comas)</label>
              <input
                type="text"
                value={newMeeting.tags}
                onChange={(e) => setNewMeeting({...newMeeting, tags: e.target.value})}
                placeholder="sprint, planning, Q1"
                className="w-full px-3 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Área de subida de archivo */}
          <div 
            className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileAudio className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">Arrastra tu archivo de audio aquí</p>
            <p className="text-sm text-gray-500 mt-2">o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400 mt-2">Formatos soportados: MP3, WAV, M4A, OGG (máx. 500MB)</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowUploadForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* Indicador de subida */}
      {uploadingFile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Subiendo: {uploadingFile.name}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadingFile.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{uploadingFile.progress}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de reuniones */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredMeetings.map((meeting) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meeting.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                      meeting.status === 'transcribing' ? 'bg-yellow-100 text-yellow-700' :
                      meeting.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {meeting.status === 'transcribing' && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                      {statusLabels[meeting.status]}
                    </span>

                    {meeting.starred && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(meeting.date)}
                    </div>
                    {meeting.duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(meeting.duration)}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {meeting.participants.length} participantes
                    </div>
                  </div>

                  {/* Participantes */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {meeting.participants.map((participant, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {participant}
                      </span>
                    ))}
                  </div>

                  {/* Tags */}
                  {meeting.tags && meeting.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {meeting.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Resumen */}
                  {meeting.summary && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Resumen</h4>
                      <p className="text-sm text-gray-700">{meeting.summary}</p>
                    </div>
                  )}

                  {/* Puntos clave */}
                  {meeting.keyPoints && meeting.keyPoints.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Puntos Clave</h4>
                      <ul className="space-y-1">
                        {meeting.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Items de acción */}
                  {meeting.actionItems && meeting.actionItems.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Acciones a Realizar</h4>
                      <ul className="space-y-2">
                        {meeting.actionItems.map((item, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{item.task}</span>
                              <div className="text-xs text-gray-500">
                                Responsable: {item.assignee} | Fecha: {item.deadline}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 ml-4">
                  {meeting.audioFile && (
                    <button
                      onClick={() => playAudio(meeting)}
                      className={`p-2 rounded-lg transition-colors ${
                        currentlyPlaying === meeting.id
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                      title="Reproducir audio"
                    >
                      {currentlyPlaying === meeting.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {meeting.status === 'completed' && (
                    <button
                      onClick={() => openEmailModal(meeting)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Enviar por email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedMeeting(meeting)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMeetings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No hay reuniones que coincidan con los filtros'
                : 'No tienes reuniones aún. ¡Sube tu primera grabación!'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enviar Minuta por Email</h3>
              <button
                onClick={() => setShowEmailModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Para</label>
                <input
                  type="email"
                  value={emailTemplate.to}
                  onChange={(e) => setEmailTemplate({...emailTemplate, to: e.target.value})}
                  className="w-full px-3 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="destinatario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                <input
                  type="email"
                  value={emailTemplate.cc}
                  onChange={(e) => setEmailTemplate({...emailTemplate, cc: e.target.value})}
                  className="w-full px-3 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="copia@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <input
                  type="text"
                  value={emailTemplate.subject}
                  onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                  className="w-full px-3 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  value={emailTemplate.body}
                  onChange={(e) => setEmailTemplate({...emailTemplate, body: e.target.value})}
                  rows={12}
                  className="w-full px-3 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={async () => {
                  try {
                    const selectedMeeting = meetings.find(m => m.id === showEmailModal);
                    if (!selectedMeeting) return;

                    const response = await fetch('http://localhost:3001/api/send-meeting-email', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        meetingId: selectedMeeting.id,
                        recipients: emailTemplate.to.split(',').map(email => email.trim()),
                        meetingData: selectedMeeting
                      })
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                      alert(`✅ Minuta enviada exitosamente a: ${result.recipients}`);
                      // Marcar como enviada
                      setMeetings(prev => prev.map(meeting => 
                        meeting.id === selectedMeeting.id 
                          ? { ...meeting, emailSent: true }
                          : meeting
                      ));
                    } else {
                      alert(`❌ Error enviando email: ${result.error}`);
                    }
                  } catch (error) {
                    console.error('Error enviando email:', error);
                    alert('❌ Error enviando email. Revisa la configuración.');
                  }
                  setShowEmailModal(null);
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar Email
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(emailTemplate.body);
                  alert('Contenido copiado al portapapeles');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
              
              <button
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Audio Player oculto */}
      <audio 
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        className="hidden"
      />
    </div>
  );
};

export default MeetingsModule;