import { Component, type ErrorInfo, type ReactNode } from 'react'
import './ErrorBoundary.css'

type Props = { children: ReactNode; title?: string }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Receipt Maker error boundary', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary-card">
          <span className="error-boundary-mark" aria-hidden />
          <h1>{this.props.title || 'Something went wrong'}</h1>
          <p>The studio hit an unexpected error. Your projects in this browser are still saved.</p>
          <p className="error-boundary-detail">{this.state.error.message}</p>
          <button
            type="button"
            className="error-boundary-btn"
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          >
            Reload studio
          </button>
        </div>
      </div>
    )
  }
}
