// GameStateManager composable
import { reactive } from 'vue'
import GameState from '../models/GameState.js'
import { HumanPlayer, AIPlayer } from '../models/Player.js'
import WireTile from '../models/WireTile.js'

let gameStateInstance

export function useGameStateManager() {
  if (!gameStateInstance) {
    gameStateInstance = reactive(new GameState({}))
  }
  // Create a new game with the given configuration
  function createNewGame({
    numPlayers = 4,
    hasHuman = true,
    yellow: { created: yellowCreated = 0, onBoard: yellowOnBoard = 0 } = {},
    red: { created: redCreated = 0, onBoard: redOnBoard = 0 } = {},
  }) {
    if (numPlayers < 3 || numPlayers > 5) {
      throw new Error('Number of players must be between 3 and 5.')
    }
    // Create players
    const players = []
    for (let i = 0; i < numPlayers; i++) {
      if (hasHuman && i === 0) {
        players.push(
          new HumanPlayer({
            id: i,
            name: 'Human',
            hand: [],
          }),
        )
      } else {
        players.push(
          new AIPlayer({
            id: i,
            name: `AI ${i + 1}`,
            hand: [],
          }),
        )
      }
    }

    // Create blue wires (4 of each number 1-12)
    const blueWires = []
    for (let n = 1; n <= 12; n++) {
      for (let i = 0; i < 4; i++) {
        blueWires.push(
          new WireTile({
            id: `blue-${n}-${i}`,
            color: 'blue',
            number: n,
          }),
        )
      }
    }

    // Create yellow wires (pick random numbers, number is x.1)
    let yellowNumbers = Array.from({ length: 11 }, (_, i) => i + 1)
    yellowNumbers = yellowNumbers.sort(() => Math.random() - 0.5)
    const yellowWires = []
    for (let i = 0; i < yellowCreated && i < yellowNumbers.length; i++) {
      yellowWires.push(
        new WireTile({
          id: `yellow-${yellowNumbers[i]}`,
          color: 'yellow',
          number: yellowNumbers[i] + 0.1,
        }),
      )
    }

    // Create red wires (pick random numbers, number is x.5)
    let redNumbers = Array.from({ length: 11 }, (_, i) => i + 1)
    redNumbers = redNumbers.sort(() => Math.random() - 0.5)
    const redWires = []
    for (let i = 0; i < redCreated && i < redNumbers.length; i++) {
      redWires.push(
        new WireTile({
          id: `red-${redNumbers[i]}`,
          color: 'red',
          number: redNumbers[i] + 0.5,
        }),
      )
    }

    // Select yellow/red wires to be on the board
    const yellowOnBoardWires = yellowWires.slice(0, yellowOnBoard)
    const redOnBoardWires = redWires.slice(0, redOnBoard)
    // Remove yellow/red wires not on board
    let allWires = [...blueWires, ...yellowOnBoardWires, ...redOnBoardWires]
    // Shuffle again for distribution
    allWires = allWires.sort(() => Math.random() - 0.5)

    // Distribute wires to players
    let playerIndex = 0
    for (const wire of allWires) {
      players[playerIndex].hand.push(wire)
      playerIndex = (playerIndex + 1) % players.length
    }
    // Sort each player's hand by wire number
    for (const player of players) {
      player.hand.sort((a, b) => a.number - b.number)
    }

    // Reset state
    Object.assign(
      gameStateInstance,
      new GameState({
        players,
        wires: allWires,
        equipment: [],
        detonatorDial: numPlayers,
        turn: 0,
        mission: null,
        history: [],
        yellowWires,
        redWires,
      }),
    )
  }

  return {
    state: gameStateInstance,
    createNewGame,
    // ...other methods
  }
}
