import { MAX_VERTICES } from "./constants";
import shader from "../shader.wgsl?raw";

export const vertices = new Float32Array(MAX_VERTICES * 2);
export const indices = new Uint16Array(MAX_VERTICES);

let canvasFormat = navigator.gpu.getPreferredCanvasFormat()

export class Renderer {
	static async Create(): Promise<Renderer> {
		let gpuAdapter = await navigator.gpu.requestAdapter();
		if (!gpuAdapter) throw Error("Unable to retrieve GPU Adapter.");

		let device = await gpuAdapter.requestDevice();
		if (!device) throw Error("Unable to retrieve GPU Device.");

		let vertexBuffer = device.createBuffer({
			label: "Vertex buffer",
			size: MAX_VERTICES * 4 * 2,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});

		let indexBuffer = device.createBuffer({
			label: "Index buffer",
			size: MAX_VERTICES * 2,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		});

		let shaderModule = device.createShaderModule({
			label: "Triangle shader module",
			code: shader,
		});

		let renderPipeline = device.createRenderPipeline({
			label: "Cell pipeline",
			layout: "auto",
			primitive: {
				topology: "triangle-list",
			},
			vertex: {
				module: shaderModule,
				entryPoint: "vertexMain",
				buffers: [
					{
						arrayStride: 8,
						attributes: [
							{
								format: "float32x2",
								offset: 0,
								shaderLocation: 0, // Position, see vertex shader
							},
						],
					},
				],
			},
			fragment: {
				module: shaderModule,
				entryPoint: "fragmentMain",
				targets: [
					{
						format: canvasFormat,
					},
				],
			},
		});

		return new Renderer(
			device,
			vertexBuffer,
			indexBuffer,
			renderPipeline,
		);
	}

	private constructor(
		private device: GPUDevice,
		private vertexBuffer: GPUBuffer,
		private indexBuffer: GPUBuffer,
		private renderPipeline: GPURenderPipeline,
	) {}

	draw() {
		if (this.context === undefined) return;

		const encoder = this.device.createCommandEncoder();

		this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
		this.device.queue.writeBuffer(this.indexBuffer, 0, indices);

		const renderPass = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: this.context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: { r: 0, g: 0, b: 0, a: 0 }, // background color
					storeOp: "store",
				},
			],
		});

		renderPass.setPipeline(this.renderPipeline);
		renderPass.setVertexBuffer(0, this.vertexBuffer);
		renderPass.setIndexBuffer(this.indexBuffer, "uint16");
		renderPass.drawIndexed(MAX_VERTICES, 1);
		renderPass.end();

		this.device.queue.submit([encoder.finish()]);
	}

	set canvas(canvas: OffscreenCanvas | undefined) {
		if (canvas === undefined) {
			this.context = undefined;
			return;
		}

		this.context = canvas.getContext("webgpu") as GPUCanvasContext;

		this.context.configure({
			device: this.device,
			format: canvasFormat,
			alphaMode: "premultiplied",
		});
	}

	private context?: GPUCanvasContext = undefined;
}
