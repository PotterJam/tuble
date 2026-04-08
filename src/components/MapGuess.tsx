import type { MapGuessResult, RouteSegment } from "../game/types";
import linesData from "../data/lines.json";
import metadataData from "../data/station-metadata.json";
import { graph } from "../game/pathfinding";

const lines = linesData as Record<string, { name: string; colour: string }>;
const meta = metadataData as Record<string, { lat: number; lon: number; borough: string }>;

const HOP_LENGTH = 20;
const LINE_THICKNESS = 10;
const NODE_RADIUS = 9;
const TARGET_RADIUS = 12;
const PADDING = 30;
const MAX_WIDTH = 400;

interface Point { x: number; y: number }

function geoAngle(fromId: string, toId: string): number {
  const f = meta[fromId];
  const t = meta[toId];
  if (!f || !t) return 0;
  const dx = t.lon - f.lon;
  const dy = -(t.lat - f.lat);
  const angle = Math.atan2(dy, dx);
  return Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
}

function computeRouteGeometry(guessId: string, segments: RouteSegment[]) {
  const allPoints: Point[][] = [];
  let cursor: Point = { x: 0, y: 0 };
  let prevId = guessId;

  for (const seg of segments) {
    const segPath = seg.path ?? [seg.endStationId];
    const stationIds = [prevId, ...segPath];
    const pts: Point[] = [{ ...cursor }];

    for (let i = 1; i < stationIds.length; i++) {
      const angle = geoAngle(stationIds[i - 1], stationIds[i]);
      const prev = pts[pts.length - 1];
      pts.push({
        x: prev.x + Math.cos(angle) * HOP_LENGTH,
        y: prev.y + Math.sin(angle) * HOP_LENGTH,
      });
    }

    allPoints.push(pts);
    cursor = pts[pts.length - 1];
    prevId = seg.endStationId;
  }

  const flat = allPoints.flat();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of flat) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const rawW = maxX - minX;
  const rawH = maxY - minY;
  const scale = rawW > 0 ? Math.min(1, (MAX_WIDTH - PADDING * 2) / rawW) : 1;

  const scaledPoints = allPoints.map(pts =>
    pts.map(p => ({
      x: (p.x - minX) * scale + PADDING,
      y: (p.y - minY) * scale + PADDING,
    }))
  );

  return {
    segmentPoints: scaledPoints,
    width: rawW * scale + PADDING * 2,
    height: rawH * scale + PADDING * 2,
  };
}

function pointsToSvgPath(points: Point[]): string {
  if (points.length < 2) return "";
  const parts = points.map((p, i) =>
    `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  );
  return parts.join(" ");
}

interface MapGuessListProps {
  guesses: MapGuessResult[];
  getStationName: (id: string) => string;
}

function buildSegmentKey(fromId: string, seg: { endStationId: string; lines: string[] }): string {
  return `${fromId}->${seg.endStationId}:${[...seg.lines].sort().join(",")}`;
}

function getRevealedSegments(guesses: MapGuessResult[]): Set<string> {
  const keyCounts = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const guess of guesses) {
    let prevId = guess.stationId;
    for (const seg of guess.hint.segments) {
      const key = buildSegmentKey(prevId, seg);
      if (keyCounts.has(key)) {
        duplicates.add(key);
      }
      keyCounts.set(key, seg.lines[0]);
      prevId = seg.endStationId;
    }
  }

  return duplicates;
}

export default function MapGuessList({ guesses, getStationName }: MapGuessListProps) {
  if (guesses.length === 0) return null;

  const revealedKeys = getRevealedSegments(guesses);

  return (
    <div className="guess-list">
      {guesses.map((guess, i) => {
        const stationLines = graph.stations[guess.stationId]?.lines ?? [];
        const sharedSet = new Set(guess.sharedLines);
        const geo = computeRouteGeometry(guess.stationId, guess.hint.segments);

        return (
          <div key={i} className={`guess-row ${guess.correct ? "correct" : ""}`}>
            <div className="guess-header">
              <div className="guess-station-info">
                <span className="guess-station">{getStationName(guess.stationId)}</span>
                {!guess.correct && stationLines.length > 0 && (
                  <div className="station-line-dots">
                    {stationLines.map(lineId => (
                      <span
                        key={lineId}
                        className="station-line-dot"
                        style={{ backgroundColor: lines[lineId]?.colour ?? "#999" }}
                        title={lines[lineId]?.name ?? lineId}
                      />
                    ))}
                  </div>
                )}
              </div>
              {guess.correct && <span className="guess-correct-label">Correct!</span>}
            </div>

            {!guess.correct && (
              <div className="map-feedback">
                <div className="map-top-row">
                  <span className="total-stops">
                    {guess.totalStops} {guess.totalStops === 1 ? "stop" : "stops"} away
                  </span>
                </div>

                <div className="route-visualizer-wrapper">
                  <svg
                    width={geo.width}
                    height={Math.max(geo.height, 50)}
                    className="route-svg"
                  >
                    {guess.hint.segments.map((seg, j) => {
                      const fromId = j === 0
                        ? guess.stationId
                        : guess.hint.segments[j - 1].endStationId;
                      const segKey = buildSegmentKey(fromId, seg);
                      const revealedByShared = seg.lines.find(l => sharedSet.has(l));
                      const revealedByCross = revealedKeys.has(segKey);
                      const lineColor = (revealedByShared || revealedByCross)
                        ? lines[seg.lines[0]]?.colour ?? "#999"
                        : "#D4C5A9";
                      const pts = geo.segmentPoints[j];
                      const d = pointsToSvgPath(pts);
                      const midIdx = Math.floor(pts.length / 2);
                      const mid = pts[midIdx];
                      const before = pts[Math.max(0, midIdx - 1)];
                      const after = pts[Math.min(pts.length - 1, midIdx + 1)];
                      const localAngle = Math.atan2(after.y - before.y, after.x - before.x);
                      const perp1 = localAngle - Math.PI / 2;
                      const perp2 = localAngle + Math.PI / 2;
                      const perpAngle = Math.sin(perp1) < Math.sin(perp2) ? perp1 : perp2;
                      const labelOffset = 16;

                      return (
                        <g key={j}>
                          <path
                            d={d}
                            fill="none"
                            stroke={lineColor}
                            strokeWidth={LINE_THICKNESS}
                            strokeLinecap="butt"
                            strokeLinejoin="round"
                          />
                          <text
                            x={mid.x + Math.cos(perpAngle) * labelOffset}
                            y={mid.y + Math.sin(perpAngle) * labelOffset}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="route-stops-text"
                          >
                            {seg.stops}
                          </text>
                        </g>
                      );
                    })}

                    {/* Start tick */}
                    {(() => {
                      const pts = geo.segmentPoints[0];
                      if (!pts || pts.length < 2) return null;
                      const p = pts[0];
                      const next = pts[1];
                      const angle = Math.atan2(next.y - p.y, next.x - p.x) + Math.PI / 2;
                      const tickLen = 11;
                      const px = p.x;
                      const py = p.y;
                      return (
                        <line
                          x1={px + Math.cos(angle) * tickLen}
                          y1={py + Math.sin(angle) * tickLen}
                          x2={px - Math.cos(angle) * tickLen}
                          y2={py - Math.sin(angle) * tickLen}
                          stroke="#000"
                          strokeWidth={4}
                          strokeLinecap="round"
                        />
                      );
                    })()}

                    {/* Interchange nodes */}
                    {guess.hint.segments.slice(0, -1).map((_, j) => {
                      const pts = geo.segmentPoints[j];
                      const p = pts[pts.length - 1];
                      const px = p.x;
                      const py = p.y;
                      return (
                        <circle
                          key={`int-${j}`}
                          cx={px}
                          cy={py}
                          r={NODE_RADIUS}
                          fill="#fff"
                          stroke="#000"
                          strokeWidth={2.5}
                        />
                      );
                    })}

                    {/* Target node */}
                    {(() => {
                      const lastSeg = geo.segmentPoints[geo.segmentPoints.length - 1];
                      const p = lastSeg[lastSeg.length - 1];
                      const px = p.x;
                      const py = p.y;
                      return (
                        <g>
                          <circle
                            cx={px}
                            cy={py}
                            r={TARGET_RADIUS}
                            fill="#fff"
                            stroke="#000"
                            strokeWidth={2.5}
                          />
                          <text
                            x={px}
                            y={py}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="route-target-text"
                          >
                            ?
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                {guess.sharedLines.length > 0 && (
                  <div className="shared-lines">
                    {guess.sharedLines.map((lineId) => (
                      <span
                        key={lineId}
                        className="line-bubble"
                        style={{ backgroundColor: lines[lineId]?.colour ?? "#666" }}
                        title={lines[lineId]?.name ?? lineId}
                      >
                        {lines[lineId]?.name ?? lineId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
