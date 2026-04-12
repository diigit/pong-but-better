import { SHA512_256 } from "bun";
import { GameObject } from "./game-objects";
import { Evt } from "evt";

const VERTEX_BUFFER_STARTING_LENGTH = 64; // 32 vertices

let gpuAdapter = await window.navigator.gpu.requestAdapter();
if (!gpuAdapter) throw Error("Unable to retrieve GPU Adapter.");

let device = await gpuAdapter.requestDevice();
if (!device) throw Error("Unable to retrieve GPU Device.");

class GpuHandler {
	constructor(canvas: HTMLCanvasElement) {
		const canvasFormat = window.navigator.gpu.getPreferredCanvasFormat();

		this.context = canvas.getContext("webgpu") as GPUCanvasContext;

		this.context.configure({
			device,
			format: canvasFormat,
			alphaMode: "premultiplied",
		});

		this.shaderModule = device.createShaderModule({
			label: "Triangle shader module",
			code: /* wgsl */`
				struct VertexInput {
					@location(0) pos: vec2f,
				};

				struct VertexOutput {
					@builtin(position) pos: vec4f,
				};

				@vertex
				fn vertexMain(input: VertexInput) -> VertexOutput {
					var output: VertexOutput;
					output.pos = vec4f(input.pos, 0, 1);
					
					return output;
				}

				@fragment
				fn fragmentMain() -> @location(0) vec4f {
					return vec4f(1, 1, 1, 1);
				}
			`
		});

		this.renderPipeline = device.createRenderPipeline({
			label: "Cell pipeline",
			layout: "auto",
			primitive: { 
				topology: "triangle-list", 
			},
			vertex: {
				module: this.shaderModule,
				entryPoint: "vertexMain",
				buffers: [{
					arrayStride: 8,
					attributes: [{
						format: "float32x2",
						offset: 0,
						shaderLocation: 0, // Position, see vertex shader
					}],
				}]
			},
			fragment: {
				module: this.shaderModule,
				entryPoint: "fragmentMain",
				targets: [{
					format: canvasFormat
				}],
			}
		});

		this.vertexBuffer = this.createVertexBuffer(32 * VERTEX_BUFFER_STARTING_LENGTH);
	}

	createVertexBuffer(size: number): GPUBuffer {
		return device.createBuffer({
			label: "Render triangle vertex buffer",
			size: size,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
		})
	}

	resizeVertexBuffer(newMinSize: number) {
		const currentSize = this.vertexBuffer.size;
		const mul = Math.pow(2, Math.ceil(Math.log2(newMinSize / currentSize)));

		this.vertexBuffer.destroy()
		this.vertexBuffer = this.createVertexBuffer(currentSize * mul);
	}

	writeTriangles(triangles: Float32Array) {
		this.numVertices = triangles.byteLength / 8;
		
		if (this.vertexBuffer.size < triangles.byteLength) {
			this.resizeVertexBuffer(triangles.byteLength);
		}

		device.queue.writeBuffer(this.vertexBuffer, 0, triangles);
	}

	render() {
		const encoder = device.createCommandEncoder();

		const renderPass = encoder.beginRenderPass({
			colorAttachments: [{
				view: this.context.getCurrentTexture().createView(),
				loadOp: "clear",
				clearValue: { r: 0, g: 0, b: 0, a: 0 }, // background color
				storeOp: "store",
			}]
		});

		renderPass.setPipeline(this.renderPipeline);
		renderPass.setVertexBuffer(0, this.vertexBuffer);
		renderPass.draw(this.numVertices, 1, 0, 0);

		renderPass.end();
		device.queue.submit([encoder.finish()]);
	}

	cleanup() {
		this.vertexBuffer.destroy();
	}

	private vertexBuffer: GPUBuffer;
	private shaderModule: GPUShaderModule;
	private renderPipeline: GPURenderPipeline;
	private context: GPUCanvasContext;
	private numVertices: number = 0;
}

export class PongRenderer {
	public readonly frameRendered = Evt.create<number>();

	constructor() {
		this.gpu = window.navigator.gpu;
		if (this.gpu === undefined) Error("WebGPU is not supported by this browser.");
	}

	setCanvas(canvas: HTMLCanvasElement | undefined) {
		if (canvas === undefined) {
			// TODO cleanup
			this.canvas = undefined;
			this.gpuHandler?.cleanup();
			window.cancelAnimationFrame(this.renderLoopId);
			return;
		}

		if (canvas === this.canvas as Node) return;

		this.canvas = canvas;
		this.gpuHandler = new GpuHandler(canvas);

		const step: FrameRequestCallback = (deltaTime) => {
			if (this.gpuHandler === undefined) return;

			this.updateTriangles();
			this.gpuHandler.render()
			this.renderLoopId = window.requestAnimationFrame(step);

			this.frameRendered.post(deltaTime);
		}

		this.renderLoopId = window.requestAnimationFrame(step);
	}
	
	updateTriangles() {
		let bufferLength = 0;

		// get total amount of vertices that will be added to buffer
		this.objects.forEach((obj) => {
			bufferLength += obj.shapeDescriptor.vertexCount;
		});

		let vertexArray = new Float32Array(bufferLength * 2);

		// calculate triangles and write to vertex array
		let vertexOffset = 0;
		this.objects.forEach((obj) => {
			obj.shapeDescriptor.writeTriangles(vertexArray, vertexOffset);
			vertexOffset += obj.shapeDescriptor.vertexCount * 2;
		});

		this.gpuHandler?.writeTriangles(vertexArray);
	}

	renderGameObject(object: GameObject) {
		this.objects.add(object);
	}

	unrenderGameObject(object: GameObject) {
		this.objects.delete(object);
	}

	private objects = new Set<GameObject>;
	private canvas: HTMLCanvasElement | undefined;
	private gpu: GPU;
	private renderLoopId = 0;

	private gpuHandler: GpuHandler | undefined;
}