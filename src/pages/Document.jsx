import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Cloud, CloudOff } from 'lucide-react';
import SlideEditor from '../components/SlideEditor.jsx';
import Toolbar from '../components/Toolbar.jsx';
import { fetchDocument } from '../services/api.js';
import { socket } from '../services/socket.js';
import { debounce } from '../utils/debounce.js';

const defaultSlideSize = {
  width: 1280,
  height: 720
};

function makeId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `slide-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSlide(content = '<h2>새 슬라이드</h2><p></p>') {
  return {
    id: makeId(),
    content
  };
}

function combineContent(movedContent, existingContent) {
  const cleanExisting = typeof existingContent === 'string' ? existingContent : '<p></p>';
  if (!movedContent) {
    return cleanExisting;
  }

  return `${movedContent}${cleanExisting}`;
}

function splitOverflowContent(content) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = typeof content === 'string' ? content : '';
  const children = Array.from(wrapper.children);

  if (children.length > 1) {
    const movedNode = children[children.length - 1];
    movedNode.remove();
    return {
      currentContent: wrapper.innerHTML || '<p></p>',
      movedContent: movedNode.outerHTML
    };
  }

  const text = wrapper.textContent || '';
  if (text.length < 80) {
    return {
      currentContent: content,
      movedContent: ''
    };
  }

  const splitAt = Math.max(40, Math.floor(text.length * 0.7));
  const before = text.slice(0, splitAt).trim();
  const after = text.slice(splitAt).trim();

  return {
    currentContent: `<p>${before}</p>`,
    movedContent: after ? `<p>${after}</p>` : ''
  };
}

function readSlideSize() {
  try {
    const stored = JSON.parse(localStorage.getItem('doc:slideSize') || 'null');
    if (stored?.width && stored?.height) {
      return stored;
    }
  } catch {
    return defaultSlideSize;
  }

  return defaultSlideSize;
}

export default function Document({ token, onGoHome }) {
  const canEdit = Boolean(token);
  const [slides, setSlides] = useState([]);
  const [activeEditor, setActiveEditor] = useState(null);
  const [saveState, setSaveState] = useState('불러오는 중');
  const [notice, setNotice] = useState('');
  const [slideSize, setSlideSize] = useState(readSlideSize);
  const [overflowedSlides, setOverflowedSlides] = useState(() => new Set());

  const debouncedSave = useMemo(
    () =>
      debounce((nextSlides) => {
        if (!canEdit || !Array.isArray(nextSlides)) {
          return;
        }

        setSaveState('저장 중');
        socket.emit('document:save', { token, slides: nextSlides }, (result) => {
          if (result?.ok) {
            setSaveState('저장됨');
            setNotice('');
            return;
          }

          setSaveState('저장 실패');
          setNotice(result?.message || '저장에 실패했습니다.');
        });
      }, 700),
    [canEdit, token]
  );

  useEffect(() => {
    try {
      localStorage.setItem('doc:slideSize', JSON.stringify(slideSize));
    } catch {
      // localStorage may be blocked in some mobile browsers.
    }
  }, [slideSize]);

  useEffect(() => {
    let active = true;

    fetchDocument()
      .then((document) => {
        if (active) {
          setSlides(Array.isArray(document?.slides) ? document.slides : []);
          setSaveState('동기화됨');
        }
      })
      .catch((error) => {
        setNotice(error.message);
        setSaveState('불러오기 실패');
      });

    socket.connect();
    socket.on('document:sync', (document) => {
      setSlides(Array.isArray(document?.slides) ? document.slides : []);
      setSaveState('동기화됨');
    });
    socket.on('connect_error', () => {
      setSaveState('연결 실패');
      setNotice('서버 연결을 확인해주세요.');
    });

    return () => {
      active = false;
      socket.off('document:sync');
      socket.off('connect_error');
    };
  }, []);

  const updateSlide = (slideId, content, editor) => {
    setActiveEditor(editor || null);
    setSlides((currentSlides) => {
      const nextSlides = currentSlides.map((slide) => (slide.id === slideId ? { ...slide, content } : slide));
      debouncedSave(nextSlides);
      return nextSlides;
    });
  };

  const addSlide = () => {
    setSlides((currentSlides) => {
      const nextSlides = [...currentSlides, createSlide()];
      debouncedSave(nextSlides);
      return nextSlides;
    });
  };

  const handleOverflow = (slideId) => {
    if (!canEdit) {
      return;
    }

    setOverflowedSlides((current) => {
      if (current.has(slideId)) {
        return current;
      }

      const next = new Set(current);
      next.add(slideId);
      return next;
    });

    setSlides((currentSlides) => {
      const index = currentSlides.findIndex((slide) => slide.id === slideId);
      if (index === -1) {
        return currentSlides;
      }

      const { currentContent, movedContent } = splitOverflowContent(currentSlides[index].content);
      if (!movedContent && currentSlides[index + 1]) {
        setNotice('현재 슬라이드가 가득 찼습니다. 다음 슬라이드로 이어서 작성하세요.');
        return currentSlides;
      }

      const nextSlides = currentSlides.map((slide) => ({ ...slide }));
      nextSlides[index].content = currentContent || currentSlides[index].content;

      if (nextSlides[index + 1]) {
        nextSlides[index + 1].content = combineContent(movedContent, nextSlides[index + 1].content);
        setNotice('슬라이드가 가득 차서 넘친 내용을 다음 슬라이드로 옮겼습니다.');
      } else {
        nextSlides.push(createSlide(movedContent || '<h2>이어지는 슬라이드</h2><p></p>'));
        setNotice('슬라이드가 가득 차서 다음 슬라이드를 자동으로 추가했습니다.');
      }

      debouncedSave(nextSlides);
      return nextSlides;
    });
  };

  return (
    <main className="document-page">
      <header className="topbar">
        <button className="square-button" type="button" onClick={onGoHome} title="처음으로">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="topbar-title">공용 실시간 문서 사이트</p>
          <p className="topbar-subtitle">{canEdit ? '편집 가능' : '읽기 전용'}</p>
        </div>
        <div className="save-badge">
          {saveState.includes('실패') ? <CloudOff size={17} /> : <Cloud size={17} />}
          <span>{saveState}</span>
        </div>
      </header>

      <Toolbar
        editor={activeEditor}
        canEdit={canEdit}
        onAddSlide={addSlide}
        slideSize={slideSize}
        onSlideSizeChange={setSlideSize}
      />

      {notice ? <p className="notice">{notice}</p> : null}
      {!canEdit ? <p className="notice neutral">비밀번호 인증 전에는 문서를 읽기 전용으로 볼 수 있습니다.</p> : null}

      <section className="slide-stage" aria-label="슬라이드 문서">
        {slides.map((slide, index) => (
          <div className="slide-shell" key={slide.id || index} style={{ width: `min(100%, ${slideSize.width}px)` }}>
            <span className="slide-number">{index + 1}</span>
            <SlideEditor
              slide={slide}
              canEdit={canEdit}
              isActive={Boolean(activeEditor?.isFocused)}
              slideSize={slideSize}
              onFocus={setActiveEditor}
              onChange={updateSlide}
              onOverflow={handleOverflow}
            />
          </div>
        ))}
      </section>
    </main>
  );
}
