// Singleton that handles collisions

import { Box, box, Vector, vector } from "2d-geometry";
import { GameObject } from "./game-objects";

function calcCollision(a: Box, b: Box): { colliding: boolean, vector: Vector } {
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
	// TODO: optimize from O(n^2) to O(nlog(n))
	updateColliders() {
		let checkedObects = new Set<GameObject>;

		this.colliders.forEach((obj) => {
			this.colliders.forEach((other) => {
				if (obj === other || checkedObects.has(other)) return;
				this.simulateCollision(obj, other);
			})

			checkedObects.add(obj);
		})
	}

	simulateCollision(a: GameObject, b: GameObject) {
		const { colliding, vector } = calcCollision(a.boundingBox, b.boundingBox);
		if (colliding === false) return;

		console.log(`[COLLIDE] ${vector}`);

		const x1 = (a.mass - b.mass)/(a.mass + b.mass)

		const vAF = a.velocity.multiply(x1).add(b.velocity.multiply((2*b.mass)/(a.mass + b.mass)));
		const vBF = b.velocity.multiply(-x1).add(a.velocity.multiply((2*a.mass)/(a.mass + b.mass)));

		a.velocity = vAF;
		b.velocity = vBF;
	}

	addCollider(obj: GameObject) {
		this.colliders.add(obj);
	}

	removeCollider(obj: GameObject) {
		this.colliders.delete(obj);
	}

	private colliders = new Set<GameObject>;
}