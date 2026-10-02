import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Erro na interface do Professor FC', error, info) }
  render() {
    return this.state.failed ? <main className="welcome"><h1>Professor FC</h1><p role="alert">Não foi possível apresentar a sessão. Recarregue para reiniciar o protótipo.</p><button onClick={() => window.location.reload()}>Reiniciar protótipo</button></main> : this.props.children
  }
}
