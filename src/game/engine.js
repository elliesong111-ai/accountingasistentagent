import promptsData from '../data/prompts.json';
import rolesData from '../data/roles.json';

export const PHASES = ['green', 'yellow', 'red', 'blue', 'black'];

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
  blue: {
    label: 'BLUE',
    mood: 'Release',
    subtitle: 'Breathe. Let it settle.',
    color: '#1B3A4B',
    textColor: '#90E0EF',
  },
  black: {
    label: 'BLACK',
    mood: 'Reflection',
    subtitle: "The game is almost over. Say what's true.",
    color: '#0D0D0D',
    textColor: '#AAAAAA',
  },
};

// Cards per phase per mode
const PHASE_CARD_COUNTS = {
  quick: { green: 2, yellow: 3, red: 2, blue: 1, black: 1 },
  mini:  { green: 7, yellow: 10, red: 8, blue: 5, black: 4 },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildDeck(mode) {
  const counts = PHASE_CARD_COUNTS[mode];
  const deck = [];

  for (const phase of PHASES) {
    const available = promptsData[phase].filter((c) => c.modes.includes(mode));
    const selected = shuffle(available).slice(0, counts[phase]);
    selected.forEach((card) => deck.push({ ...card, phase }));
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

export function evaluateWinners(players, votes) {
  // votes: { mostReal: playerIndex, mostSuspicious: playerIndex }
  // Count votes
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
  const analystIdx = players.indexOf(analyst);
  const manipulatorIdx = players.indexOf(manipulator);
  const loyalIdx = players.indexOf(loyal);

  const winners = [];

  // Analyst wins if Liar is voted Most Suspicious
  if (String(mostSuspiciousIdx) === String(liarIdx)) {
    winners.push({ player: analyst, reason: 'Identified the Liar.' });
  }

  // Liar wins if NOT voted Most Suspicious
  if (String(mostSuspiciousIdx) !== String(liarIdx)) {
    winners.push({ player: liar, reason: 'Never got caught.' });
  }

  // Manipulator wins if not Most Suspicious AND Liar was caught
  if (
    String(mostSuspiciousIdx) === String(liarIdx) &&
    String(mostSuspiciousIdx) !== String(manipulatorIdx)
  ) {
    winners.push({ player: manipulator, reason: 'Stayed invisible while the Liar fell.' });
  }

  // Loyal wins if voted Most Real
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
