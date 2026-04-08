import { useState, useMemo, useCallback } from "react";
import type { GameMode } from "./game/types";
import {
  getTodayKey,
  loadOrCreateGame,
  saveGame,
  makeGuess,
  getStationList,
  createGame,
  randomGame,
  loadMode,
  saveMode,
} from "./game/game";
import { getStationName } from "./game/pathfinding";
import StationInput from "./components/StationInput";
import MapGuessList from "./components/MapGuess";
import AttributeGuessList from "./components/AttributeGuess";
import GameOver from "./components/GameOver";
import Settings from "./components/Settings";
import type { MapGuessResult, AttributeGuessResult } from "./game/types";
import "./App.css";

const dateKey = getTodayKey();

function App() {
  const [mode, setMode] = useState<GameMode>(loadMode);
  const [gameState, setGameState] = useState(() => loadOrCreateGame(dateKey, loadMode()));
  const stations = useMemo(() => getStationList(), []);
  const guessedIds = useMemo(
    () => new Set(gameState.guesses.map((g) => g.stationId)),
    [gameState.guesses],
  );

  const handleModeChange = useCallback(
    (newMode: GameMode) => {
      setMode(newMode);
      saveMode(newMode);
      const game = loadOrCreateGame(dateKey, newMode);
      setGameState(game);
    },
    [],
  );

  const handleGuess = useCallback(
    (stationId: string) => {
      const next = makeGuess(gameState, stationId);
      setGameState(next);
      saveGame(dateKey, next);
    },
    [gameState],
  );

  const handleReset = useCallback(() => {
    const fresh = createGame(dateKey, mode);
    setGameState(fresh);
    saveGame(dateKey, fresh);
  }, [mode]);

  const handleNewStation = useCallback(() => {
    const fresh = randomGame(mode);
    setGameState(fresh);
    saveGame(dateKey, fresh);
  }, [mode]);

  const getName = useCallback((id: string) => getStationName(id) ?? id, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tuble</h1>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "map" ? "active" : ""}`}
            onClick={() => handleModeChange("map")}
          >
            Map
          </button>
          <button
            className={`mode-btn ${mode === "attributes" ? "active" : ""}`}
            onClick={() => handleModeChange("attributes")}
          >
            Attributes
          </button>
        </div>
        <p className="guess-counter">
          {gameState.guesses.length} / {gameState.maxGuesses}
        </p>
      </header>

      {mode === "map" ? (
        <MapGuessList
          guesses={gameState.guesses as MapGuessResult[]}
          getStationName={getName}
        />
      ) : (
        <AttributeGuessList
          guesses={gameState.guesses as AttributeGuessResult[]}
          getStationName={getName}
        />
      )}

      {gameState.status === "playing" && (
        <StationInput
          stations={stations}
          guessedIds={guessedIds}
          onGuess={handleGuess}
        />
      )}

      <GameOver state={gameState} />

      <div className="bottom-buttons">
        <Settings />
        <button className="bottom-btn" onClick={handleReset}>
          Reset
        </button>
        <button className="bottom-btn" onClick={handleNewStation}>
          New station
        </button>
      </div>

      <footer className="app-footer">
        <p>
          Built by <a href="https://github.com/olane">Oli</a>. Inspired heavily
          by <a href="https://loconundrum.aaronc.cc/">Loconundrum</a>.
        </p>
        <p>
          Powered by TfL Open Data. Contains OS data &copy; Crown copyright and
          database rights 2016 and Geomni UK Map data &copy; and database rights
          [2019].
        </p>
      </footer>
    </div>
  );
}

export default App;
