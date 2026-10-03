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
            for (pos, entity_type) in world.query_mut::<(&mut Position, &EntityType)>() {
				if entity_type.0 != 3 { return; }

                // Clamp paddle position to be within bounds
                *pos = Position(point![pos.x, clamp(pos.y, PADDLE_HEIGHT / 2.0, CANVAS_HEIGHT - PADDLE_HEIGHT / 2.0)]);
            }
        }
    }
}
