import type { GameState } from "../game/types";

interface GameOverProps {
  state: GameState;
  targetName: string;
  targetCode: string;
  targetZone: string;
  targetRidership: number;
}

function formatRidership(n: number): string {
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return String(n);
}

export default function GameOver({ state, targetName, targetCode, targetZone, targetRidership }: GameOverProps) {
  if (state.status === "playing") return null;

  const won = state.status === "won";

  return (
    <div className="game-over-card">
      <h2>{won ? "You got it!" : "Not this time"}</h2>
      <p className="game-over-answer">
        {won
          ? `You found ${targetName} in ${state.guesses.length} ${state.guesses.length === 1 ? "guess" : "guesses"}.`
          : `The answer was ${targetName}.`}
      </p>
      <div className="game-over-stats">
        <span className="code-tiles">
          {targetCode.split("").map((c, i) => (
            <span key={i} className="code-tile correct">{c}</span>
          ))}
        </span>
        <span>Zone {targetZone}</span>
        <span>{formatRidership(targetRidership)} riders/day</span>
      </div>
      <p className="game-over-comeback">Come back tomorrow for a new puzzle!</p>
    </div>
  );
}
