import GameWindow from "./components/ui/GameWindow";
import { GameSettings } from "./components/ui/GameSettings";

export function App() {  
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-10 p-10">
      <div className="flex-1 flex items-center flex-col">
        <div className="p-4 rounded-xl bg-white/10 drop-shadow-2xl border-white/15 border-2">
          <p className="font-title font-black text-4xl text-title text-shadow-2xs">pong-but-better</p>
          <p className="font-light italic">version 0.0.0</p>
        </div>
      </div>
      <GameWindow/>
      <GameSettings/>
    </div>
  );
}

export default App;
