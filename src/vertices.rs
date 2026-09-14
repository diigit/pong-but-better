use deref::{Deref, DerefMut};
use nalgebra::Point2;
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
pub struct Vertices(#[auto_ref] Vec<Point2<Precision>>);

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

        for (shape, position, bounds, _) in
            (&data.shape, &data.position, &data.bounds, &data.visible).join()
        {
			shape.write_vertices(&mut data.vertices, **position, **bounds);
		}

		// Todo: Send result to typescript side
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tesselation() {}
}
