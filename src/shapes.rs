use nalgebra::{Point2, Vector2};

use crate::physics::Precision;

pub enum Shape {
    AxisAlignedBox,
}

impl Shape {
    pub fn write_vertices(
        &self,
        vertices: &mut Vec<Point2<Precision>>,
        position: Point2<Precision>,
        scale: Vector2<Precision>,
    ) {
        match self {
            Self::AxisAlignedBox => {
				
			}
        }
    }
}
