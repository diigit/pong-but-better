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