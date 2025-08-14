import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Code,
  Highlighter,
  Palette,
  Smile,
  Hash,
  AtSign,
  Send,
  Flame,
  AlertTriangle,
  Zap,
  Circle,
  CheckCircle2,
  Star,
  Target,
  Rocket,
  Heart,
  ThumbsUp
} from 'lucide-react';

const SimpleRichEditor = ({ value, onChange, placeholder = "Escribe tu comentario..." }) => {
  const editorRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Colores predefinidos
  const colors = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  const highlights = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#D1FAE5'];
  const emojis = ['👍', '❤️', '🎯', '✅', '⭐', '🔥', '💡', '🚀', '⚡', '🎨'];
  
  // Inicializar el contenido del editor
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const startOffset = range ? range.startOffset : 0;
      
      editorRef.current.innerHTML = value || '';
      
      // Restaurar la posición del cursor
      if (range && editorRef.current.firstChild) {
        try {
          const newRange = document.createRange();
          newRange.setStart(editorRef.current.firstChild, Math.min(startOffset, editorRef.current.textContent.length));
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          // Ignorar errores de rango
        }
      }
    }
  }, []);

  // Aplicar formato
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleChange();
  };

  // Insertar texto
  const insertText = (text) => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    handleChange();
  };

  // Manejar cambios
  const handleChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      if (content !== value) {
        onChange(content);
      }
    }
  };

  // Manejar pegado
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleChange();
  };

  const ToolButton = ({ onClick, icon: Icon, title, active = false }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
        active ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
      }`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="border-2 border-indigo-200 rounded-lg overflow-hidden bg-white shadow-md">
      {/* Barra de herramientas */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 p-2">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Formato básico */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolButton
              onClick={() => applyFormat('bold')}
              icon={Bold}
              title="Negrita"
            />
            <ToolButton
              onClick={() => applyFormat('italic')}
              icon={Italic}
              title="Cursiva"
            />
            <ToolButton
              onClick={() => applyFormat('underline')}
              icon={UnderlineIcon}
              title="Subrayado"
            />
          </div>

          {/* Listas */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolButton
              onClick={() => applyFormat('insertUnorderedList')}
              icon={List}
              title="Lista"
            />
            <ToolButton
              onClick={() => applyFormat('formatBlock', '<pre>')}
              icon={Code}
              title="Código"
            />
          </div>

          {/* Colores */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <Palette className="w-4 h-4 text-gray-500" />
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => applyFormat('foreColor', color)}
                className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
              />
            ))}
          </div>

          {/* Resaltado */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <Highlighter className="w-4 h-4 text-gray-500" />
            {highlights.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => applyFormat('backColor', color)}
                className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Resaltar: ${color}`}
              />
            ))}
          </div>

          {/* Iconos estilo JARVI */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertText('🔥')}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Urgente"
            >
              <Flame className="w-4 h-4 text-red-500" />
            </button>
            <button
              type="button"
              onClick={() => insertText('⚠️')}
              className="p-1 hover:bg-orange-100 rounded transition-colors"
              title="Alta prioridad"
            >
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </button>
            <button
              type="button"
              onClick={() => insertText('⚡')}
              className="p-1 hover:bg-yellow-100 rounded transition-colors"
              title="Media prioridad"
            >
              <Zap className="w-4 h-4 text-yellow-500" />
            </button>
            <button
              type="button"
              onClick={() => insertText('✅')}
              className="p-1 hover:bg-green-100 rounded transition-colors"
              title="Completado"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </button>
            <button
              type="button"
              onClick={() => insertText('⭐')}
              className="p-1 hover:bg-purple-100 rounded transition-colors"
              title="Favorito"
            >
              <Star className="w-4 h-4 text-purple-500" />
            </button>
            <button
              type="button"
              onClick={() => insertText('🎯')}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              title="Objetivo"
            >
              <Target className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Etiquetas rápidas */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-600">Rápido:</span>
          <button
            type="button"
            onClick={() => insertText('#importante ')}
            className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            #importante
          </button>
          <button
            type="button"
            onClick={() => insertText('#revisar ')}
            className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
          >
            #revisar
          </button>
          <button
            type="button"
            onClick={() => insertText('#pregunta ')}
            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            #pregunta
          </button>
          <button
            type="button"
            onClick={() => insertText('#completado ')}
            className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            #completado
          </button>
          <button
            type="button"
            onClick={() => insertText('@')}
            className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 flex items-center gap-1"
          >
            <AtSign className="w-3 h-3" />
            mencionar
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[150px] max-h-[300px] overflow-y-auto text-gray-900 focus:outline-none"
        style={{ 
          color: '#111827',
          fontSize: '14px',
          lineHeight: '1.6',
          direction: 'ltr',
          unicodeBidi: 'embed'
        }}
        onInput={handleChange}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Barra de estado */}
      <div className="border-t border-gray-200 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-600">
          {editorRef.current?.textContent?.length || 0} caracteres
        </div>
        <div className="text-xs text-gray-600">
          💡 Usa Ctrl+B, Ctrl+I, Ctrl+U para formato rápido
        </div>
      </div>
    </div>
  );
};

export default SimpleRichEditor;