import { matrix, Point, Vector, type Shape } from "2d-geometry";

export class GameObject {
	constructor(private _shape: Shape) {
		this.acceleration = Vector.EMPTY;
		this.velocity = Vector.EMPTY;
	}
	
	set acceleration(acc: Vector) {
		this.acceleration = acc;
	}

	get acceleration(): Vector {
		return this.acceleration;
	}

	set velocity(vel: Vector) {
		this.velocity = vel;
	}

	get velocity(): Vector {
		return this.velocity;
	}

	set position(p: Point) {
		const translate = p.translate(this.shape.center.transform(matrix(0, 0, -1)))
		this.shape.translate(translate);
	}

	get position(): Point {
		return this.shape.center;
	}

	get shape(): Shape {
		return this._shape;
	}

	movementStep(time: number) {
		this.velocity = this.velocity.add(this.acceleration.multiply(time));
		this.shape.translate(this.velocity.multiply(time));
	}
}