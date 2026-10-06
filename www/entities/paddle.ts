import { vector } from "2d-geometry";
import { Entity, Mass } from ".";
import { PADDLE_HEIGHT, PADDLE_WIDTH } from "../constants";

export class Paddle extends Entity {
	public static readonly entityType: number = 2;

	constructor(view: DataView, _destroy: () => void, _setUpdating: () => void) {
		super(view, _destroy, _setUpdating);

		this.mass = new Mass(true, 0);
		this.bounds = vector(PADDLE_WIDTH, PADDLE_HEIGHT);
	}
}

export class BotPaddle extends Paddle {
	public static readonly entityType: number = 3;

	constructor(view: DataView, _destroy: () => void, _setUpdating: () => void) {
		super(view, _destroy, _setUpdating);
	}
}
