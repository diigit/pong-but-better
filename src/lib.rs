mod utils;
mod physics;
mod vertices;
mod backend;
mod shapes;

use wasm_bindgen::prelude::*;

use utils::set_panic_hook;

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    set_panic_hook();

    Ok(())
}

#[wasm_bindgen(module="/www/src/frontend.tsx")]
extern "C" {
    fn send_vertices(ptr: *const f32, len: usize); 
}