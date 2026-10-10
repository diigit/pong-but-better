export abstract class Gamemode {
	public abstract startRound(): void;
	public abstract endRound(): void;
	public abstract destroy(): void;
}
