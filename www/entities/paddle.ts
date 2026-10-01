import { Entity, ENTITY_TYPE_OFFSET, Mass } from ".";

// 	Paddle Layout

//	[Bytes]	Value (Type)
//  -------------------------------
//	[48-51]	Max Speed (f32)
//	[52-55]	Reaction time (f32) 	<-- Only if bot paddle

const MAX_SPEED_OFFSET = 48;
const REACTION_TIME_OFFSET = 52;

export class Paddle extends Entity {
	constructor(view: DataView, _set_updated: () => void, _destroy: () => void) {
		super(view, _set_updated, _destroy);

		this.mass = new Mass(true, 0);
		view.setUint32(ENTITY_TYPE_OFFSET, 1);
	}

	set maxSpeed(maxSpeed: number) {
		this.view.setFloat32(MAX_SPEED_OFFSET, maxSpeed);
		this._set_updated();
	}

	get maxSpeed(): number {
		return this.view.getFloat32(MAX_SPEED_OFFSET);
	}
}

export class BotPaddle extends Paddle {
	constructor(view: DataView, _set_updated: () => void, _destroy: () => void) {
		super(view, _set_updated, _destroy);

		view.setUint32(ENTITY_TYPE_OFFSET, 2);
	}
	
	set reactionTime(time: number) {
		this.view.setFloat32(REACTION_TIME_OFFSET, time);
		this._set_updated();
	}

	get reactionTime(): number {
		return this.view.getFloat32(REACTION_TIME_OFFSET);
	}
}