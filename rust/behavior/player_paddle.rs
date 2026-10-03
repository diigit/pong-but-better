use nalgebra::{clamp, point};

use crate::{
    behavior::Behavior,
    constants::{CANVAS_HEIGHT, PADDLE_HEIGHT},
    entity_tracker::EntityType,
    movement::Position,
};

inventory::submit! {
    Behavior {
        run: |world| {
            for (entity_type, pos) in world.query_mut::<(&EntityType, &mut Position)>() {
				if entity_type.0 == 2 { 
					// Clamp paddle position to be within bounds
					*pos = Position(point![pos.x, clamp(pos.y, 0.0, CANVAS_HEIGHT - PADDLE_HEIGHT)]);
				}
            }
        }
    }
}
