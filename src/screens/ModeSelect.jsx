export default function ModeSelect({ onSelect, onBack }) {
  return (
    <div className="screen screen--mode">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="screen-header">
        <h2 className="screen-title">Choose Your Session</h2>
        <p className="screen-subtitle">How much time do you have?</p>
      </div>

      <div className="mode-cards">
        <button className="mode-card" onClick={() => onSelect('quick')}>
          <div className="mode-card-time">~ 5 min</div>
          <div className="mode-card-name">Quick Test</div>
          <div className="mode-card-desc">
            10 cards · all 5 phases · good for a first game or a quick round
          </div>
          <div className="mode-card-arrow">→</div>
        </button>

        <button className="mode-card" onClick={() => onSelect('mini')}>
          <div className="mode-card-time">~ 30 min</div>
          <div className="mode-card-name">Mini Session</div>
          <div className="mode-card-desc">
            35 cards · deeper prompts · role pressure builds over time
          </div>
          <div className="mode-card-arrow">→</div>
        </button>
      </div>

      <p className="mode-note">The real game happens between people, not on the screen.</p>
    </div>
  );
}
