import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error renderizando la aplicación:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Se produjo un error</h1>
          <p>La interfaz no pudo renderizarse correctamente.</p>
          <p style={{ marginTop: '0.5rem' }}>Intenta recargar la página. Si el problema persiste, comparte este mensaje:</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
            {String(this.state.error || 'Error desconocido')}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}