use hecs::World;
use lyon::{
    math::Point,
    path::builder::NoAttributes,
    tessellation::{
        BuffersBuilder, FillBuilder, FillOptions, FillTessellator, VertexBuffers,
        geometry_builder::{Positions, simple_builder},
    },
};

use crate::{
    movement::{Bounds, Position},
    set_vertex_buffer,
    shapes::Shape,
};

#[derive(Debug)]
pub struct Visible;

#[derive(Default)]
pub struct TriangulationSystem {
    last: usize,
    buffers: [VertexBuffers<Point, u16>; 2],
}

impl TriangulationSystem {
    pub fn new() -> Self {
        Self {
            last: 0,
            buffers: [VertexBuffers::new(), VertexBuffers::new()],
        }
    }

    pub fn run_triangulation(&mut self, world: &mut World) {
        let current_index = 1 - self.last;
        let buffer=  &mut self.buffers[current_index];
        buffer.clear();

        let mut geo_builder: BuffersBuilder<'_, Point, u16, Positions> =
            simple_builder(buffer);
        let mut tessellator: FillTessellator = FillTessellator::new();
        let fill_opts: FillOptions = FillOptions::tolerance(0.1);
        let mut builder: NoAttributes<FillBuilder<'_>> =
            tessellator.builder(&fill_opts, &mut geo_builder);

        let query = world.query_mut::<(&Shape, &Position, &Bounds, &Visible)>();

        for (shape, position, bounds, _) in query {
            shape.write_vertices(&mut builder, **position, **bounds);
        }

        if let Ok(()) = builder.build() {
            set_vertex_buffer(
                buffer.vertices.as_ptr() as *const f32,
                buffer.vertices.len(),
            );
        }
    }
}
