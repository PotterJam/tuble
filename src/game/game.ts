import type {
  GameState,
  GameMode,
  MapGuessResult,
  AttributeGuessResult,
  Comparison,
  TileMatch,
  CompassDirection,
} from "./types";
import { findRoute, getAllStationIds, graph } from "./pathfinding";
import metadataData from "../data/station-metadata.json";
import ridershipData from "../data/ridership.json";

const metadata = metadataData as Record<string, { lat: number; lon: number; borough: string }>;
const riderships = ridershipData as Record<string, number>;

const MAX_GUESSES = 8;
const STORAGE_KEY = "tuble-game";

// ─── Seeded PRNG ───

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

// ─── Game creation ───

export function createGame(dateKey: string, mode: GameMode): GameState {
  return {
    targetId: getTargetForDate(dateKey),
    mode,
    guesses: [],
    maxGuesses: MAX_GUESSES,
    status: "playing",
  };
}

export function randomGame(mode: GameMode): GameState {
  const ids = getAllStationIds();
  const targetId = ids[Math.floor(Math.random() * ids.length)];
  return {
    targetId,
    mode,
    guesses: [],
    maxGuesses: MAX_GUESSES,
    status: "playing",
  };
}

// ─── Guessing ───

export function makeGuess(state: GameState, stationId: string): GameState {
  if (state.status !== "playing") throw new Error("Game is already over");
  if (!graph.stations[stationId]) throw new Error(`Unknown station: ${stationId}`);

  const currentGuesses = state.guesses as Array<MapGuessResult | AttributeGuessResult>;
  if (currentGuesses.some((g) => g.stationId === stationId)) {
    throw new Error(`Already guessed: ${stationId}`);
  }

  const correct = stationId === state.targetId;

  let result: MapGuessResult | AttributeGuessResult;
  if (state.mode === "map") {
    result = buildMapGuess(stationId, state.targetId, correct);
  } else {
    result = buildAttributeGuess(stationId, state.targetId, correct);
  }

  const guesses = [...currentGuesses, result];
  let status: GameState["status"] = "playing";
  if (correct) {
    status = "won";
  } else if (guesses.length >= state.maxGuesses) {
    status = "lost";
  }

  return { ...state, guesses: guesses as MapGuessResult[] | AttributeGuessResult[], status };
}

// ─── Map Mode ───

function computeCompass(fromId: string, toId: string): CompassDirection {
  const from = metadata[fromId];
  const to = metadata[toId];
  if (!from || !to) return "N";

  const dLat = to.lat - from.lat;
  const dLon = to.lon - from.lon;

  // Convert to approximate bearing
  const angle = Math.atan2(dLon, dLat) * (180 / Math.PI);
  // Normalize to 0-360
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

// ─── Attributes Mode ───

function getNetworkTypes(stationId: string): string[] {
  const lines = graph.stations[stationId]?.lines ?? [];
  const types = new Set<string>();
  for (const line of lines) {
    if (line === "elizabeth") {
      types.add("Elizabeth line");
    } else {
      types.add("Underground");
    }
  }
  return [...types].sort();
}

function parseZones(zone: string): number[] {
  const matches = zone.match(/\d+/g);
  return matches ? matches.map(Number) : [0];
}

function compareNumeric(a: number, b: number): Comparison {
  if (a > b) return "higher";
  if (a < b) return "lower";
  return "equal";
}

function compareZoneDirection(guessZone: string, targetZone: string): Comparison {
  const guessNums = parseZones(guessZone);
  const targetNums = parseZones(targetZone);
  if (guessNums.some((g) => targetNums.includes(g))) return "equal";
  return compareNumeric(Math.min(...guessNums), Math.min(...targetNums));
}

function arrayMatch(a: string[], b: string[]): TileMatch {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === setB.size && [...setA].every((x) => setB.has(x))) return "exact";
  if ([...setA].some((x) => setB.has(x))) return "partial";
  return "none";
}

// Usage brackets for "exact" match on ridership
const USAGE_BRACKETS = [0, 5000, 10000, 20000, 40000, 80000, Infinity];

function usageBracket(ridership: number): number {
  for (let i = 0; i < USAGE_BRACKETS.length - 1; i++) {
    if (ridership < USAGE_BRACKETS[i + 1]) return i;
  }
  return USAGE_BRACKETS.length - 1;
}

function buildAttributeGuess(
  guessId: string,
  targetId: string,
  correct: boolean,
): AttributeGuessResult {
  const guessStation = graph.stations[guessId];
  const targetStation = graph.stations[targetId];
  const guessZone = guessStation?.zone ?? "?";
  const targetZone = targetStation?.zone ?? "?";
  const guessMeta = metadata[guessId];
  const targetMeta = metadata[targetId];
  const guessRidership = riderships[guessId] ?? 0;
  const targetRidership = riderships[targetId] ?? 0;
  const guessLines = guessStation?.lines ?? [];
  const targetLines = targetStation?.lines ?? [];
  const guessNetworks = getNetworkTypes(guessId);
  const targetNetworks = getNetworkTypes(targetId);

  // Zone
  const guessNums = parseZones(guessZone);
  const targetNums = parseZones(targetZone);
  const zoneMatch: TileMatch = guessNums.some((g) => targetNums.includes(g)) ? "exact" : "none";
  const zoneDirection = compareZoneDirection(guessZone, targetZone);

  // Borough
  const boroughMatch: TileMatch =
    guessMeta?.borough && targetMeta?.borough && guessMeta.borough === targetMeta.borough
      ? "exact"
      : "none";

  // Network
  const networkMatch = arrayMatch(guessNetworks, targetNetworks);

  // Lines
  const linesMatch = arrayMatch(guessLines, targetLines);

  // Ridership
  const ridershipMatch: TileMatch =
    usageBracket(guessRidership) === usageBracket(targetRidership) ? "exact" : "none";
  const ridershipDirection = compareNumeric(guessRidership, targetRidership);

  return {
    stationId: guessId,
    correct,
    zone: guessZone,
    zoneMatch,
    zoneDirection,
    borough: guessMeta?.borough ?? "Unknown",
    boroughMatch,
    networkTypes: guessNetworks,
    networkMatch,
    linesServed: guessLines,
    linesMatch,
    ridership: guessRidership,
    ridershipMatch,
    ridershipDirection,
  };
}

// ─── Station list ───

export function getStationList(): { id: string; name: string }[] {
  return Object.entries(graph.stations)
    .map(([id, station]) => ({ id, name: station.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Persistence ───

interface SavedState {
  dateKey: string;
  mode: GameMode;
  game: GameState;
}

export function saveGame(dateKey: string, state: GameState): void {
  const data: SavedState = { dateKey, mode: state.mode, game: state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadOrCreateGame(dateKey: string, mode: GameMode): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: SavedState = JSON.parse(raw);
      if (saved.dateKey === dateKey && saved.game.mode === mode) {
        return saved.game;
      }
    }
  } catch {
    // Corrupted data — start fresh
  }
  return createGame(dateKey, mode);
}

// ─── Mode persistence ───

const MODE_KEY = "tuble-mode";

export function loadMode(): GameMode {
  try {
    const val = localStorage.getItem(MODE_KEY);
    if (val === "map" || val === "attributes") return val;
  } catch {
    // ignore
  }
  return "map";
}

export function saveMode(mode: GameMode): void {
  localStorage.setItem(MODE_KEY, mode);
}
