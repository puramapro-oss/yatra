'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

type State = { hasError: boolean; message?: string }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    if (typeof window !== 'undefined') {
      console.error('[YATRA ErrorBoundary]', error)
    }
  }

  reset = () => {
    this.setState({ hasError: false, message: undefined })
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center p-6">
          <div className="glass max-w-md w-full p-8 rounded-2xl text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="text-amber-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Oups, quelque chose a planté 🌿</h1>
            <p className="text-white/60 mb-6">
              Pas grave. Un rafraîchissement règle souvent ça. Si le souci persiste, écris-nous via le bouton aide.
            </p>
            <button onClick={this.reset} className="btn-primary mx-auto">
              <RefreshCcw size={16} /> Recharger
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
