import React from 'react';
import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Document from './pages/Document.jsx';

function readStoredToken() {
  try {
    return sessionStorage.getItem('doc:token') || '';
  } catch {
    return '';
  }
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.pathname);
  const [token, setToken] = useState(readStoredToken);

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  const handleAuthenticated = (nextToken) => {
    try {
      sessionStorage.setItem('doc:token', nextToken);
    } catch {
      // Mobile private browsing can block sessionStorage.
    }

    setToken(nextToken);
    navigate('/doc');
  };

  if (route === '/doc') {
    return <Document token={token} onGoHome={() => navigate('/')} />;
  }

  return <Home canEdit={Boolean(token)} onAuthenticated={handleAuthenticated} onOpenDocument={() => navigate('/doc')} />;
}
