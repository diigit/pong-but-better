import { matrix, Point, Vector, type Shape } from "2d-geometry";
import type { ShapeDescriptor } from "./lib/rendering/shape-descriptors";

export class GameObject {
	constructor(public readonly shapeDescriptor: ShapeDescriptor) { }
	
	set acceleration(acc: Vector) {
		this._acc = acc;
	}

	get acceleration(): Vector {
		return this._acc;
	}

	set velocity(vel: Vector) {
		this._vel = vel;
	}

	get velocity(): Vector {
		return this._vel;
	}

	set position(p: Point) {	
		// move shape descriptor and bounding box
		this.shapeDescriptor.center = p;
	}

	get position(): Point {
		// todo: return bounding box center instead?
		return this.shapeDescriptor.center;
	}

	movementStep(time: number) {
		this.velocity = this.velocity.add(this.acceleration.multiply(time));
		this.shapeDescriptor.move(this.velocity.multiply(time));
	}

	private _acc: Vector = Vector.EMPTY;
	private _vel: Vector = Vector.EMPTY;
}