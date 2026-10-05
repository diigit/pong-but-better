import { StrictMode, createContext } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App.tsx";
import "@fontsource/poppins";
import { Gamemaster } from "./gamemaster.ts";
import Worker from "./worker.ts?worker";

let worker = new Worker();

export const entityDataBuffer: SharedArrayBuffer = await new Promise((resolve) => {
	let listener = (event: MessageEvent) => {
		resolve(event.data);
		worker.removeEventListener("message", listener);
	};
	worker.addEventListener("message", listener);
});

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

const gamemaster = await Gamemaster.create(worker, entityDataBuffer);

export const dependencyContext = createContext({ setCanvas, gamemaster });
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<dependencyContext.Provider value={{ setCanvas, gamemaster }}>
			<App />
		</dependencyContext.Provider>
	</StrictMode>,
);
