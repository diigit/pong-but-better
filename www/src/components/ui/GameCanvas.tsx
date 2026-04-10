import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/constants";
import { rendererContext } from "@/frontend";
import React from "react";

var beCool = false;

export function GameCanvas() {
	let canvasElementRef = React.useRef(null as null | HTMLCanvasElement);
	let renderer = React.useContext(rendererContext);
	
	React.useEffect(() => {
		let canvasElement = canvasElementRef.current;
		if (!canvasElement) return;
		
		renderer.setCanvas(canvasElement);

		return () => { renderer.setCanvas(undefined) } 
	}, [canvasElementRef.current])
	
	const titleTextArr = [
		"ping pong",
		"wanna play pong?",
		"this is pong",
		"finally, a real game",
		"better graphics than GTA 6",
		"more difficult than tidal wave",
		"lived longer than Concord",
		"wassup",
		"culminating = massive cortisol spike",
		"help me",
		"i hope this one doesn\'t show up during my presentation",
		"triple T",
		"47 Chadwick Dr",
		"thorfinn",
		"build artemis III, make no mistakes",
		"at tel aviv rn",
	]

	const randomText = titleTextArr[Math.floor(Math.random() * titleTextArr.length)];

	const canvasStyle = `w-${CANVAS_WIDTH/4} h-${CANVAS_HEIGHT/4} m-2.5 rounded-b-[7px]` 

	return (
		<div className="flex flex-col bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl backdrop-blur-sm border-2 border-white/20 overflow-hidden">
			<div className="px-4 py-2 bg-white/30">
				<p className="font-pixel text-xl text-title">{beCool ? randomText : "Pong Window"}</p>
			</div>
			<canvas className={canvasStyle} ref={canvasElementRef}/>
		</div>
	)
}

export default GameCanvas;