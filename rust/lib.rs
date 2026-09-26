use wasm_bindgen::{JsValue, prelude::*};

mod collisions;
mod extended_entities;
mod movement;
mod shapes;
mod triangulation;
mod utils;
mod gameplay;

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    Ok(())
}
