use specs::prelude::*;
use web_sys::js_sys;

use crate::{
    physics::{Collisions, Movement, Precision, TimeDelta}, vertices::Tessellation,
};

pub struct Backend<'a, 'b> {
    send_vertices_fn: &'a js_sys::Function,
    world: World,
    dispatcher: Dispatcher<'a, 'b>,
}

impl<'a, 'b> Backend<'a, 'b> {
    pub fn new(send_vertices: &'a js_sys::Function) -> Self {
        let mut backend = Self {
            world: World::new(),
            dispatcher: DispatcherBuilder::new()
                .with(Movement, "movement", &[])
                .with(Collisions, "collisions", &[])
                .with(Tessellation, "tessellation", &[])
                .build(),
			send_vertices_fn: send_vertices,
        };

        backend.dispatcher.setup(&mut backend.world);

        backend
    }

    pub fn update(&mut self, delta_time: Precision) {
		**self.world.write_resource::<TimeDelta>() = delta_time;
		self.dispatcher.dispatch(&self.world);

		// todo: use send vertices to send a vector of f32 to typescript
	}
}
