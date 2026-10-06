// A class for controlling entities

import { point, vector, type Point, type Vector } from "2d-geometry";
import { Evt } from "evt";
import { ENTITY_SIZE_BYTES } from "../constants";

// 	Entity Buffer Layout

//	[Bytes]	Value (Type)
//  -------------------------------
//	[04-07]	Entity Id (u32)
//	[08-11]	Entity Type (u32)
//	[12-19]	Position (f32 x, f32 y)
//	[20-27]	Velocity (f32 x, f32 y)
//	[28-35]	Acceleration (f32 x, f32 y)
//	[36-43]	Bounds (f32 x, f32 y)
//	[44-47]	Mass (f32)

//	Entity Types

//	[id]	Type
//	----------------
//	1		Uninitialized
//	2		None
//	3		Player paddle
//	4		Enemy Paddle

const ENTITY_ID_OFFSET = 4;
//const ENTITY_TYPE_OFFSET = 8;
const POSITION_OFFSET = 12;
const VELOCITY_OFFSET = 20;
const ACCELERATION_OFFSET = 28;
const BOUNDS_OFFSET = 36;
const MASS_OFFSET = 44;

let _f32_array = new Float32Array(1);
_f32_array[0] = 3.4028235e38;
const F32_MAX = _f32_array[0];

export class Mass {
	constructor(
		public anchored = false,
		public value = 0,
	) {}
}

export abstract class Entity {
	public static entityType: number;

	public readonly collided: Evt<Entity> = new Evt();

	constructor(
		protected view: DataView,
		protected _destroy: () => void = () => {},
		protected setUpdating: () => void,
	) {
	}

	public destroy() {
		this.destroyed = true;
		this._destroy();
	}

	public isDestroyed() {
		return this.destroyed;
	}

	set position(position: Point) {
		this.setUpdating();

		this.view.setFloat32(POSITION_OFFSET, position.x);
		this.view.setFloat32(POSITION_OFFSET + 4, position.y);
	}

	get position(): Point {
		return point(
			this.view.getFloat32(POSITION_OFFSET),
			this.view.getFloat32(POSITION_OFFSET + 4),
		);
	}

	set velocity(velocity: Vector) {
		this.setUpdating();

		this.view.setFloat32(VELOCITY_OFFSET, velocity.x);
		this.view.setFloat32(VELOCITY_OFFSET + 4, velocity.y);
	}

	get velocity(): Vector {
		return vector(
			this.view.getFloat32(VELOCITY_OFFSET),
			this.view.getFloat32(VELOCITY_OFFSET + 4),
		);
	}

	set acceleration(acceleration: Vector) {
		this.setUpdating();

		this.view.setFloat32(ACCELERATION_OFFSET, acceleration.x);
		this.view.setFloat32(ACCELERATION_OFFSET + 4, acceleration.y);
	}

	get acceleration(): Vector {
		return vector(
			this.view.getFloat32(ACCELERATION_OFFSET),
			this.view.getFloat32(ACCELERATION_OFFSET + 4),
		);
	}

	set mass(mass: Mass) {
		this.setUpdating();

		if (mass.anchored) {
			this.view.setFloat32(MASS_OFFSET, F32_MAX); // f32 Max
		} else {
			this.view.setFloat32(MASS_OFFSET, mass.value); // f32 Max
		}
	}

	get mass(): Mass {
		let val = this.view.getFloat32(MASS_OFFSET);

		if (val === F32_MAX) {
			return new Mass(true, 0);
		} else {
			return new Mass(false, val);
		}
	}

	set bounds(bounds: Vector) {
		this.setUpdating();

		this.view.setFloat32(BOUNDS_OFFSET, bounds.x);
		this.view.setFloat32(BOUNDS_OFFSET + 4, bounds.y);
	}

	get bounds(): Vector {
		return vector(this.view.getFloat32(BOUNDS_OFFSET), this.view.getFloat32(BOUNDS_OFFSET + 4));
	}

	get id(): number {
		return this.view.getInt32(ENTITY_ID_OFFSET);
	}

	private destroyed = false;
}

export function getDataView(shared_buffer: SharedArrayBuffer, index: number): DataView {
	return new DataView(shared_buffer, (index + 1) * ENTITY_SIZE_BYTES, ENTITY_SIZE_BYTES);
}

export class BaseEntity extends Entity {
	public static readonly entityType: number = 1;

	constructor(view: DataView, _destroy: () => void, _setUpdating: () => void) {
		super(view, _destroy, _setUpdating);
	}
}