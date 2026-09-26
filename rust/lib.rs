use wasm_bindgen::{JsValue, prelude::*};

mod collisions;
mod extended_entities;
mod movement;
mod shapes;
mod triangulation;
mod utils;
mod gameplay;
mod constants;

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    utils::set_panic_hook();
    
    Ok(())
}
