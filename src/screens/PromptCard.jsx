import { useState } from 'react';
import { PHASE_META, ABILITY_TYPES } from '../game/engine';
import AbilityModal from './AbilityModal';

export default function PromptCard({
  card,
  cardNumber,
  totalCards,
  currentPlayer,
  currentPlayerIndex,
  players,
  onNext,
  isLast,
  abilityUsed,
  redirectedTarget,
  declareActive,
  onAbilitySkip,
  onAbilityChallenge,
  onAbilityRedirect,
  onAbilityDeclare,
}) {
  const [showAbilityModal, setShowAbilityModal] = useState(false);
  const meta = PHASE_META[card.phase];
  const ability = currentPlayer.role.ability;

  // Determine effective target player
  const effectiveTarget = () => {
    // After REDIRECT, card now targets the redirected player
    if (redirectedTarget !== null && ability.type === ABILITY_TYPES.REDIRECT) {
      return players[redirectedTarget];
    }
    // After CHALLENGE, the challenge is addressed to the chosen player
    if (redirectedTarget !== null && ability.type === ABILITY_TYPES.CHALLENGE) {
      return players[redirectedTarget];
    }
    if (card.target === 'all') return null; // everyone
    if (card.target === 'pair') return null;
    return currentPlayer;
  };

  const targetPlayer = effectiveTarget();

  const targetLabel = () => {
    if (redirectedTarget !== null) {
      const t = players[redirectedTarget];
      if (ability.type === ABILITY_TYPES.CHALLENGE) return `${t.name} — CHALLENGED`;
      return `${t.name} — REDIRECTED`;
    }
    if (card.target === 'all') return 'Everyone';
    if (card.target === 'pair') return `${currentPlayer.name} + one other`;
    return currentPlayer.name;
  };

  const showAbilityButton = !abilityUsed && redirectedTarget === null && !declareActive;

  return (
    <div
      className="screen screen--prompt"
      style={{ '--phase-color': meta.color, '--phase-text': meta.textColor }}
    >
      {/* DECLARE banner — shown after Loyal activates their ability */}
      {declareActive && (
        <div className="declare-banner">
          <span className="declare-banner-label">DECLARED</span>
          <span className="declare-banner-text">
            {currentPlayer.name} swears the next thing they say is the truth.
          </span>
        </div>
      )}

      <div className="prompt-top">
        <div className="prompt-phase-dot" />
        <div className="prompt-meta">
          <span className="prompt-type">
            {/* Show special type label when ability is in effect */}
            {redirectedTarget !== null && ability.type === ABILITY_TYPES.CHALLENGE
              ? 'CHALLENGE'
              : redirectedTarget !== null && ability.type === ABILITY_TYPES.REDIRECT
              ? 'REDIRECTED'
              : card.type}
          </span>
          <span className="prompt-progress">{cardNumber} / {totalCards}</span>
        </div>
      </div>

      <div className="prompt-body">
        <div className={`prompt-target ${redirectedTarget !== null ? 'prompt-target--ability' : ''}`}>
          {targetLabel()}
        </div>

        {/* Challenge mode shows a different prompt */}
        {redirectedTarget !== null && ability.type === ABILITY_TYPES.CHALLENGE ? (
          <p className="prompt-text">
            {currentPlayer.name} asks you one question — directly, out loud, right now.
            You must answer.
          </p>
        ) : (
          <p className="prompt-text">{card.text}</p>
        )}
      </div>

      <div className="prompt-footer">
        {/* Player chips */}
        <div className="prompt-players">
          {players.map((p, i) => {
            const isActive = p === currentPlayer;
            const isRedirected = redirectedTarget === i;
            return (
              <div
                key={i}
                className={`prompt-player-chip ${isActive ? 'active' : ''} ${isRedirected ? 'redirected' : ''}`}
              >
                {p.name}
              </div>
            );
          })}
        </div>

        {/* Ability button — only shown if not yet used, no pending ability effect */}
        {showAbilityButton && (
          <button
            className={`btn btn--ability ability--${currentPlayer.roleId}`}
            onClick={() => setShowAbilityModal(true)}
          >
            Use Ability: {ability.name}
          </button>
        )}

        {/* Spent ability indicator */}
        {abilityUsed && (
          <div className="ability-spent">
            Ability used
          </div>
        )}

        <button className="btn btn--primary" onClick={onNext}>
          {isLast ? 'Final Vote →' : 'Next Card →'}
        </button>
      </div>

      {/* Ability modal overlay */}
      {showAbilityModal && (
        <AbilityModal
          currentPlayer={currentPlayer}
          currentPlayerIndex={currentPlayerIndex}
          players={players}
          onSkip={() => { setShowAbilityModal(false); onAbilitySkip(); }}
          onChallenge={(i) => { setShowAbilityModal(false); onAbilityChallenge(i); }}
          onRedirect={(i) => { setShowAbilityModal(false); onAbilityRedirect(i); }}
          onDeclare={() => { setShowAbilityModal(false); onAbilityDeclare(); }}
          onCancel={() => setShowAbilityModal(false)}
        />
      )}
    </div>
  );
}
