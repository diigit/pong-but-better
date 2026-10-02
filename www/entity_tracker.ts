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
	}
	
	createEntity<T extends Entity>(entityType: EntityConstructor<T>): Promise<T> {
		let index = this.entities.length;
		let dataView = getDataView(this.buffer, index);

		let entity = new entityType(dataView, () => this.setUpdated(), () => {
			// TODO
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

  private updatedView;
  private entities: Entity[] = [];
}