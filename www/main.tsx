import { StrictMode, createContext } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.tsx'
import { PongRenderer } from "./pong-renderer.ts";
import { AABBCollider } from "./collisions.ts";
import '@fontsource/poppins';
import { GameState } from "./game-state.ts";
import { MAX_VERTICES } from './constants.ts';

let vertexBuffer = new SharedArrayBuffer(MAX_VERTICES * 2 * 32)
let indexBuffer = new SharedArrayBuffer(MAX_VERTICES * 16)
let worker = new Worker("./www/gameplay.ts", { type: "module" });

worker.onmessage = event => {
  if (event.data === "ready") {
    worker.postMessage([vertexBuffer, indexBuffer])
  } 
}

const renderer = new PongRenderer(vertexBuffer, indexBuffer);
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
