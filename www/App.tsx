import GameWindow from "./components/ui/GameWindow";
import { GameSettings } from "./components/ui/GameSettings";

export function App() {  
  return (
    <div className="w-screen h-screen flex flex-col items-center gap-10 p-10">
      <div className="flex-1 flex items-center flex-col justify-end">
          <p className="font-sans font-bold text-4xl text-title text-shadow-sm">Pong, but Better</p>
          <p className="font-light text-black/50 italic text-center">version 1.0.0</p>
      </div>
      <GameWindow/>
      <GameSettings/>
    </div>
  );
}

export default App;
