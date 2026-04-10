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
	// TODO: minowski difference to detect collisions 
	// detect their direction too

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

		console.log("Colliding. Vector: \n", vector);
	}

	/*transferMomentum(objectA: GameObject, objectB: GameObject) {
		if (objectA.superHeavy && objectB.superHeavy) return;

		let moveA = 0;
		let moveB = 0;

		if (objectA.superHeavy) {
			moveB = 1;
		} else if (objectB.superHeavy) {
			moveA = 1;
		} else {
			const totalMass = objectA.mass + objectB.mass;
			moveA = objectA.mass / totalMass;
			moveB = moveA - 1;
		}
		
		const penVec = this.calcPenetrationVec(objectA, objectB);
		
		let moveVecA = penVec.multiply(moveA);
		let moveVecB = penVec.multiply(moveB);

		objectA.shapeDescriptor.move(moveVecA);
		objectB.shapeDescriptor.move(moveVecB);

		let avgVelocity = objectA.velocity.add(objectB.velocity).multiply(0.5);
		objectA.velocity = avgVelocity.multiply(moveA);
		objectB.velocity = avgVelocity.multiply(moveB);
	}*/

	addCollider(obj: GameObject) {
		this.colliders.add(obj);
	}

	removeCollider(obj: GameObject) {
		this.colliders.delete(obj);
	}

	private colliders = new Set<GameObject>;
}