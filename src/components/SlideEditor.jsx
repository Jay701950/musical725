import React, { useEffect, useRef } from 'react';
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

export default function SlideEditor({ slide, canEdit, isActive, slideSize, onFocus, onChange, onOverflow }) {
  const frameRef = useRef(null);
  const slideId = typeof slide?.id === 'string' ? slide.id : 'slide';
  const safeContent = typeof slide?.content === 'string' ? slide.content : '<p></p>';

  const checkOverflow = () => {
    const body = frameRef.current?.querySelector('.slide-body');
    if (!body) {
      return;
    }

    if (body.scrollHeight > body.clientHeight + 8) {
      onOverflow?.(slideId);
    }
  };

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
      window.requestAnimationFrame(checkOverflow);
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
    window.requestAnimationFrame(checkOverflow);
  }, [editor, safeContent]);

  return (
    <article
      ref={frameRef}
      className={`slide-frame ${isActive ? 'is-active' : ''}`}
      style={{ height: `${slideSize.height}px` }}
      onClick={() => editor && onFocus?.(editor)}
    >
      <EditorContent editor={editor} />
    </article>
  );
}
