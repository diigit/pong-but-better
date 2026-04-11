import { point, rect, vector } from "2d-geometry";
import { AABBCollider, Axis, Barrier } from "./collisions";
import { GameObject } from "./game-objects";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_PADDLE_HEIGHT, DEFAULT_PADDLE_WIDTH, PADDLE_EDGE_MARGIN } from "./constants";
import { PolygonDescriptor } from "./lib/rendering/shape-descriptors";
import type { PongRenderer } from "./pong-renderer";

export class GameState {
	constructor(renderer: PongRenderer, collider: AABBCollider) {
		const paddleShape = rect(0, 0, DEFAULT_PADDLE_WIDTH, DEFAULT_PADDLE_HEIGHT);
		this.paddleLeft = new GameObject(new PolygonDescriptor(paddleShape));
		this.paddleLeft.superHeavy = true;
		this.paddleLeft.position = point(-CANVAS_WIDTH/2 + (DEFAULT_PADDLE_WIDTH/2 + PADDLE_EDGE_MARGIN), 0);
		renderer.renderGameObject(this.paddleLeft);
		collider.addCollider(this.paddleLeft);

		this.paddleRight = new GameObject(new PolygonDescriptor(paddleShape));
		this.paddleRight.superHeavy = true;
		this.paddleRight.position = point(CANVAS_WIDTH/2 - (DEFAULT_PADDLE_WIDTH/2 + PADDLE_EDGE_MARGIN), 0);
		renderer.renderGameObject(this.paddleRight);
		collider.addCollider(this.paddleRight);

		this.barriers = [];
		this.barriers[0] = new Barrier(Axis.X, -CANVAS_WIDTH/2);
		this.barriers[1] = new Barrier(Axis.X, CANVAS_WIDTH/2);
		this.barriers[2] = new Barrier(Axis.Y, -CANVAS_HEIGHT/2);
		this.barriers[3] = new Barrier(Axis.Y, CANVAS_HEIGHT/2);

		this.barriers.forEach((barrier) => collider.addBarrier(barrier));

		this.ball = new GameObject(new PolygonDescriptor(rect(-8, -8, 16, 16)));
		this.ball.velocity = vector(400, 100);
		renderer.renderGameObject(this.ball);
		collider.addCollider(this.ball);

		this.keyDownFn = (event: KeyboardEvent) => {
			if (event.key === "ArrowUp") {
				this.paddleLeft.velocity = vector(0, 200);
			} else if (event.key === "ArrowDown") {
				this.paddleLeft.velocity = vector(0, -200);
			}
		}

		this.keyUpFn = (event: KeyboardEvent) => {
			if (event.key === "ArrowUp" || event.key === "ArrowDown") {
				this.paddleLeft.velocity = vector(0, 0);
			}
		}

		window.addEventListener("keydown", this.keyDownFn);
		window.addEventListener("keyup", this.keyUpFn);
	}

	start() {

	}

	moveStep(deltaTime: number) {
		this.paddleLeft.movementStep(deltaTime);
		this.ball.movementStep(deltaTime);
		this.paddleRight.movementStep(deltaTime);
	}

	end() {
		window.removeEventListener("keydown", this.keyDownFn);
	}

	private paddleLeft: GameObject;
	private paddleRight: GameObject;
	private ball: GameObject;
	private barriers: Barrier[];
	private keyDownFn: (event: KeyboardEvent) => void;
	private keyUpFn;
}