import { evaluateWinners } from '../game/engine';

export default function Results({ players, votes, onPlayAgain, onEnd }) {
  const { winners, mostRealIdx, mostSuspiciousIdx, realTally, suspiciousTally } =
    evaluateWinners(players, votes);

  return (
    <div className="screen screen--results">
      <div className="results-header">
        <h2 className="results-title">The Truth</h2>
        <p className="results-subtitle">Roles revealed. Scores settled.</p>
      </div>

      <div className="results-section">
        <div className="results-section-label">VOTE RESULTS</div>
        <div className="results-vote-row">
          <span className="results-vote-label">Most Real</span>
          <span className="results-vote-name">{players[mostRealIdx]?.name ?? '—'}</span>
        </div>
        <div className="results-vote-row">
          <span className="results-vote-label">Most Suspicious</span>
          <span className="results-vote-name suspicious">{players[mostSuspiciousIdx]?.name ?? '—'}</span>
        </div>
      </div>

      <div className="results-section">
        <div className="results-section-label">ROLES REVEALED</div>
        {players.map((p, i) => (
          <div key={i} className="results-player-row">
            <span className="results-player-name">{p.name}</span>
            <span className={`results-role-badge role--${p.roleId}`}>{p.role.name}</span>
          </div>
        ))}
      </div>

      {winners.length > 0 ? (
        <div className="results-section">
          <div className="results-section-label">WINNERS</div>
          {winners.map((w, i) => (
            <div key={i} className="results-winner-row">
              <span className="results-winner-name">{w.player.name}</span>
              <span className="results-winner-reason">{w.reason}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="results-section">
          <p className="results-no-winner">No clear winner tonight. That's fine. Some games are like that.</p>
        </div>
      )}

      <div className="results-footer">
        <button className="btn btn--ghost" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn btn--text" onClick={onEnd}>
          End Session
        </button>
      </div>
    </div>
  );
}
