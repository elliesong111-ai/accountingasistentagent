import { PHASE_META } from '../game/engine';

export default function PromptCard({
  card,
  cardNumber,
  totalCards,
  currentPlayer,
  players,
  onNext,
  isLast,
}) {
  const meta = PHASE_META[card.phase];

  const targetLabel = () => {
    if (card.target === 'all') return 'Everyone';
    if (card.target === 'pair') {
      // pick two random players (different from current)
      return `${currentPlayer.name} + one other`;
    }
    return currentPlayer.name;
  };

  return (
    <div
      className="screen screen--prompt"
      style={{ '--phase-color': meta.color, '--phase-text': meta.textColor }}
    >
      <div className="prompt-top">
        <div className="prompt-phase-dot" />
        <div className="prompt-meta">
          <span className="prompt-type">{card.type}</span>
          <span className="prompt-progress">{cardNumber} / {totalCards}</span>
        </div>
      </div>

      <div className="prompt-body">
        <div className="prompt-target">{targetLabel()}</div>
        <p className="prompt-text">{card.text}</p>
      </div>

      <div className="prompt-footer">
        <div className="prompt-players">
          {players.map((p, i) => (
            <div
              key={i}
              className={`prompt-player-chip ${p === currentPlayer ? 'active' : ''}`}
            >
              {p.name}
            </div>
          ))}
        </div>
        <button className="btn btn--primary" onClick={onNext}>
          {isLast ? 'Final Vote →' : 'Next Card →'}
        </button>
      </div>
    </div>
  );
}
