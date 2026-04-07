/**
 * Generates src/data/ridership.json from TfL station footfall data.
 *
 * Source: https://crowding.data.tfl.gov.uk/Network%20Demand/StationFootfall_2025_2026%20.csv
 *
 * Usage:
 *   curl -o footfall.csv 'https://crowding.data.tfl.gov.uk/Network%20Demand/StationFootfall_2025_2026%20.csv'
 *   npx tsx scripts/build-ridership.ts footfall.csv
 */

import { readFileSync, writeFileSync } from "fs";
import graphData from "../src/data/tube-graph.json";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx scripts/build-ridership.ts <footfall.csv>");
  process.exit(1);
}

const csv = readFileSync(csvPath, "utf8");
const lines = csv.trim().split("\n");

// Compute average daily (entry + exit) per station name
const totals: Record<string, number> = {};
const days: Record<string, number> = {};

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(",");
  const station = cols[2];
  const entry = parseInt(cols[3]) || 0;
  const exit = parseInt(cols[4]) || 0;
  totals[station] = (totals[station] ?? 0) + entry + exit;
  days[station] = (days[station] ?? 0) + 1;
}

const avgs: Record<string, number> = {};
for (const [s, t] of Object.entries(totals)) {
  avgs[s] = Math.round(t / days[s]);
}

// Normalize a name for fuzzy matching
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const csvByNorm: Record<string, string> = {};
for (const name of Object.keys(avgs)) {
  csvByNorm[norm(name)] = name;
}

// Manual mappings for station names that don't match after normalization
const manual: Record<string, string> = {
  "edgware-road-bakerloo": "Edgware Road B",
  "edgware-road-circle-line": "Edgware Road C&H",
  "shepherds-bush-central": "Shepherds Bush",
  "hammersmith-handc-line": "Hammersmith C&H",
  "burnham-berks": "Burnham Bucks",
  "woolwich": "Woolwich Elizabeth Line",
  "custom-house": "Custom House Elizabeth Line",
  "watford": "Watford Met",
};

const stations = graphData.stations as Record<string, { name: string }>;
const result: Record<string, number> = {};
const unmatched: string[] = [];

for (const [id, station] of Object.entries(stations)) {
  const n = norm(station.name);
  if (csvByNorm[n]) {
    result[id] = avgs[csvByNorm[n]];
  } else if (manual[id] && avgs[manual[id]] !== undefined) {
    result[id] = avgs[manual[id]];
  } else {
    unmatched.push(`${id} (${station.name})`);
  }
}

if (unmatched.length > 0) {
  console.error("Unmatched stations:");
  unmatched.forEach((s) => console.error(`  ${s}`));
  console.error(
    "\nAdd manual mappings in this script for the above stations."
  );
  process.exit(1);
}

const outPath = new URL("../src/data/ridership.json", import.meta.url)
  .pathname;
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
console.log(
  `Written ${Object.keys(result).length} stations to ${outPath}`
);
