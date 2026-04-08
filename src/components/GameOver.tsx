import { useState } from "react";
import type { GameState, MapGuessResult } from "../game/types";
import { getTodayKey } from "../game/game";
import { getStationName } from "../game/pathfinding";

interface GameOverProps {
  state: GameState;
}

const LINE_EMOJI: Record<string, string> = {
  bakerloo: "\uD83D\uDFE4",
  central: "\uD83D\uDD34",
  circle: "\uD83D\uDFE1",
  district: "\uD83D\uDFE2",
  elizabeth: "\uD83D\uDFE3",
  "hammersmith-city": "\uD83D\uDFE0",
  jubilee: "\u26AA",
  metropolitan: "\uD83D\uDFE3",
  northern: "\u26AB",
  piccadilly: "\uD83D\uDD35",
  victoria: "\uD83D\uDD35",
  "waterloo-city": "\uD83D\uDFE2",
};

function buildSegmentKey(fromId: string, seg: { endStationId: string; lines: string[] }): string {
  return `${fromId}->${seg.endStationId}:${[...seg.lines].sort().join(",")}`;
}

function getRevealedSegments(guesses: MapGuessResult[]): Set<string> {
  const seen = new Map<string, number>();
  const duplicates = new Set<string>();

  for (const guess of guesses) {
    let prevId = guess.stationId;
    for (const seg of guess.hint.segments) {
      const key = buildSegmentKey(prevId, seg);
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      if (count >= 2) duplicates.add(key);
      prevId = seg.endStationId;
    }
  }

  return duplicates;
}

function buildShareText(state: GameState): string {
  const dateKey = getTodayKey();
  const won = state.status === "won";
  const score = won ? `${state.guesses.length}/${state.maxGuesses}` : `X/${state.maxGuesses}`;

  const guesses = state.guesses as MapGuessResult[];
  const revealedKeys = getRevealedSegments(guesses);

  const rows = guesses.map((g) => {
    if (g.correct) return "\u2705";

    const sharedSet = new Set(g.sharedLines);
    const segEmojis: string[] = [];
    let prevId = g.stationId;

    for (const seg of g.hint.segments) {
      const segKey = buildSegmentKey(prevId, seg);
      const revealedByShared = seg.lines.find(l => sharedSet.has(l));
      const revealedByCross = revealedKeys.has(segKey);

      if (revealedByShared || revealedByCross) {
        const lineId = revealedByShared ?? seg.lines[0];
        segEmojis.push(LINE_EMOJI[lineId] ?? "\uD83D\uDFE0");
      } else {
        segEmojis.push("\u2B1C");
      }
      prevId = seg.endStationId;
    }

    return `${segEmojis.join("")} ${g.totalStops}`;
  });

  return `Tuble \uD83D\uDE87 ${dateKey} ${score}\n${rows.join("\n")}`;
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
