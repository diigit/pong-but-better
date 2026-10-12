use std::{collections::{HashSet, hash_set::Iter}, hash::Hash};

use serde::{Deserialize, Serialize};
use wasm_bindgen::JsValue;

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
pub struct SetExtraComponentParams {
    pub index: u32,
    pub name: String,

    #[serde(with = "serde_wasm_bindgen::preserve")]
    pub val: JsValue,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Command {
    SetPaused(bool),
    SetEntity(EntityCreationParams),
    RemoveEntity(u32),
    SetExtraComponent(SetExtraComponentParams),
}

pub struct PairsSet<T>
where
    T: Copy + Hash + Eq + ?Sized,
{
    set: HashSet<(T, T)>,
}

impl<T> PairsSet<T>
where
    T: Copy + Hash + Eq + ?Sized,
{
    pub fn new() -> Self {
        Self {
            set: HashSet::new(),
        }
    }

    pub fn get(&self, i: T, j: T) -> Option<(T, T)> {
        let tuple = (i, j);
        let reverse = (j, i);

        if self.set.contains(&tuple) {
            return Some(tuple);
        } else if self.set.contains(&reverse) {
            return Some(reverse);
        }

        None
    }

    pub fn add(&mut self, i: T, j: T) {
        if self.get(i, j) != None {
            return;
        }

        self.set.insert((i, j));
    }

    pub fn remove(&mut self, i: T, j: T) -> bool {
        if let Some(tuple) = self.get(i, j) {
            return self.set.remove(&tuple);
        }

        false
    }

    pub fn is_empty(&self) -> bool {
        self.set.is_empty()
    }

    pub fn iter(&self) -> Iter<'_, (T, T)> {
        return self.set.iter();
    }
}