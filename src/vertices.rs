use deref::{Deref, DerefMut};
use lyon::{math::Point, path::{builder::NoAttributes}, tessellation::{
    BuffersBuilder, FillBuilder, FillOptions, FillTessellator, VertexBuffers, geometry_builder::{Positions, simple_builder},
}};
use specs::{Component, prelude::*};

use crate::{
    physics::{Bounds, Position},
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
    vertices: Write<'a, Vertices>,
}

impl<'a> System<'a> for Tessellation {
    type SystemData = TessellationSystemData<'a>;

    fn run(&mut self, mut data: Self::SystemData) {
        data.vertices.clear();
        
        let mut geo_builder: BuffersBuilder<'_, Point, u16, Positions> = simple_builder(&mut **data.vertices);
        let mut tessellator: FillTessellator = FillTessellator::new();
		let fill_opts: FillOptions = FillOptions::tolerance(0.1);
        let mut builder: NoAttributes<FillBuilder<'_>> = tessellator.builder(&fill_opts, &mut geo_builder);

        for (shape, position, bounds, _) in
                (&data.shape, &data.position, &data.bounds, &data.visible).join()
            {
                shape.write_vertices(&mut builder, **position, **bounds);
            }

		    let _ = builder.build();  
    }
}