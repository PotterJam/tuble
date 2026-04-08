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
  path: string[];
}

/** The hint shown to the player after a guess */
export interface RouteHint {
  segments: RouteSegment[];
  totalStops: number;
}

/** 8-point compass direction */
export type CompassDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export interface MapGuessResult {
  stationId: string;
  correct: boolean;
  hint: RouteHint;
  compass: CompassDirection;
  totalStops: number;
  sharedLines: string[];
}

export interface GameState {
  targetId: string;
  guesses: MapGuessResult[];
  maxGuesses: number;
  status: "playing" | "won" | "lost";
}
