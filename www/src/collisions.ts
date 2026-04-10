// Singleton that handles collisions

import { box, Vector, vector } from "2d-geometry";
import { GameObject } from "./game-objects";

type CollisionsSet = Set<[a: GameObject, b: GameObject]>;

export class Collisions {
	// TODO: optimize from O(n^2) to O(nlog(n))
	// TODO: minowski difference to detect collisions 
	// detect their direction too
	calcCollisions(): CollisionsSet {
		let checkedObects = new Set<GameObject>;
		let collisions = new Set<[a: GameObject, b: GameObject]>;

		this.colliders.forEach((obj) => {
			this.colliders.forEach((other) => {
				if (checkedObects.has(other)) return;
				if (obj.boundingBox.intersect(other.boundingBox)) collisions.add([obj, other]);
			})

			checkedObects.add(obj);
		})

		return collisions;
	}

	calcPenetrationVec(objA: GameObject, objB: GameObject) {
		const aabbA = objA.boundingBox;
		const aabbB = objB.boundingBox;

		const overlapX = Math.min(aabbA.xmax, aabbB.xmax) - Math.max(aabbA.xmin, aabbB.xmin);
		const overlapY = Math.min(aabbA.ymax, aabbB.ymax) - Math.max(aabbA.ymin, aabbB.ymin);

		const axisIsX = overlapX < overlapY;
		let sign = 1;

		if (axisIsX) {
			sign = Math.sign(aabbA.center.x - aabbB.center.x);
		} else {
			sign = Math.sign(aabbA.center.y - aabbB.center.y);
		}

		return (overlapX > overlapY ? vector(0, overlapY) : vector(overlapX, 0)).multiply(sign);
	}

	transferMomentum(objectA: GameObject, objectB: GameObject) {
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
	}

	addCollider(obj: GameObject) {
		this.colliders.add(obj);
	}

	removeCollider(obj: GameObject) {
		this.colliders.delete(obj);
	}

	private colliders = new Set<GameObject>;
}