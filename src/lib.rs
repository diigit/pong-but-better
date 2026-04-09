mod utils;

use wasm_bindgen::prelude::*;

use crate::utils::set_panic_hook;

#[wasm_bindgen(start)]
pub fn run() -> Result<(), JsValue> {
    set_panic_hook();

    Ok(())
}
