import { useState, useCallback } from 'react';
import { buildDeck, assignRoles, getNextPlayer, buildAbilitiesUsed, PHASES } from './game/engine';
import Landing from './screens/Landing';
import ModeSelect from './screens/ModeSelect';
import PlayerSetup from './screens/PlayerSetup';
import RoleReveal from './screens/RoleReveal';
import PhaseCard from './screens/PhaseCard';
import PromptCard from './screens/PromptCard';
import MidVote from './screens/MidVote';
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
  MID_VOTE: 'mid_vote',       // checkpoint between Red and Black
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
  midVotes: null,             // [playerIndex, ...] — one per player, in player order
  abilitiesUsed: {},
  redirectedTarget: null,
  declareActive: false,
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
    midVotes: null,
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

  // ─── Setup ───

  const handleModeSelect = (mode) => go({ mode, screen: SCREEN.PLAYER_SETUP });

  const handlePlayersReady = (names) => {
    const players = assignRoles(names);
    go({ players, screen: SCREEN.ROLE_REVEAL });
  };

  const handleRolesRevealed = () => {
    const deck = buildDeck(state.mode);
    go({
      deck,
      cardIndex: 0,
      currentPlayerIndex: 0,
      phaseIndex: 0,
      abilitiesUsed: buildAbilitiesUsed(state.players),
      redirectedTarget: null,
      declareActive: false,
      screen: SCREEN.PHASE_CARD,
    });
  };

  const handlePhaseBegin = () => go({ screen: SCREEN.PROMPT_CARD });

  // ─── Card navigation ───

  const advanceCard = (fromIndex) => {
    const { deck, currentPlayerIndex, players } = state;
    const nextIndex = fromIndex + 1;
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

      // Red → Black transition: intercept with mid-game checkpoint
      if (currentPhase === 'red' && nextPhase === 'black') {
        go({
          ...clearTransient,
          cardIndex: nextIndex,
          currentPlayerIndex: nextPlayerIndex,
          phaseIndex: newPhaseIndex,
          screen: SCREEN.MID_VOTE,
        });
        return;
      }

      go({
        ...clearTransient,
        cardIndex: nextIndex,
        currentPlayerIndex: nextPlayerIndex,
        phaseIndex: newPhaseIndex,
        screen: SCREEN.PHASE_CARD,
      });
    } else {
      go({ ...clearTransient, cardIndex: nextIndex, currentPlayerIndex: nextPlayerIndex });
    }
  };

  const handleNextCard = () => advanceCard(state.cardIndex);

  // After mid-vote completes, store results then show Black's phase card
  const handleMidVoteComplete = (suspicions) => {
    go({ midVotes: suspicions, screen: SCREEN.PHASE_CARD });
  };

  // ─── Ability handlers ───

  const markAbilityUsed = (playerIndex) =>
    ({ ...state.abilitiesUsed, [playerIndex]: true });

  const handleAbilitySkip = () => {
    go({ abilitiesUsed: markAbilityUsed(state.currentPlayerIndex) });
    advanceCard(state.cardIndex);
  };

  const handleAbilityChallenge = (targetPlayerIndex) => {
    go({
      abilitiesUsed: markAbilityUsed(state.currentPlayerIndex),
      redirectedTarget: targetPlayerIndex,
    });
  };

  const handleAbilityRedirect = (targetPlayerIndex) => {
    go({
      abilitiesUsed: markAbilityUsed(state.currentPlayerIndex),
      redirectedTarget: targetPlayerIndex,
    });
  };

  const handleAbilityDeclare = () => {
    go({
      abilitiesUsed: markAbilityUsed(state.currentPlayerIndex),
      declareActive: true,
    });
  };

  const handleVoteComplete = (votes) => go({ votes, screen: SCREEN.RESULTS });

  // ─── Render ───

  const {
    screen, players, deck, cardIndex,
    currentPlayerIndex, phaseIndex, votes, midVotes,
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
        abilityUsed={abilitiesUsed[currentPlayerIndex] ?? false}
        redirectedTarget={redirectedTarget}
        declareActive={declareActive}
        onAbilitySkip={handleAbilitySkip}
        onAbilityChallenge={handleAbilityChallenge}
        onAbilityRedirect={handleAbilityRedirect}
        onAbilityDeclare={handleAbilityDeclare}
      />
    );
  }

  if (screen === SCREEN.MID_VOTE) {
    return <MidVote players={players} onComplete={handleMidVoteComplete} />;
  }

  if (screen === SCREEN.FINAL_VOTE) {
    return <FinalVote players={players} onComplete={handleVoteComplete} />;
  }

  if (screen === SCREEN.RESULTS) {
    return (
      <Results
        players={players}
        votes={votes}
        midVotes={midVotes}
        onPlayAgain={() => go({ screen: SCREEN.MODE_SELECT, ...resetGameState() })}
        onEnd={reset}
      />
    );
  }

  return null;
}
