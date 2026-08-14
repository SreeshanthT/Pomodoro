import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MiniApp } from './MiniApp'
import './styles/theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MiniApp />
  </StrictMode>
)
