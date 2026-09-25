import { StrictMode, createContext } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.tsx'
import { PongRenderer } from "./pong-renderer.ts";
import { AABBCollider } from "./collisions.ts";
import '@fontsource/poppins';
import { GameState } from "./game-state.ts";
import { GameController, VertexBufferPtr } from "../pkg/pong_but_better"

let worker = new Worker("./www/gameplay.ts", { type: "module" });
let game_controller = GameController.new(worker);

const renderer = new PongRenderer();
const collider = new AABBCollider();
const gameState = new GameState(renderer, collider);

worker.onmessage = event => {
  let buffer_ptr = (VertexBufferPtr as any).__wrap(event.data.__wbg_ptr);
  renderer.setVertexBufferPtr(buffer_ptr);
}

export const dependencyContext = createContext({ renderer, gameState });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <dependencyContext.Provider value={{ renderer, gameState }}>
      <App />
    </dependencyContext.Provider>
  </StrictMode>,
)
