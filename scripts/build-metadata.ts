/**
 * Fetches station coordinates and borough data from the TfL API
 * and writes src/data/station-metadata.json.
 *
 * Usage: npx tsx scripts/build-metadata.ts
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const TFL_BASE = "https://api.tfl.gov.uk";

interface TubeGraph {
  stations: Record<string, { id: string; name: string; zone: string; lines: string[] }>;
}

interface StationMetadata {
  lat: number;
  lon: number;
  borough: string;
}

interface TflStopPoint {
  commonName: string;
  lat: number;
  lon: number;
  additionalProperties?: { category: string; key: string; value: string }[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function toSlug(stationName: string): string {
  return stationName
    .replace(/\s+Underground\s+Station$/i, "")
    .replace(/\s+Rail\s+Station$/i, "")
    .replace(/\s+DLR\s+Station$/i, "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const graphPath = join(import.meta.dirname, "..", "src", "data", "tube-graph.json");
  const graph: TubeGraph = JSON.parse(readFileSync(graphPath, "utf-8"));
  const stationIds = Object.keys(graph.stations);

  console.log(`Fetching metadata for ${stationIds.length} stations...`);

  // Fetch all stop points for tube and elizabeth line modes
  const stopPoints = await fetchJson<TflStopPoint[]>(
    `${TFL_BASE}/StopPoint/Mode/tube,elizabeth-line?count=500`
  );

  console.log(`Fetched ${stopPoints.length} stop points from TfL`);

  // Build a lookup from slug -> TfL stop point data
  const tflBySlug = new Map<string, TflStopPoint>();
  for (const sp of stopPoints) {
    const slug = toSlug(sp.commonName);
    tflBySlug.set(slug, sp);
  }

  const metadata: Record<string, StationMetadata> = {};
  const missing: string[] = [];

  for (const id of stationIds) {
    const station = graph.stations[id];
    const sp = tflBySlug.get(id);

    if (sp) {
      const boroughProp = sp.additionalProperties?.find(
        (p) => p.key === "Borough"
      );
      metadata[id] = {
        lat: sp.lat,
        lon: sp.lon,
        borough: boroughProp?.value || "Unknown",
      };
    } else {
      missing.push(`${id} (${station.name})`);
      metadata[id] = { lat: 0, lon: 0, borough: "Unknown" };
    }
  }

  if (missing.length > 0) {
    console.warn(`\n⚠ ${missing.length} stations not matched:`);
    for (const m of missing) {
      console.warn(`  - ${m}`);
    }

    // Try individual lookups for missing stations
    console.log("\nTrying individual lookups for missing stations...");
    for (const id of stationIds) {
      if (metadata[id].lat !== 0) continue;
      const station = graph.stations[id];
      try {
        const results = await fetchJson<{ matches: TflStopPoint[] }>(
          `${TFL_BASE}/StopPoint/Search/${encodeURIComponent(station.name)}?modes=tube,elizabeth-line&maxResults=1`
        );
        if (results.matches && results.matches.length > 0) {
          const sp = results.matches[0];
          // Need to fetch full details for borough
          const detail = await fetchJson<TflStopPoint>(
            `${TFL_BASE}/StopPoint/${(sp as unknown as { id: string }).id}`
          );
          const boroughProp = detail.additionalProperties?.find(
            (p) => p.key === "Borough"
          );
          metadata[id] = {
            lat: detail.lat,
            lon: detail.lon,
            borough: boroughProp?.value || "Unknown",
          };
          console.log(`  ✓ Found ${station.name}`);
        }
      } catch {
        console.warn(`  ✗ Could not find ${station.name}`);
      }
    }
  }

  const outPath = join(import.meta.dirname, "..", "src", "data", "station-metadata.json");
  writeFileSync(outPath, JSON.stringify(metadata, null, 2));

  const found = Object.values(metadata).filter((m) => m.lat !== 0).length;
  console.log(`\n✓ Generated station-metadata.json: ${found}/${stationIds.length} stations with coordinates`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
