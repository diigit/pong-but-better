use deref::{DerefMut};
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
    send_vertices,
    shapes::Shape,
};

#[derive(Debug)]
pub struct Visible;

#[derive(Debug, DerefMut, Default)]
pub struct Vertices(#[auto_ref] VertexBuffers<Point, u16>);

#[derive(Default)]
pub struct TriangulationSystem {
    buffers: Vertices,
}

impl TriangulationSystem {
    pub fn run_triangulation(&mut self, world: &mut World) {
        self.buffers.clear();

        let mut geo_builder: BuffersBuilder<'_, Point, u16, Positions> =
            simple_builder(&mut self.buffers);
        let mut tessellator: FillTessellator = FillTessellator::new();
        let fill_opts: FillOptions = FillOptions::tolerance(0.1);
        let mut builder: NoAttributes<FillBuilder<'_>> =
            tessellator.builder(&fill_opts, &mut geo_builder);

        let query = world.query_mut::<(&Shape, &Position, &Bounds, &Visible)>();

        for (shape, position, bounds, _) in query {
            shape.write_vertices(&mut builder, **position, **bounds);
        }

        if let Ok(()) = builder.build() {
            send_vertices(
                self.buffers.vertices.as_ptr() as *const f32,
                self.buffers.vertices.len(),
            );
        }
    }
}
