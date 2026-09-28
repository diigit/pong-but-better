import { StrictMode, createContext } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.tsx'
import { PongRenderer } from "./pong-renderer.ts";
import { AABBCollider } from "./collisions.ts";
import '@fontsource/poppins';
import { GameState } from "./game-state.ts";
import { MAX_VERTICES } from './constants.ts';
import { GameplayCommunicator } from '../pkg/pong_but_better';

let vertexBuffer = new SharedArrayBuffer(MAX_VERTICES * 2 * 32);
let indexBuffer = new SharedArrayBuffer(MAX_VERTICES * 16);

// [u32; 3] 
// [0] = Vertex Buffer Length
// [1] = Index Buffer Length
// [2] = Vertex buffer read/write indicator
let dataBuffer = new SharedArrayBuffer(12); 
let worker = new Worker("./www/gameplay.ts", { type: "module" });

worker.onmessage = event => {
  if (event.data === "ready") {
    worker.postMessage([vertexBuffer, indexBuffer, dataBuffer])
    
    setTimeout(() => {
      let communicator = GameplayCommunicator.new(worker);
      communicator.spawn_balls(3);
    }, 1000)
  } 
}

const renderer = new PongRenderer(vertexBuffer, indexBuffer, dataBuffer);
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
