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
import { AABBCollider, Axis, Barrier } from "./collisions.ts";
import { GameObject } from "./game-objects.ts";
import { PolygonDescriptor } from "./lib/rendering/shape-descriptors.ts";
import { rect, vector } from "2d-geometry";
import '@fontsource/poppins';
import { GameState } from "./game-state.ts";

const renderer = new PongRenderer();
const collider = new AABBCollider();
const gameState = new GameState(renderer, collider);

export const dependencyContext = createContext({ renderer, gameState });
const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <dependencyContext.Provider value={{ renderer, gameState }}>
      <App />
    </dependencyContext.Provider>
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

// game state test
{
  const PHYSICS_UPDATE_HZ = 165; // times per second

  setInterval(() => {
    gameState.moveStep(1/PHYSICS_UPDATE_HZ);
    collider.updateColliders();
  }, 1000/PHYSICS_UPDATE_HZ);
}