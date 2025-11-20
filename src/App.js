import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import confetti from "canvas-confetti";

// Helper to load state from local storage
const loadState = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

export default function App() {

  // Match State
  const [innings, setInnings] = useState(() => loadState("innings", 1));
  const [totalOvers, setTotalOvers] = useState(() => loadState("totalOvers", 5));
  const [matchStarted, setMatchStarted] = useState(() => loadState("matchStarted", false));

  // Team Names
  const [teamA, setTeamA] = useState(() => loadState("teamA", "Team A"));
  const [teamB, setTeamB] = useState(() => loadState("teamB", "Team B"));
  const [battingFirst, setBattingFirst] = useState(() => loadState("battingFirst", "Team A"));

  // Theme
  const [dark, setDark] = useState(() => loadState("dark", false));

  // Score State
  const [runs, setRuns] = useState(() => loadState("runs", 0));
  const [wickets, setWickets] = useState(() => loadState("wickets", 0));
  const [balls, setBalls] = useState(() => loadState("balls", 0));

  // History
  const [ballHistory, setBallHistory] = useState(() => loadState("ballHistory", []));
  const [overHistory, setOverHistory] = useState(() => loadState("overHistory", []));

  // Result
  const [matchResult, setMatchResult] = useState(() => loadState("matchResult", ""));
  const [lastMatch, setLastMatch] = useState(() => loadState("lastMatch", null));

  // Animation state
  const [actionAnimation, setActionAnimation] = useState(null);
  const [tossing, setTossing] = useState(false);

  // Innings Score
  const [target, setTarget] = useState(() => loadState("target", null));
  const [innings1Score, setInnings1Score] = useState(() => loadState("innings1Score", { runs: null, wickets: null, overs: null }));
  const [innings2Score, setInnings2Score] = useState(() => loadState("innings2Score", { runs: null, wickets: null, overs: null }));

  const maxBalls = totalOvers * 6;
  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;

  // Derived State for Current Batting Team
  const currentBattingTeam = innings === 1 ? battingFirst : (battingFirst === teamA ? teamB : teamA);
  const currentBowlingTeam = currentBattingTeam === teamA ? teamB : teamA;

  // Save State to Local Storage
  useEffect(() => {
    localStorage.setItem("innings", JSON.stringify(innings));
    localStorage.setItem("totalOvers", JSON.stringify(totalOvers));
    localStorage.setItem("matchStarted", JSON.stringify(matchStarted));
    localStorage.setItem("teamA", JSON.stringify(teamA));
    localStorage.setItem("teamB", JSON.stringify(teamB));
    localStorage.setItem("battingFirst", JSON.stringify(battingFirst));
    localStorage.setItem("dark", JSON.stringify(dark));
    localStorage.setItem("runs", JSON.stringify(runs));
    localStorage.setItem("wickets", JSON.stringify(wickets));
    localStorage.setItem("balls", JSON.stringify(balls));
    localStorage.setItem("ballHistory", JSON.stringify(ballHistory));
    localStorage.setItem("overHistory", JSON.stringify(overHistory));
    localStorage.setItem("matchResult", JSON.stringify(matchResult));
    localStorage.setItem("lastMatch", JSON.stringify(lastMatch));
    localStorage.setItem("target", JSON.stringify(target));
    localStorage.setItem("innings1Score", JSON.stringify(innings1Score));
    localStorage.setItem("innings2Score", JSON.stringify(innings2Score));
  }, [innings, totalOvers, matchStarted, teamA, teamB, battingFirst, dark, runs, wickets, balls, ballHistory, overHistory, matchResult, lastMatch, target, innings1Score, innings2Score]);

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

    // Trigger animations for boundaries
    if (r === 4) {
      setActionAnimation('four');
    } else if (r === 6) {
      setActionAnimation('six');
    }
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

    // Trigger wicket animation
    setActionAnimation('wicket');
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
      const chasingTeam = currentBattingTeam;
      const defendingTeam = currentBowlingTeam;

      if (runs >= target) result = `${chasingTeam} WON by ${10 - wickets} wickets`;
      else if (runs === target - 1) result = "MATCH TIED";
      else result = `${defendingTeam} WON by ${target - runs - 1} runs`;

      setMatchResult(result);
      if (result !== "MATCH TIED") triggerConfetti();
    }
  };

  // Trigger Confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Auto-WIN
  useEffect(() => {
    if (innings === 2 && target) {
      const chasingTeam = currentBattingTeam;
      const defendingTeam = currentBowlingTeam;

      if (runs >= target) {
        setMatchResult(`${chasingTeam} WON by ${10 - wickets} wickets`);
        triggerConfetti();
      }
      if (balls === maxBalls) {
        if (runs === target - 1) {
          if (runs === target - 1) {
            setMatchResult("MATCH TIED");
          } else if (runs < target - 1) {
            setMatchResult(`${defendingTeam} WON by ${target - runs - 1} runs`);
            triggerConfetti();
          }
        }
      }
    }
  }, [runs, balls, innings, target, maxBalls, wickets, currentBattingTeam, currentBowlingTeam]);

  // Prevent Accidental Exit
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (matchStarted && !matchResult) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [matchStarted, matchResult]);

  // Clear animation after it plays
  useEffect(() => {
    if (actionAnimation) {
      const duration = actionAnimation === 'wicket' ? 4000 : 1000;
      const timer = setTimeout(() => {
        setActionAnimation(null);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [actionAnimation]);

  // Reset
  const resetMatch = () => {
    // Save last match details
    if (matchResult) {
      setLastMatch({
        result: matchResult,
        teamA,
        teamB,
        scores: {
          inn1: innings1Score,
          inn2: innings2Score
        },
        battingFirst
      });
    }

    // Reset Game State
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

  const startSuperOver = () => {
    resetMatch();
    setTotalOvers(1);
    setMatchStarted(true);
  };

  const resolveByToss = () => {
    setTossing(true);
    setTimeout(() => {
      const winner = Math.random() > 0.5 ? teamA : teamB;
      setMatchResult(`${winner} WON by Coin Toss`);
      setTossing(false);
      triggerConfetti();
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
              <span>{battingFirst} (Inn 1)</span>
              <span>{innings1Score.runs}/{innings1Score.wickets} ({innings1Score.overs})</span>
            </div>

            {innings2Score.runs !== null && (
              <div className="summary-row">
                <span>{battingFirst === teamA ? teamB : teamA} (Inn 2)</span>
                <span>{innings2Score.runs}/{innings2Score.wickets} ({innings2Score.overs})</span>
              </div>
            )}
          </div>
        )}

        {/* START SCREEN */}
        {!matchStarted && (
          <div className="premium-card text-center">
            <h4 className="fw-bold mb-3">Match Setup</h4>

            {/* LAST MATCH DETAILS */}
            {lastMatch && (
              <div className="alert alert-secondary mb-4 text-start">
                <h6 className="fw-bold mb-2">Last Match Result:</h6>
                <p className="mb-1 fw-bold text-success">{lastMatch.result}</p>
                <small className="d-block text-muted">
                  {lastMatch.battingFirst}: {lastMatch.scores.inn1.runs}/{lastMatch.scores.inn1.wickets} ({lastMatch.scores.inn1.overs})
                </small>
                {lastMatch.scores.inn2.runs !== null && (
                  <small className="d-block text-muted">
                    {lastMatch.battingFirst === lastMatch.teamA ? lastMatch.teamB : lastMatch.teamA}: {lastMatch.scores.inn2.runs}/{lastMatch.scores.inn2.wickets} ({lastMatch.scores.inn2.overs})
                  </small>
                )}
              </div>
            )}

            <div className="mb-3 text-start">
              <label className="form-label small text-muted">Overs</label>
              <input
                type="number"
                className="form-control input-premium"
                value={totalOvers}
                min="1"
                onChange={(e) => setTotalOvers(Number(e.target.value))}
              />
            </div>

            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label small text-muted">Team A Name</label>
                <input
                  type="text"
                  className="form-control input-premium"
                  value={teamA}
                  onChange={(e) => {
                    setTeamA(e.target.value);
                    if (battingFirst === teamA) setBattingFirst(e.target.value);
                  }}
                />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted">Team B Name</label>
                <input
                  type="text"
                  className="form-control input-premium"
                  value={teamB}
                  onChange={(e) => {
                    setTeamB(e.target.value);
                    if (battingFirst === teamB) setBattingFirst(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="mb-3 text-start">
              <label className="form-label small text-muted">Who Bats First?</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="battingFirst"
                    id="batFirstA"
                    checked={battingFirst === teamA}
                    onChange={() => setBattingFirst(teamA)}
                  />
                  <label className="form-check-label" htmlFor="batFirstA">
                    {teamA}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="battingFirst"
                    id="batFirstB"
                    checked={battingFirst === teamB}
                    onChange={() => setBattingFirst(teamB)}
                  />
                  <label className="form-check-label" htmlFor="batFirstB">
                    {teamB}
                  </label>
                </div>
              </div>
            </div>

            <button className="btn btn-dark w-100" onClick={() => setMatchStarted(true)}>
              Start Match
            </button>
          </div>
        )}

        {/* MAIN UI */}
        {matchStarted && !matchResult && (
          <>
            {/* ANIMATION OVERLAY */}
            {actionAnimation && (
              <div className={`action-animation-overlay ${actionAnimation}`}>
                <div className="action-animation-content">
                  {actionAnimation === 'six' && (
                    <>
                      <div className="animation-emoji">🏏</div>
                      <div className="animation-text">SIX!</div>
                      <div className="animation-subtext">Maximum!</div>
                    </>
                  )}
                  {actionAnimation === 'four' && (
                    <>
                      <div className="animation-emoji">⚡</div>
                      <div className="animation-text">FOUR!</div>
                      <div className="animation-subtext">Boundary!</div>
                    </>
                  )}
                  {actionAnimation === 'wicket' && (
                    <>
                      <div className="animation-emoji">🦆</div>
                      <div className="animation-subtext">OUT!</div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="premium-card text-center mb-3">
              <h4 className="mb-2 text-muted">{currentBattingTeam} Batting</h4>
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
