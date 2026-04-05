import { evaluateWinners } from '../game/engine';

export default function Results({ players, votes, midVotes, onPlayAgain, onEnd }) {
  const { winners, mostRealIdx, mostSuspiciousIdx } = evaluateWinners(players, votes);

  return (
    <div className="screen screen--results">
      <div className="results-header">
        <h2 className="results-title">The Truth</h2>
        <p className="results-subtitle">Roles revealed. Scores settled.</p>
      </div>

      {/* ── Vote results ── */}
      <div className="results-section">
        <div className="results-section-label">FINAL VOTE</div>
        <div className="results-vote-row">
          <span className="results-vote-label">Most Real</span>
          <span className="results-vote-name">{players[mostRealIdx]?.name ?? '—'}</span>
        </div>
        <div className="results-vote-row">
          <span className="results-vote-label">Most Suspicious</span>
          <span className="results-vote-name suspicious">
            {players[mostSuspiciousIdx]?.name ?? '—'}
          </span>
        </div>
      </div>

      {/* ── Mid-game reads vs final vote comparison ── */}
      {midVotes && midVotes.length > 0 && (
        <div className="results-section">
          <div className="results-section-label">MID-GAME READS</div>
          <p className="results-midvote-intro">
            Who each player suspected halfway through — and whether they changed their mind.
          </p>
          {players.map((voter, voterIdx) => {
            const midTarget = players[midVotes[voterIdx]];
            // Find this voter's final suspicious vote
            // votes.mostSuspicious is an array of each voter's pick, in voter order
            const finalTarget = players[votes.mostSuspicious[voterIdx]];
            const changed = midVotes[voterIdx] !== votes.mostSuspicious[voterIdx];

            return (
              <div key={voterIdx} className="results-midvote-row">
                <div className="results-midvote-voter">{voter.name}</div>
                <div className="results-midvote-picks">
                  <span className="results-midvote-pick">
                    Halfway: <strong>{midTarget?.name ?? '—'}</strong>
                  </span>
                  <span className="results-midvote-arrow">→</span>
                  <span className={`results-midvote-pick ${changed ? 'changed' : 'unchanged'}`}>
                    Final: <strong>{finalTarget?.name ?? '—'}</strong>
                  </span>
                  {changed && <span className="results-midvote-changed-badge">changed</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Role reveal ── */}
      <div className="results-section">
        <div className="results-section-label">ROLES REVEALED</div>
        {players.map((p, i) => (
          <div key={i} className="results-player-row">
            <span className="results-player-name">{p.name}</span>
            <span className={`results-role-badge role--${p.roleId}`}>{p.role.name}</span>
          </div>
        ))}
      </div>

      {/* ── Winners ── */}
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
          <p className="results-no-winner">
            No clear winner tonight. That's fine. Some games are like that.
          </p>
        </div>
      )}

      <div className="results-footer">
        <button className="btn btn--ghost" onClick={onPlayAgain}>Play Again</button>
        <button className="btn btn--text" onClick={onEnd}>End Session</button>
      </div>
    </div>
  );
}
