import type { Middleman } from "../pkg/pong_but_better";
import { ENTITY_SIZE_BYTES } from "./constants";
import { Entity, getDataView } from "./entities";

type EntityConstructor<T extends Entity> = new (
	view: DataView, 
	_set_updated: () => void, 
	_destroy: () => void
) => T;

export class EntityTracker {
	constructor(private worker: Worker, private middleman: Middleman, private buffer: SharedArrayBuffer) {
		this.updatedView = getDataView(buffer, -1)

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
	
	createEntity<T extends Entity>(entityType: EntityConstructor<T>): Promise<T> {
		let index = this.entities.length;
		let dataView = getDataView(this.buffer, index);

		let entity = new entityType(dataView, () => this.setUpdated(), () => {
			this.middleman.delete_entity(index)
		});

		this.middleman.request_entity((index) * ENTITY_SIZE_BYTES, entity.entityType);

		this.entities[index] = entity;

		let promise: Promise<T> = new Promise((resolve) => {
			let listener = (event: MessageEvent) => {
				if (event.data === "entity created") {
					this.worker.removeEventListener("message", listener);
					resolve(entity as any);
				}
			}
			this.worker.addEventListener("message", listener)
		})

		return promise;
	}

	setUpdated() {
		this.updatedView.setUint8(0, 1);
	}

	getEntity(id: number): Entity | undefined {
		return this.entities.find((e) => !e.isDestroyed() && e.id === id);
	}

	private updatedView;
	private entities: Entity[] = [];
}