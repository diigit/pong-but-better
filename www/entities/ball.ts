import { point, vector } from "2d-geometry";
import { Entity, Mass } from ".";
import {
	BALL_MASS,
	BALL_SIZE,
	BALL_SPEED_INCREASE,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	PADDLE_BALL_FRICTION,
	PADDLE_BALL_SKEW,
} from "../constants";
import { Paddle } from "./paddle";

export class Ball extends Entity {
	constructor(view: DataView, _set_updated: () => void, _destroy: () => void) {
		super(view, _set_updated, _destroy);

		this.bounds = vector(BALL_SIZE, BALL_SIZE);
		this.position = point(CANVAS_WIDTH / 2 - BALL_SIZE / 2, CANVAS_HEIGHT / 2 - BALL_SIZE / 2);
		this.mass = new Mass(false, BALL_MASS);

		this.listener = this.collided.attach((entity) => {
			if (!(entity instanceof Paddle)) return;

			const yDist = (this.position.y + this.bounds.y / 2) - entity.position.y;
			const scalar = yDist / entity.bounds.y - 0.5;

			this.velocity = vector(
				this.velocity.x * BALL_SPEED_INCREASE,
				this.velocity.y +
					scalar * PADDLE_BALL_SKEW +
					entity.velocity.y * PADDLE_BALL_FRICTION,
			);
		});
	}

	public destroy(): void {
		this._destroy();
		this.listener.detach();
	}

	private listener;
}
