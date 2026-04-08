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

// todo: in rust or gpu?
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

class GpuHandler {
	constructor(private device: GPUDevice) {
		this.vertexBuffer = device.createBuffer({
			label: "Polygon vertex buffer",
			size: 32 * 2 * 0,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
		});
	}

	passTriangles(triangles: Point[][]) {
		
	}

	cleanup() {

	}

	private vertexBuffer: GPUBuffer;
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
			this.gpuHandler?.cleanup();
			return;
		}

		let gpuAdapter = await this.gpu.requestAdapter();
		if (!gpuAdapter) throw Error("Unable to retrieve GPU Adapter.");

		let device = await gpuAdapter.requestDevice();
		if (!device) throw Error("Unable to retrieve GPU Device.");
		
		const context = canvas.getContext("webgpu") as GPUCanvasContext;
		context.configure({
			device,
			format: this.gpu.getPreferredCanvasFormat(),
		});

		this.gpuHandler = new GpuHandler(device);
	}

	renderPass() {
		// for each object, convert it into triangles and add it too the vertex buffer and draw the triangle.
	}
	
	// potentitally optimize by running on wasm or gpu
	updateTriangles() {
		let allTriangles: Point[][] = [];

		this.polygons.forEach((gameObject) => {
			const polygonTriangles = calcTriangles(gameObject.shape as Polygon);
			allTriangles.concat(polygonTriangles);
		});	

		this.gpuHandler?.passTriangles(allTriangles);
	}

	renderGameObject(object: GameObject) {
		const shapeType = object.shape.tag;

		if (shapeType === ShapeTag.Polygon) {
			this.polygons.add(object);
		} else if (shapeType === ShapeTag.Circle) {
			this.circles.add(object);
		} else {
			throw Error("Could not render shape.");
		}
	}

	unrenderGameObject(object: GameObject) {
		if (object.shape.tag === ShapeTag.Polygon) {
			this.polygons.delete(object)
		} else if (object.shape.tag === ShapeTag.Circle) {
			this.circles.delete(object)
		} else {
			throw Error("Shape does not exist.");
		}
	}

	private polygons = new Set<GameObject>;
	private circles = new Set<GameObject>;
	private canvas: HTMLCanvasElement | undefined;
	private gpu: GPU;

	private gpuHandler: GpuHandler | undefined;
}