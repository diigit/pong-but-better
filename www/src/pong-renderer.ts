import { Point, Polygon, Shape, ShapeTag } from "2d-geometry";
import { GameObject } from "./game-objects";

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 256;

// assume that all polys are convex cus i dont feel like implementing a function for this rn
function checkConvexClockwise(v0: Point, v1: Point, v2: Point) {
	return true;
}

function modDecrement(n: number, len: number) {
	return (n - 1 + len) % len
}

function modIncrement(n: number, len: number) {
	return (n + 1) % len
}

function calcTriangles(polygon: Polygon) {
	let triangles: Point[][] = []
	let vertices = polygon.vertices;
	let clippedVertices = polygon.vertices;

	const numVertices = clippedVertices.length;

	let i0 = 0;
	let i1 = 1;
	while (clippedVertices.length < numVertices - 2) {
		const prevIndex = modDecrement(i0, clippedVertices.length)
		const nextIndex = modIncrement(i0, clippedVertices.length)

		const v0 = vertices[prevIndex] as Point;
		const v1 = vertices[i0] as Point;
		const v2 = vertices[nextIndex] as Point;
		
		if (checkConvexClockwise(v0, v1, v2)) {
			triangles.push([v0, v1, v2]);
			clippedVertices.splice(i0, 1);
			
			i1 = prevIndex // previous vertex
			i0 = nextIndex; // next vertex
		} else {
			if (i0 !== i1) {
				i0 = i1;
			} else {
				i0 = modIncrement(i0, clippedVertices.length);
				i0 = modIncrement(i0, clippedVertices.length);
				i1 = i0
			}
		}
	}

	return triangles;
}

class RenderedPolygon {
	constructor(public readonly gameObject: GameObject) {
		this.triangles = calcTriangles(gameObject.shape as Polygon);
	}

	public readonly triangles: Point[][];
}

export class PongRenderer {
	constructor() {
		this.gpu = window.navigator.gpu;
		if (this.gpu === undefined) Error("WebGPU is not supported by this browser.");
	}

	async setCanvas(canvas: HTMLCanvasElement | undefined) {
		this.canvas = canvas;

		if (canvas === undefined) {
			// TODO cleanup
			return;
		}

		let gpuAdapter = await this.gpu.requestAdapter();
		if (!gpuAdapter) throw Error("Unable to retrieve GPU Adapter.");

		let device = await gpuAdapter.requestDevice();
		if (!device) throw Error("Unable to retrieve GPU Device.");

		// TODO: get device and manage its distribution throughout the entire class
		
		const context = canvas.getContext("webgpu") as GPUCanvasContext;
		context.configure({
			device,
			format: this.gpu.getPreferredCanvasFormat(),
		});

		
	}

	renderPass() {
		// for each object, convert it into triangles and add it too the vertex buffer and draw the triangle.
	}
	
	renderGameObject(object: GameObject) {
		const shapeType = object.shape.tag;

		if (shapeType === ShapeTag.Polygon) {
			this.polygons.add(new RenderedPolygon(object));
		} else if (shapeType === ShapeTag.Circle) {
			this.circles.add(object)
		} else {
			throw Error("Could not render shape.");
		}
	}

	unrenderGameObject(object: GameObject) {
		if (object.shape.tag === ShapeTag.Polygon) {
			for (const polygon of this.polygons) {
				if (polygon.gameObject === object) {
					this.polygons.delete(polygon);
					break;
				}
			}
		} else if (object.shape.tag === ShapeTag.Circle) {
			this.circles.delete(object)
		} else {
			throw Error("Shape does not exist.");
		}
	}

	private polygons = new Set<RenderedPolygon>;
	private circles = new Set<GameObject>;
	private renderedObjects = new Map<ShapeTag.Polygon | ShapeTag.Circle, GameObject[]>;
	private canvas: HTMLCanvasElement | undefined;
	private gpu: GPU;

	private _device: GPUDevice | undefined;
}