import { GameObject } from "./game-objects";

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 256;
const VERTEX_BUFFER_STARTING_LENGTH = 64; // 32 vertices

class GpuHandler {
	constructor(private device: GPUDevice, canvas: HTMLCanvasElement) {
		const canvasFormat = window.navigator.gpu.getPreferredCanvasFormat();

		this.context = canvas.getContext("webgpu") as GPUCanvasContext;
		this.context.configure({
			device,
			format: canvasFormat,
		});

		this.shaderModule = device.createShaderModule({
			label: "Triangle shader module",
			code: /* wgsl */`
				struct VertexInput {
					@location(0) pos: vec2f,
				};

				@vertex
				fn vertexMain(input: VertexInput) -> VertexOutput {
					var output: VertexOutput;
					output.pos = input.pos / vec2f(${CANVAS_WIDTH}, ${CANVAS_HEIGHT});
					
					return output;
				}

				@fragment
				fn fragmentMain() -> @location(0) vec4f {
					return vec4f(0, 0, 0, 1);
				}
			`
		});

		this.renderPipeline = this.device.createRenderPipeline({
			label: "Cell pipeline",
			layout: "auto",
			vertex: {
				module: this.shaderModule,
				entryPoint: "vertexMain",
				buffers: [{
					arrayStride: 6,
					attributes: [{
						format: "float32x2",
						offset: 0,
						shaderLocation: 0, // Position, see vertex shader
					}],
				}]
			},
			fragment: {
				module: this.shaderModule,
				entryPoint: "vertexMain",
				targets: [{
					format: canvasFormat
				}],
			}
		});

		this.vertexBuffer = this.createVertexBuffer(32 * VERTEX_BUFFER_STARTING_LENGTH);
	}

	createVertexBuffer(size: number): GPUBuffer {
		return this.device.createBuffer({
			label: "Render triangle vertex buffer",
			size: size,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
		})
	}

	resizeVertexBuffer(newMinSize: number) {
		const currentSize = this.vertexBuffer.size;
		const mul = 2^Math.ceil(Math.log2(newMinSize / currentSize))

		this.vertexBuffer.destroy()
		this.vertexBuffer = this.createVertexBuffer(currentSize * mul);
	}

	writeTriangles(triangles: Float32Array) {
		this.numTriangles = triangles.byteLength / 32 / 3;
		
		if (this.vertexBuffer.size < triangles.byteLength) {
			this.resizeVertexBuffer(triangles.byteLength);
		}

		this.device.queue.writeBuffer(this.vertexBuffer, 0, triangles);
	}

	render() {
		const encoder = this.device.createCommandEncoder();

		const renderPass = encoder.beginRenderPass({
			colorAttachments: [{
				view: this.context.getCurrentTexture().createView(),
				loadOp: "clear",
				clearValue: { r: 0, g: 0, b: 0, a: 1 }, // background color
				storeOp: "store",
			}]
		});

		renderPass.setPipeline(this.renderPipeline);
		renderPass.setVertexBuffer(0, this.vertexBuffer);
		renderPass.draw(3, this.numTriangles);

		renderPass.end();

		this.device.queue.submit([encoder.finish()]);
	}

	cleanup() {
		this.vertexBuffer.destroy();
	}

	private vertexBuffer: GPUBuffer;
	private shaderModule: GPUShaderModule;
	private renderPipeline: GPURenderPipeline;
	private context: GPUCanvasContext;
	private numTriangles: number = 0;
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

		this.gpuHandler = new GpuHandler(device, canvas);
	}
	
	updateTriangles() {
		let bufferLength = 0;

		// get total amount of vertices that will be added to buffer
		this.objects.forEach((obj) => {
			bufferLength += obj.shapeDescriptor.vertexCount;
		});

		let vertexArray = new Float32Array(bufferLength);

		// calculate triangles and write to vertex array
		let vertexOffset = 0;
		this.objects.forEach((obj) => {
			obj.shapeDescriptor.writeTriangles(vertexArray, vertexOffset);
			vertexOffset += obj.shapeDescriptor.vertexCount;
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

	private gpuHandler: GpuHandler | undefined;
}