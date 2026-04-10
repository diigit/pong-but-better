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

		return overlapX > overlapY ? vector(0, overlapY) : vector(overlapX, 0);
	}

	transferMomentum(objectA: GameObject, objectB: GameObject) {
		// TODO changes velocity of object A and object B based on what side they collide on and their respective masses
		
	}

	addCollider(obj: GameObject) {
		this.colliders.add(obj);
	}

	removeCollider(obj: GameObject) {
		this.colliders.delete(obj);
	}

	private colliders = new Set<GameObject>;
}