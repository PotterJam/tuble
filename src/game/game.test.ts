import { describe, it, expect, beforeEach } from "vitest";
import {
  getTargetForDate,
  createGame,
  makeGuess,
  getStationList,
  getTodayKey,
} from "./game";
import { getAllStationIds } from "./pathfinding";
import type { GameState, MapGuessResult } from "./types";

describe("daily puzzle selection", () => {
  it("returns a valid station for a given date", () => {
    const target = getTargetForDate("2026-04-07");
    const allIds = getAllStationIds();
    expect(allIds).toContain(target);
  });

  it("is deterministic — same date always gives same station", () => {
    const a = getTargetForDate("2026-01-15");
    const b = getTargetForDate("2026-01-15");
    expect(a).toBe(b);
  });

  it("different dates give different stations (spot check)", () => {
    const a = getTargetForDate("2026-01-01");
    const b = getTargetForDate("2026-01-02");
    const c = getTargetForDate("2026-06-15");
    const unique = new Set([a, b, c]);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });
});

describe("getTodayKey", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(getTodayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("createGame", () => {
  it("creates a fresh game with correct defaults", () => {
    const game = createGame("2026-04-07");
    expect(game.status).toBe("playing");
    expect(game.guesses).toEqual([]);
    expect(game.maxGuesses).toBe(8);
    expect(game.targetId).toBe(getTargetForDate("2026-04-07"));
  });
});

describe("makeGuess", () => {
  let game: GameState;

  beforeEach(() => {
    game = createGame("2026-04-07");
  });

  it("adds a guess with route hint and compass", () => {
    const allIds = getAllStationIds();
    const wrongId = allIds.find((id) => id !== game.targetId)!;

    const next = makeGuess(game, wrongId);
    expect(next.guesses).toHaveLength(1);

    const guess = next.guesses[0] as MapGuessResult;
    expect(guess.stationId).toBe(wrongId);
    expect(guess.correct).toBe(false);
    expect(guess.hint.segments.length).toBeGreaterThan(0);
    expect(guess.compass).toMatch(/^(N|NE|E|SE|S|SW|W|NW)$/);
    expect(next.status).toBe("playing");
  });

  it("wins when guessing the target", () => {
    const next = makeGuess(game, game.targetId);
    expect(next.guesses).toHaveLength(1);

    const guess = next.guesses[0] as MapGuessResult;
    expect(guess.correct).toBe(true);
    expect(guess.hint.totalStops).toBe(0);
    expect(next.status).toBe("won");
  });

  it("loses after max guesses", () => {
    const allIds = getAllStationIds();
    const wrongIds = allIds.filter((id) => id !== game.targetId);

    let state = game;
    for (let i = 0; i < 8; i++) {
      state = makeGuess(state, wrongIds[i]);
    }
    expect(state.guesses).toHaveLength(8);
    expect(state.status).toBe("lost");
  });

  it("throws when guessing after game is over", () => {
    const won = makeGuess(game, game.targetId);
    const allIds = getAllStationIds();
    const anotherId = allIds.find((id) => id !== game.targetId)!;
    expect(() => makeGuess(won, anotherId)).toThrow("Game is already over");
  });

  it("throws on duplicate guesses", () => {
    const allIds = getAllStationIds();
    const wrongId = allIds.find((id) => id !== game.targetId)!;
    const first = makeGuess(game, wrongId);
    expect(() => makeGuess(first, wrongId)).toThrow("Already guessed");
  });

  it("throws for unknown stations", () => {
    expect(() => makeGuess(game, "fake-station")).toThrow("Unknown station");
  });
});

describe("getStationList", () => {
  it("returns all stations sorted by name", () => {
    const list = getStationList();
    expect(list.length).toBe(getAllStationIds().length);
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].name.localeCompare(list[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it("each entry has id and name", () => {
    const list = getStationList();
    for (const entry of list) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
    }
  });
});
