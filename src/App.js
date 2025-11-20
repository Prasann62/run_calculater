import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

export default function App() {

  // Match State
  const [innings, setInnings] = useState(1);
  const [totalOvers, setTotalOvers] = useState(5);
  const [matchStarted, setMatchStarted] = useState(false);

  // Theme
  const [dark, setDark] = useState(false);

  // Score State
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);

  // History
  const [ballHistory, setBallHistory] = useState([]);
  const [overHistory, setOverHistory] = useState([]);

  // Result
  const [matchResult, setMatchResult] = useState("");

  // Innings Score
  const [target, setTarget] = useState(null);
  const [innings1Score, setInnings1Score] = useState({ runs: null, wickets: null, overs: null });
  const [innings2Score, setInnings2Score] = useState({ runs: null, wickets: null, overs: null });

  const maxBalls = totalOvers * 6;
  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;

  // RECORD BALL — FIXED (NO DUPLICATE RUNS & IMMUTABLE UPDATES)
  const recordBall = (action, run, legal = true) => {
    setOverHistory(prev => {
      // FIX: Use current 'balls' state to determine the over index.
      const overIndex = Math.floor(balls / 6);

      const updated = [...prev];

      if (!updated[overIndex]) {
        updated[overIndex] = { over: overIndex + 1, runs: 0, balls: [] };
      } else {
        // IMMUTABLE UPDATE: Copy the object and the balls array
        updated[overIndex] = {
          ...updated[overIndex],
          balls: [...updated[overIndex].balls]
        };
      }

      updated[overIndex].runs += run;
      updated[overIndex].balls.push(action);

      return updated;
    });

    setBallHistory(prev => [...prev, { action, run, legal }]);
  };

  // Add Run
  const addRun = (r) => {
    if (matchResult || balls >= maxBalls) return;
    setRuns(prev => prev + r);
    setBalls(prev => prev + 1);
    recordBall(String(r), r, true);
  };

  // Extra
  const addExtra = (type, r) => {
    if (matchResult) return;
    setRuns(prev => prev + r);
    recordBall(type, r, false);
  };

  // Wicket
  const fallWicket = () => {
    if (matchResult || balls >= maxBalls) return;
    setWickets(prev => prev + 1);
    setBalls(prev => prev + 1);
    recordBall("W", 0, true);
  };

  // Undo (Safe & Immutable)
  const undo = () => {
    if (ballHistory.length === 0) return;

    const last = ballHistory[ballHistory.length - 1];

    setBallHistory(prev => prev.slice(0, -1));
    setRuns(prev => prev - last.run);

    if (last.action === "W") {
      setWickets(prev => prev - 1);
    }
    if (last.legal) {
      setBalls(prev => prev - 1);
    }

    setOverHistory(prev => {
      // IMMUTABLE UPDATE: Deep copy relevant parts
      const updated = prev.map(o => ({ ...o, balls: [...o.balls] }));

      let idx = updated.length - 1;
      while (idx >= 0 && updated[idx].balls.length === 0) idx--;

      if (idx >= 0) {
        updated[idx].balls.pop();
        updated[idx].runs -= last.run;

        if (updated[idx].balls.length === 0 && updated[idx].runs === 0 && idx > 0) {
          updated.splice(idx, 1);
        }
      }
      return updated;
    });
  };

  // End Innings
  const endInnings = () => {
    if (innings === 1) {
      setInnings1Score({ runs, wickets, overs });
      setTarget(runs + 1);

      setInnings(2);
      setRuns(0);
      setWickets(0);
      setBalls(0);
      setBallHistory([]);
      setOverHistory([]);
    } else {
      setInnings2Score({ runs, wickets, overs });

      let result = "";
      if (runs >= target) result = `Team B WON by ${10 - wickets} wickets`;
      else if (runs === target - 1) result = "MATCH TIED";
      else result = `Team A WON by ${target - runs - 1} runs`;

      setMatchResult(result);
    }
  };

  // Auto-WIN
  useEffect(() => {
    if (innings === 2 && target) {
      if (runs >= target) {
        setMatchResult(`Team B WON by ${10 - wickets} wickets`);
      }
      if (balls === maxBalls) {
        if (runs === target - 1) {
          setMatchResult("MATCH TIED");
        } else if (runs < target - 1) {
          setMatchResult(`Team A WON by ${target - runs - 1} runs`);
        }
      }
    }
  }, [runs, balls]);

// Reset
const resetMatch = () => {
  setRuns(0);
  setWickets(0);
  setBalls(0);
  setBallHistory([]);
  setOverHistory([]);
  setTarget(null);
  setMatchResult("");
  setMatchStarted(false);
  setInnings(1);
  setInnings1Score({ runs: null, wickets: null, overs: null });
  setInnings2Score({ runs: null, wickets: null, overs: null });
};

// Tie Breakers
const [tossing, setTossing] = useState(false);

const startSuperOver = () => {
  resetMatch();
  setTotalOvers(1);
  setMatchStarted(true);
};

const resolveByToss = () => {
  setTossing(true);
  setTimeout(() => {
    const winner = Math.random() > 0.5 ? "Team A" : "Team B";
    setMatchResult(`${winner} WON by Coin Toss`);
    setTossing(false);
  }, 3000); // Wait for 3s animation
};

return (
  <div className={dark ? "dark-theme" : "light-theme"}>
    <div className="container py-4">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="app-title">Cricket Score</h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setDark(!dark)}>
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* SCOREBOARD SUMMARY */}
      {(innings1Score.runs !== null || innings2Score.runs !== null) && (
        <div className="premium-card mb-4">
          <h5 className="fw-bold mb-3">Match Summary</h5>

          <div className="summary-row">
            <span>Innings 1</span>
            <span>{innings1Score.runs}/{innings1Score.wickets} ({innings1Score.overs})</span>
          </div>

          {innings2Score.runs !== null && (
            <div className="summary-row">
              <span>Innings 2</span>
              <span>{innings2Score.runs}/{innings2Score.wickets} ({innings2Score.overs})</span>
            </div>
          )}
        </div>
      )}

      {/* START SCREEN */}
      {!matchStarted && (
        <div className="premium-card text-center">
          <h4 className="fw-bold mb-3">Match Setup</h4>

          <input
            type="number"
            className="form-control mb-3 input-premium"
            value={totalOvers}
            min="1"
            onChange={(e) => setTotalOvers(Number(e.target.value))}
          />

          <button className="btn btn-dark w-100" onClick={() => setMatchStarted(true)}>
            Start Match
          </button>
        </div>
      )}

      {/* MAIN UI */}
      {matchStarted && !matchResult && (
        <>
          <div className="premium-card text-center mb-3">
            <h2 className="score-text">{runs} / {wickets}</h2>
            <p className="overs-text">Overs: {overs} / {totalOvers}</p>

            {innings === 2 && (
              <p className="need-text">
                Need {target - runs} runs in {maxBalls - balls} balls
              </p>
            )}
          </div>

          {/* RUN BUTTONS */}
          <div className="d-flex justify-content-center flex-wrap gap-2 mb-3">
            {[0, 1, 2, 3, 4, 6].map(n => (
              <button key={n} className="btn premium-btn" onClick={() => addRun(n)}>
                {n}
              </button>
            ))}
          </div>

          {/* EXTRAS */}
          <div className="d-flex justify-content-center flex-wrap gap-2 mb-3">
            <button className="btn premium-btn-yellow" onClick={() => addExtra("Wd", 1)}>Wide</button>
            <button className="btn premium-btn-yellow" onClick={() => addExtra("NB", 1)}>No Ball</button>
            <button className="btn premium-btn-red" onClick={fallWicket}>Wicket</button>
          </div>

          {/* CONTROLS */}
          <div className="d-flex justify-content-center gap-2 mb-3">
            <button className="btn premium-btn-grey" onClick={undo}>Undo</button>
            <button className="btn premium-btn-green" onClick={endInnings}>
              {innings === 1 ? "End Innings" : "Finish Match"}
            </button>
          </div>

          {/* OVER SUMMARY */}
          <h4 className="fw-bold mb-2">Overs</h4>
          {overHistory.map((o, i) => (
            <div className="over-premium mb-2" key={i}>
              <strong>Over {o.over}</strong> — {o.runs} runs

              <div className="mt-2">
                {o.balls.map((b, index) => (
                  <span
                    key={index}
                    className={
                      b === "6" ? "ball-tag ball6" :
                        b === "4" ? "ball-tag ball4" :
                          b === "W" ? "ball-tag ballW" :
                            "ball-tag ballN"
                    }
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* WINNER SCREEN */}
      {matchResult && (
        <div className="premium-card text-center">
          {!tossing && <div className="win-circle mb-3"></div>}

          {tossing ? (
            <div className="coin-container">
              <div className={`coin ${tossing ? "spinning" : ""}`}>
                <div className="coin-face heads">HEADS</div>
                <div className="coin-face tails">TAILS</div>
              </div>
            </div>
          ) : (
            <h2 className="text-success">{matchResult}</h2>
          )}

          {matchResult === "MATCH TIED" && !tossing ? (
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-primary w-50" onClick={startSuperOver}>
                Super Over
              </button>
              <button className="btn btn-warning w-50" onClick={resolveByToss}>
                Coin Toss
              </button>
            </div>
          ) : !tossing && (
            <button className="btn btn-dark w-100 mt-3" onClick={resetMatch}>
              Start New Match
            </button>
          )}
        </div>
      )}

    </div>
  </div>
);
}
