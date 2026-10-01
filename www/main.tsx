import { StrictMode, createContext } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App.tsx";
import "@fontsource/poppins";
import { Gamemaster } from "./gamemaster.ts";
import { Middleman } from "../pkg/pong_but_better";
import { Entity, getDataView, Mass } from "./entities/index.ts";
import { point, vector } from "2d-geometry";
import { CANVAS_HEIGHT, CANVAS_WIDTH, ENTITY_SIZE_BYTES } from "./constants.ts";

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

let middleman = Middleman.new(worker);

class EntityTracker {
  createEntity(): Promise<Entity> {
    let index = this.entities.length;
    middleman.request_entity((index) * ENTITY_SIZE_BYTES, 1);
    let dataView = getDataView(entityDataBuffer, index);
    
    let entity = new Entity(dataView, () => this.setUpdated());

    this.entities[index] = entity;

    let promise: Promise<Entity> = new Promise((resolve) => {
      let listener = (event: MessageEvent) => {
        if (event.data === "entity created") {
          worker.removeEventListener("message", listener);
          resolve(entity);
        }
      }
      worker.addEventListener("message", listener)
    })

    return promise;
  }

  setUpdated() {
    this.updatedView.setUint8(0, 1);
  }

  private updatedView = getDataView(entityDataBuffer, -1);
  private entities: Entity[] = [];
}

let a = new EntityTracker();
a.createEntity().then((entity) => {
  entity.bounds = vector(100, 100);  
  entity.acceleration = vector(0, -200)
  entity.velocity = vector(-100, 200)
  entity.position = point(CANVAS_WIDTH / 2 + 200, CANVAS_HEIGHT / 2);
  entity.mass = new Mass(false, 1);
}).catch(console.error)

a.createEntity().then((entity) => {
  entity.bounds = vector(100, 100);  
  entity.acceleration = vector(0, -200)
  entity.velocity = vector(100, 200)
  entity.position = point(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2);
  entity.mass = new Mass(false, 1);
}).catch(console.error)

const gamemaster = new Gamemaster();

export const dependencyContext = createContext({ setCanvas, gamemaster });
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <dependencyContext.Provider value={{ setCanvas, gamemaster }}>
      <App />
    </dependencyContext.Provider>
  </StrictMode>,
);
