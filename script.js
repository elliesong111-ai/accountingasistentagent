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
// FACTIONS & ROLES
// ============================================================

// Faction definitions — shown publicly on premise screen
const FACTIONS = {
  bad:     { label: 'BAD',     color: '#ef4444', desc: 'They are lying. They win together.' },
  neutral: { label: 'NEUTRAL', color: '#fbbf24', desc: 'They play both sides. Own agenda.' },
  good:    { label: 'GOOD',    color: '#4ade80', desc: 'They seek truth. Different methods.' },
};

// Which roles to use per player count
const ROLE_SETS = {
  4: ['Liar', 'Manipulator', 'Analyst', 'Loyal'],
  6: ['Liar', 'Accomplice', 'Manipulator', 'Analyst', 'Loyal', 'Witness'],
};

const ROLES = {
  // ── BAD ─────────────────────────────────────────────────
  Liar: {
    label:   'LIAR',
    faction: 'bad',
    mission: 'You are the only one lying.',
    howto:   'Act normal. Don\'t overexplain. If someone doubts you — redirect.',
    wins:    'You are NOT voted Most Suspicious.',
    color:   '#ef4444',
  },
  Accomplice: {
    label:   'ACCOMPLICE',
    faction: 'bad',
    mission: 'You know who the Liar is. Protect them.',
    howto:   'Look innocent. Redirect suspicion. Never reveal what you know.',
    wins:    'The Liar is NOT voted Most Suspicious. (You win with the Liar.)',
    color:   '#f97316',
  },
  // ── NEUTRAL ─────────────────────────────────────────────
  Manipulator: {
    label:   'MANIPULATOR',
    faction: 'neutral',
    mission: 'Control who gets blamed.',
    howto:   'Steer the room. Plant doubt. Make at least 2 others suspect the same person.',
    wins:    '2+ players vote the same Most Suspicious — and so did you.',
    color:   '#fbbf24',
  },
  // ── GOOD ────────────────────────────────────────────────
  Analyst: {
    label:   'ANALYST',
    faction: 'good',
    mission: 'Find the Liar.',
    howto:   'Watch for cracks. Who hesitates? Who deflects? Trust your gut.',
    wins:    'You vote for the actual Liar as Most Suspicious.',
    color:   '#60a5fa',
  },
  Loyal: {
    label:   'LOYAL',
    faction: 'good',
    mission: 'Be real. Earn trust.',
    howto:   'Answer honestly. Stay consistent. Don\'t perform. Just be yourself.',
    wins:    'You get the most Most Real votes.',
    color:   '#4ade80',
  },
  Witness: {
    label:   'WITNESS',
    faction: 'good',
    mission: 'You secretly know one person\'s side.',
    howto:   'Use what you know carefully. Revealing too much makes you a target.',
    wins:    'You vote for a Bad player as Most Suspicious.',
    color:   '#a78bfa',
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
    screen:      'home',  // home|setup|role-reveal|premise|session-start|game|vote|results
    mode:        null,    // 'quick' | 'mini'
    playerCount: 4,       // 4 or 6
    players:     ['', '', '', '', '', ''],
    roles:       {},      // playerName -> role key
    roleInfo:    {},      // playerName -> extra secret string (Accomplice/Witness)

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

// Assigns roles + computes secret bonus info for Accomplice / Witness
function setupRoles(players) {
  const n       = players.length;
  const roleSet = shuffle([...(ROLE_SETS[n] || ROLE_SETS[4])]);
  const roles   = {};
  players.forEach((p, i) => { roles[p] = roleSet[i]; });

  const roleInfo = {};
  const liar     = players.find(p => roles[p] === 'Liar');

  players.forEach(p => {
    if (roles[p] === 'Accomplice') {
      roleInfo[p] = 'The Liar is ' + liar + '.';
    }
    if (roles[p] === 'Witness') {
      // Pick a random other player to learn the faction of
      const others  = players.filter(x => x !== p);
      const target  = others[Math.floor(Math.random() * others.length)];
      const faction = FACTIONS[ROLES[roles[target]].faction].label;
      roleInfo[p]   = target + ' is on the ' + faction + ' side.';
    }
  });

  return { roles, roleInfo };
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

  // Tally votes
  const realCount = {};
  const suspCount = {};
  players.forEach(p => { realCount[p] = 0; suspCount[p] = 0; });
  Object.values(mostReal).forEach(t       => { if (t) realCount[t]++; });
  Object.values(mostSuspicious).forEach(t => { if (t) suspCount[t]++; });

  const maxSupp = Math.max(...Object.values(suspCount));
  const topSupp = players.filter(p => suspCount[p] === maxSupp && maxSupp > 0);
  const maxReal = Math.max(...Object.values(realCount));

  const liar = players.find(p => roles[p] === 'Liar');
  const liarSafe = liar && !topSupp.includes(liar); // true = Liar survived

  const eligible = [];

  players.forEach(p => {
    const role = roles[p];
    if (!role) return;

    switch (role) {
      // BAD: Liar — not top suspicious
      case 'Liar':
        if (liarSafe)
          eligible.push({ player: p, role, priority: 4 });
        break;

      // BAD: Accomplice — wins exactly when Liar wins
      case 'Accomplice':
        if (liarSafe)
          eligible.push({ player: p, role, priority: 5 });
        break;

      // NEUTRAL: Manipulator — steered >=2 votes to same suspicious target
      case 'Manipulator': {
        const mv = mostSuspicious[p];
        if (mv && suspCount[mv] >= 2)
          eligible.push({ player: p, role, priority: 1 });
        break;
      }

      // GOOD: Analyst — correctly named the Liar
      case 'Analyst':
        if (mostSuspicious[p] === liar)
          eligible.push({ player: p, role, priority: 2 });
        break;

      // GOOD: Witness — voted for any Bad player as suspicious
      case 'Witness': {
        const target = mostSuspicious[p];
        if (target && ROLES[roles[target]] && ROLES[roles[target]].faction === 'bad')
          eligible.push({ player: p, role, priority: 3 });
        break;
      }

      // GOOD: Loyal — most Most Real votes
      case 'Loyal':
        if (realCount[p] === maxReal && maxReal > 0)
          eligible.push({ player: p, role, priority: 6 });
        break;
    }
  });

  // Priority: Manipulator(1) > Analyst(2) > Witness(3) > Liar(4) > Accomplice(5) > Loyal(6)
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
  const n        = S.playerCount;
  const allFilled = S.players.slice(0, n).filter(p => p.trim()).length === n;
  const inputs   = Array.from({ length: n }, (_, i) => `
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
  <div class="count-toggle">
    <button class="count-btn${n === 4 ? ' active' : ''}" data-action="set-count" data-count="4">4 Players</button>
    <button class="count-btn${n === 6 ? ' active' : ''}" data-action="set-count" data-count="6">6 Players</button>
  </div>
  <div class="count-note">
    ${n === 4
      ? '1 Bad &nbsp;·&nbsp; 1 Neutral &nbsp;·&nbsp; 2 Good'
      : '2 Bad &nbsp;·&nbsp; 1 Neutral &nbsp;·&nbsp; 3 Good'}
  </div>
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

  const roleKey    = S.roles[player];
  const roleData   = ROLES[roleKey];
  const factionData = FACTIONS[roleData.faction];
  const extra      = S.roleInfo[player]; // Accomplice/Witness bonus info

  return `
<div class="screen reveal-screen anim-fadein">
  <div class="reveal-step-label">${S.revealIndex + 1} of ${total}</div>
  <div class="role-card anim-card">
    <div class="role-card-top-row">
      <div class="role-card-eyebrow">Your Role</div>
      <div class="faction-badge" style="background:${factionData.color}20;color:${factionData.color};border-color:${factionData.color}40">
        ${factionData.label}
      </div>
    </div>
    <div class="role-card-name" style="color:${roleData.color}">${roleData.label}</div>
    <div class="role-card-mission">${esc(roleData.mission)}</div>
    ${extra ? `<div class="role-card-secret"><span class="secret-icon">⚑</span> ${esc(extra)}</div>` : ''}
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
// Public screen — everyone reads this together
function renderPremise() {
  const n          = S.playerCount;
  const activeRoles = ROLE_SETS[n] || ROLE_SETS[4];

  // Group roles by faction for display
  const byFaction = { bad: [], neutral: [], good: [] };
  activeRoles.forEach(rk => { byFaction[ROLES[rk].faction].push(rk); });

  const factionBlock = (fKey) => {
    const f     = FACTIONS[fKey];
    const rKeys = byFaction[fKey];
    if (!rKeys.length) return '';
    return `
      <div class="premise-faction-block">
        <div class="premise-faction-header">
          <div class="premise-faction-dot" style="background:${f.color}"></div>
          <div class="premise-faction-label" style="color:${f.color}">${f.label}</div>
          <div class="premise-faction-count">${rKeys.length}×</div>
        </div>
        <div class="premise-faction-roles">
          ${rKeys.map(rk => `
            <div class="premise-role-row">
              <div class="premise-role-dot" style="background:${ROLES[rk].color}"></div>
              <div>
                <div class="premise-role-name">${ROLES[rk].label}</div>
                <div class="premise-role-desc">${esc(ROLES[rk].mission)}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  };

  return `
<div class="screen premise-screen anim-fadein">
  <div class="premise-top">
    <div class="premise-eyebrow">Before you begin — read this together</div>
    <div class="premise-headline">Someone<br>in this room<br>is lying.</div>
    <div class="premise-sub">Everyone has a secret role. No one knows who has what.</div>
  </div>

  <div class="premise-factions">
    ${factionBlock('bad')}
    ${factionBlock('neutral')}
    ${factionBlock('good')}
  </div>

  <div class="premise-bottom">
    <div class="premise-note">The real game happens between the people in this room.</div>
    <button class="btn btn-primary btn-lg" data-action="go-session-start">EVERYONE'S READY</button>
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

  const rolesHtml = players.map(p => {
    const rk = roles[p];
    const rd = rk ? ROLES[rk] : null;
    const fd = rd ? FACTIONS[rd.faction] : null;
    return `
    <div class="role-list-row">
      <div class="role-list-player">${esc(p)}</div>
      <div class="role-list-right">
        ${fd ? `<span class="faction-badge" style="background:${fd.color}20;color:${fd.color};border-color:${fd.color}40">${fd.label}</span>` : ''}
        <div class="role-list-role" ${rd ? `style="color:${rd.color}"` : ''}>${rd ? rd.label : ''}</div>
      </div>
    </div>`;
  }).join('');

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
      S.mode        = btn.dataset.mode;
      S.playerCount = 4;
      S.players     = Array(6).fill('');
      S.screen      = 'setup';
      render();
      break;

    case 'set-count': {
      const n = parseInt(btn.dataset.count, 10);
      S.playerCount = n;
      S.players     = Array(6).fill('');
      render();
      break;
    }

    case 'go-home':
      clearTimer();
      S = freshState();
      render();
      break;

    case 'confirm-setup': {
      const filled = S.players.slice(0, S.playerCount).filter(p => p.trim());
      if (filled.length < S.playerCount) return;
      S.players     = filled;
      const setup   = setupRoles(S.players);
      S.roles       = setup.roles;
      S.roleInfo    = setup.roleInfo;
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
  const startBtn = document.querySelector('[data-action="confirm-setup"]');
  if (startBtn) {
    const filled = S.players.slice(0, S.playerCount).filter(p => p.trim()).length;
    startBtn.disabled = filled < S.playerCount;
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', render);
