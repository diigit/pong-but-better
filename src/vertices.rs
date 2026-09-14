use deref::{Deref, DerefMut};
use lyon::{path::{builder::NoAttributes, path_buffer::Builder}, tessellation::{
    FillBuilder, FillOptions, FillTessellator, VertexBuffers, geometry_builder::simple_builder,
}};
use specs::{prelude::*, Component};

use crate::{
    physics::{Bounds, Position, Precision},
    shapes::Shape,
};

#[derive(Debug, Component)]
#[storage(NullStorage)]
pub struct Visible;

#[derive(Component, Deref)]
#[storage(VecStorage)]
pub struct ShapeComp(#[auto_ref] Shape);

#[derive(Debug, DerefMut, Default)]
pub struct Vertices(#[auto_ref] VertexBuffers<lyon::math::Point, u16>);

pub struct Tessellation;

#[derive(SystemData)]
pub struct TessellationSystemData<'a> {
    visible: ReadStorage<'a, Visible>,
    position: ReadStorage<'a, Position>,
    shape: ReadStorage<'a, ShapeComp>,
    bounds: ReadStorage<'a, Bounds>,
    vertices: Write<'a, Vertices>,
}

impl<'a> System<'a> for Tessellation {
    type SystemData = TessellationSystemData<'a>;

    fn run(&mut self, mut data: Self::SystemData) {
        data.vertices.clear();

        let mut geo_builder = simple_builder(&mut **data.vertices);
        let mut tessellator = FillTessellator::new();
		let fill_opts = FillOptions::tolerance(0.1);
        let mut builder = tessellator.builder(&fill_opts, &mut geo_builder);

        for (shape, position, bounds, _) in
            (&data.shape, &data.position, &data.bounds, &data.visible).join()
        {
            shape.write_vertices(&mut builder, **position, **bounds);
        }

		let _ = builder.build();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tesselation() {}
}
