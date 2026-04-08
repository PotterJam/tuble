import type { MapGuessResult } from "../game/types";
import linesData from "../data/lines.json";

const lines = linesData as Record<string, { name: string; colour: string }>;

const COMPASS_ARROWS: Record<string, string> = {
  N: "\u2B06\uFE0F",
  NE: "\u2197\uFE0F",
  E: "\u27A1\uFE0F",
  SE: "\u2198\uFE0F",
  S: "\u2B07\uFE0F",
  SW: "\u2199\uFE0F",
  W: "\u2B05\uFE0F",
  NW: "\u2196\uFE0F",
};

interface MapGuessListProps {
  guesses: MapGuessResult[];
  getStationName: (id: string) => string;
}

export default function MapGuessList({ guesses, getStationName }: MapGuessListProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="guess-list">
      {guesses.map((guess, i) => (
        <div key={i} className={`guess-row ${guess.correct ? "correct" : ""}`}>
          <div className="guess-header">
            <span className="guess-station">{getStationName(guess.stationId)}</span>
            {guess.correct && <span className="guess-correct-label">Correct!</span>}
          </div>

          {!guess.correct && (
            <div className="map-feedback">
              <div className="map-top-row">
                <span className="compass-arrow">{COMPASS_ARROWS[guess.compass]}</span>
                <span className="total-stops">
                  {guess.totalStops} {guess.totalStops === 1 ? "stop" : "stops"} away
                </span>
              </div>

              <div className="route-visualizer">
                <div className="route-node route-node-guess">
                  <span className="route-node-dot" />
                </div>
                {guess.hint.segments.map((seg, j) => {
                  // Reveal a line's color only if guess shares that line with target
                  const sharedSet = new Set(guess.sharedLines);
                  const revealedLine = seg.lines.find((l) => sharedSet.has(l));
                  const lineColor = revealedLine
                    ? lines[revealedLine]?.colour ?? "#999"
                    : "#ccc";
                  const lineName = revealedLine
                    ? lines[revealedLine]?.name
                    : null;
                  const isInterchange = j < guess.hint.segments.length - 1;

                  return (
                    <div key={j} className="route-segment-visual">
                      <div
                        className="route-line"
                        style={{ backgroundColor: lineColor }}
                        title={lineName ?? "Unknown line"}
                      >
                        <span className="route-stops-label">{seg.stops}</span>
                      </div>
                      {isInterchange ? (
                        <div className="route-node route-node-interchange" title="Interchange">
                          <span className="route-node-ring" />
                        </div>
                      ) : (
                        <div className="route-node route-node-target">
                          <span className="route-node-dot route-node-dot-target" />
                        </div>
                      )}
                    </div>
                  );
                })}
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
      ))}
    </div>
  );
}
