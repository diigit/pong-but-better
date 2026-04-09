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
import { GameObject } from "./game-objects.ts";
import { PolygonDescriptor } from "./lib/rendering/shape-descriptors.ts";
import { rect, vector } from "2d-geometry";

const renderer = new PongRenderer();
export const rendererContext = createContext(renderer);

const testRectangle = new GameObject(new PolygonDescriptor(rect(0, 256-50, 50, 50)));
const testRectangle2 = new GameObject(new PolygonDescriptor(rect(100, 256-50, 60, 50)));
testRectangle.acceleration = vector(-0, -50);
renderer.renderGameObject(testRectangle);
renderer.renderGameObject(testRectangle2);

const UPDATE_TIME = .05

setInterval(() => {
  testRectangle.movementStep(UPDATE_TIME);
  renderer.updateTriangles();
}, 1/UPDATE_TIME);

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
