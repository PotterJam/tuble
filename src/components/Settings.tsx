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
              Guess the mystery London Underground station in 8 tries.
            </p>
            <p>
              Each guess shows a visual route from your guess to the target,
              following the actual tube lines. Line colors are revealed when
              your guess shares that line with the target, or when multiple
              guesses share the same route segment.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
