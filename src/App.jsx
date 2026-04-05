import { useState, useCallback } from 'react';
import { buildDeck, assignRoles, getNextPlayer, buildAbilitiesUsed, PHASES } from './game/engine';
import Landing from './screens/Landing';
import ModeSelect from './screens/ModeSelect';
import PlayerSetup from './screens/PlayerSetup';
import RoleReveal from './screens/RoleReveal';
import PhaseCard from './screens/PhaseCard';
import PromptCard from './screens/PromptCard';
import FinalVote from './screens/FinalVote';
import Results from './screens/Results';
import './styles/base.css';

const SCREEN = {
  LANDING: 'landing',
  MODE_SELECT: 'mode_select',
  PLAYER_SETUP: 'player_setup',
  ROLE_REVEAL: 'role_reveal',
  PHASE_CARD: 'phase_card',
  PROMPT_CARD: 'prompt_card',
  FINAL_VOTE: 'final_vote',
  RESULTS: 'results',
};

const INITIAL_STATE = {
  screen: SCREEN.LANDING,
  mode: null,
  players: [],
  deck: [],
  cardIndex: 0,
  currentPlayerIndex: 0,
  phaseIndex: 0,
  votes: null,
  abilitiesUsed: {},      // { [playerIndex]: boolean }
  redirectedTarget: null, // playerIndex | null — set when Manipulator redirects
  declareActive: false,   // true when Loyal's DECLARE banner is showing
};

function resetGameState() {
  return {
    mode: null,
    players: [],
    deck: [],
    cardIndex: 0,
    currentPlayerIndex: 0,
    phaseIndex: 0,
    votes: null,
    abilitiesUsed: {},
    redirectedTarget: null,
    declareActive: false,
  };
}

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);

  const go = useCallback((updates) => {
    setState((s) => ({ ...s, ...updates }));
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  // ─── Setup handlers ───

  const handleModeSelect = (mode) => {
    go({ mode, screen: SCREEN.PLAYER_SETUP });
  };

  const handlePlayersReady = (names) => {
    const players = assignRoles(names);
    go({ players, screen: SCREEN.ROLE_REVEAL });
  };

  const handleRolesRevealed = () => {
    const players = state.players;
    const deck = buildDeck(state.mode);
    go({
      deck,
      cardIndex: 0,
      currentPlayerIndex: 0,
      phaseIndex: 0,
      abilitiesUsed: buildAbilitiesUsed(players),
      redirectedTarget: null,
      declareActive: false,
      screen: SCREEN.PHASE_CARD,
    });
  };

  const handlePhaseBegin = () => {
    go({ screen: SCREEN.PROMPT_CARD });
  };

  // ─── Card navigation ───

  const advanceCard = (fromIndex) => {
    const { deck, currentPlayerIndex, players } = state;
    const nextIndex = fromIndex + 1;

    // Clear any per-card transient state
    const clearTransient = { redirectedTarget: null, declareActive: false };

    if (nextIndex >= deck.length) {
      go({ ...clearTransient, screen: SCREEN.FINAL_VOTE });
      return;
    }

    const currentPhase = deck[fromIndex].phase;
    const nextPhase = deck[nextIndex].phase;
    const nextPlayerIndex = getNextPlayer(players, currentPlayerIndex);

    if (nextPhase !== currentPhase) {
      const newPhaseIndex = PHASES.indexOf(nextPhase);
      go({
        ...clearTransient,
        cardIndex: nextIndex,
        currentPlayerIndex: nextPlayerIndex,
        phaseIndex: newPhaseIndex,
        screen: SCREEN.PHASE_CARD,
      });
    } else {
      go({
        ...clearTransient,
        cardIndex: nextIndex,
        currentPlayerIndex: nextPlayerIndex,
      });
    }
  };

  const handleNextCard = () => advanceCard(state.cardIndex);

  // ─── Ability handlers ───

  // Mark current player's ability as used
  const markAbilityUsed = (playerIndex) => {
    const next = { ...state.abilitiesUsed, [playerIndex]: true };
    go({ abilitiesUsed: next });
    return next;
  };

  // LIAR — DENY: skip card, mark used
  const handleAbilitySkip = () => {
    markAbilityUsed(state.currentPlayerIndex);
    advanceCard(state.cardIndex);
  };

  // ANALYST — CHALLENGE: mark used, then PromptCard shows challenge UI
  // The challenge itself is a freeform conversation — app just surfaces it
  const handleAbilityChallenge = (targetPlayerIndex) => {
    markAbilityUsed(state.currentPlayerIndex);
    // We push a synthetic "challenge" action — stored as redirectedTarget so
    // PromptCard knows to show the challenge framing for that target
    go({ abilitiesUsed: { ...state.abilitiesUsed, [state.currentPlayerIndex]: true }, redirectedTarget: targetPlayerIndex });
  };

  // MANIPULATOR — REDIRECT: mark used, store new target
  const handleAbilityRedirect = (targetPlayerIndex) => {
    markAbilityUsed(state.currentPlayerIndex);
    go({ abilitiesUsed: { ...state.abilitiesUsed, [state.currentPlayerIndex]: true }, redirectedTarget: targetPlayerIndex });
  };

  // LOYAL — DECLARE: mark used, show banner on card
  const handleAbilityDeclare = () => {
    markAbilityUsed(state.currentPlayerIndex);
    go({ abilitiesUsed: { ...state.abilitiesUsed, [state.currentPlayerIndex]: true }, declareActive: true });
  };

  const handleVoteComplete = (votes) => {
    go({ votes, screen: SCREEN.RESULTS });
  };

  // ─── Render ───

  const {
    screen, mode, players, deck, cardIndex,
    currentPlayerIndex, phaseIndex, votes,
    abilitiesUsed, redirectedTarget, declareActive,
  } = state;

  if (screen === SCREEN.LANDING) {
    return <Landing onStart={() => go({ screen: SCREEN.MODE_SELECT })} />;
  }

  if (screen === SCREEN.MODE_SELECT) {
    return (
      <ModeSelect
        onSelect={handleModeSelect}
        onBack={() => go({ screen: SCREEN.LANDING })}
      />
    );
  }

  if (screen === SCREEN.PLAYER_SETUP) {
    return (
      <PlayerSetup
        onStart={handlePlayersReady}
        onBack={() => go({ screen: SCREEN.MODE_SELECT })}
      />
    );
  }

  if (screen === SCREEN.ROLE_REVEAL) {
    return <RoleReveal players={players} onComplete={handleRolesRevealed} />;
  }

  if (screen === SCREEN.PHASE_CARD) {
    const phase = deck.length > 0 ? deck[cardIndex]?.phase : PHASES[phaseIndex];
    return (
      <PhaseCard
        phase={phase || PHASES[phaseIndex]}
        phaseNumber={phaseIndex + 1}
        totalPhases={PHASES.length}
        onBegin={handlePhaseBegin}
      />
    );
  }

  if (screen === SCREEN.PROMPT_CARD) {
    const card = deck[cardIndex];
    const isLast = cardIndex === deck.length - 1;
    const currentPlayer = players[currentPlayerIndex];
    const abilityUsed = abilitiesUsed[currentPlayerIndex] ?? false;

    return (
      <PromptCard
        card={card}
        cardNumber={cardIndex + 1}
        totalCards={deck.length}
        currentPlayer={currentPlayer}
        currentPlayerIndex={currentPlayerIndex}
        players={players}
        onNext={handleNextCard}
        isLast={isLast}
        abilityUsed={abilityUsed}
        redirectedTarget={redirectedTarget}
        declareActive={declareActive}
        onAbilitySkip={handleAbilitySkip}
        onAbilityChallenge={handleAbilityChallenge}
        onAbilityRedirect={handleAbilityRedirect}
        onAbilityDeclare={handleAbilityDeclare}
      />
    );
  }

  if (screen === SCREEN.FINAL_VOTE) {
    return <FinalVote players={players} onComplete={handleVoteComplete} />;
  }

  if (screen === SCREEN.RESULTS) {
    return (
      <Results
        players={players}
        votes={votes}
        onPlayAgain={() => go({ screen: SCREEN.MODE_SELECT, ...resetGameState() })}
        onEnd={reset}
      />
    );
  }

  return null;
}
