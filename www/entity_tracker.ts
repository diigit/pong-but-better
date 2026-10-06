import type { Middleman } from "../pkg/pong_but_better";
import { ENTITY_SIZE_BYTES } from "./constants";
import { Entity, getDataView } from "./entities";

type EntityConstructor<T extends Entity> = new (
	view: DataView,
	_destroy: () => void,
	_setUpdating: () => void,
) => T;

export class EntityTracker {
	constructor(
		private worker: Worker,
		private middleman: Middleman,
		private buffer: SharedArrayBuffer,
	) {
		this.updated = new Int32Array(buffer, 0, 4);

		worker.addEventListener("message", (event) => {
			if (Array.isArray(event.data)) {
				let array = event.data as Array<number>;

				for (let i = 0; i < array.length; i += 2) {
					let entityI = this.getEntity(array[i]);
					let entityJ = this.getEntity(array[i + 1]);

					if (entityI === undefined || entityJ === undefined) return;

					entityI.collided.post(entityJ);
					entityJ.collided.post(entityI);
				}
			}
		});
	}

	createEntity<T extends Entity>(entityClass: EntityConstructor<T>): Promise<T> {
		let index = this.entities.length;
		let dataView = getDataView(this.buffer, index);

		let entityTypeVal = (entityClass as any).entityType as number;
		if (entityTypeVal === undefined) console.error("Could not find static entity type number!");

		this.middleman.request_entity(index * ENTITY_SIZE_BYTES, (entityClass as any).entityType);

		let promise: Promise<T> = new Promise((resolve) => {
			let listener = (event: MessageEvent) => {
				if (event.data === "entity created") {
					this.worker.removeEventListener("message", listener);

					let entity = new entityClass(
						dataView,
						() => this.middleman.delete_entity(index),
						() => this.setUpdating(),
					);

					this.entities[index] = entity;

					resolve(entity as any);
				}
			};
			this.worker.addEventListener("message", listener);
		});

		return promise;
	}

	setUpdating() {
		Atomics.store(this.updated, 0, 1);
	}

	getEntity(id: number): Entity | undefined {
		return this.entities.find((e) => !e.isDestroyed() && e.id === id);
	}

	private updated;
	private entities: Entity[] = [];
}
