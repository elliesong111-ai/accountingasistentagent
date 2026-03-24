import { useState, useCallback } from 'react';
import { buildDeck, assignRoles, getNextPlayer, PHASES } from './game/engine';
import Landing from './screens/Landing';
import ModeSelect from './screens/ModeSelect';
import PlayerSetup from './screens/PlayerSetup';
import RoleReveal from './screens/RoleReveal';
import PhaseCard from './screens/PhaseCard';
import PromptCard from './screens/PromptCard';
import FinalVote from './screens/FinalVote';
import Results from './screens/Results';
import './styles/base.css';

// ─── Screen names ───
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
  };
}

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);

  const go = useCallback((updates) => {
    setState((s) => ({ ...s, ...updates }));
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const handleModeSelect = (mode) => {
    go({ mode, screen: SCREEN.PLAYER_SETUP });
  };

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
      screen: SCREEN.PHASE_CARD,
    });
  };

  const handlePhaseBegin = () => {
    go({ screen: SCREEN.PROMPT_CARD });
  };

  const handleNextCard = () => {
    const { deck, cardIndex, currentPlayerIndex, players } = state;
    const nextIndex = cardIndex + 1;

    if (nextIndex >= deck.length) {
      go({ screen: SCREEN.FINAL_VOTE });
      return;
    }

    const currentPhase = deck[cardIndex].phase;
    const nextPhase = deck[nextIndex].phase;
    const nextPlayerIndex = getNextPlayer(players, currentPlayerIndex);

    if (nextPhase !== currentPhase) {
      const newPhaseIndex = PHASES.indexOf(nextPhase);
      go({
        cardIndex: nextIndex,
        currentPlayerIndex: nextPlayerIndex,
        phaseIndex: newPhaseIndex,
        screen: SCREEN.PHASE_CARD,
      });
    } else {
      go({
        cardIndex: nextIndex,
        currentPlayerIndex: nextPlayerIndex,
      });
    }
  };

  const handleVoteComplete = (votes) => {
    go({ votes, screen: SCREEN.RESULTS });
  };

  const { screen, mode, players, deck, cardIndex, currentPlayerIndex, phaseIndex, votes } = state;

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
    return (
      <PromptCard
        card={card}
        cardNumber={cardIndex + 1}
        totalCards={deck.length}
        currentPlayer={players[currentPlayerIndex]}
        players={players}
        onNext={handleNextCard}
        isLast={isLast}
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
