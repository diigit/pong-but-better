// Singleton that handles collisions

import { Box, box, Vector, vector } from "2d-geometry";
import { GameObject } from "./game-objects";
import { Evt } from "evt";

export enum Axis {
	X,
	Y,
}

export enum Equality {
	LessThan,
	EqualTo,
	GreaterThan,
}

export class Barrier {
	constructor(
		public readonly axis: Axis,
		public readonly value: number,
		public readonly equality: Equality,
	) { }
}

function calcCollision(a: Box, b: Box): { 
	colliding: boolean, 
	vector: Vector 
} {
	const differences = [
		a.xmax - b.xmin, 
		a.ymax - b.ymin, 
		a.xmin - b.xmax, 
		a.ymin - b.ymax
	] as const;

	const isColliding = 
		Math.sign(differences[2]) !== Math.sign(differences[0]) && 
		Math.sign(differences[1]) !== Math.sign(differences[3]);

	if (isColliding === false) 
		return { 
			colliding: false, 
			vector: Vector.EMPTY 
		};

	let rotation = 0;
	let min = Infinity;

	differences.forEach((diff, index) => {
		if (Math.abs(diff) < min) {
			min = diff;
			rotation = index;
		}
	})

	return {
		colliding: isColliding,
		vector: rotation % 2 === 0 ? vector(min, 0) : vector(0, min),
	};
}

export class AABBCollider {
	public readonly objectCollisionOccured = Evt.create<[a: GameObject, b: GameObject]>();
	public readonly barrierCollisionOccured = Evt.create<[object: GameObject, barrier: Barrier]>();

	// TODO: optimize from O(n^2) to O(nlog(n))
	updateColliders() {
		let checkedObects = new Set<GameObject>;

		this.colliders.forEach((obj) => {
			this.colliders.forEach((other) => {
				if (obj === other || checkedObects.has(other)) return;
				this.simulateCollision(obj, other);
			});

			this.barriers.forEach((barrier) => {
				this.simulateBarrierCollision(obj, barrier);
			});

			checkedObects.add(obj);
		})
	}

	simulateCollision(a: GameObject, b: GameObject) {
		const { colliding, vector } = calcCollision(a.boundingBox, b.boundingBox);
		if (colliding === false || vector.equalTo(Vector.EMPTY)) return;

		const norm = vector.normalize();
		const flip = new Vector(Math.abs(norm.x) * 2 - 1, Math.abs(norm.y) * 2 - 1);

		this.objectCollisionOccured.post([a, b]);
		
		if (a.superHeavy && b.superHeavy) return;

		if (a.superHeavy) {
			b.shapeDescriptor.move(vector);
			b.velocity = new Vector(
				b.velocity.x * flip.x, 
				b.velocity.y * flip.y,
			).multiply(-1);
			return;
		}

		if (b.superHeavy) {
			a.shapeDescriptor.move(vector.multiply(-1));
			a.velocity = new Vector(
				a.velocity.x * flip.x, 
				a.velocity.y * flip.y,
			).multiply(-1);
			return;
		}

		b.shapeDescriptor.move(vector);

		const x1 = (a.mass - b.mass)/(a.mass + b.mass)

		const vAF = a.velocity.multiply(x1).add(b.velocity.multiply((2*b.mass)/(a.mass + b.mass)));
		const vBF = b.velocity.multiply(-x1).add(a.velocity.multiply((2*a.mass)/(a.mass + b.mass)));
		
		a.velocity = new Vector(
			vAF.x * flip.x, 
			vAF.y * flip.y,
		);
		b.velocity = new Vector(
			vBF.x * flip.x, 
			vBF.y * flip.y,
		);
	}

	simulateBarrierCollision(obj: GameObject, barrier: Barrier) {
		if (obj.superHeavy) return;

		if (barrier.axis === Axis.X) {
			const diffMax = barrier.value - obj.boundingBox.xmax;
			const diffMin = barrier.value - obj.boundingBox.xmin;

			if (
				(barrier.equality === Equality.EqualTo && Math.sign(diffMax) === Math.sign(diffMin)) ||
				(barrier.equality === Equality.LessThan && Math.sign(diffMax) === Math.sign(diffMin) && Math.sign(diffMax) === -1) ||
				(barrier.equality === Equality.GreaterThan && Math.sign(diffMax) === Math.sign(diffMin) && Math.sign(diffMax) === 1)
			) return;
			this.barrierCollisionOccured.post([obj, barrier]);

			if (Math.abs(diffMax) < Math.abs(diffMin)) {
				obj.shapeDescriptor.move(vector(diffMax, 0));
			} else {
				obj.shapeDescriptor.move(vector(diffMin, 0));
			}

			obj.velocity = vector(-obj.velocity.x, obj.velocity.y);
		} else {
			const diffMax = barrier.value - obj.boundingBox.ymax;
			const diffMin = barrier.value - obj.boundingBox.ymin;
			
			if (Math.sign(diffMax) === Math.sign(diffMin)) return;
			this.barrierCollisionOccured.post([obj, barrier]);

			if (Math.abs(diffMax) < Math.abs(diffMin)) {
				obj.shapeDescriptor.move(vector(0, diffMax));
			} else {
				obj.shapeDescriptor.move(vector(0, diffMin));
			}

			obj.velocity = vector(obj.velocity.x, -obj.velocity.y);
		}
	}

	addBarrier(barrier: Barrier) {
		this.barriers.add(barrier);
	}

	removeBarrier(barrier: Barrier) {
		this.barriers.delete(barrier);
	}

	addCollider(obj: GameObject) {
		this.colliders.add(obj);
	}

	removeCollider(obj: GameObject) {
		this.colliders.delete(obj);
	}

	private colliders = new Set<GameObject>;
	private barriers = new Set<Barrier>();
}