import MovingBackground from "./components/ui/moving-background";
import GameCanvas from "./GameCanvas";

export function App() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <MovingBackground/>
      <GameCanvas/>
    </div>
  );
}

export default App;
