export const CANVAS_WIDTH = 512;
export const CANVAS_HEIGHT = 256;

export const MAX_VERTICES = 128;
export const MAX_ENTITIES = MAX_VERTICES / 4;
export const ENTITY_SIZE_BYTES = 64;
export const BORDER_THICKNESS = 250;

export const DOWN_KEYS = ["ArrowDown", "s"];
export const UP_KEYS = ["ArrowUp", "w"];

export const PADDLE_BALL_SKEW = 150;
export const PADDLE_BALL_FRICTION = 0.2;
export const BALL_SPEED_INCREASE = 1.05;

export const PADDLE_WIDTH = 8;
export const PADDLE_HEIGHT = 64;
export const PADDLE_EDGE_MARGIN = 0;

export const ENABLE_SETTINGS = false;

export const PADDLE_MOVE_SPEED = 400;
export const BALL_SPEED = 400;
export const BALL_SIZE = 12;
export const WINNING_SCORE = 3;
export const BALL_MASS = 5;

export const BALL_WAIT_TIME = 1; // seconds

export const BOT_DIFFICULTY = {
	EASY: { PREDICTION_TIME: 0.3, PADDLE_MOVE_SPEED: 320 },
	MEDIUM: { PREDICTION_TIME: 0.5, PADDLE_MOVE_SPEED: 400 },
	HARD: { PREDICTION_TIME: 1, PADDLE_MOVE_SPEED: 550 },
};
