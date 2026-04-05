import promptsData from '../data/prompts.json';
import rolesData from '../data/roles.json';

// Blue phase removed from active play.
// Its prompts are merged into the Black pool as landing/decompression cards.
// The structural "Blue moment" is now handled by the MidVote checkpoint screen,
// inserted automatically between Red and Black phases.
export const PHASES = ['green', 'yellow', 'red', 'black'];

export const PHASE_META = {
  green: {
    label: 'GREEN',
    mood: 'Warm Up',
    subtitle: 'Keep it easy. Keep it real.',
    color: '#2D6A4F',
    textColor: '#B7E4C7',
  },
  yellow: {
    label: 'YELLOW',
    mood: 'Tension',
    subtitle: 'Something is shifting. Pay attention.',
    color: '#9C4E00',
    textColor: '#FFD166',
  },
  red: {
    label: 'RED',
    mood: 'Edge',
    subtitle: "This is where it gets real. Don't look away.",
    color: '#6B0F1A',
    textColor: '#FF8FA3',
  },
  black: {
    label: 'BLACK',
    mood: 'Reflection',
    subtitle: "The game is almost over. Say what's true.",
    color: '#0D0D0D',
    textColor: '#AAAAAA',
  },
};

// Cards per phase per mode.
// Black pool = blue prompts + black prompts combined (blue opens, black closes).
const PHASE_CARD_COUNTS = {
  quick: { green: 2, yellow: 3, red: 2, black: 3 },
  mini:  { green: 7, yellow: 10, red: 8, black: 9 },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Guarantee that Yellow and Red each contain at least 1 PRESSURE card
// targeting the Liar. This ensures every game has at least 2 structural
// moments where the Liar faces asymmetric pressure — regardless of shuffle.
function buildPhaseCards(phase, mode, count) {
  const pool = promptsData[phase].filter((c) => c.modes.includes(mode));

  const pressureCards = pool.filter((c) => c.type === 'PRESSURE');
  const regularCards  = pool.filter((c) => c.type !== 'PRESSURE');

  // Reserve 1 pressure card slot for phases that have them
  if (pressureCards.length > 0 && count >= 2) {
    const guaranteed = shuffle(pressureCards).slice(0, 1);
    const usedIds = new Set(guaranteed.map((c) => c.id));
    const remaining = shuffle(
      [...pressureCards, ...regularCards].filter((c) => !usedIds.has(c.id))
    ).slice(0, count - 1);
    return [...guaranteed, ...remaining];
  }

  return shuffle(pool).slice(0, count);
}

export function buildDeck(mode) {
  const counts = PHASE_CARD_COUNTS[mode];
  const deck = [];

  for (const phase of PHASES) {
    let cards;

    if (phase === 'black') {
      // Merge blue (release/landing) + black (reflection) into one pool.
      // Blue cards come first to act as decompression after the MidVote checkpoint.
      const blueCards = (promptsData.blue || [])
        .filter((c) => c.modes.includes(mode))
        .map((c) => ({ ...c, phase: 'black' }));
      const blackCards = (promptsData.black || [])
        .filter((c) => c.modes.includes(mode))
        .map((c) => ({ ...c, phase: 'black' }));

      const blueOpeners = shuffle(blueCards).slice(0, Math.min(2, blueCards.length));
      const needed = counts.black - blueOpeners.length;
      const blackFill = shuffle(blackCards).slice(0, needed);
      cards = [...blueOpeners, ...blackFill];
    } else {
      cards = buildPhaseCards(phase, mode, counts[phase]);
    }

    cards.forEach((card) => deck.push({ ...card, phase }));
  }

  return deck;
}

export function assignRoles(playerNames) {
  const roleIds = shuffle(rolesData.map((r) => r.id));
  return playerNames.map((name, i) => ({
    name,
    roleId: roleIds[i],
    role: rolesData.find((r) => r.id === roleIds[i]),
  }));
}

export function getNextPlayer(players, currentIndex) {
  return (currentIndex + 1) % players.length;
}

// Build initial abilitiesUsed map: { [playerIndex]: false }
export function buildAbilitiesUsed(players) {
  return Object.fromEntries(players.map((_, i) => [i, false]));
}

// Ability type constants — consumed by UI to know what flow to trigger
export const ABILITY_TYPES = {
  SKIP: 'skip',           // Liar: skip current card silently
  CHALLENGE: 'challenge', // Analyst: ask one free-form question to chosen player
  REDIRECT: 'redirect',   // Manipulator: reassign card target to chosen player
  DECLARE: 'declare',     // Loyal: banner declaring next statement is the truth
};

export function evaluateWinners(players, votes) {
  const realTally = {};
  const suspiciousTally = {};

  votes.mostReal.forEach((idx) => {
    realTally[idx] = (realTally[idx] || 0) + 1;
  });
  votes.mostSuspicious.forEach((idx) => {
    suspiciousTally[idx] = (suspiciousTally[idx] || 0) + 1;
  });

  const mostRealIdx = Object.entries(realTally).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostSuspiciousIdx = Object.entries(suspiciousTally).sort((a, b) => b[1] - a[1])[0]?.[0];

  const liar = players.find((p) => p.roleId === 'liar');
  const analyst = players.find((p) => p.roleId === 'analyst');
  const manipulator = players.find((p) => p.roleId === 'manipulator');
  const loyal = players.find((p) => p.roleId === 'loyal');

  const liarIdx = players.indexOf(liar);
  const manipulatorIdx = players.indexOf(manipulator);
  const loyalIdx = players.indexOf(loyal);

  const winners = [];

  if (String(mostSuspiciousIdx) === String(liarIdx)) {
    winners.push({ player: analyst, reason: 'Identified the Liar.' });
  }
  if (String(mostSuspiciousIdx) !== String(liarIdx)) {
    winners.push({ player: liar, reason: 'Never got caught.' });
  }
  if (
    String(mostSuspiciousIdx) === String(liarIdx) &&
    String(mostSuspiciousIdx) !== String(manipulatorIdx)
  ) {
    winners.push({ player: manipulator, reason: 'Stayed invisible while the Liar fell.' });
  }
  if (String(mostRealIdx) === String(loyalIdx)) {
    winners.push({ player: loyal, reason: 'The most real person in the room.' });
  }

  return {
    winners,
    mostRealIdx: Number(mostRealIdx),
    mostSuspiciousIdx: Number(mostSuspiciousIdx),
    realTally,
    suspiciousTally,
  };
}
