use serde::{Deserialize, Serialize};

pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityCreationParams {
    pub index: u32,
    pub ent_type: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Command {
    SetPaused(bool),
    SetEntity(EntityCreationParams),
    RemoveEntity(u32),
}
