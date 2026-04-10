/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createContext, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { PongRenderer } from "./pong-renderer.ts";
import { AABBCollider } from "./collisions.ts";
import { GameObject } from "./game-objects.ts";
import { PolygonDescriptor } from "./lib/rendering/shape-descriptors.ts";
import { rect, vector } from "2d-geometry";

const renderer = new PongRenderer();
const collider = new AABBCollider();

export const rendererContext = createContext(renderer);
const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <rendererContext.Provider value={renderer}>
      <App />
    </rendererContext.Provider>
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}

// object collision test
{
  const UPDATE_INTERVAL = 50; //ms
  
  const objectA = new GameObject(new PolygonDescriptor(rect(-256, -32, 64, 64)));
  objectA.mass = 1;
  objectA.velocity = vector(200, 0);
  renderer.renderGameObject(objectA);
  collider.addCollider(objectA);

  const objectB = new GameObject(new PolygonDescriptor(rect(256, -32, 64, 64)));
  objectB.mass = 1;
  objectB.velocity = vector(-1000, -30);
  renderer.renderGameObject(objectB);
  collider.addCollider(objectB);

  setInterval(() => {
    objectA.movementStep(UPDATE_INTERVAL/1000);
    objectB.movementStep(UPDATE_INTERVAL/1000);
    collider.updateColliders();
    renderer.updateTriangles();
  }, UPDATE_INTERVAL);
}