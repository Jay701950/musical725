import React from 'react';
import { FileText } from 'lucide-react';
import PasswordForm from '../components/PasswordForm.jsx';

export default function Home({ canEdit, onAuthenticated, onOpenDocument }) {
  return (
    <main className="home-page">
      <section className="home-copy">
        <div className="brand-mark" aria-hidden="true">
          <FileText size={28} />
        </div>
        <p className="eyebrow">공용 실시간 문서 사이트</p>
        <h1>하나의 슬라이드 문서를 함께 수정합니다</h1>
        <p className="lead">비밀번호를 입력하면 편집 권한이 켜지고, 입력 내용은 실시간으로 동기화되어 자동 저장됩니다.</p>
        <div className="status-line">
          현재 상태 <strong>{canEdit ? '편집 가능' : '읽기 전용'}</strong>
        </div>
      </section>

      <section className="access-section">
        <PasswordForm onAuthenticated={onAuthenticated} />
        <button className="ghost-button" type="button" onClick={onOpenDocument}>
          읽기 전용으로 문서 보기
        </button>
      </section>
    </main>
  );
}
