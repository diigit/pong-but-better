import { StrictMode, createContext } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App.tsx";
import "@fontsource/poppins";
import { Gamemaster } from "./gamemaster.ts";

let worker = new Worker("./www/worker.ts", { type: "module" });

export const entityDataBuffer: SharedArrayBuffer = await new Promise(
  (resolve) => {
    let listener = (event: MessageEvent) => {
      resolve(event.data);
      worker.removeEventListener("message", listener);
    }
    worker.addEventListener("message", listener);
  },
);

function setCanvas(new_canvas: HTMLCanvasElement | null) {
  if (new_canvas) {
    try {
      let canvas = new_canvas.transferControlToOffscreen();
      worker.postMessage(canvas, [canvas]);
    } catch {}
  } else {
    worker.postMessage("remove canvas");
  }
}

const gamemaster = await new Promise((resolve) => {
    const gamemaster = Gamemaster.create(worker, entityDataBuffer);

    setTimeout(() => {
      resolve(gamemaster)
    }, 1000)
})

export const dependencyContext = createContext({ setCanvas, gamemaster });
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <dependencyContext.Provider value={{ setCanvas, gamemaster }}>
      <App />
    </dependencyContext.Provider>
  </StrictMode>,
);
