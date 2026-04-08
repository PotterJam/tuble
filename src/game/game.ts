import type {
  GameState,
  MapGuessResult,
  CompassDirection,
} from "./types";
import { findRoute, getAllStationIds, graph } from "./pathfinding";
import metadataData from "../data/station-metadata.json";

const metadata = metadataData as Record<string, { lat: number; lon: number; borough: string }>;

const MAX_GUESSES = 8;
const STORAGE_KEY = "tuble-game";

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateSeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) | 0;
  }
  return hash;
}

export function getTargetForDate(dateKey: string): string {
  const ids = getAllStationIds();
  const rng = mulberry32(dateSeed(dateKey));
  const index = Math.floor(rng() * ids.length);
  return ids[index];
}

export function createGame(dateKey: string): GameState {
  return {
    targetId: getTargetForDate(dateKey),
    guesses: [],
    maxGuesses: MAX_GUESSES,
    status: "playing",
  };
}

export function randomGame(): GameState {
  const ids = getAllStationIds();
  const targetId = ids[Math.floor(Math.random() * ids.length)];
  return {
    targetId,
    guesses: [],
    maxGuesses: MAX_GUESSES,
    status: "playing",
  };
}

export function makeGuess(state: GameState, stationId: string): GameState {
  if (state.status !== "playing") throw new Error("Game is already over");
  if (!graph.stations[stationId]) throw new Error(`Unknown station: ${stationId}`);

  if (state.guesses.some((g) => g.stationId === stationId)) {
    throw new Error(`Already guessed: ${stationId}`);
  }

  const correct = stationId === state.targetId;
  const result = buildMapGuess(stationId, state.targetId, correct);

  const guesses = [...state.guesses, result];
  let status: GameState["status"] = "playing";
  if (correct) {
    status = "won";
  } else if (guesses.length >= state.maxGuesses) {
    status = "lost";
  }

  return { ...state, guesses, status };
}

function computeCompass(fromId: string, toId: string): CompassDirection {
  const from = metadata[fromId];
  const to = metadata[toId];
  if (!from || !to) return "N";

  const dLat = to.lat - from.lat;
  const dLon = to.lon - from.lon;

  const angle = Math.atan2(dLon, dLat) * (180 / Math.PI);
  const normalized = ((angle % 360) + 360) % 360;

  if (normalized < 22.5 || normalized >= 337.5) return "N";
  if (normalized < 67.5) return "NE";
  if (normalized < 112.5) return "E";
  if (normalized < 157.5) return "SE";
  if (normalized < 202.5) return "S";
  if (normalized < 247.5) return "SW";
  if (normalized < 292.5) return "W";
  return "NW";
}

function buildMapGuess(guessId: string, targetId: string, correct: boolean): MapGuessResult {
  const hints = findRoute(guessId, targetId);
  const hint = hints[0];
  const compass = computeCompass(guessId, targetId);

  const guessLines = new Set(graph.stations[guessId]?.lines ?? []);
  const targetLines = graph.stations[targetId]?.lines ?? [];
  const sharedLines = targetLines.filter((l) => guessLines.has(l));

  return {
    stationId: guessId,
    correct,
    hint,
    compass,
    totalStops: hint.totalStops,
    sharedLines,
  };
}

export function getStationList(): { id: string; name: string }[] {
  return Object.entries(graph.stations)
    .map(([id, station]) => ({ id, name: station.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface SavedState {
  dateKey: string;
  game: GameState;
}

export function saveGame(dateKey: string, state: GameState): void {
  const data: SavedState = { dateKey, game: state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadOrCreateGame(dateKey: string): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: SavedState = JSON.parse(raw);
      if (saved.dateKey === dateKey) {
        return saved.game;
      }
    }
  } catch {
    // Corrupted data — start fresh
  }
  return createGame(dateKey);
}
