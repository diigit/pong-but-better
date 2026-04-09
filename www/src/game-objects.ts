import { Box, matrix, Point, vector, Vector, type Shape } from "2d-geometry";
import type { ShapeDescriptor } from "./lib/rendering/shape-descriptors";

export class GameObject {
	constructor(public readonly shapeDescriptor: ShapeDescriptor) {
		this._aabb = shapeDescriptor.aabb;
	}
	
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
		return this.shapeDescriptor.center;
	}

	get boundingBox(): Box {
		const currentCenter = this._aabb.center;
		this._aabb = this._aabb.translate(this.position.x - currentCenter.x, this.position.y - currentCenter.y);
		return this._aabb;
	}	

	movementStep(time: number) {
		this.velocity = this.velocity.add(this.acceleration.multiply(time));
		this.shapeDescriptor.move(this.velocity.multiply(time));
	}

	private _acc: Vector = Vector.EMPTY;
	private _vel: Vector = Vector.EMPTY;
	private _aabb: Box = Box.EMPTY;
}