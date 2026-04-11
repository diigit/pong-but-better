import { Point, point, rect, Vector, vector } from "2d-geometry";
import { AABBCollider, Axis, Barrier } from "./collisions";
import { GameObject } from "./game-objects";
import { BALL_WAIT_TIME, CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_BALL_SIZE, DEFAULT_BALL_SPEED, DEFAULT_PADDLE_HEIGHT, DEFAULT_PADDLE_MOVE_SPEED, DEFAULT_PADDLE_WIDTH, DEFAULT_WINNING_SCORE, PADDLE_EDGE_MARGIN } from "./constants";
import { PolygonDescriptor } from "./lib/rendering/shape-descriptors";
import type { PongRenderer } from "./pong-renderer";
import { Evt } from "evt";
import { act } from "react";

export class GameState {
	public readonly selfScoreChanged = Evt.create<number>();
	public readonly oppScoreChanged = Evt.create<number>();
	public readonly gameActivityChanged = Evt.create<boolean>();

	public winningScore = DEFAULT_WINNING_SCORE;
	
	constructor(renderer: PongRenderer, collider: AABBCollider) {
		this.ball = new GameObject(new PolygonDescriptor(rect(0, 0, DEFAULT_BALL_SIZE, DEFAULT_BALL_SIZE)));
		renderer.renderGameObject(this.ball);
		collider.addCollider(this.ball);
		
		this.paddleLeft = new PaddleController(point(-CANVAS_WIDTH/2 + (DEFAULT_PADDLE_WIDTH/2 + PADDLE_EDGE_MARGIN), 0));
		renderer.renderGameObject(this.paddleLeft.paddle);
		collider.addCollider(this.paddleLeft.paddle);
		
		this.paddleRight = new PaddleController(point(CANVAS_WIDTH/2 - (DEFAULT_PADDLE_WIDTH/2 + PADDLE_EDGE_MARGIN), 0));
		renderer.renderGameObject(this.paddleRight.paddle);
		collider.addCollider(this.paddleRight.paddle);

		this.objectCollisionEvent = collider.objectCollisionOccured.attach(this.onObjectCollision);

		this.barriers = [];
		this.barriers[0] = new Barrier(Axis.X, -CANVAS_WIDTH/2); 	// left
		this.barriers[1] = new Barrier(Axis.X, CANVAS_WIDTH/2); 	// right
		this.barriers[2] = new Barrier(Axis.Y, -CANVAS_HEIGHT/2); 	// top
		this.barriers[3] = new Barrier(Axis.Y, CANVAS_HEIGHT/2); 	// bottom
		this.barriers.forEach((barrier) => collider.addBarrier(barrier));

		this.barrierCollisionEvent = collider.barrierCollisionOccured.attach(this.onBarrierCollision);
	}

	start() {
		if (this.isGameActive) return;
		this.isGameActive = true;

		this.selfScore = 0;
		this.oppScore = 0;

		window.addEventListener("keydown", this.keyDownFn);
		window.addEventListener("keyup", this.keyUpFn);
	}

	moveStep(deltaTime: number) {
		if (!this.isGameActive) return;

		this.paddleLeft.step(deltaTime);
		this.ball.movementStep(deltaTime);
		this.paddleRight.step(deltaTime);
	}

	end() {
		if (!this.isGameActive) return;
		this.isGameActive = false;

		window.removeEventListener("keydown", this.keyDownFn);
		window.removeEventListener("keyup", this.keyUpFn);

		this.barrierCollisionEvent.detach();
		this.objectCollisionEvent.detach();
	}

	resetBall() {
		this.ball.velocity = Vector.EMPTY;
		this.ball.position = Point.EMPTY;

		if (this.selfScore >= this.winningScore || this.oppScore >= this.winningScore) {
			this.end();
		} else {
			setTimeout(() => {
				this.ball.velocity = vector(DEFAULT_BALL_SPEED * (this._selfScore > this._oppScore ? -1 : 1), 0);
			}, BALL_WAIT_TIME * 1000)
		}
	}

	get isGameActive() {
		return this._isGameActive;
	}

	set isGameActive(active: boolean) {
		if (active === this.isGameActive) return;

		this._isGameActive = active;
		this.gameActivityChanged.post(active);
	}

	get selfScore(): number {
		return this._selfScore;
	}

	set selfScore(score: number) {
		this._selfScore = score;
		this.selfScoreChanged.post(score);
		this.resetBall();
	}

	get oppScore(): number {
		return this._oppScore;
	}

	set oppScore(score: number) {
		this._oppScore = score;
		this.oppScoreChanged.post(score);
		this.resetBall();
	}
	
	private onObjectCollision = (collidingObjects: GameObject[]) => {
		if (!collidingObjects.includes(this.ball)) return;

		let paddle;
		if (collidingObjects.includes(this.paddleLeft.paddle)) {
			paddle = this.paddleLeft.paddle;
		} else if (collidingObjects.includes(this.paddleRight.paddle)) {
			paddle = this.paddleRight.paddle;
		}

		if (paddle === undefined) return;

		this.ball.velocity = this.ball.velocity.add(new Vector(this.ball.velocity.x/75, paddle.velocity.y * .5));
	};

	private onBarrierCollision = ([ball, barrier]: [GameObject, Barrier]) => {
		if (ball !== this.ball) return;

		const isLeftBarrier = barrier === this.barriers[0];
		const isRightBarrier = barrier === this.barriers[1];

		if (isLeftBarrier) {
			this.oppScore += 1;
		} else if (isRightBarrier) {
			this.selfScore += 1;
		}
	}

	private keyDownFn = (event: KeyboardEvent) => {
		switch (event.key) {
			case "ArrowUp":
				this.paddleLeft.move(PaddleMoveDirection.Up);
				break;
			case "ArrowDown":
				this.paddleLeft.move(PaddleMoveDirection.Down);
				break;
		}
	};

	private keyUpFn = (event: KeyboardEvent) => {
		if (event.key === "ArrowUp" || event.key === "ArrowDown") 
			this.paddleLeft.move(PaddleMoveDirection.None);
	};

	private paddleLeft;
	private paddleRight;
	private ball: GameObject;
	private barriers: Barrier[];
	private barrierCollisionEvent;
	private objectCollisionEvent;
	private _isGameActive = false;

	private _selfScore: number = 0;
	private _oppScore: number = 0;
}

enum PaddleMoveDirection {
	Up,
	Down,
	None,
}

export class PaddleController {
	public readonly paddle = new GameObject(new PolygonDescriptor(rect(
		0, 
		0, 
		DEFAULT_PADDLE_WIDTH, 
		DEFAULT_PADDLE_HEIGHT
	)))
	
	constructor(initialPosition: Point = Point.EMPTY) {
		this.paddle.position = initialPosition;
		this.paddle.superHeavy = true;
	}

	move(moveDirection: PaddleMoveDirection) {
		let mult = 0;
		switch (moveDirection) {
			case PaddleMoveDirection.Up:
				mult = 1;
				break;
			case PaddleMoveDirection.Down:
				mult = -1;
				break;
			case PaddleMoveDirection.None:
				mult = 0;
				break; 
		}

		this.paddle.velocity = vector(this.paddle.velocity.x, this._speed * mult);
	}

	step(deltaTime: number) {
		this.paddle.movementStep(deltaTime);

		const paddleYMax = CANVAS_HEIGHT/2 - this.paddle.boundingBox.height/2
		const paddleYMin = -CANVAS_HEIGHT/2 + this.paddle.boundingBox.height/2

		this.paddle.position = new Point(
			this.paddle.position.x, 
			Math.min(
				Math.max(this.paddle.position.y, paddleYMin), 
				paddleYMax)
			)
	}

	get speed(): number {
		return this._speed;
	}

	set speed(newSpeed: number) {
		this._speed = newSpeed;
		this.move(this._moveDirection);
	}

	get moveDirection() {
		return this._moveDirection;
	}

	get isMoving() {
		return this._moveDirection !== PaddleMoveDirection.None;
	}

	private _speed = DEFAULT_PADDLE_MOVE_SPEED;
	private _moveDirection = PaddleMoveDirection.None;
}