import React, { useEffect } from 'react';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element?.style?.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }

          return {
            style: `font-size: ${attributes.fontSize}`
          };
        }
      }
    };
  }
});

export default function SlideEditor({ slide, canEdit, isActive, onFocus, onChange }) {
  const slideId = typeof slide?.id === 'string' ? slide.id : 'slide';
  const safeContent = typeof slide?.content === 'string' ? slide.content : '<p></p>';

  const editor = useEditor({
    extensions: [StarterKit, FontSize, Color],
    content: safeContent,
    editable: canEdit,
    editorProps: {
      attributes: {
        class: 'slide-body'
      }
    },
    onFocus: ({ editor: focusedEditor }) => onFocus?.(focusedEditor),
    onUpdate: ({ editor: updatedEditor }) => {
      onChange?.(slideId, updatedEditor.getHTML(), updatedEditor);
    }
  });

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [canEdit, editor]);

  useEffect(() => {
    if (!editor || editor.isFocused || editor.getHTML() === safeContent) {
      return;
    }

    editor.commands.setContent(safeContent, false);
  }, [editor, safeContent]);

  return (
    <article className={`slide-frame ${isActive ? 'is-active' : ''}`} onClick={() => editor && onFocus?.(editor)}>
      <EditorContent editor={editor} />
    </article>
  );
}
