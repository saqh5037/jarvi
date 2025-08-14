import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Code,
  Highlighter,
  Palette,
  Hash,
  AtSign,
  Flame,
  AlertTriangle,
  Zap,
  Circle,
  CheckCircle2,
  Star,
  Target,
  Send
} from 'lucide-react';

const EnhancedTextEditor = ({ value = '', onChange, placeholder = "Escribe tu comentario..." }) => {
  const [content, setContent] = useState(value);
  const textareaRef = useRef(null);
  const [showFormatting, setShowFormatting] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  
  // Actualizar contenido cuando cambia el valor externo
  useEffect(() => {
    setContent(value);
  }, [value]);

  // Manejar cambios en el textarea
  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange(newContent);
  };

  // Insertar texto en la posición del cursor
  const insertAtCursor = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    
    const newContent = before + text + after;
    setContent(newContent);
    onChange(newContent);
    
    // Restaurar el cursor después del texto insertado
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Envolver texto seleccionado con formato
  const wrapSelection = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    if (selectedText) {
      const beforeText = content.substring(0, start);
      const afterText = content.substring(end);
      const newContent = beforeText + before + selectedText + after + afterText;
      
      setContent(newContent);
      onChange(newContent);
      
      // Restaurar selección
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, end + before.length);
      }, 0);
    } else {
      // Si no hay selección, insertar el formato con placeholder
      insertAtCursor(before + 'texto' + after);
    }
  };

  // Colores y estilos
  const colors = [
    { code: '#000000', name: 'Negro' },
    { code: '#EF4444', name: 'Rojo' },
    { code: '#F59E0B', name: 'Naranja' },
    { code: '#10B981', name: 'Verde' },
    { code: '#3B82F6', name: 'Azul' },
    { code: '#8B5CF6', name: 'Púrpura' }
  ];

  const IconButton = ({ onClick, icon: Icon, title, className = "" }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-700 ${className}`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const PriorityButton = ({ icon: Icon, text, color, hoverColor, label }) => (
    <button
      type="button"
      onClick={() => insertAtCursor(text)}
      className={`p-1 hover:${hoverColor} rounded transition-colors group flex items-center gap-1`}
      title={label}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs ${color.replace('text-', 'text-')} hidden group-hover:inline`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="border-2 border-indigo-200 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Barra de herramientas */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 p-2">
        {/* Primera línea: Formato de texto */}
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
            <IconButton
              onClick={() => wrapSelection('**', '**')}
              icon={Bold}
              title="Negrita"
            />
            <IconButton
              onClick={() => wrapSelection('_', '_')}
              icon={Italic}
              title="Cursiva"
            />
            <IconButton
              onClick={() => wrapSelection('__', '__')}
              icon={UnderlineIcon}
              title="Subrayado"
            />
          </div>

          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
            <IconButton
              onClick={() => insertAtCursor('\n• ')}
              icon={List}
              title="Lista"
            />
            <IconButton
              onClick={() => wrapSelection('`', '`')}
              icon={Code}
              title="Código"
            />
            <IconButton
              onClick={() => wrapSelection('==', '==')}
              icon={Highlighter}
              title="Resaltar"
            />
          </div>

          {/* Iconos de prioridad estilo JARVI */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 mr-1">Prioridad:</span>
            <PriorityButton
              icon={Flame}
              text="🔥 [URGENTE] "
              color="text-red-500"
              hoverColor="bg-red-100"
              label="Urgente"
            />
            <PriorityButton
              icon={AlertTriangle}
              text="⚠️ [ALTA] "
              color="text-orange-500"
              hoverColor="bg-orange-100"
              label="Alta"
            />
            <PriorityButton
              icon={Zap}
              text="⚡ [MEDIA] "
              color="text-yellow-500"
              hoverColor="bg-yellow-100"
              label="Media"
            />
            <PriorityButton
              icon={Circle}
              text="⭕ [BAJA] "
              color="text-green-500"
              hoverColor="bg-green-100"
              label="Baja"
            />
          </div>

          <div className="border-l border-gray-300 pl-2 ml-2 flex gap-1">
            <IconButton
              onClick={() => insertAtCursor('✅ ')}
              icon={CheckCircle2}
              title="Completado"
              className="hover:bg-green-100"
            />
            <IconButton
              onClick={() => insertAtCursor('⭐ ')}
              icon={Star}
              title="Importante"
              className="hover:bg-purple-100"
            />
            <IconButton
              onClick={() => insertAtCursor('🎯 ')}
              icon={Target}
              title="Objetivo"
              className="hover:bg-blue-100"
            />
          </div>
        </div>

        {/* Segunda línea: Etiquetas */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-600">Etiquetas:</span>
          
          {['#importante', '#revisar', '#pregunta', '#idea', '#completado'].map((tag) => {
            const colors = {
              '#importante': 'bg-red-100 text-red-700 hover:bg-red-200',
              '#revisar': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
              '#pregunta': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
              '#idea': 'bg-purple-100 text-purple-700 hover:bg-purple-200',
              '#completado': 'bg-green-100 text-green-700 hover:bg-green-200'
            };
            
            return (
              <button
                key={tag}
                type="button"
                onClick={() => insertAtCursor(tag + ' ')}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${colors[tag]}`}
              >
                {tag}
              </button>
            );
          })}
          
          <button
            type="button"
            onClick={() => insertAtCursor('@')}
            className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-1"
          >
            <AtSign className="w-3 h-3" />
            mencionar
          </button>
        </div>
      </div>

      {/* Área de texto mejorada */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full p-4 min-h-[200px] max-h-[400px] resize-y text-gray-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset font-mono"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '14px',
            lineHeight: '1.7',
            direction: 'ltr',
            textAlign: 'left',
            unicodeBidi: 'normal'
          }}
        />
      </div>

      {/* Vista previa del formato (opcional) */}
      {showFormatting && content && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="text-xs text-gray-600 mb-2">Vista previa:</div>
          <div 
            className="prose prose-sm max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ 
              __html: content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
                .replace(/__(.*?)__/g, '<u>$1</u>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/==(.*?)==/g, '<mark>$1</mark>')
                .replace(/\n/g, '<br>')
            }}
          />
        </div>
      )}

      {/* Barra de estado */}
      <div className="border-t border-gray-200 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-600">
          {content.length} caracteres • {content.split(/\s+/).filter(w => w.length > 0).length} palabras
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFormatting(!showFormatting)}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            {showFormatting ? 'Ocultar' : 'Mostrar'} vista previa
          </button>
          <span className="text-xs text-gray-600">
            💡 Usa ** para negrita, _ para cursiva
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTextEditor;