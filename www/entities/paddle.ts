import { vector } from "2d-geometry";
import { Entity, Mass } from ".";
import { DEFAULT_PADDLE_HEIGHT, DEFAULT_PADDLE_WIDTH } from "../constants";

// 	Paddle Layout

//	[Bytes]	Value (Type)
//  -------------------------------
//	[48-51]	Max Speed (f32)
//	[52-55]	Reaction time (f32) 	<-- Only if bot paddle

const MAX_SPEED_OFFSET = 48;
const REACTION_TIME_OFFSET = 52;

export class Paddle extends Entity {
	public readonly entityType: number = 2;

	constructor(view: DataView, _set_updated: () => void, _destroy: () => void) {
		super(view, _set_updated, _destroy);

		this.mass = new Mass(true, 0);
		this.bounds = vector(DEFAULT_PADDLE_WIDTH, DEFAULT_PADDLE_HEIGHT);
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
	public readonly entityType: number = 3;

	constructor(view: DataView, _set_updated: () => void, _destroy: () => void) {
		super(view, _set_updated, _destroy);
	}

	set reactionTime(time: number) {
		this.view.setFloat32(REACTION_TIME_OFFSET, time);
		this._set_updated();
	}

	get reactionTime(): number {
		return this.view.getFloat32(REACTION_TIME_OFFSET);
	}
}
