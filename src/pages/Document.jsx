import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Cloud, CloudOff } from 'lucide-react';
import SlideEditor from '../components/SlideEditor.jsx';
import Toolbar from '../components/Toolbar.jsx';
import { fetchDocument } from '../services/api.js';
import { socket } from '../services/socket.js';
import { debounce } from '../utils/debounce.js';

function makeId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `slide-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSlide() {
  return {
    id: makeId(),
    content: '<h2>새 슬라이드</h2><p></p>'
  };
}

export default function Document({ token, onGoHome }) {
  const canEdit = Boolean(token);
  const [slides, setSlides] = useState([]);
  const [activeEditor, setActiveEditor] = useState(null);
  const [saveState, setSaveState] = useState('불러오는 중');
  const [notice, setNotice] = useState('');

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

      <Toolbar editor={activeEditor} canEdit={canEdit} onAddSlide={addSlide} />

      {notice ? <p className="notice">{notice}</p> : null}
      {!canEdit ? <p className="notice neutral">비밀번호 인증 전에는 문서를 읽기 전용으로 볼 수 있습니다.</p> : null}

      <section className="slide-stage" aria-label="슬라이드 문서">
        {slides.map((slide, index) => (
          <div className="slide-shell" key={slide.id || index}>
            <span className="slide-number">{index + 1}</span>
            <SlideEditor
              slide={slide}
              canEdit={canEdit}
              isActive={Boolean(activeEditor?.isFocused)}
              onFocus={setActiveEditor}
              onChange={updateSlide}
            />
          </div>
        ))}
      </section>
    </main>
  );
}
