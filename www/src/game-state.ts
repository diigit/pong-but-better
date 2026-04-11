import { Point, point, rect, Vector, vector } from "2d-geometry";
import { AABBCollider, Axis, Barrier } from "./collisions";
import { GameObject } from "./game-objects";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_BALL_SIZE, DEFAULT_BALL_SPEED, DEFAULT_PADDLE_HEIGHT, DEFAULT_PADDLE_MOVE_SPEED, DEFAULT_PADDLE_WIDTH, PADDLE_EDGE_MARGIN } from "./constants";
import { PolygonDescriptor } from "./lib/rendering/shape-descriptors";
import type { PongRenderer } from "./pong-renderer";

export class GameState {
	constructor(renderer: PongRenderer, collider: AABBCollider) {
		this.ball = new GameObject(new PolygonDescriptor(rect(-DEFAULT_BALL_SIZE/2, -DEFAULT_BALL_SIZE/2, DEFAULT_BALL_SIZE, DEFAULT_BALL_SIZE)));
		this.ball.velocity = vector(DEFAULT_BALL_SPEED, 50);
		renderer.renderGameObject(this.ball);
		collider.addCollider(this.ball);
		
		const paddleShape = rect(0, 0, DEFAULT_PADDLE_WIDTH, DEFAULT_PADDLE_HEIGHT);
		this.paddleLeft = new GameObject(new PolygonDescriptor(paddleShape));
		this.paddleLeft.superHeavy = true;
		this.paddleLeft.position = point(-CANVAS_WIDTH/2 + (DEFAULT_PADDLE_WIDTH/2 + PADDLE_EDGE_MARGIN), 0);
		renderer.renderGameObject(this.paddleLeft);
		collider.addCollider(this.paddleLeft);

		this.objectCollisionEvent = collider.objectCollisionOccured.attach((collidingObjects) => {
			if (!collidingObjects.includes(this.ball)) return;

			let paddle;
			if (collidingObjects.includes(this.paddleLeft)) {
				paddle = this.paddleLeft;
			} else if (collidingObjects.includes(this.paddleRight)) {
				paddle = this.paddleRight;
			}

			if (paddle === undefined) return;

			this.ball.velocity = this.ball.velocity.add(new Vector(40, paddle.velocity.y * .5));
		})

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

		this.keyDownFn = (event: KeyboardEvent) => {
			if (event.key === "ArrowUp") {
				this.paddleLeft.velocity = vector(0, DEFAULT_PADDLE_MOVE_SPEED);
			} else if (event.key === "ArrowDown") {
				this.paddleLeft.velocity = vector(0, -DEFAULT_PADDLE_MOVE_SPEED);
			}
		}

		this.keyUpFn = (event: KeyboardEvent) => {
			if (event.key === "ArrowUp" || event.key === "ArrowDown") {
				this.paddleLeft.velocity = vector(0, 0);
			}
		}

		window.addEventListener("keydown", this.keyDownFn);
		window.addEventListener("keyup", this.keyUpFn);

		this.barrierCollisionEvent = collider.barrierCollisionOccured.attach(([ball, barrier]) => {
			if (ball !== this.ball) return;

			const isLeftBarrier = barrier === this.barriers[0];
			const isRightBarrier = barrier === this.barriers[1];

			if (isLeftBarrier) {
				console.log("[SCORE] Right scored!");
			} else if (isRightBarrier) {
				console.log("[SCORE] Left scored!");
			}
		})
	}

	start() {

	}

	moveStep(deltaTime: number) {
		this.paddleLeft.movementStep(deltaTime);
		this.ball.movementStep(deltaTime);
		this.paddleRight.movementStep(deltaTime);

		const paddleYMax = CANVAS_HEIGHT/2 - this.paddleLeft.boundingBox.height/2
		const paddleYMin = -CANVAS_HEIGHT/2 + this.paddleLeft.boundingBox.height/2

		this.paddleLeft.position = new Point(
			this.paddleLeft.position.x, 
			Math.min(
				Math.max(this.paddleLeft.position.y, paddleYMin), 
				paddleYMax)
			)
	}

	end() {
		window.removeEventListener("keydown", this.keyDownFn);
		this.barrierCollisionEvent.detach();
		this.objectCollisionEvent.detach();
	}

	private paddleLeft: GameObject;
	private paddleRight: GameObject;
	private ball: GameObject;
	private barriers: Barrier[];
	private keyDownFn: (event: KeyboardEvent) => void;
	private keyUpFn;
	private barrierCollisionEvent;
	private objectCollisionEvent;
}