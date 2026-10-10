use nalgebra::{clamp, point};

use crate::{
    behavior::Behavior, constants::CANVAS_HEIGHT, entity_tracker::EntityType, movement::{Bounds, Position},
};

inventory::submit! {
    Behavior {
        run: |world| {
            for (entity_type, bounds, pos) in world.query_mut::<(&EntityType, &Bounds, &mut Position)>() {
				if entity_type.0 == 2 || entity_type.0 == 3 { 
					// Clamp paddle position to be within bounds
					*pos = Position(point![pos.x, clamp(pos.y, 0.0, CANVAS_HEIGHT - bounds.y)]);
				}
            }
        }
    }
}
