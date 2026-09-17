use deref::{Deref, DerefMut};
use lyon::{
    math::Point,
    path::builder::NoAttributes,
    tessellation::{
        geometry_builder::{simple_builder, Positions},
        BuffersBuilder, FillBuilder, FillOptions, FillTessellator, VertexBuffers,
    },
};
use specs::{prelude::*, Component};

use crate::{
    physics::{Bounds, Position},
    send_vertices,
    shapes::Shape,
};

#[derive(Debug, Component)]
#[storage(NullStorage)]
pub struct Visible;

#[derive(Component, Deref)]
#[storage(VecStorage)]
pub struct ShapeComp(#[auto_ref] Shape);

#[derive(Debug, DerefMut, Default)]
pub struct Vertices(#[auto_ref] VertexBuffers<Point, u16>);

pub struct Tessellation;

#[derive(SystemData)]
pub struct TessellationSystemData<'a> {
    visible: ReadStorage<'a, Visible>,
    position: ReadStorage<'a, Position>,
    shape: ReadStorage<'a, ShapeComp>,
    bounds: ReadStorage<'a, Bounds>,
    buf: Write<'a, Vertices>,
}

impl<'a> System<'a> for Tessellation {
    type SystemData = TessellationSystemData<'a>;

    fn run(&mut self, mut data: Self::SystemData) {
        data.buf.clear();

        let mut geo_builder: BuffersBuilder<'_, Point, u16, Positions> =
            simple_builder(&mut **data.buf);
        let mut tessellator: FillTessellator = FillTessellator::new();
        let fill_opts: FillOptions = FillOptions::tolerance(0.1);
        let mut builder: NoAttributes<FillBuilder<'_>> =
            tessellator.builder(&fill_opts, &mut geo_builder);

        for (shape, position, bounds, _) in
            (&data.shape, &data.position, &data.bounds, &data.visible).join()
        {
            shape.write_vertices(&mut builder, **position, **bounds);
        }

        if let Ok(()) = builder.build() {
            send_vertices(
                data.buf.vertices.as_ptr() as *const f32,
                data.buf.vertices.len(),
            );
        }
    }
}
