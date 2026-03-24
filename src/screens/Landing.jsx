export default function Landing({ onStart }) {
  return (
    <div className="screen screen--landing">
      <div className="landing-content">
        <div className="landing-eyebrow">a social game</div>
        <h1 className="landing-title">WHO'S<br />LYING</h1>
        <p className="landing-tagline">
          You don't need to lie.<br />
          You just need everyone to believe you.
        </p>
      </div>
      <div className="landing-footer">
        <p className="landing-note">4 players · in-person · one device</p>
        <button className="btn btn--primary" onClick={onStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}
