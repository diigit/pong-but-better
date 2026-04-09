// Singleton that handles collisions

import { GameObject } from "./game-objects";

export class Collisions {
	// TODO: optimize from O(n^2) to O(nlog(n))
	checkCollisions() {
		
	}

	addCollider(obj: GameObject) {
		this.colliders.add(obj);
	}

	removeCollider(obj: GameObject) {
		this.colliders.delete(obj);
	}

	private colliders = new Set<GameObject>;
}