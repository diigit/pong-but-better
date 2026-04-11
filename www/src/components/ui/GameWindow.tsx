import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/constants";
import { dependencyContext } from "@/frontend";
import React from "react";

export function GameWindow() {
	const canvasElementRef = React.useRef(null as null | HTMLCanvasElement);
	const dependencies = React.useContext(dependencyContext);

	const [selfScore, setSelfScore] = React.useState(-1);
	const [oppScore, setOppScore]  = React.useState(-1);
	
	React.useEffect(() => {
		const canvasElement = canvasElementRef.current;
		if (!canvasElement) return;
		
		dependencies.renderer.setCanvas(canvasElement);

		return () => { dependencies.renderer.setCanvas(undefined) } 
	}, [canvasElementRef.current, dependencies.renderer])

	React.useEffect(() => {
		const selfScoreChangedEvt = dependencies.gameState.selfScoreChanged.attach(setSelfScore);
		const oppScoreChangedEvt = dependencies.gameState.oppScoreChanged.attach(setOppScore);

		if (selfScore === -1) setSelfScore(dependencies.gameState.selfScore);
		if (oppScore === -1) setOppScore(dependencies.gameState.oppScore);

		return () => {
			selfScoreChangedEvt.detach();
			oppScoreChangedEvt.detach();
		}
	}, [dependencies.gameState])

	return (
		<div className="flex-none flex flex-col bg-white/30 rounded-xl w-fit h-fit drop-shadow-xl backdrop-blur-sm border-2 border-white/20 overflow-hidden">
			<div key="top bar" className="flex flex-row px-2 py-2 bg-white/30">
				<p key="left score" className="font-sans text-lg text-normal-text justify-start text-left items-center bg-black/5 px-2 py-1 rounded-xl">Your Score: {selfScore}</p>
				<div key="spacer" className="grow"/> 
 				<p key="right score" className="font-sans text-lg text-normal-text justify-end text-right items-center bg-black/5 px-2 py-1 rounded-xl">Opponent Score: {oppScore}</p>
			</div>
			<canvas className="m-2.5 rounded-b-[7px]" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={canvasElementRef}/>
		</div>
	)
}

export default GameWindow;