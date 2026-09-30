import { StrictMode, createContext } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.tsx'
import '@fontsource/poppins';
import { GameState } from "./game-state.ts";
import { GameplayCommunicator } from '../pkg/pong_but_better';

let worker = new Worker("./www/gameplay.ts", { type: "module" });
await new Promise((resolve) => 
  worker.onmessage = event => { if (event.data === "ready") resolve(undefined); }
)

function setCanvas(new_canvas: HTMLCanvasElement | null) {
  if (new_canvas) {
    try {
      let canvas = new_canvas.transferControlToOffscreen();
      worker.postMessage(canvas, [canvas]);
    } catch { }
  } else {
    worker.postMessage("remove canvas");
  }
}

let communicator = GameplayCommunicator.new(worker);
communicator.spawn_balls(3);

const gameState = new GameState(communicator);

export const dependencyContext = createContext({ setCanvas, gameState });
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <dependencyContext.Provider value={{ setCanvas, gameState }}>
      <App />
    </dependencyContext.Provider>
  </StrictMode>,
)
