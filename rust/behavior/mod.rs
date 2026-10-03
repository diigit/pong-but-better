pub mod player_paddle;
pub mod bot_paddle;

use hecs::World;

pub struct Behavior {
	pub run: fn(&mut World),
}

inventory::collect!(Behavior);

pub fn run_behaviors(world: &mut World) {
	for behavior in inventory::iter::<Behavior> {
		(behavior.run)(world);
	}
}