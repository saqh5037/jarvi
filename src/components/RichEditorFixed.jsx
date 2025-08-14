import React, { useRef, useState, useCallback } from 'react';
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
  Rocket
} from 'lucide-react';

const RichEditorFixed = ({ value, onChange, placeholder = "Escribe tu comentario..." }) => {
  const editorRef = useRef(null);
  const [isFormatting, setIsFormatting] = useState(false);
  
  // Colores y estilos
  const colors = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  const highlights = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#D1FAE5'];

  // Aplicar formato manteniendo el cursor
  const applyFormat = useCallback((command, value = null) => {
    setIsFormatting(true);
    
    // Guardar posición del cursor
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    // Aplicar formato
    document.execCommand(command, false, value);
    
    // Restaurar focus y actualizar
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Disparar evento de cambio
      const event = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(event);
    }
    
    setTimeout(() => setIsFormatting(false), 10);
  }, []);

  // Insertar contenido en la posición del cursor
  const insertContent = useCallback((content) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    // Insertar el contenido
    const textNode = document.createTextNode(content);
    range.insertNode(textNode);
    
    // Mover cursor después del contenido insertado
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Actualizar el valor
    handleInput();
  }, []);

  // Manejar cambios en el editor
  const handleInput = useCallback(() => {
    if (editorRef.current && !isFormatting) {
      const content = editorRef.current.innerHTML;
      // Solo actualizar si realmente cambió
      if (content !== value) {
        onChange(content);
      }
    }
  }, [onChange, value, isFormatting]);

  // Manejar pegado para prevenir formato no deseado
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Manejar teclas especiales
  const handleKeyDown = useCallback((e) => {
    // Ctrl/Cmd + Enter para enviar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // Aquí podrías disparar el envío del comentario
    }
  }, []);

  const ToolButton = ({ onClick, icon: Icon, title, active = false }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
        active ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
      }`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="border-2 border-indigo-200 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Barra de herramientas superior */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 p-2">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Formato de texto */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
            <ToolButton
              onClick={() => applyFormat('bold')}
              icon={Bold}
              title="Negrita (Ctrl+B)"
            />
            <ToolButton
              onClick={() => applyFormat('italic')}
              icon={Italic}
              title="Cursiva (Ctrl+I)"
            />
            <ToolButton
              onClick={() => applyFormat('underline')}
              icon={UnderlineIcon}
              title="Subrayado (Ctrl+U)"
            />
          </div>

          {/* Listas y código */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-2">
            <ToolButton
              onClick={() => applyFormat('insertUnorderedList')}
              icon={List}
              title="Lista con viñetas"
            />
            <ToolButton
              onClick={() => applyFormat('formatBlock', '<pre>')}
              icon={Code}
              title="Bloque de código"
            />
          </div>

          {/* Colores de texto */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <Palette className="w-4 h-4 text-gray-500" />
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => applyFormat('foreColor', color)}
                className="w-5 h-5 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
              />
            ))}
          </div>

          {/* Resaltado */}
          <div className="flex items-center gap-1">
            <Highlighter className="w-4 h-4 text-gray-500" />
            {highlights.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => applyFormat('backColor', color)}
                className="w-5 h-5 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Resaltar: ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Segunda línea: Iconos de prioridad y etiquetas */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-600">Prioridad:</span>
          
          <button
            type="button"
            onClick={() => insertContent('🔥 [URGENTE] ')}
            className="p-1 hover:bg-red-100 rounded transition-colors group flex items-center gap-1"
            title="Urgente"
          >
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600 hidden group-hover:inline">Urgente</span>
          </button>
          
          <button
            type="button"
            onClick={() => insertContent('⚠️ [ALTA] ')}
            className="p-1 hover:bg-orange-100 rounded transition-colors group flex items-center gap-1"
            title="Alta"
          >
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-orange-600 hidden group-hover:inline">Alta</span>
          </button>
          
          <button
            type="button"
            onClick={() => insertContent('⚡ [MEDIA] ')}
            className="p-1 hover:bg-yellow-100 rounded transition-colors group flex items-center gap-1"
            title="Media"
          >
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-600 hidden group-hover:inline">Media</span>
          </button>
          
          <button
            type="button"
            onClick={() => insertContent('⭕ [BAJA] ')}
            className="p-1 hover:bg-green-100 rounded transition-colors group flex items-center gap-1"
            title="Baja"
          >
            <Circle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 hidden group-hover:inline">Baja</span>
          </button>

          <div className="border-l border-gray-300 pl-2 ml-2 flex gap-2">
            <button
              type="button"
              onClick={() => insertContent('✅ ')}
              className="p-1 hover:bg-green-100 rounded transition-colors"
              title="Completado"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </button>
            
            <button
              type="button"
              onClick={() => insertContent('⭐ ')}
              className="p-1 hover:bg-purple-100 rounded transition-colors"
              title="Importante"
            >
              <Star className="w-4 h-4 text-purple-500" />
            </button>
            
            <button
              type="button"
              onClick={() => insertContent('🎯 ')}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              title="Objetivo"
            >
              <Target className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Tercera línea: Etiquetas rápidas */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-600">Etiquetas:</span>
          
          <button
            type="button"
            onClick={() => insertContent('#importante ')}
            className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
          >
            #importante
          </button>
          
          <button
            type="button"
            onClick={() => insertContent('#revisar ')}
            className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
          >
            #revisar
          </button>
          
          <button
            type="button"
            onClick={() => insertContent('#pregunta ')}
            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            #pregunta
          </button>
          
          <button
            type="button"
            onClick={() => insertContent('#idea ')}
            className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
          >
            #idea
          </button>
          
          <button
            type="button"
            onClick={() => insertContent('#completado ')}
            className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            #completado
          </button>
          
          <button
            type="button"
            onClick={() => insertContent('@')}
            className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-1"
          >
            <AtSign className="w-3 h-3" />
            mencionar
          </button>
        </div>
      </div>

      {/* Editor de contenido */}
      <div className="relative bg-white">
        <div
          ref={editorRef}
          contentEditable
          className="p-4 min-h-[150px] max-h-[400px] overflow-y-auto text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset rounded-b-lg"
          style={{ 
            fontSize: '14px',
            lineHeight: '1.6',
            wordBreak: 'break-word'
          }}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          dangerouslySetInnerHTML={{ __html: value || '' }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
        
        {/* Indicador de placeholder cuando está vacío */}
        {(!value || value === '<br>' || value === '') && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Barra de estado */}
      <div className="border-t border-gray-200 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-600">
          {editorRef.current?.textContent?.length || 0} caracteres
        </div>
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <span>💡 Ctrl+B/I/U para formato</span>
          <span>•</span>
          <span>Ctrl+Enter para enviar</span>
        </div>
      </div>
    </div>
  );
};

export default RichEditorFixed;