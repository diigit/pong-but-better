import { run_within_worker } from "../pkg/pong_but_better";
import { ENTITY_BYTES, MAX_ENTITIES } from "./constants";
import { indices, Renderer, vertices } from "./render";

let renderer = new Renderer();

let entityData = new SharedArrayBuffer(MAX_ENTITIES * ENTITY_BYTES);

run_within_worker(vertices, indices, entityData, (canvas: OffscreenCanvas | undefined) => {
  renderer.canvas = canvas;
}).catch(console.error);

function renderLoop() {
  renderer.draw();
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);
