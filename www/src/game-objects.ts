import { matrix, Point, Vector, type Shape } from "2d-geometry";
import type { ShapeDescriptor } from "./lib/rendering/shape-descriptors";

export class GameObject {
	constructor(public readonly shapeDescriptor: ShapeDescriptor) {
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
}