/* ============================================================
   WHO'S LYING — V1
   Plain JS, no dependencies, no backend.
   ============================================================ */

// ============================================================
// CARD DATA
// ============================================================
const CARDS = {
  green: [
    { title: 'LOOK',        text: 'Look at someone for 3 seconds. Don\'t say anything.' },
    { title: 'VIBE',        text: 'Describe someone\'s vibe in one word.' },
    { title: 'WHO FIRST',   text: 'Who would speak first in a tense moment?' },
    { title: 'ENERGY',      text: 'Who has the strongest presence here?' },
    { title: 'SMALL TRUTH', text: 'Say something small but true about yourself.' },
    { title: 'SWITCH',      text: 'Switch seats with someone.' },
  ],
  yellow: [
    { title: 'IF I HAD TO', text: 'If you had to — who here do you trust the least?' },
    { title: 'I FEEL LIKE', text: 'Say: "I feel like you\'re hiding something."' },
    { title: 'WHO KNOWS',   text: 'Who here knows more than they say?' },
    { title: 'NOT YOU',     text: 'Choose someone. Say: "Not you." Don\'t explain.' },
    { title: 'ALMOST',      text: 'Say something true — but don\'t finish it.' },
    { title: 'WATCH',       text: 'Watch someone closely this round.' },
  ],
  red: [
    { title: 'SAY IT (SOFT)',  text: 'Say something honest about someone — but keep it light.' },
    { title: 'CALL IT',        text: 'Ask someone: "Are you being real right now?"' },
    { title: 'THEY DECIDE',    text: 'Choose someone. They decide who this applies to.' },
    { title: 'DOUBLE EDGE',    text: 'Choose someone. One of you reveals something. They decide who.' },
    { title: 'POINT',          text: 'Point to the person you trust the least.' },
    { title: "DON'T EXPLAIN",  text: 'Say something about someone. Do not explain.' },
  ],
  blue: [
    { title: 'LAUGH IT OFF',   text: 'Turn the last moment into a joke.' },
    { title: 'GROUP RESET',    text: 'Everyone answers: "What just happened?"' },
    { title: 'CHANGE ENERGY',  text: 'Start a new topic for 30 seconds.' },
  ],
  black: [
    { title: 'MOST REAL',   text: 'Who felt the most real tonight?' },
    { title: 'STILL HIDING',text: 'Who is still hiding something?' },
    { title: 'WHO CHANGED', text: 'Who feels different now?' },
  ],
};

// ============================================================
// ROLES
// ============================================================
const ROLE_NAMES = ['Liar', 'Analyst', 'Manipulator', 'Loyal'];

const ROLES = {
  Liar: {
    label:   'LIAR',
    mission: 'You are the only one lying.',
    howto:   'Act normal. Don\'t overexplain. If someone doubts you — redirect.',
    wins:    'You are NOT voted Most Suspicious.',
    color:   '#ef4444',
  },
  Analyst: {
    label:   'ANALYST',
    mission: 'Find the Liar.',
    howto:   'Watch for cracks. Who hesitates? Who deflects? Trust your gut.',
    wins:    'You vote for the actual Liar as Most Suspicious.',
    color:   '#60a5fa',
  },
  Manipulator: {
    label:   'MANIPULATOR',
    mission: 'Control who gets blamed.',
    howto:   'Steer the room. Plant doubt. Make at least 2 others suspect the same person.',
    wins:    '2+ players vote the same Most Suspicious target — and so did you.',
    color:   '#fbbf24',
  },
  Loyal: {
    label:   'LOYAL',
    mission: 'Be real. Earn trust.',
    howto:   'Answer honestly. Stay consistent. Don\'t perform. Just be yourself.',
    wins:    'You get the most Most Real votes.',
    color:   '#4ade80',
  },
};

// ============================================================
// PHASES
// ============================================================
const MINI_PHASES = [
  { id: 'green',  label: 'GREEN',  color: '#4ade80', duration: 300  },
  { id: 'yellow', label: 'YELLOW', color: '#fbbf24', duration: 600  },
  { id: 'red',    label: 'RED',    color: '#ef4444', duration: 480  },
  { id: 'blue',   label: 'BLUE',   color: '#60a5fa', duration: 240  },
  { id: 'black',  label: 'BLACK',  color: '#e2e8f0', duration: 180  },
];

// ============================================================
// STATE
// ============================================================
function freshState() {
  return {
    screen: 'home',           // home | setup | role-reveal | session-start | premise | game | vote | results
    mode:   null,             // 'quick' | 'mini'
    players: ['', '', '', ''],
    roles:   {},              // name -> role key

    // Role reveal
    revealIndex: 0,
    revealShown: false,

    // Game — mini
    phases: [],
    currentPhaseIndex: 0,
    phaseCards:     {},       // phaseId -> shuffled card array
    cardUsedIndex:  {},       // phaseId -> number used
    currentCard:    null,
    phaseEndTime:   null,
    timeRemaining:  0,
    phaseTotalTime: 0,
    timerInterval:  null,
    showingPhaseTransition: false,
    nextPhaseIndex: 0,

    // Game — quick
    quickCards:     [],
    quickCardIndex: 0,
    quickEndTime:   null,

    // Vote
    voteIndex:          0,
    voteMostReal:       null,
    voteMostSuspicious: null,
    votes: {
      mostReal:       {},   // voter -> target
      mostSuspicious: {},
    },

    // Results
    winners: [],

    // UI overlays
    showRules: false,
  };
}

let S = freshState();

// ============================================================
// HELPERS
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignRoles(players) {
  const roles = shuffle([...ROLE_NAMES]);
  const map = {};
  players.forEach((p, i) => { map[p] = roles[i]; });
  return map;
}

function fmt(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function phaseColor(phaseId) {
  const p = MINI_PHASES.find(p => p.id === phaseId);
  return p ? p.color : '#e2e8f0';
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// CARD LOGIC
// ============================================================
function buildQuickCards() {
  // Guaranteed distribution: 1 green, 2 yellow, 1 red, 1 black
  const g  = shuffle(CARDS.green)[0];
  const ys = shuffle(CARDS.yellow).slice(0, 2);
  const r  = shuffle(CARDS.red)[0];
  const b  = CARDS.black[0];
  return [
    { ...g,    phase: 'green'  },
    { ...ys[0],phase: 'yellow' },
    { ...ys[1],phase: 'yellow' },
    { ...r,    phase: 'red'    },
    { ...b,    phase: 'black'  },
  ];
}

function drawNextCard() {
  if (S.mode === 'quick') {
    if (S.quickCardIndex < S.quickCards.length) {
      S.currentCard = S.quickCards[S.quickCardIndex++];
    } else {
      S.currentCard = null;
    }
    return;
  }
  const phase = S.phases[S.currentPhaseIndex];
  const cards = S.phaseCards[phase.id];
  const used  = S.cardUsedIndex[phase.id];
  if (used < cards.length) {
    S.currentCard = { ...cards[used], phase: phase.id };
    S.cardUsedIndex[phase.id] = used + 1;
  } else {
    S.currentCard = null;
  }
}

// ============================================================
// WIN LOGIC
// ============================================================
function computeWinners() {
  const { votes, roles, players } = S;
  const { mostReal, mostSuspicious } = votes;

  // Count votes
  const realCount = {};
  const suspCount = {};
  players.forEach(p => { realCount[p] = 0; suspCount[p] = 0; });
  Object.values(mostReal).forEach(t       => { if (t) realCount[t]++; });
  Object.values(mostSuspicious).forEach(t => { if (t) suspCount[t]++; });

  // Top suspicious
  const maxSupp = Math.max(...Object.values(suspCount));
  const topSupp = players.filter(p => suspCount[p] === maxSupp && maxSupp > 0);

  // Top real
  const maxReal = Math.max(...Object.values(realCount));

  const liarName       = players.find(p => roles[p] === 'Liar');
  const analystName    = players.find(p => roles[p] === 'Analyst');
  const manipName      = players.find(p => roles[p] === 'Manipulator');
  const loyalName      = players.find(p => roles[p] === 'Loyal');

  const eligible = [];

  // Liar wins: not in top suspicious
  if (liarName && !topSupp.includes(liarName)) {
    eligible.push({ player: liarName, role: 'Liar', priority: 3 });
  }
  // Analyst wins: voted Liar as most suspicious
  if (analystName && mostSuspicious[analystName] === liarName) {
    eligible.push({ player: analystName, role: 'Analyst', priority: 2 });
  }
  // Manipulator wins: >=2 players voted same target AND manipulator voted that target
  if (manipName) {
    const mv = mostSuspicious[manipName];
    if (mv && suspCount[mv] >= 2) {
      eligible.push({ player: manipName, role: 'Manipulator', priority: 1 });
    }
  }
  // Loyal wins: most Most Real votes
  if (loyalName && realCount[loyalName] === maxReal && maxReal > 0) {
    eligible.push({ player: loyalName, role: 'Loyal', priority: 4 });
  }

  // Sort by priority, cap at 2
  eligible.sort((a, b) => a.priority - b.priority);
  return eligible.slice(0, 2);
}

// ============================================================
// TIMERS
// ============================================================
function clearTimer() {
  if (S.timerInterval) {
    clearInterval(S.timerInterval);
    S.timerInterval = null;
  }
}

function startPhaseTimer() {
  clearTimer();
  const phase = S.phases[S.currentPhaseIndex];
  S.phaseTotalTime = phase.duration;
  S.phaseEndTime   = Date.now() + phase.duration * 1000;
  S.timeRemaining  = phase.duration;

  S.timerInterval = setInterval(() => {
    const rem = Math.ceil((S.phaseEndTime - Date.now()) / 1000);
    if (rem <= 0) {
      S.timeRemaining = 0;
      clearTimer();
      updateTimerDOM();
      handlePhaseEnd();
    } else {
      S.timeRemaining = rem;
      updateTimerDOM();
    }
  }, 500);
}

function startQuickTimer() {
  clearTimer();
  S.quickEndTime  = Date.now() + 5 * 60 * 1000;
  S.phaseTotalTime = 300;
  S.timeRemaining  = 300;

  S.timerInterval = setInterval(() => {
    const rem = Math.ceil((S.quickEndTime - Date.now()) / 1000);
    if (rem <= 0) {
      S.timeRemaining = 0;
      clearTimer();
      updateTimerDOM();
      goToVote();
    } else {
      S.timeRemaining = rem;
      updateTimerDOM();
    }
  }, 500);
}

// Surgically update timer elements without re-rendering
function updateTimerDOM() {
  const timerEl = document.querySelector('.game-timer');
  const fillEl  = document.querySelector('.phase-bar-fill');
  if (timerEl) {
    timerEl.textContent = fmt(S.timeRemaining);
    if (S.timeRemaining <= 30) {
      timerEl.classList.add('urgent');
    } else {
      timerEl.classList.remove('urgent');
    }
  }
  if (fillEl) {
    const pct = S.phaseTotalTime > 0
      ? (S.timeRemaining / S.phaseTotalTime) * 100
      : 0;
    fillEl.style.width = pct + '%';
  }
}

// ============================================================
// TRANSITIONS
// ============================================================
function handlePhaseEnd() {
  if (S.currentPhaseIndex >= S.phases.length - 1) {
    goToVote();
    return;
  }
  S.showingPhaseTransition = true;
  S.nextPhaseIndex = S.currentPhaseIndex + 1;
  render();
}

function advancePhase() {
  S.currentPhaseIndex = S.nextPhaseIndex;
  S.showingPhaseTransition = false;
  drawNextCard();
  startPhaseTimer();
  render();
}

function goToVote() {
  clearTimer();
  S.screen               = 'vote';
  S.voteIndex            = 0;
  S.voteMostReal         = null;
  S.voteMostSuspicious   = null;
  render();
}

function startSession() {
  if (S.mode === 'mini') {
    S.phases         = MINI_PHASES;
    S.currentPhaseIndex = 0;
    S.phaseCards     = {};
    S.cardUsedIndex  = {};
    MINI_PHASES.forEach(p => {
      S.phaseCards[p.id]    = shuffle(CARDS[p.id]);
      S.cardUsedIndex[p.id] = 0;
    });
    drawNextCard();
    startPhaseTimer();
  } else {
    S.quickCards     = buildQuickCards();
    S.quickCardIndex = 0;
    S.currentCard    = S.quickCards[0];
    S.quickCardIndex = 1;
    startQuickTimer();
  }
  S.screen = 'game';
  render();
}

// ============================================================
// RENDER
// ============================================================
function render() {
  const app = document.getElementById('app');
  if (S.screen === 'home')             app.innerHTML = renderHome();
  else if (S.screen === 'setup')       app.innerHTML = renderSetup();
  else if (S.screen === 'role-reveal') app.innerHTML = renderRoleReveal();
  else if (S.screen === 'premise')     app.innerHTML = renderPremise();
  else if (S.screen === 'session-start') app.innerHTML = renderSessionStart();
  else if (S.screen === 'game')        app.innerHTML = S.showingPhaseTransition
                                                         ? renderPhaseTransition()
                                                         : renderGame();
  else if (S.screen === 'vote')        app.innerHTML = renderVote();
  else if (S.screen === 'results')     app.innerHTML = renderResults();
  bindEvents();
}

// ── HOME ────────────────────────────────────────────────────
function renderHome() {
  return `
<div class="screen home-screen anim-fadeup">
  <div class="home-top">
    <div class="home-wordmark">
      <div class="home-title"><em>WHO'S</em><em>LYING</em></div>
      <div class="home-sub">An in-person social game</div>
    </div>
  </div>
  <div class="home-bottom">
    <div class="home-modes">
      <button class="btn btn-primary btn-lg" data-action="pick-mode" data-mode="mini">
        <span class="mode-btn-inner">
          MINI SESSION
          <span class="mode-btn-duration">~30 min</span>
        </span>
      </button>
      <button class="btn btn-secondary btn-lg" data-action="pick-mode" data-mode="quick">
        <span class="mode-btn-inner">
          QUICK TEST
          <span class="mode-btn-duration">~5 min</span>
        </span>
      </button>
    </div>
    <div class="home-footer">4 players &nbsp;·&nbsp; No accounts &nbsp;·&nbsp; No setup</div>
  </div>
</div>`;
}

// ── SETUP ────────────────────────────────────────────────────
function renderSetup() {
  const allFilled = S.players.filter(p => p.trim()).length === 4;
  const inputs = [0,1,2,3].map(i => `
    <div class="input-wrap">
      <span class="input-num">${i+1}</span>
      <input
        class="player-input"
        type="text"
        placeholder="Player name"
        data-idx="${i}"
        value="${esc(S.players[i])}"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="words"
        spellcheck="false"
        maxlength="20"
      >
    </div>`).join('');

  return `
<div class="screen setup-screen anim-fadeup">
  <div class="screen-nav">
    <button class="back-btn" data-action="go-home">&#8592;</button>
    <span class="screen-nav-title">${S.mode === 'mini' ? 'Mini Session' : 'Quick Test'}</span>
  </div>
  <div class="setup-heading">Who's playing?</div>
  <div class="player-inputs">${inputs}</div>
  <div class="setup-footer">
    <button class="btn btn-primary" data-action="confirm-setup" ${allFilled ? '' : 'disabled'}>
      ASSIGN ROLES
    </button>
  </div>
</div>`;
}

// ── ROLE REVEAL ──────────────────────────────────────────────
function renderRoleReveal() {
  const player = S.players[S.revealIndex];
  const total  = S.players.length;

  if (!S.revealShown) {
    return `
<div class="screen reveal-screen anim-fadein">
  <div class="reveal-step-label">${S.revealIndex + 1} of ${total}</div>
  <div class="reveal-prompt">Pass the phone to</div>
  <div class="reveal-name">${esc(player)}</div>
  <div class="reveal-cta-wrap">
    <button class="btn btn-primary btn-lg" data-action="show-role">I'M READY</button>
  </div>
</div>`;
  }

  const roleKey  = S.roles[player];
  const roleData = ROLES[roleKey];
  return `
<div class="screen reveal-screen anim-fadein">
  <div class="reveal-step-label">${S.revealIndex + 1} of ${total}</div>
  <div class="role-card anim-card">
    <div class="role-card-eyebrow">Your Role</div>
    <div class="role-card-name" style="color:${roleData.color}">${roleData.label}</div>
    <div class="role-card-mission">${esc(roleData.mission)}</div>
    <hr class="role-card-divider">
    <div class="role-card-section-label">HOW TO PLAY</div>
    <div class="role-card-howto">${esc(roleData.howto)}</div>
    <hr class="role-card-divider">
    <div class="role-card-section-label">YOU WIN IF</div>
    <div class="role-card-wins">${esc(roleData.wins)}</div>
  </div>
  <button class="btn btn-ghost" data-action="next-reveal">GOT IT — KEEP THIS SECRET</button>
</div>`;
}

// ── PREMISE ──────────────────────────────────────────────────
// Public screen — everyone reads this together before the game
function renderPremise() {
  const isMini = S.mode === 'mini';
  return `
<div class="screen premise-screen anim-fadein">
  <div class="premise-top">
    <div class="premise-eyebrow">Before you begin</div>
    <div class="premise-headline">One of you<br>is lying.</div>
    <div class="premise-sub">Everyone else has a secret role.<br>No one knows who has what.</div>
  </div>

  <div class="premise-roles">
    <div class="premise-role-row">
      <div class="premise-role-dot" style="background:#ef4444"></div>
      <div>
        <div class="premise-role-name">LIAR</div>
        <div class="premise-role-desc">Blend in. Don't get caught.</div>
      </div>
    </div>
    <div class="premise-role-row">
      <div class="premise-role-dot" style="background:#60a5fa"></div>
      <div>
        <div class="premise-role-name">ANALYST</div>
        <div class="premise-role-desc">Find the liar.</div>
      </div>
    </div>
    <div class="premise-role-row">
      <div class="premise-role-dot" style="background:#fbbf24"></div>
      <div>
        <div class="premise-role-name">MANIPULATOR</div>
        <div class="premise-role-desc">Control who gets blamed.</div>
      </div>
    </div>
    <div class="premise-role-row">
      <div class="premise-role-dot" style="background:#4ade80"></div>
      <div>
        <div class="premise-role-name">LOYAL</div>
        <div class="premise-role-desc">Be real. Earn trust.</div>
      </div>
    </div>
  </div>

  <div class="premise-bottom">
    <div class="premise-note">
      The real game happens between the people in this room.
    </div>
    <button class="btn btn-primary btn-lg" data-action="go-session-start">
      EVERYONE'S READY
    </button>
  </div>
</div>`;
}

// ── SESSION START ────────────────────────────────────────────
function renderSessionStart() {
  const isMini = S.mode === 'mini';
  return `
<div class="screen session-start-screen anim-fadeup">
  <div class="ss-mode-label">${isMini ? 'Mini Session' : 'Quick Test'}</div>
  <div class="ss-duration">${isMini ? '30 minutes' : '5 minutes'}</div>
  <div class="ss-instructions">
    Place the phone face up.<br>
    <em>Anyone</em> can tap Next Card.<br>
    Stay in character.
  </div>
  <button class="btn btn-primary btn-lg" data-action="begin-session" style="width:100%">
    BEGIN
  </button>
</div>`;
}

// ── GAME ─────────────────────────────────────────────────────
function renderGame() {
  let color, label;
  if (S.mode === 'mini') {
    const phase = S.phases[S.currentPhaseIndex];
    color = phase.color;
    label = phase.label;
  } else {
    const pid = S.currentCard ? S.currentCard.phase : 'green';
    color = phaseColor(pid);
    label = pid.toUpperCase();
  }

  const pct     = S.phaseTotalTime > 0
    ? (S.timeRemaining / S.phaseTotalTime) * 100
    : 0;
  const urgent  = S.timeRemaining <= 30 && S.timeRemaining > 0;
  const timeStr = fmt(S.timeRemaining);

  const cardHtml = S.currentCard
    ? `<div class="game-card">
         <div class="game-card-phase-dot" style="background:${color}"></div>
         <div class="game-card-title">${esc(S.currentCard.title)}</div>
         <div class="game-card-text">${esc(S.currentCard.text)}</div>
       </div>`
    : `<div class="game-no-cards">
         <div class="game-no-cards-dash">—</div>
         <div class="game-no-cards-msg">No more cards this phase.<br>Continue the conversation.</div>
       </div>`;

  const rulesOverlay = S.showRules ? `
<div class="rules-overlay anim-fadein">
  <div class="rules-overlay-box">
    <div class="rules-overlay-title">WIN CONDITIONS</div>
    ${Object.entries(ROLES).map(([key, r]) => `
      <div class="rules-row">
        <div class="rules-role-name" style="color:${r.color}">${r.label}</div>
        <div class="rules-role-wins">${esc(r.wins)}</div>
      </div>`).join('')}
    <button class="btn btn-ghost" data-action="hide-rules" style="margin-top:20px">CLOSE</button>
  </div>
</div>` : '';

  return `
<div class="screen game-screen">
  <div class="phase-bar">
    <div class="phase-bar-fill" style="width:${pct}%;background:${color}"></div>
  </div>
  <div class="game-header">
    <div class="phase-pill" style="color:${color}">
      <div class="phase-dot" style="background:${color}"></div>
      ${label}
    </div>
    <div style="display:flex;align-items:center;gap:14px">
      <div class="game-timer${urgent ? ' urgent' : ''}">${timeStr}</div>
      <button class="rules-btn" data-action="show-rules">?</button>
    </div>
  </div>
  <div class="game-card-area">${cardHtml}</div>
  <div class="game-footer">
    <button class="btn btn-primary" data-action="next-card">NEXT CARD</button>
    <button class="btn btn-danger" data-action="skip-to-vote">SKIP TO VOTE</button>
  </div>
  ${rulesOverlay}
</div>`;
}

// ── PHASE TRANSITION ─────────────────────────────────────────
function renderPhaseTransition() {
  const next     = S.phases[S.nextPhaseIndex];
  const color    = next.color;
  const durMin   = Math.round(next.duration / 60);
  return `
<div class="screen phase-trans-screen anim-fadein">
  <div class="phase-trans-label" style="color:${color}">Phase Complete</div>
  <div class="phase-trans-name" style="color:${color}">${next.label}</div>
  <div class="phase-trans-duration">${durMin} minute${durMin !== 1 ? 's' : ''}</div>
  <button class="btn btn-primary" data-action="advance-phase" style="width:100%">
    CONTINUE
  </button>
</div>`;
}

// ── VOTE ─────────────────────────────────────────────────────
function renderVote() {
  const player = S.players[S.voteIndex];
  const others = S.players.filter(p => p !== player);

  const makeOpts = (type, selected) => others.map(p => `
    <button
      class="vote-option${selected === p ? ' selected' : ''}"
      data-action="cast-vote"
      data-type="${type}"
      data-target="${esc(p)}"
    >
      ${esc(p)}
      <div class="vote-option-check">
        <div class="vote-option-check-inner"></div>
      </div>
    </button>`).join('');

  const canSubmit = S.voteMostReal && S.voteMostSuspicious;

  return `
<div class="screen vote-screen anim-fadein">
  <div class="vote-header">
    <div class="vote-pass-label">Pass the phone to</div>
    <div class="vote-player-name">${esc(player)}</div>
    <div class="vote-private-tag">Vote is private</div>
  </div>

  <div class="vote-section">
    <div class="vote-section-label">Most Real</div>
    <div class="vote-options">${makeOpts('real', S.voteMostReal)}</div>
  </div>

  <div class="vote-section">
    <div class="vote-section-label">Most Suspicious</div>
    <div class="vote-options">${makeOpts('suspicious', S.voteMostSuspicious)}</div>
  </div>

  <div class="vote-footer">
    <button
      class="btn btn-primary"
      data-action="submit-vote"
      ${canSubmit ? '' : 'disabled'}
    >
      SUBMIT VOTE ${S.voteIndex + 1} / ${S.players.length}
    </button>
  </div>
</div>`;
}

// ── RESULTS ──────────────────────────────────────────────────
function renderResults() {
  const { winners, roles, players } = S;

  const winnersHtml = winners.length
    ? winners.map(w => `
        <div class="winner-card">
          <div class="winner-info">
            <div class="winner-name">${esc(w.player)}</div>
            <div class="winner-role">${esc(w.role)}</div>
          </div>
          <div class="winner-star">★</div>
        </div>`).join('')
    : `<div class="no-winners-msg">No winners this round.<br>Everyone was equally suspicious.</div>`;

  const rolesHtml = players.map(p => `
    <div class="role-list-row">
      <div class="role-list-player">${esc(p)}</div>
      <div class="role-list-role">${roles[p] ? ROLES[roles[p]].label : ''}</div>
    </div>`).join('');

  return `
<div class="screen results-screen anim-fadeup">
  <div class="results-header">
    <div class="results-eyebrow">The Verdict</div>
    <div class="results-title">RESULTS</div>
  </div>

  <div class="results-section">
    <div class="results-section-label">${winners.length ? `Winner${winners.length > 1 ? 's' : ''}` : 'No Winners'}</div>
    ${winnersHtml}
  </div>

  <div class="results-section">
    <div class="results-section-label">Roles Revealed</div>
    ${rolesHtml}
  </div>

  <div class="results-footer">
    <button class="btn btn-secondary" data-action="play-again">PLAY AGAIN</button>
  </div>
</div>`;
}

// ============================================================
// EVENTS
// ============================================================
function bindEvents() {
  // Actions
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', onAction, { passive: true });
  });
  // Player name inputs — live
  document.querySelectorAll('.player-input').forEach(el => {
    el.addEventListener('input', onPlayerInput);
  });
}

function onAction(e) {
  const btn    = e.currentTarget;
  const action = btn.dataset.action;

  switch (action) {

    case 'pick-mode':
      S.mode    = btn.dataset.mode;
      S.players = ['', '', '', ''];
      S.screen  = 'setup';
      render();
      break;

    case 'go-home':
      clearTimer();
      S = freshState();
      render();
      break;

    case 'confirm-setup': {
      const filled = S.players.filter(p => p.trim());
      if (filled.length < 4) return;
      S.players     = filled;
      S.roles       = assignRoles(S.players);
      S.revealIndex = 0;
      S.revealShown = false;
      S.screen      = 'role-reveal';
      render();
      break;
    }

    case 'show-role':
      S.revealShown = true;
      render();
      break;

    case 'next-reveal':
      S.revealIndex++;
      S.revealShown = false;
      if (S.revealIndex >= S.players.length) {
        S.screen = 'premise';
      }
      render();
      break;

    case 'go-session-start':
      S.screen = 'session-start';
      render();
      break;

    case 'begin-session':
      startSession();
      break;

    case 'show-rules':
      S.showRules = true;
      render();
      break;

    case 'hide-rules':
      S.showRules = false;
      render();
      break;

    case 'next-card':
      drawNextCard();
      if (S.mode === 'quick' && !S.currentCard) {
        goToVote();
        return;
      }
      render();
      break;

    case 'skip-to-vote':
      goToVote();
      break;

    case 'advance-phase':
      advancePhase();
      break;

    case 'cast-vote': {
      const type   = btn.dataset.type;
      const target = btn.dataset.target;
      if (type === 'real')       S.voteMostReal       = target;
      if (type === 'suspicious') S.voteMostSuspicious = target;
      render();
      break;
    }

    case 'submit-vote': {
      if (!S.voteMostReal || !S.voteMostSuspicious) return;
      const voter = S.players[S.voteIndex];
      S.votes.mostReal[voter]       = S.voteMostReal;
      S.votes.mostSuspicious[voter] = S.voteMostSuspicious;
      S.voteIndex++;
      S.voteMostReal       = null;
      S.voteMostSuspicious = null;
      if (S.voteIndex >= S.players.length) {
        S.winners = computeWinners();
        S.screen  = 'results';
      }
      render();
      break;
    }

    case 'play-again':
      clearTimer();
      S = freshState();
      render();
      break;
  }
}

function onPlayerInput(e) {
  const idx = parseInt(e.target.dataset.idx, 10);
  S.players[idx] = e.target.value;
  // Update start button without full re-render
  const startBtn = document.querySelector('[data-action="confirm-setup"]');
  if (startBtn) {
    const filled = S.players.filter(p => p.trim()).length;
    startBtn.disabled = filled < 4;
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', render);
