import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Tag,
  Hash,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  X,
  Plus,
  FileText,
  Wand2
} from 'lucide-react';
import axios from 'axios';

const PromptNameGenerator = ({ 
  content, 
  projectName = '',
  onNameGenerated,
  classification = null,
  initialTags = [] 
}) => {
  const [generatedName, setGeneratedName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [copied, setCopied] = useState(false);

  // Formato de fecha
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (content && content.length > 10) {
      generateNameAndTags();
    }
  }, [content]);

  useEffect(() => {
    // Usar tags de la clasificación si están disponibles
    if (classification?.tags) {
      setAvailableTags(classification.tags);
      // Auto-seleccionar los primeros 3 tags más relevantes
      setSelectedTags(classification.tags.slice(0, 3));
    } else if (initialTags.length > 0) {
      setAvailableTags(initialTags);
      setSelectedTags(initialTags.slice(0, 3));
    }
  }, [classification, initialTags]);

  const generateNameAndTags = async () => {
    setIsGenerating(true);
    
    try {
      // Si ya tenemos clasificación, usarla
      if (classification) {
        handleClassificationData(classification);
      } else {
        // Llamar al servidor de clasificación
        const response = await axios.post('http://localhost:3005/api/classify', {
          content: content,
          context: { currentProject: projectName }
        });
        
        if (response.data.success) {
          handleClassificationData(response.data.classification);
        }
      }
    } catch (error) {
      console.error('Error generando nombre:', error);
      // Fallback a generación local
      generateLocalName();
    }
    
    setIsGenerating(false);
  };

  const handleClassificationData = (classificationData) => {
    // Usar el título sugerido por la IA
    if (classificationData.suggestedTitle) {
      const cleanTitle = generateCleanDescription(classificationData.suggestedTitle);
      setDescription(cleanTitle);
      setEditableDescription(cleanTitle);
    }
    
    // Usar tags de la clasificación
    if (classificationData.tags) {
      setAvailableTags(classificationData.tags);
      // Seleccionar automáticamente los primeros 5 tags
      setSelectedTags(classificationData.tags.slice(0, 5));
    }
    
    // Generar el nombre completo
    updateGeneratedName();
  };

  const generateCleanDescription = (text) => {
    // Limpiar y acortar la descripción
    let clean = text
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/gi, '') // Eliminar caracteres especiales
      .trim()
      .split(' ')
      .slice(0, 10) // Máximo 10 palabras
      .join('');
    
    // Convertir a PascalCase
    clean = clean
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    
    return clean;
  };

  const generateLocalName = () => {
    // Generación local de nombre basada en las primeras palabras
    const words = content.trim().split(' ').slice(0, 5);
    const cleanDesc = words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
    
    setDescription(cleanDesc);
    setEditableDescription(cleanDesc);
    
    // Extraer tags básicos
    const basicTags = extractBasicTags(content);
    setAvailableTags(basicTags);
    setSelectedTags(basicTags.slice(0, 3));
    
    updateGeneratedName();
  };

  const extractBasicTags = (text) => {
    const tags = [];
    const lowerText = text.toLowerCase();
    
    // Palabras clave comunes
    const keywords = {
      'react': ['react', 'componente', 'hooks', 'jsx'],
      'api': ['api', 'endpoint', 'servidor', 'backend'],
      'database': ['base de datos', 'database', 'sql', 'mongodb'],
      'frontend': ['frontend', 'ui', 'interfaz', 'diseño'],
      'bugfix': ['error', 'bug', 'fix', 'arreglar'],
      'feature': ['nueva', 'función', 'añadir', 'implementar'],
      'refactor': ['mejorar', 'optimizar', 'refactorizar'],
      'test': ['test', 'prueba', 'testing'],
      'docs': ['documentación', 'documento', 'readme']
    };
    
    Object.entries(keywords).forEach(([tag, words]) => {
      if (words.some(word => lowerText.includes(word))) {
        tags.push(tag);
      }
    });
    
    // Añadir proyecto si se menciona
    if (projectName) {
      tags.unshift(projectName.toLowerCase().replace(/\s+/g, ''));
    }
    
    return tags;
  };

  const updateGeneratedName = () => {
    const date = getCurrentDate();
    const desc = editableDescription || description || 'Prompt';
    const tags = selectedTags.length > 0 ? '_' + selectedTags.join('_') : '';
    
    const fullName = `${date}_${desc}${tags}`;
    setGeneratedName(fullName);
    
    // Notificar al componente padre
    if (onNameGenerated) {
      onNameGenerated(fullName, selectedTags);
    }
  };

  useEffect(() => {
    updateGeneratedName();
  }, [description, editableDescription, selectedTags]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !availableTags.includes(customTag)) {
      const cleanTag = customTag.toLowerCase().replace(/\s+/g, '');
      setAvailableTags([...availableTags, cleanTag]);
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, cleanTag]);
      }
      setCustomTag('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Nombre Generado - Preview Principal */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg p-4 border border-indigo-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-medium text-white">Nombre del Prompt Generado</h4>
          </div>
          
          <div className="flex items-center gap-2">
            {isGenerating && (
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
            )}
            <button
              onClick={generateNameAndTags}
              className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded transition-colors"
              title="Regenerar nombre"
            >
              <Wand2 className="w-4 h-4" />
            </button>
            <button
              onClick={copyToClipboard}
              className={`p-1.5 rounded transition-colors ${
                copied 
                  ? 'bg-green-600/20 text-green-400' 
                  : 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-400'
              }`}
              title="Copiar nombre"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Visualización del nombre con colores */}
        <div className="font-mono text-sm bg-black/30 rounded-lg p-3 overflow-x-auto">
          <span className="text-cyan-400">{getCurrentDate()}</span>
          <span className="text-gray-500">_</span>
          <span className="text-green-400">{editableDescription || description || 'Prompt'}</span>
          {selectedTags.length > 0 && (
            <>
              <span className="text-gray-500">_</span>
              {selectedTags.map((tag, index) => (
                <React.Fragment key={tag}>
                  <span className="text-yellow-400">{tag}</span>
                  {index < selectedTags.length - 1 && <span className="text-gray-500">_</span>}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Editor de Descripción */}
      <div className="bg-gray-800/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400 flex items-center gap-1">
            <Edit3 className="w-3 h-3" />
            Descripción (máx. 10 palabras)
          </label>
          <button
            onClick={() => setIsEditingDescription(!isEditingDescription)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isEditingDescription ? 'Aplicar' : 'Editar'}
          </button>
        </div>
        
        {isEditingDescription ? (
          <input
            type="text"
            value={editableDescription}
            onChange={(e) => {
              const words = e.target.value.split(' ');
              if (words.length <= 10) {
                setEditableDescription(e.target.value);
              }
            }}
            onBlur={() => setIsEditingDescription(false)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Descripción concisa..."
            autoFocus
          />
        ) : (
          <div className="px-3 py-2 bg-gray-700/50 rounded text-sm text-gray-300">
            {editableDescription || description || 'Sin descripción'}
          </div>
        )}
      </div>

      {/* Selector de Tags */}
      <div className="bg-gray-800/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-gray-400 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Tags ({selectedTags.length}/5 seleccionados)
          </label>
          <button
            onClick={() => setShowTagSelector(!showTagSelector)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            {showTagSelector ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showTagSelector ? 'Cerrar' : 'Gestionar'}
          </button>
        </div>

        {/* Tags Seleccionados */}
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedTags.map(tag => (
            <motion.span
              key={tag}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded-full text-xs flex items-center gap-1 cursor-pointer hover:bg-indigo-600/40 transition-colors"
              onClick={() => toggleTag(tag)}
            >
              #{tag}
              <X className="w-3 h-3" />
            </motion.span>
          ))}
          {selectedTags.length === 0 && (
            <span className="text-xs text-gray-500 italic">No hay tags seleccionados</span>
          )}
        </div>

        {/* Panel de Tags Disponibles */}
        <AnimatePresence>
          {showTagSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 p-3 bg-gray-700/30 rounded-lg"
            >
              <p className="text-xs text-gray-400 mb-2">Tags disponibles (click para añadir/quitar):</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    disabled={!selectedTags.includes(tag) && selectedTags.length >= 5}
                    className={`px-2 py-1 rounded-full text-xs transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-indigo-600/40 text-indigo-300 hover:bg-indigo-600/50'
                        : 'bg-gray-600/30 text-gray-400 hover:bg-gray-600/50 disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Añadir Tag Personalizado */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCustomTag();
                    }
                  }}
                  placeholder="Añadir tag personalizado..."
                  className="flex-1 px-3 py-1.5 bg-gray-700 text-white rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  onClick={addCustomTag}
                  disabled={!customTag.trim() || selectedTags.length >= 5}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Información y Tips */}
      <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-blue-300 font-medium mb-1">Formato del nombre:</p>
            <p className="text-xs text-gray-400">
              [YYYY-MM-DD]_[Descripción]_[Tags]
            </p>
            <p className="text-xs text-gray-500 mt-1">
              • Fecha actual para ordenación cronológica<br />
              • Descripción concisa (máx. 10 palabras)<br />
              • Hasta 5 tags para categorización<br />
              • Formato optimizado para búsqueda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptNameGenerator;