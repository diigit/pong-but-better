mod utils;
mod physics;

use wasm_bindgen::prelude::*;

use utils::set_panic_hook;

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    set_panic_hook();

    Ok(())
}

#[wasm_bindgen]
extern "C" {
    fn alert(message: &str);
}

#[wasm_bindgen]
pub fn this_is_a_test(message: &str) {
    alert(&format!("Oh, a message! What does it say?\n\n \"{message}\"\n\n Oh.. uhhh.. okay.."));
}