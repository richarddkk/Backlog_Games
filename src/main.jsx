import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Checkpoint:', error); }
  render() {
    if (this.state.failed) return <main className="fatal-error"><h1>Não foi possível abrir a biblioteca.</h1><p>Seus dados salvos não foram apagados. Recarregue a página para tentar novamente.</p><button className="button primary" onClick={() => window.location.reload()}>Recarregar</button></main>;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
