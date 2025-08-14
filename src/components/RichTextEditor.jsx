import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Code,
  Quote,
  Highlighter,
  Type,
  Palette,
  Smile,
  Hash,
  AtSign,
  Link2,
  Undo,
  Redo,
  CheckSquare
} from 'lucide-react';

const RichTextEditor = ({ content, onChange, placeholder = "Escribe tu comentario..." }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  // Colores predefinidos
  const colors = [
    '#000000', '#6B7280', '#EF4444', '#F59E0B', '#10B981', 
    '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];

  // Colores de resaltado
  const highlightColors = [
    '#FEF3C7', '#DBEAFE', '#EDE9FE', '#FCE7F3', '#CCFBF1',
    '#FED7AA', '#FEE2E2', '#D1FAE5', '#E0E7FF'
  ];

  // Emojis rápidos
  const quickEmojis = ['👍', '❤️', '🎯', '✅', '⭐', '🔥', '💡', '🚀', '⚡', '🎨'];

  const insertEmoji = (emoji) => {
    editor.chain().focus().insertContent(emoji).run();
  };

  const MenuButton = ({ onClick, isActive, children, title }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
      }`}
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <div className="border-2 border-indigo-200 rounded-lg overflow-hidden bg-white shadow-lg">
      {/* Barra de herramientas principal */}
      <div className="border-b-2 border-indigo-100 p-2 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Formato de texto */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Negrita (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Cursiva (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Subrayado (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Tachado"
            >
              <Type className="w-4 h-4 line-through" />
            </MenuButton>
          </div>

          {/* Listas */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Lista con viñetas"
            >
              <List className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Lista numerada"
            >
              <ListOrdered className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive('taskList')}
              title="Lista de tareas"
            >
              <CheckSquare className="w-4 h-4" />
            </MenuButton>
          </div>

          {/* Bloques */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title="Bloque de código"
            >
              <Code className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Cita"
            >
              <Quote className="w-4 h-4" />
            </MenuButton>
          </div>

          {/* Deshacer/Rehacer */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              isActive={false}
              title="Deshacer (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              isActive={false}
              title="Rehacer (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </MenuButton>
          </div>
        </div>

        {/* Segunda línea: Colores y emojis */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
          {/* Selector de color de texto */}
          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-gray-500" />
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => editor.chain().focus().setColor(color).run()}
                className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
                type="button"
              />
            ))}
          </div>

          {/* Selector de resaltado */}
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
            <Highlighter className="w-4 h-4 text-gray-500" />
            {highlightColors.map((color) => (
              <button
                key={color}
                onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Resaltar: ${color}`}
                type="button"
              />
            ))}
          </div>

          {/* Emojis rápidos */}
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
            <Smile className="w-4 h-4 text-gray-500" />
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-lg hover:scale-125 transition-transform"
                title={`Insertar ${emoji}`}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Tercera línea: Etiquetas rápidas */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">Etiquetas rápidas:</span>
          <button
            onClick={() => editor.chain().focus().insertContent('#importante ').run()}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            type="button"
          >
            #importante
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent('#revisar ').run()}
            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
            type="button"
          >
            #revisar
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent('#pregunta ').run()}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            type="button"
          >
            #pregunta
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent('#idea ').run()}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            type="button"
          >
            #idea
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent('#completado ').run()}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            type="button"
          >
            #completado
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent('@').run()}
            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors flex items-center gap-1"
            type="button"
          >
            <AtSign className="w-3 h-3" />
            mencionar
          </button>
        </div>
      </div>

      {/* Editor de contenido */}
      <div className="bg-white">
        <EditorContent 
          editor={editor}
          className="prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none text-gray-900"
        />
      </div>

      {/* Barra de estado */}
      <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {editor.storage.characterCount?.characters() || 0} caracteres
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Markdown soportado</span>
          <span>•</span>
          <span>Ctrl+Enter para enviar</span>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;