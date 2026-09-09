/**
 * Last line of defence.
 *
 * If a render ever throws, the reader gets a panel they can act on instead of a
 * blank page — the saved state is the only thing that can realistically poison a
 * render here, and it lives in their browser where nobody else can clear it.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { WumpusMark } from './ui/Art'
import { reset } from './storage'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Discord UI crashed', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="crash">
        <div className="crash-card">
          <WumpusMark />
          <h1>Something went wrong</h1>
          <p>
            This usually means saved data from an older version of the page is no longer
            readable. Clearing it starts you fresh — nothing else on your machine is touched.
          </p>
          <pre>{error.message}</pre>
          <button
            className="btn-primary"
            onClick={() => {
              reset()
              location.reload()
            }}
          >
            Clear saved data and reload
          </button>
        </div>
      </div>
    )
  }
}
