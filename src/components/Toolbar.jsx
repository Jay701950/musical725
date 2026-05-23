import React from 'react';
import { Bold, Circle, Plus, Type } from 'lucide-react';

const colors = [
  { label: '빨강', value: '#e03131' },
  { label: '주황', value: '#f08c00' },
  { label: '노랑', value: '#f2c94c' },
  { label: '초록', value: '#2f9e44' },
  { label: '파랑', value: '#1971c2' },
  { label: '남색', value: '#364fc7' },
  { label: '보라', value: '#9c36b5' },
  { label: '검정', value: '#1c2430' }
];

const fontSizes = ['12px', '14px', '16px', '20px', '24px', '32px', '40px', '48px', '60px', '72px'];

export default function Toolbar({ editor, canEdit, onAddSlide }) {
  const disabled = !canEdit || !editor;

  const runCommand = (command) => {
    if (disabled || !editor) {
      return;
    }

    command(editor);
  };

  return (
    <div className="toolbar" aria-label="문서 도구">
      <button
        className="icon-button"
        type="button"
        onClick={onAddSlide}
        disabled={!canEdit}
        title="슬라이드 추가"
      >
        <Plus size={19} />
        <span>슬라이드 추가</span>
      </button>

      <button
        className="square-button"
        type="button"
        onClick={() => runCommand((activeEditor) => activeEditor.chain().focus().toggleBold().run())}
        disabled={disabled}
        title="굵게"
        aria-pressed={editor?.isActive('bold') || false}
      >
        <Bold size={19} />
      </button>

      <label className="select-control" title="글자 크기">
        <Type size={18} />
        <select
          disabled={disabled}
          defaultValue=""
          onChange={(event) =>
            runCommand((activeEditor) => activeEditor.chain().focus().setMark('textStyle', { fontSize: event.target.value }).run())
          }
        >
          <option value="" disabled>
            크기
          </option>
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="color-strip" aria-label="글자 색상">
        {colors.map((color) => (
          <button
            key={color.value}
            className="color-button"
            type="button"
            style={{ '--swatch': color.value }}
            onClick={() => runCommand((activeEditor) => activeEditor.chain().focus().setColor(color.value).run())}
            disabled={disabled}
            title={color.label}
          >
            <Circle size={15} fill="var(--swatch)" stroke="var(--swatch)" />
          </button>
        ))}
      </div>
    </div>
  );
}
