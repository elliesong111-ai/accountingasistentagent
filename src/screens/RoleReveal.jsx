import { useState } from 'react';

export default function RoleReveal({ players, onComplete }) {
  const [step, setStep] = useState(0); // 0..3: pass prompt, 4..7: role shown
  // step 0-3: "pass to player N" screen
  // step 4-7: role screen for player N-4

  const totalSteps = players.length * 2;
  const isPassScreen = step % 2 === 0;
  const playerIndex = Math.floor(step / 2);
  const player = players[playerIndex];

  const handleNext = () => {
    if (step + 1 >= totalSteps) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  if (isPassScreen) {
    return (
      <div className="screen screen--role-pass">
        <div className="role-pass-content">
          <div className="role-pass-icon">🤫</div>
          <h2 className="role-pass-title">Pass the phone to</h2>
          <div className="role-pass-name">{player.name}</div>
          <p className="role-pass-note">Don't show anyone else.</p>
        </div>
        <button className="btn btn--primary" onClick={handleNext}>
          I'm ready
        </button>
      </div>
    );
  }

  const { role } = player;

  return (
    <div className="screen screen--role-reveal">
      <div className="role-reveal-content">
        <div className="role-badge">{role.name}</div>
        <p className="role-description">{role.description}</p>
        <div className="role-divider" />
        <div className="role-goal-label">YOUR GOAL</div>
        <p className="role-goal">{role.goal}</p>
        <div className="role-hint-label">REMEMBER</div>
        <p className="role-hint">{role.hint}</p>
      </div>
      <button className="btn btn--ghost" onClick={handleNext}>
        Got it →
      </button>
    </div>
  );
}
