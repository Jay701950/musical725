import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { verifyPassword } from '../services/api.js';

export default function PasswordForm({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = await verifyPassword(password);
      onAuthenticated(token);
    } catch (authError) {
      setError(authError.message || '비밀번호가 틀렸습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-panel" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="password">
        비밀번호
      </label>
      <div className="password-row">
        <LockKeyhole size={20} aria-hidden="true" />
        <input
          id="password"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="비밀번호 입력"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? '확인 중' : '접속'}
      </button>
    </form>
  );
}
