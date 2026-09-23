import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useGameStore } from './store/gameStore'
import { App } from './App'
import './index.css'

async function boot() {
  await useGameStore.getState().loadGame()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

boot()
