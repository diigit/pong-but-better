import { StrictMode, createContext } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.tsx'
import { PongRenderer } from "./pong-renderer.ts";
import { AABBCollider } from "./collisions.ts";
import '@fontsource/poppins';
import { GameState } from "./game-state.ts";
import { GameController } from '../pkg/pong_but_better';

const renderer = new PongRenderer();
const collider = new AABBCollider();
const gameState = new GameState(renderer, collider);

export const dependencyContext = createContext({ renderer, gameState });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <dependencyContext.Provider value={{ renderer, gameState }}>
      <App />
    </dependencyContext.Provider>
  </StrictMode>,
)

GameController.new();