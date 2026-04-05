import { useState } from 'react';

/**
 * MidVote — Mid-game suspicion checkpoint.
 *
 * Triggered automatically when all Red cards are done, before Black begins.
 * Each player privately selects one person they suspect right now.
 * Results are sealed — not shown until the final Results screen,
 * where they're compared against the final vote.
 */
export default function MidVote({ players, onComplete }) {
  const [step, setStep] = useState('intro');   // 'intro' | 'pass' | 'vote'
  const [voterIndex, setVoterIndex] = useState(0);
  const [suspicions, setSuspicions] = useState([]); // [playerIndex, ...]

  const voter = players[voterIndex];

  const handleBegin = () => setStep('pass');

  const handlePassReady = () => setStep('vote');

  const handleVote = (targetIndex) => {
    const next = [...suspicions, targetIndex];

    if (voterIndex + 1 >= players.length) {
      onComplete(next);
    } else {
      setSuspicions(next);
      setVoterIndex(voterIndex + 1);
      setStep('pass');
    }
  };

  // ─── Intro screen ───
  if (step === 'intro') {
    return (
      <div className="screen screen--midvote-intro">
        <div className="midvote-intro-content">
          <div className="midvote-eyebrow">Checkpoint</div>
          <h2 className="midvote-title">Halfway Through.</h2>
          <p className="midvote-desc">
            Before the final round — each person privately records who they
            suspect right now.
          </p>
          <p className="midvote-desc midvote-desc--muted">
            Your answer is sealed. No one sees it until the very end,
            where it's compared to your final vote.
          </p>
          <p className="midvote-desc midvote-desc--muted">
            Did the game change your mind?
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleBegin}>
          Begin
        </button>
      </div>
    );
  }

  // ─── Pass screen ───
  if (step === 'pass') {
    return (
      <div className="screen screen--midvote-pass">
        <div className="midvote-pass-content">
          <div className="midvote-eyebrow">Mid-game Read</div>
          <p className="midvote-pass-prompt">Pass to</p>
          <div className="midvote-pass-name">{voter.name}</div>
          <p className="midvote-pass-note">Don't show anyone. This is just for you.</p>
        </div>
        <button className="btn btn--primary" onClick={handlePassReady}>
          I'm ready
        </button>
      </div>
    );
  }

  // ─── Vote screen ───
  return (
    <div className="screen screen--midvote-vote">
      <div className="midvote-vote-header">
        <div className="midvote-eyebrow">{voter.name}</div>
        <h2 className="midvote-vote-question">
          Right now — who are you most suspicious of?
        </h2>
        <p className="midvote-vote-note">This is sealed until the end.</p>
      </div>
      <div className="midvote-vote-options">
        {players.map((p, i) => {
          if (p === voter) return null;
          return (
            <button
              key={i}
              className="midvote-vote-option"
              onClick={() => handleVote(i)}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
