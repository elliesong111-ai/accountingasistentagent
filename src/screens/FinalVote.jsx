import { useState } from 'react';

export default function FinalVote({ players, onComplete }) {
  // Each of the 4 voters submits two votes
  const [voterIndex, setVoterIndex] = useState(0);
  const [showingFor, setShowingFor] = useState('pass'); // 'pass' | 'real' | 'suspicious'
  const [realVotes, setRealVotes] = useState([]);
  const [suspiciousVotes, setSuspiciousVotes] = useState([]);
  const [pendingReal, setPendingReal] = useState(null);

  const voter = players[voterIndex];

  const handlePassReady = () => setShowingFor('real');

  const handleRealVote = (idx) => {
    setPendingReal(idx);
    setShowingFor('suspicious');
  };

  const handleSuspiciousVote = (idx) => {
    const newReal = [...realVotes, pendingReal];
    const newSuspicious = [...suspiciousVotes, idx];

    if (voterIndex + 1 >= players.length) {
      onComplete({ mostReal: newReal, mostSuspicious: newSuspicious });
    } else {
      setRealVotes(newReal);
      setSuspiciousVotes(newSuspicious);
      setPendingReal(null);
      setVoterIndex(voterIndex + 1);
      setShowingFor('pass');
    }
  };

  if (showingFor === 'pass') {
    return (
      <div className="screen screen--vote-pass">
        <div className="vote-pass-content">
          <div className="vote-eyebrow">Final Vote</div>
          <h2 className="vote-pass-title">Pass to</h2>
          <div className="vote-pass-name">{voter.name}</div>
          <p className="vote-pass-note">Your vote is private. Don't show anyone.</p>
        </div>
        <button className="btn btn--primary" onClick={handlePassReady}>
          I'm ready
        </button>
      </div>
    );
  }

  if (showingFor === 'real') {
    return (
      <div className="screen screen--vote">
        <div className="vote-header">
          <div className="vote-eyebrow">{voter.name}'s vote</div>
          <h2 className="vote-question">Who felt most real tonight?</h2>
        </div>
        <div className="vote-options">
          {players.map((p, i) => {
            if (p === voter) return null;
            return (
              <button key={i} className="vote-option" onClick={() => handleRealVote(i)}>
                {p.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="screen screen--vote">
      <div className="vote-header">
        <div className="vote-eyebrow">{voter.name}'s vote</div>
        <h2 className="vote-question">Who felt most suspicious?</h2>
      </div>
      <div className="vote-options">
        {players.map((p, i) => {
          if (p === voter) return null;
          return (
            <button key={i} className="vote-option vote-option--suspicious" onClick={() => handleSuspiciousVote(i)}>
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
