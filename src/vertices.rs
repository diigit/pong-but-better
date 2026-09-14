use specs::{prelude::*, Component};

use crate::physics::Bounds;

#[derive(Debug, Component)]
#[storage(NullStorage)]
pub struct Visible;

pub struct Tessellation;

#[derive(SystemData)]
pub struct TessellationSystemData<'a> {
	visible: ReadStorage<'a, Visible>,
	bounds: ReadStorage<'a, Bounds>,
}

impl<'a> System<'a> for Tessellation {
	type SystemData = TessellationSystemData<'a>;

	fn run(&mut self, data: Self::SystemData) {
		
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn test_tesselation() {

	}
}