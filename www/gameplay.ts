import { GameController } from "../pkg/pong_but_better";

async function setupGameplay() {
	self.onmessage = async event => {
		console.log(event);	
		event.data.run();
	}
}

setupGameplay().catch(e => console.error(e));