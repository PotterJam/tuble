/** A tube station */
export interface Station {
  id: string;
  name: string;
  zone: string;
  lines: string[];
}

/** A directed edge in the graph adjacency list */
export interface Edge {
  to: string;
  line: string;
}

/** The full tube graph as stored in tube-graph.json */
export interface TubeGraph {
  stations: Record<string, Station>;
  adjacency: Record<string, Edge[]>;
}

/** Station metadata (coordinates + borough) */
export interface StationMeta {
  lat: number;
  lon: number;
  borough: string;
}

/** One segment of a route — a contiguous run on one or more parallel lines */
export interface RouteSegment {
  lines: string[];
  stops: number;
  endStationId: string;
}

/** The hint shown to the player after a guess */
export interface RouteHint {
  segments: RouteSegment[];
  totalStops: number;
}

export type Comparison = "higher" | "lower" | "equal";

/** 8-point compass direction */
export type CompassDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type GameMode = "map" | "attributes";

// ─── Map Mode Types ───

export interface MapGuessResult {
  stationId: string;
  correct: boolean;
  hint: RouteHint;
  compass: CompassDirection;
  totalStops: number;
  /** Which lines the guess shares with the target */
  sharedLines: string[];
}

// ─── Attributes Mode Types ───

export type TileMatch = "exact" | "partial" | "none";

export interface AttributeGuessResult {
  stationId: string;
  correct: boolean;
  zone: string;
  zoneMatch: TileMatch;
  zoneDirection: Comparison;
  borough: string;
  boroughMatch: TileMatch;
  networkTypes: string[];
  networkMatch: TileMatch;
  linesServed: string[];
  linesMatch: TileMatch;
  ridership: number;
  ridershipMatch: TileMatch;
  ridershipDirection: Comparison;
}

// ─── Game State ───

export interface GameState {
  targetId: string;
  mode: GameMode;
  guesses: MapGuessResult[] | AttributeGuessResult[];
  maxGuesses: number;
  status: "playing" | "won" | "lost";
}
