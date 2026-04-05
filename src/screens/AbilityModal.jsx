import { useState } from 'react';
import { ABILITY_TYPES } from '../game/engine';

/**
 * AbilityModal
 *
 * Rendered as a full-screen overlay on top of PromptCard.
 * Handles all 4 ability flows:
 *   SKIP      — one confirmation screen, then fires onSkip
 *   CHALLENGE — player picker, then fires onChallenge(targetIndex)
 *   REDIRECT  — player picker, then fires onRedirect(targetIndex)
 *   DECLARE   — one confirmation screen, then fires onDeclare
 */
export default function AbilityModal({
  currentPlayer,
  currentPlayerIndex,
  players,
  onSkip,
  onChallenge,
  onRedirect,
  onDeclare,
  onCancel,
}) {
  const ability = currentPlayer.role.ability;
  const [step, setStep] = useState('confirm'); // 'confirm' | 'pick_target'

  const needsTarget =
    ability.type === ABILITY_TYPES.CHALLENGE || ability.type === ABILITY_TYPES.REDIRECT;

  const handleConfirm = () => {
    if (needsTarget) {
      setStep('pick_target');
    } else if (ability.type === ABILITY_TYPES.SKIP) {
      onSkip();
    } else if (ability.type === ABILITY_TYPES.DECLARE) {
      onDeclare();
    }
  };

  const handleTargetPick = (targetIndex) => {
    if (ability.type === ABILITY_TYPES.CHALLENGE) {
      onChallenge(targetIndex);
    } else {
      onRedirect(targetIndex);
    }
  };

  // ─── Confirm screen ───
  if (step === 'confirm') {
    return (
      <div className="ability-overlay">
        <div className="ability-modal">
          <button className="ability-cancel" onClick={onCancel}>✕</button>

          <div className="ability-modal-role">{currentPlayer.name}</div>
          <div className={`ability-modal-name ability-name--${currentPlayer.roleId}`}>
            {ability.name}
          </div>
          <p className="ability-modal-desc">{ability.fullDesc}</p>

          <div className="ability-modal-warning">
            Once used, this ability is gone for the rest of the game.
          </div>

          <button className="btn btn--primary ability-confirm-btn" onClick={handleConfirm}>
            {needsTarget ? 'Choose Target →' : 'Activate'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Target picker screen ───
  return (
    <div className="ability-overlay">
      <div className="ability-modal">
        <button className="ability-cancel" onClick={onCancel}>✕</button>

        <div className={`ability-modal-name ability-name--${currentPlayer.roleId}`}>
          {ability.name}
        </div>
        <p className="ability-modal-pick-label">
          {ability.type === ABILITY_TYPES.CHALLENGE
            ? 'Who do you want to challenge?'
            : 'Who takes this card instead?'}
        </p>

        <div className="ability-target-list">
          {players.map((p, i) => {
            if (i === currentPlayerIndex) return null;
            return (
              <button
                key={i}
                className="ability-target-option"
                onClick={() => handleTargetPick(i)}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
