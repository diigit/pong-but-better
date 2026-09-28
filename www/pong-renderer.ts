import { MAX_VERTICES } from "./constants";

let gpuAdapter = await window.navigator.gpu.requestAdapter();
if (!gpuAdapter) throw Error("Unable to retrieve GPU Adapter.");

let device = await gpuAdapter.requestDevice();
if (!device) throw Error("Unable to retrieve GPU Device.");

class GpuHandler {
	constructor(canvas: HTMLCanvasElement, shared_vertex_buffer: SharedArrayBuffer, shared_index_buffer: SharedArrayBuffer, data_buffer: SharedArrayBuffer) {
		const canvasFormat = window.navigator.gpu.getPreferredCanvasFormat();

		this.vertices = new Float32Array(shared_vertex_buffer);
		this.indices = new Uint16Array(shared_index_buffer);
		this.data = new Uint32Array(data_buffer);
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
					return vec4f(0.67843, 0.61961, 0.5098, 1);
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

		this.vertexBuffer = this.createVertexBuffer(MAX_VERTICES * 2 * 32);
		this.indexBuffer = device.createBuffer({
			label: "Triangle index buffer",
			size: MAX_VERTICES * 2 * 16,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.INDEX,
		})
	}

	createVertexBuffer(size: number): GPUBuffer {
		return device.createBuffer({
			label: "Render triangle vertex buffer",
			size: size,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
		})
	}

	updateBuffers() {
		device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices, 0, this.vertexBufferLen);
		device.queue.writeBuffer(this.indexBuffer, 0, this.indices, 0, this.indexBufferLen);
	}

	render() {
		if (this.isLocked) return;
		this.isLocked = true;
		
		console.log(this.vertexBufferLen);
		this.updateBuffers();

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
		renderPass.setIndexBuffer(this.indexBuffer, "uint16");
		renderPass.drawIndexed(this.indexBufferLen, 1);
		
		renderPass.end();
		device.queue.submit([encoder.finish()]);

		this.isLocked = false;
	}

	get vertexBufferLen() {
		return this.data[0];
	}

	get indexBufferLen() {
		return this.data[1];
	}
	
	get isLocked(): boolean {
		return this.data[2] == 1;
	}

	set isLocked(val: boolean) {
		this.data[2] = val ? 1 : 0
	}

	cleanup() {
		this.vertexBuffer.destroy();
	}

	private vertexBuffer: GPUBuffer;
	private indexBuffer: GPUBuffer;
	private shaderModule: GPUShaderModule;
	private renderPipeline: GPURenderPipeline;
	private context: GPUCanvasContext;
	private vertices: Float32Array;
	private indices: Uint16Array;
	private data: Uint32Array;
}

export class PongRenderer {	
	constructor(private vertex_buffer: SharedArrayBuffer, private index_buffer: SharedArrayBuffer, private dataBuffer: SharedArrayBuffer) {
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
		this.gpuHandler = new GpuHandler(canvas, this.vertex_buffer, this.index_buffer, this.dataBuffer);

		const step: FrameRequestCallback = () => {
			if (this.gpuHandler === undefined) return;

			//let bufData = this.game_controller.get_vertex_buffer();
			//this.gpuHandler.writeTriangles(new Float32Array(memory.buffer, bufData.ptr, bufData.len))
			this.gpuHandler.render()
			this.renderLoopId = window.requestAnimationFrame(step);
		}

		this.renderLoopId = window.requestAnimationFrame(step);
	}

	private canvas: HTMLCanvasElement | undefined;
	private gpu: GPU;
	private renderLoopId = 0;

	private gpuHandler: GpuHandler | undefined;
}
