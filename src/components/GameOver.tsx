import { useState } from "react";
import type { GameState, MapGuessResult, AttributeGuessResult } from "../game/types";
import { getTodayKey } from "../game/game";
import { getStationName } from "../game/pathfinding";

interface GameOverProps {
  state: GameState;
}

function buildShareText(state: GameState): string {
  const dateKey = getTodayKey();
  const won = state.status === "won";
  const score = won ? `${state.guesses.length}/${state.maxGuesses}` : `X/${state.maxGuesses}`;
  const modeLabel = state.mode === "map" ? "\uD83D\uDDFA\uFE0F" : "\uD83E\uDDEC";

  let rows: string[];
  if (state.mode === "map") {
    const guesses = state.guesses as MapGuessResult[];
    rows = guesses.map((g) => {
      if (g.correct) return "\u2705";
      const compass: Record<string, string> = {
        N: "\u2B06\uFE0F", NE: "\u2197\uFE0F", E: "\u27A1\uFE0F", SE: "\u2198\uFE0F",
        S: "\u2B07\uFE0F", SW: "\u2199\uFE0F", W: "\u2B05\uFE0F", NW: "\u2196\uFE0F",
      };
      return `${compass[g.compass]} ${g.totalStops} stops ${g.sharedLines.length > 0 ? "\uD83D\uDFE2" : "\u26AA"}`;
    });
  } else {
    const guesses = state.guesses as AttributeGuessResult[];
    rows = guesses.map((g) => {
      if (g.correct) return "\u2705";
      const tile = (m: string) =>
        m === "exact" ? "\uD83D\uDFE9" : m === "partial" ? "\uD83D\uDFE8" : "\u2B1C";
      return [
        tile(g.zoneMatch),
        tile(g.boroughMatch),
        tile(g.networkMatch),
        tile(g.linesMatch),
        tile(g.ridershipMatch),
      ].join("");
    });
  }

  return `Tuble ${modeLabel} ${dateKey} ${score}\n${rows.join("\n")}`;
}

export default function GameOver({ state }: GameOverProps) {
  const [copied, setCopied] = useState(false);

  if (state.status === "playing") return null;

  const won = state.status === "won";
  const targetName = getStationName(state.targetId) ?? state.targetId;

  function handleShare() {
    const text = buildShareText(state);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="game-over-card">
      <h2>{won ? "You got it!" : "Not this time"}</h2>
      <p className="game-over-answer">
        {won
          ? `You found ${targetName} in ${state.guesses.length} ${state.guesses.length === 1 ? "guess" : "guesses"}.`
          : `The answer was ${targetName}.`}
      </p>
      <button className="share-btn" onClick={handleShare}>
        {copied ? "Copied!" : "Share"}
      </button>
      <p className="game-over-comeback">Come back tomorrow for a new puzzle!</p>
    </div>
  );
}
