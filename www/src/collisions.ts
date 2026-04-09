// Singleton that handles collisions

import { vector } from "2d-geometry";
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