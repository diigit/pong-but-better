import { point, vector } from "2d-geometry";
import { Entity, Mass } from "../entities";
import type { Gamemaster } from "../gamemaster";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_BALL_SIZE, DEFAULT_BALL_SPEED } from "../constants";

export class DefaultGamemode {
	public static async create(gamemaster: Gamemaster): Promise<DefaultGamemode> {
		let ball = await gamemaster.entityTracker.createEntity(Entity);
		ball.bounds = vector(DEFAULT_BALL_SIZE, DEFAULT_BALL_SIZE);
		ball.position = point(
			CANVAS_WIDTH / 2 - DEFAULT_BALL_SIZE / 2,
			CANVAS_HEIGHT / 2 - DEFAULT_BALL_SIZE / 2,
		);
		ball.mass = new Mass(false, 3);
		ball.velocity = vector(-DEFAULT_BALL_SPEED, 0);

		return new DefaultGamemode(gamemaster, ball);
	}

	public destroy() {
		this.ball.destroy();
	}

	private constructor(
		private gamemaster: Gamemaster,
		private ball: Entity,
	) {
		console.log(this.gamemaster);
	}
}
