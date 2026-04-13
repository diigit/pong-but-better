import { Point, point, rect, Vector, vector } from "2d-geometry";
import { AABBCollider, Axis, Barrier, Equality } from "./collisions";
import { GameObject } from "./game-objects";
import { BALL_MASS, BALL_WAIT_TIME, BOT_DIFFICULTY, CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_BALL_SIZE, DEFAULT_BALL_SPEED, DEFAULT_PADDLE_HEIGHT, DEFAULT_PADDLE_MOVE_SPEED, DEFAULT_PADDLE_WIDTH, DEFAULT_WINNING_SCORE, PADDLE_EDGE_MARGIN } from "./constants";
import { PolygonDescriptor } from "./lib/rendering/shape-descriptors";
import type { PongRenderer } from "./pong-renderer";
import { Evt } from "evt";

function randomBetween(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export enum Gamemode {
	Normal, 
	ManyBalls,
	Obstacles,
	ExplodeYourPC,
}

export enum BotDifficulty {
	Easy,
	Medium,
	Hard,
}

export class GameState {
	public readonly selfScoreChanged = Evt.create<number>();
	public readonly oppScoreChanged = Evt.create<number>();
	public readonly gameActivityChanged = Evt.create<boolean>();
	public readonly gamemodeChanged = Evt.create<Gamemode>();
	public readonly botDifficultyChanged = Evt.create<BotDifficulty>();

	public winningScore = DEFAULT_WINNING_SCORE;
	
	constructor(readonly renderer: PongRenderer, readonly collider: AABBCollider) {
		this.ball = new GameObject(new PolygonDescriptor(rect(0, 0, DEFAULT_BALL_SIZE, DEFAULT_BALL_SIZE)));
		this.ball.mass = BALL_MASS;
		renderer.renderGameObject(this.ball);
		collider.addCollider(this.ball);

		this.paddleLeft = new PaddleController(point(-CANVAS_WIDTH/2 + (DEFAULT_PADDLE_WIDTH/2 + PADDLE_EDGE_MARGIN), 0));
		renderer.renderGameObject(this.paddleLeft.paddle);
		collider.addCollider(this.paddleLeft.paddle);
		
		this.paddleRight = new PaddleController(point(CANVAS_WIDTH/2 - (DEFAULT_PADDLE_WIDTH/2 + PADDLE_EDGE_MARGIN), 0));
		renderer.renderGameObject(this.paddleRight.paddle);
		collider.addCollider(this.paddleRight.paddle);

		this.barriers = [];
		this.barriers[0] = new Barrier(Axis.X, -CANVAS_WIDTH/2, Equality.LessThan); 	// left
		this.barriers[1] = new Barrier(Axis.X, CANVAS_WIDTH/2, Equality.GreaterThan); 	// right
		this.barriers[2] = new Barrier(Axis.Y, -CANVAS_HEIGHT/2, Equality.LessThan); 	// top
		this.barriers[3] = new Barrier(Axis.Y, CANVAS_HEIGHT/2, Equality.GreaterThan); 	// bottom
		this.barriers.forEach((barrier) => collider.addBarrier(barrier));

		this.botOpp = new BotPaddleController(this.paddleRight, this.ball);

		this.ctx = Evt.newCtx();
	}

	start() {
		if (this.isGameActive) return;
		
		this.selfScore = 0;
		this.oppScore = 0;

		this.botOpp.start();

		this.ctx = Evt.newCtx();
		this.collider.barrierCollisionOccured.attach(this.ctx, this.onBarrierCollision);
		this.collider.objectCollisionOccured.attach(this.ctx, this.onObjectCollision);

		window.addEventListener("keydown", this.keyDownFn);
		window.addEventListener("keyup", this.keyUpFn);

		this.isGameActive = true;

		this.resetBall();

		this._gamemode?.onStart?.();
	}

	moveStep(deltaTime: number) {
		if (!this.isGameActive) return;

		this.paddleLeft.step(deltaTime);
		this.ball.movementStep(deltaTime);
		this.paddleRight.step(deltaTime);

		this._gamemode?.onStep?.(deltaTime);
	}

	end() {
		if (!this.isGameActive) return;
		this.isGameActive = false;

		this.resetBall(true);

		window.removeEventListener("keydown", this.keyDownFn);
		window.removeEventListener("keyup", this.keyUpFn);

		this.botOpp.stop();

		this.ctx.done();

		this._gamemode?.onEnd?.();
	}

	resetBall(ign = false) {
		if (this.isGameActive === false || ign) return;

		this.ball.velocity = Vector.EMPTY;
		this.ball.position = Point.EMPTY;

		this.paddleLeft.reset();
		this.paddleRight.reset();

		this._gamemode?.onReset?.();

		if (this.selfScore >= this.winningScore || this.oppScore >= this.winningScore) {
			this.end();
		} else {
			setTimeout(() => {
				this.ball.velocity = vector(DEFAULT_BALL_SPEED * (this._selfScore > this._oppScore ? -1 : 1), randomBetween(-150, 150));
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
	
	get gamemode() {
		return this._gamemode !== undefined ? this._gamemode.type : Gamemode.Normal;
	}

	set gamemode(newGamemode: Gamemode) {
		if ((newGamemode === Gamemode.Normal && this._gamemode === undefined) || newGamemode === this._gamemode?.type) return;

		this.selfScore = 0;
		this.oppScore = 0;
		
		this.end();
		this._gamemode?.cleanUp();

		let gamemodeHandler;
		switch (newGamemode) {
			case Gamemode.ManyBalls:
				gamemodeHandler = new ManyBallsGamemode(this);
				break;
			case Gamemode.Obstacles:
				gamemodeHandler = new ObstaclesGamemode(this);
				break;
			case Gamemode.ExplodeYourPC:
				gamemodeHandler = new ExplodeYourPCGamemode(this);
				break;
		}

		this._gamemode = gamemodeHandler;
		this.gamemodeChanged.post(newGamemode);
	}

	get botDifficulty() {
		return this._botDifficulty;
	}

	set botDifficulty(newBotDifficulty: BotDifficulty) {
		this._botDifficulty = newBotDifficulty;
		this.botDifficultyChanged.post(newBotDifficulty);

		this.botOpp.setDifficulty(newBotDifficulty);
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
	ball: GameObject;
	private barriers: Barrier[];
	private botOpp;
	private ctx;

	private _isGameActive = false;
	private _selfScore: number = 0;
	private _oppScore: number = 0;
	private _gamemode: GamemodeHandler | undefined;
	private _botDifficulty = BotDifficulty.Easy;
}

interface GamemodeHandler {
	onStart?(): void;
	onStep?(deltaTime: number): void;
	onEnd?(): void;
	onReset?(): void;

	cleanUp(): void;

	readonly gameState: GameState;
	readonly type: Gamemode;
}

class ExplodeYourPCGamemode implements GamemodeHandler {
	public readonly type = Gamemode.ExplodeYourPC;

	constructor(readonly gameState: GameState) {
		
	}
	
	onStart(): void {
		for (let i = 0; i < 200; i++) {
			const sideSize = 16;

			const spawnPositionWidth = CANVAS_WIDTH - sideSize;
			const spawnPositionHeight = CANVAS_HEIGHT - sideSize;
			
			const newBall = new GameObject(new PolygonDescriptor(rect(
				randomBetween(-spawnPositionWidth/2, spawnPositionWidth/2),
				randomBetween(-spawnPositionHeight/2, spawnPositionHeight/2),
				sideSize,
				sideSize,
			)))

			newBall.velocity = vector(randomBetween(-100, 100), randomBetween(-100, 100))
			newBall.mass = randomBetween(.7, 2)

			this.gameState.collider.addCollider(newBall);
			this.gameState.renderer.renderGameObject(newBall);

			this.balls[i] = newBall;
		}
	}

	onStep(deltaTime: number): void {
		this.balls.forEach((ball) => {
			ball.movementStep(deltaTime);
		});

		if (this.gameState.ball.velocity.length < 400) {
			this.gameState.ball.velocity = this.gameState.ball.velocity.multiply(2);
		}
	}

	onEnd(): void {
		this.balls.forEach((ball) => {
			this.gameState.collider.removeCollider(ball);
			this.gameState.renderer.unrenderGameObject(ball);
		});
	}

	cleanUp() {
		                                                                                                                                                                                            
	}

	private balls = new Array<GameObject>;
}


class ManyBallsGamemode implements GamemodeHandler {
	public readonly type = Gamemode.ManyBalls;

	constructor(readonly gameState: GameState) {
		
	}
	
	onStart(): void {
		for (let i = 0; i < 10; i++) {
			const sideSize = randomBetween(12, 14);

			const spawnPositionWidth = CANVAS_WIDTH - sideSize;
			const spawnPositionHeight = CANVAS_HEIGHT - sideSize;
			
			const newBall = new GameObject(new PolygonDescriptor(rect(
				randomBetween(-spawnPositionWidth/2, spawnPositionWidth/2),
				randomBetween(-spawnPositionHeight/2, spawnPositionHeight/2),
				sideSize,
				sideSize,
			)))

			newBall.velocity = vector(randomBetween(-100, 100), randomBetween(-100, 100))
			newBall.mass = randomBetween(.7, 2)

			this.gameState.collider.addCollider(newBall);
			this.gameState.renderer.renderGameObject(newBall);

			this.balls[i] = newBall;
		}
	}

	onStep(deltaTime: number): void {
		this.balls.forEach((ball) => {
			ball.movementStep(deltaTime);
		});

		if (this.gameState.ball.velocity.length < 400) {
			this.gameState.ball.velocity = this.gameState.ball.velocity.multiply(2);
		}
	}

	onEnd(): void {
		this.balls.forEach((ball) => {
			this.gameState.collider.removeCollider(ball);
			this.gameState.renderer.unrenderGameObject(ball);
		});
	}

	cleanUp() {
		                                                                                                                                                                                            
	}

	private balls = new Array<GameObject>;
}

class ObstaclesGamemode implements GamemodeHandler {
	public readonly type = Gamemode.Obstacles;

	constructor(readonly gameState: GameState) {

	}

	onStart(): void {
		let index = 0;
		while (this.obstacles.length < 10) {
			const sideSize = randomBetween(10, 32);

			const spawnPositionWidth = CANVAS_WIDTH - sideSize - (PADDLE_EDGE_MARGIN + DEFAULT_PADDLE_WIDTH + 10);
			const spawnPositionHeight = CANVAS_HEIGHT - sideSize;
			
			const newObstacle = new GameObject(new PolygonDescriptor(rect(
				randomBetween(-spawnPositionWidth/2, spawnPositionWidth/2),
				randomBetween(-spawnPositionHeight/2, spawnPositionHeight/2),
				sideSize,
				sideSize * randomBetween(.5, 1.5),
			)))

			let colliding = false;
			this.obstacles.forEach((other) => {
				const result = this.gameState.collider.boundingBoxesAreColliding(newObstacle.boundingBox, other.boundingBox);
				colliding = result.colliding || colliding;
			});

			if (colliding) 
				continue;
			

			newObstacle.superHeavy = true;

			this.gameState.collider.addCollider(newObstacle);
			this.gameState.renderer.renderGameObject(newObstacle);

			this.obstacles[index] = newObstacle;

			index++;
		}
	}

	onEnd(): void {
		this.obstacles.forEach((obstacle) => {
			this.gameState.collider.removeCollider(obstacle);
			this.gameState.renderer.unrenderGameObject(obstacle);
		});

		this.obstacles = new Array;
	}


	cleanUp() {
		
	}

	private obstacles = new Array<GameObject>;
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

	reset() {
		this.paddle.velocity = Vector.EMPTY;
		this.paddle.position = point(this.paddle.position.x, 0); 
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

export class BotPaddleController {
	public pollingRate = BOT_DIFFICULTY.EASY.POLLING_RATE; // seconds
	public predictionDistanace = BOT_DIFFICULTY.EASY.PREDICT_DISTANCE;
	
	constructor(public readonly paddle: PaddleController, private ball: GameObject) { }

	start() {
		if (this.isActive) return;
		this.isActive = true;	

		this.interval = setInterval(() => {
			const paddle = this.paddle.paddle;
			const ball = this.ball;

			const xDist = Math.min(paddle.position.x - ball.position.x, 100);
			const futureYPos = (ball.velocity.y / ball.velocity.x ) * xDist + ball.position.y;
			
			let moveDirection = PaddleMoveDirection.None;

			if (paddle.boundingBox.ymin > futureYPos) {
				moveDirection = PaddleMoveDirection.Down;
			} else if (paddle.boundingBox.ymax < futureYPos) {
				moveDirection = PaddleMoveDirection.Up;
			}
			
			this.paddle.move(moveDirection);
		}, 1000/this.pollingRate)
	}

	setDifficulty(difficulty: BotDifficulty) {
		switch (difficulty) {
			case BotDifficulty.Easy:
				this.pollingRate = BOT_DIFFICULTY.EASY.POLLING_RATE;
				this.predictionDistanace = BOT_DIFFICULTY.EASY.PREDICT_DISTANCE;
				this.paddle.speed = BOT_DIFFICULTY.EASY.PADDLE_MOVE_SPEED;
				break;
			case BotDifficulty.Medium:
				this.pollingRate = BOT_DIFFICULTY.MEDIUM.POLLING_RATE;
				this.predictionDistanace = BOT_DIFFICULTY.MEDIUM.PREDICT_DISTANCE;
				this.paddle.speed = BOT_DIFFICULTY.MEDIUM.PADDLE_MOVE_SPEED;
				break;
			case BotDifficulty.Hard:
				this.pollingRate = BOT_DIFFICULTY.HARD.POLLING_RATE;
				this.predictionDistanace = BOT_DIFFICULTY.HARD.PREDICT_DISTANCE;
				this.paddle.speed = BOT_DIFFICULTY.HARD.PADDLE_MOVE_SPEED;
				break;
		}
		
		this.stop();
		this.start();
	}

	stop() {
		if (!this.isActive) return;
		this.isActive = false;

		clearInterval(this.interval);
	}

	private isActive = false;
	private interval: NodeJS.Timeout | undefined;
}