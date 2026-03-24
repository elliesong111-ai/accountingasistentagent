import { useState } from 'react';

export default function PlayerSetup({ onStart, onBack }) {
  const [names, setNames] = useState(['', '', '', '']);

  const updateName = (i, val) => {
    const next = [...names];
    next[i] = val;
    setNames(next);
  };

  const allFilled = names.every((n) => n.trim().length > 0);

  return (
    <div className="screen screen--setup">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="screen-header">
        <h2 className="screen-title">Who's Playing?</h2>
        <p className="screen-subtitle">4 players. Enter everyone's name.</p>
      </div>

      <div className="player-inputs">
        {names.map((name, i) => (
          <div key={i} className="player-input-row">
            <span className="player-number">{i + 1}</span>
            <input
              className="player-input"
              type="text"
              placeholder={`Player ${i + 1}`}
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              maxLength={16}
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      <div className="setup-footer">
        <p className="setup-note">Roles are assigned secretly. No one else will see your role.</p>
        <button
          className="btn btn--primary"
          disabled={!allFilled}
          onClick={() => onStart(names.map((n) => n.trim()))}
        >
          Deal Roles
        </button>
      </div>
    </div>
  );
}
