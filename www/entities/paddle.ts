import { Entity, Mass } from ".";

export class Paddle extends Entity {
	constructor() {
		super()
		
		this.mass = new Mass(true, 0);
	}

	set maxSpeed(maxSpeed: number) {
		// TODO
	}

	get maxSpeed(): number {
		// TODO
		return 0;
	}
}

export class BotPaddle extends Paddle {
	constructor() {
		super();

		// TODO
	}
	
	set reactionTime(time: number) {
		// TODO
	}

	get reactionTime(): number {
		// TODO
		return 0;
	}
}