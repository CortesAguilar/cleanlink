import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { DesignSystemView } from '../components/design-system-view'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignSystemView />
  </StrictMode>,
)
