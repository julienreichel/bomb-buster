// GameStateManager composable
import { reactive } from 'vue'
import GameState from '../models/GameState.js'
import {
  advancePickRound,
  advancePlayRound,
  createBlueWires,
  createColoredWires,
  createGamePlayers,
  distributeWiresToPlayers,
  initializeGameState,
  playRound,
  prepareWiresForBoard,
  validateGameParameters,
} from './GameSetupHelpers.js'

let gameStateInstance

export function useGameStateManager() {
  if (!gameStateInstance) {
    gameStateInstance = reactive(new GameState({}))
  }
  // Helper function to initialize game state

  // Create a new game with the given configuration
  function createNewGame({
    numPlayers = 4,
    hasHuman = true,
    doubleDetectorEnabled = true,
    yellow: { created: yellowCreated = 0, onBoard: yellowOnBoard = 0 } = {},
    red: { created: redCreated = 0, onBoard: redOnBoard = 0 } = {},
    autoStart = false,
    isSimulation = true,
  }) {
    validateGameParameters(numPlayers)

    const players = createGamePlayers(numPlayers, hasHuman, doubleDetectorEnabled)
    const blueWires = createBlueWires()
    const yellowWires = createColoredWires('yellow', yellowCreated)
    const redWires = createColoredWires('red', redCreated)
    const allWires = [...blueWires, ...yellowWires, ...redWires]

    const allWiresOnBoard = prepareWiresForBoard({
      blueWires,
      yellowWires,
      redWires,
      yellowOnBoard,
      redOnBoard,
    })

    distributeWiresToPlayers(players, allWiresOnBoard)

    initializeGameState(gameStateInstance, {
      players,
      allWires,
      yellowWires,
      redWires,
      numPlayers,
      autoStart,
      isSimulation,
    })

    if (autoStart) {
      // Don't await in createNewGame to avoid blocking, let it run async
      startPickRound(gameStateInstance)
    }
  }

  async function startPickRound(gameState) {
    gameState.phase = 'pick-card'
    gameState.pickedCards = []
    gameState.currentPicker = 0 // Start with player 0
    await advancePickRound(gameState)
  }

  return {
    state: gameStateInstance,
    createNewGame,
    startPickRound: async () => await startPickRound(gameStateInstance),
    advancePickRound: async () => await advancePickRound(gameStateInstance),
    advancePlayRound: async () => await advancePlayRound(gameStateInstance),
    playRound: (params) => playRound(gameStateInstance, params),
    // Helper functions for testing
    initializeGameState: (params) => initializeGameState(gameStateInstance, params),
    // ...other methods
  }
}
