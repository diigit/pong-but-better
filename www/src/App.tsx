import GameWindow from "./components/ui/GameWindow";

export function App() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="fixed top-15 flex items-center flex-col p-4 rounded-xl bg-white/10 drop-shadow-2xl border-white/15 border-2">
        <p className="font-title font-black text-4xl text-title text-shadow-2xs">pong-but-better</p>
        <p className="font-light italic">version 0.0.0</p>
      </div>
      <GameWindow/>
    </div>
  );
}

export default App;
