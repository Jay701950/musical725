export async function verifyPassword(password) {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.token) {
    throw new Error(payload.message || '비밀번호가 틀렸습니다.');
  }

  return payload.token;
}

export async function fetchDocument() {
  const response = await fetch('/api/document');
  if (!response.ok) {
    throw new Error('문서를 불러오지 못했습니다.');
  }

  return response.json();
}
