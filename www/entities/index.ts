// A class for controlling entities

import { point, vector, type Point, type Vector } from "2d-geometry";
import { Evt } from "evt";


export class Mass {
	constructor(public anchored = false, public value = 0) {};
}

export class Entity {
	public readonly collided: Evt<(other: Entity) => void> = new Evt();

	constructor() {
		// TODO
	}

	public destroy() {
		// TODO
	}

	set position(position: Point) {
		// TODO
	}

	get position(): Point {
		// TODO
		return point(0, 0);
	}

	set velocity(velocity: Vector) {
		// TODO
	}

	get velocity(): Vector {
		// TODO
		return vector(0, 0);
	}

	set acceleration(acceleration: Vector) {
		// TODO
	}

	get acceleration(): Vector {
		// TODO
		return vector(0, 0);
	}

	set mass(mass: Mass) {
		// TODO
	}

	get mass(): Mass {
		// TODO
		return new Mass;
	}

	set bounds(bounds: Vector) {
		// TODO
	}

	get bounds(): Vector {
		// TODO
		return vector(0, 0);
	}
}