import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fallback-page">
          <h1>화면을 불러오지 못했습니다</h1>
          <p>{this.state.error.message || '잠시 후 다시 시도해주세요.'}</p>
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>
            새로고침
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
