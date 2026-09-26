import { CanvasSize, run_within_worker } from "../pkg/pong_but_better";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";

onmessage = event => { 	
	run_within_worker(
		event.data, 
		CanvasSize.new(CANVAS_WIDTH, CANVAS_HEIGHT),
	);
}

postMessage("ready");