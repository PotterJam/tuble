import type { AttributeGuessResult, TileMatch, Comparison } from "../game/types";

function tileClass(match: TileMatch): string {
  if (match === "exact") return "tile-exact";
  if (match === "partial") return "tile-partial";
  return "tile-miss";
}

function dirArrow(dir: Comparison): string {
  if (dir === "higher") return "\u2B07"; // target is lower
  if (dir === "lower") return "\u2B06"; // target is higher
  return "";
}

function formatRidership(n: number): string {
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return String(n);
}

interface AttributeGuessListProps {
  guesses: AttributeGuessResult[];
  getStationName: (id: string) => string;
}

export default function AttributeGuessList({
  guesses,
  getStationName,
}: AttributeGuessListProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="guess-list">
      {/* Category header row */}
      <div className="attr-header-row">
        <div className="attr-header-name" />
        <div className="attr-header-tiles">
          <span className="attr-header-label">Zone</span>
          <span className="attr-header-label">Borough</span>
          <span className="attr-header-label">Network</span>
          <span className="attr-header-label">Lines</span>
          <span className="attr-header-label">Usage</span>
        </div>
      </div>

      {guesses.map((guess, i) => (
        <div key={i} className={`guess-row ${guess.correct ? "correct" : ""}`}>
          <div className="attr-guess-content">
            <div className="guess-station">{getStationName(guess.stationId)}</div>

            {guess.correct ? (
              <div className="guess-correct-label">Correct!</div>
            ) : (
              <div className="attr-tiles">
                {/* Zone */}
                <div className={`attr-tile ${tileClass(guess.zoneMatch)}`}>
                  <span className="attr-tile-value">
                    {guess.zoneMatch === "exact" ? guess.zone : ""}
                  </span>
                  {guess.zoneMatch !== "exact" && (
                    <span className="attr-tile-arrow">
                      {dirArrow(guess.zoneDirection)}
                    </span>
                  )}
                </div>

                {/* Borough */}
                <div className={`attr-tile ${tileClass(guess.boroughMatch)}`}>
                  <span className="attr-tile-value">
                    {guess.boroughMatch === "exact" ? "\u2713" : ""}
                  </span>
                </div>

                {/* Network */}
                <div className={`attr-tile ${tileClass(guess.networkMatch)}`}>
                  <span className="attr-tile-value">
                    {guess.networkMatch === "exact"
                      ? "\u2713"
                      : guess.networkMatch === "partial"
                        ? "~"
                        : ""}
                  </span>
                </div>

                {/* Lines */}
                <div className={`attr-tile ${tileClass(guess.linesMatch)}`}>
                  <span className="attr-tile-value">
                    {guess.linesMatch === "exact"
                      ? "\u2713"
                      : guess.linesMatch === "partial"
                        ? "~"
                        : ""}
                  </span>
                </div>

                {/* Usage */}
                <div className={`attr-tile ${tileClass(guess.ridershipMatch)}`}>
                  <span className="attr-tile-value">
                    {guess.ridershipMatch === "exact"
                      ? formatRidership(guess.ridership)
                      : ""}
                  </span>
                  {guess.ridershipMatch !== "exact" && (
                    <span className="attr-tile-arrow">
                      {dirArrow(guess.ridershipDirection)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
