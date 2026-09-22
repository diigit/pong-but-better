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
    VertexBufferPtr, movement::{Bounds, Position}, shapes::Shape,
};

#[derive(Debug)]
pub struct Visible;

pub struct TriangulationSystem {
    buffer: VertexBuffers<Point, u16>,
}

impl TriangulationSystem {
    pub fn new() -> Self {
        Self {
            buffer: VertexBuffers::new(),
        }
    }

    pub fn run_triangulation(&mut self, world: &mut World) {
        let buffer = &mut self.buffer;
        buffer.clear();

        let mut geo_builder: BuffersBuilder<'_, Point, u16, Positions> = simple_builder(buffer);
        let mut tessellator: FillTessellator = FillTessellator::new();
        let fill_opts: FillOptions = FillOptions::tolerance(0.1);
        let mut builder: NoAttributes<FillBuilder<'_>> =
            tessellator.builder(&fill_opts, &mut geo_builder);

        let query = world.query_mut::<(&Shape, &Position, &Bounds, &Visible)>();

        for (shape, position, bounds, _) in query {
            shape.write_vertices(&mut builder, **position, **bounds);
        }
    }

    pub fn get_buffer_ptr(&self) -> VertexBufferPtr {
        VertexBufferPtr {
            ptr: self.buffer.vertices.as_ptr() as *const f32,
            len: self.buffer.vertices.len(),
        }
    }
}
