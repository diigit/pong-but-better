import { matrix, point, Point, segment, Vector, vector, type Circle, type Polygon } from "2d-geometry";

export interface ShapeDescriptor {
	get vertexCount(): number;
	
	get center(): Point;
	set center(p: Point);

	writeTriangles(arr: Float32Array<ArrayBufferLike>, offset: number): void;
	move(v: Vector): void;
}

export class PolygonDescriptor implements ShapeDescriptor {
	constructor(private shape: Polygon) { }
	
	writeTriangles(arr: Float32Array<ArrayBufferLike>, offset: number) {
		const isConvex = (v0: Point, v1: Point, v2: Point): boolean => {
			const cross = (v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x);	
			return cross > 0;
		}

		const decrement = (n: number, len: number): number => {
			return (n - 1 + len) % len
		}

		const increment = (n: number, len: number): number => {
			return (n + 1) % len
		}

		let clippedVertices = this.shape.vertices;

		let i0 = 0;
		let i1 = 1;
		let vertexIndex = 0;

		while (clippedVertices.length >= 3) {
			const prevIndex = decrement(i0, clippedVertices.length);
			const nextIndex = increment(i0, clippedVertices.length);
	
			const v0 = clippedVertices[prevIndex] as Point;
			const v1 = clippedVertices[i0] as Point;
			const v2 = clippedVertices[nextIndex] as Point;
			
			if (isConvex(v0, v1, v2)) {
				arr.set([v0.x/512, v0.y/256, v1.x/512, v1.y/256, v2.x/512, v2.y/256], offset + vertexIndex);
				vertexIndex += 6;
				clippedVertices.splice(i0, 1);
				
				i1 = i0 // next vertex
				i0 = decrement(i0, clippedVertices.length); // previous vertex
			} else {
				if (i0 !== i1) {
					i0 = i1;
				} else {
					i0 = increment(i0, clippedVertices.length);
					i1 = i0
				}
			}
		}
	}

	get vertexCount(): number {
		return (this.shape.vertices.length - 2) * 3;
	}

	get center(): Point {
		return this.shape.center;
	}

	set center(p: Point) {
		const center = this.center;
		const translate = vector(p.x - center.x, p.y - center.y);
		this.move(translate);
	}

	move(v: Vector) {
		this.shape = this.shape.translate(v);
	}
}

// TODO
export class CircleDescriptor implements ShapeDescriptor {
	constructor(private circle: Circle) { }

	writeTriangles(arr: Float32Array<ArrayBufferLike>, offset: number): void { }

	get vertexCount(): number { return 0 }

	get center(): Point { return Point.EMPTY; }
	set center(p: Point) { }

	move(v: Vector) { }
}