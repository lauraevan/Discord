import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import { StatusMasks } from './ui/Status'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* the mask sprite every avatar and status indicator points at */}
      <StatusMasks />
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
