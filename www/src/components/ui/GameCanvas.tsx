import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/constants";
import { dependencyContext } from "@/frontend";
import React from "react";

export function GameCanvas() {
	let canvasElementRef = React.useRef(null as null | HTMLCanvasElement);
	let dependencies = React.useContext(dependencyContext);
	
	React.useEffect(() => {
		let canvasElement = canvasElementRef.current;
		if (!canvasElement) return;
		
		dependencies.renderer.setCanvas(canvasElement);

		return () => { dependencies.renderer.setCanvas(undefined) } 
	}, [canvasElementRef.current, dependencies.renderer])

	return (
		<div className="flex-none flex flex-col bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl backdrop-blur-sm border-2 border-white/20 overflow-hidden">
			<div key="top bar" className="flex flex-row px-2 py-2 bg-white/30">
				<p key="left score" className="font-sans text-lg text-normal-text justify-start text-left items-center bg-black/5 px-2 py-1 rounded-xl">Your Score: 0</p>
				<div key="spacer" className="grow"/> 
 				<p key="right score" className="font-sans text-lg text-normal-text justify-end text-right items-center bg-black/5 px-2 py-1 rounded-xl">Opponent Score: 0</p>
			</div>
			<canvas className="m-2.5 rounded-b-[7px]" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={canvasElementRef}/>
		</div>
	)
}

export default GameCanvas;