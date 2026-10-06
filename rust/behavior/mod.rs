pub mod bot_paddle;
pub mod player_paddle;

use std::collections::HashMap;

use hecs::{Entity, World};
use wasm_bindgen::JsValue;

pub struct Behavior {
    pub run: fn(&mut World),
}

inventory::collect!(Behavior);

pub struct ExtraComponent {
    pub name: &'static str,
    pub add_to_entity: fn(&mut World, Entity, JsValue),
}

inventory::collect!(ExtraComponent);

pub fn run_behaviors(world: &mut World) {
    for behavior in inventory::iter::<Behavior> {
        (behavior.run)(world);
    }
}

pub type ExtraComponentsMap = HashMap<&'static str, fn(&mut World, Entity, wasm_bindgen::JsValue)>;

pub fn get_extra_components() -> ExtraComponentsMap {
    let mut map = HashMap::new();

    for component in inventory::iter::<ExtraComponent> {
        map.insert(component.name, component.add_to_entity);
    }

    return map;
}
