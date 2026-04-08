import { useState } from "react";

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="bottom-btn" onClick={() => setIsOpen(true)}>
        How to play
      </button>
      {isOpen && (
        <div className="settings-backdrop" onClick={() => setIsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="settings-close" onClick={() => setIsOpen(false)}>
              &times;
            </button>
            <h2>How to play</h2>
            <p>
              Guess the mystery London Underground station in 8 tries. Choose
              between two game modes using the toggle at the top.
            </p>

            <h3>Map Mode</h3>
            <p>
              Each guess shows a visual route from your guess to the target, with
              a compass arrow pointing in the real-world direction. Line colors
              are only revealed if your guess shares that line with the target.
            </p>

            <h3>Attributes Mode</h3>
            <p>
              Each guess shows 5 tiles comparing your guess to the target across
              fixed categories:
            </p>
            <ul className="hint-key">
              <li><strong>Zone</strong> — exact match or arrow direction</li>
              <li><strong>Borough</strong> — same borough or miss</li>
              <li><strong>Network</strong> — Underground vs Elizabeth line</li>
              <li><strong>Lines</strong> — shared lines (hidden identity)</li>
              <li><strong>Usage</strong> — daily passenger volume bracket</li>
            </ul>

            <h3>Tile colors</h3>
            <ul className="hint-key">
              <li>
                <span className="attr-tile tile-exact inline-tile" />
                Exact match
              </li>
              <li>
                <span className="attr-tile tile-partial inline-tile" />
                Partial match (shares some overlap)
              </li>
              <li>
                <span className="attr-tile tile-miss inline-tile" />
                No match
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
