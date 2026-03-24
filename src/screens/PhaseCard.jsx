import { PHASE_META } from '../game/engine';

export default function PhaseCard({ phase, phaseNumber, totalPhases, onBegin }) {
  const meta = PHASE_META[phase];

  return (
    <div
      className="screen screen--phase"
      style={{ '--phase-color': meta.color, '--phase-text': meta.textColor }}
    >
      <div className="phase-card-content">
        <div className="phase-number">
          Phase {phaseNumber} / {totalPhases}
        </div>
        <div className="phase-label">{meta.label}</div>
        <div className="phase-mood">{meta.mood}</div>
        <p className="phase-subtitle">{meta.subtitle}</p>
      </div>
      <button className="btn btn--phase" onClick={onBegin}>
        Begin Phase
      </button>
    </div>
  );
}
