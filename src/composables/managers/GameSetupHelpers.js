// Game setup helper functions
import { AIPlayer, HumanPlayer } from '../models/Player.js'
import WireTile from '../models/WireTile.js'

// Helper function to validate game parameters
export function validateGameParameters(numPlayers) {
  if (numPlayers < 3 || numPlayers > 5) {
    throw new Error('Number of players must be between 3 and 5.')
  }
}

// Helper function to create game players
export function createGamePlayers(numPlayers, hasHuman, doubleDetectorEnabled) {
  const players = []
  for (let i = 0; i < numPlayers; i++) {
    if (hasHuman && i === 0) {
      players.push(
        new HumanPlayer({
          id: i,
          name: 'Human',
          hand: [],
          doubleDetectorEnabled,
        }),
      )
    } else {
      players.push(
        new AIPlayer({
          id: i,
          name: `AI ${i + 1}`,
          hand: [],
          doubleDetectorEnabled,
        }),
      )
    }
  }
  return players
}

// Helper function to create blue wire tiles
export function createBlueWires() {
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
  return blueWires
}

// Helper function to create colored wires (yellow or red)
export function createColoredWires(color, count) {
  const offset = color === 'yellow' ? 0.1 : 0.5
  let numbers = Array.from({ length: 11 }, (_, i) => i + 1)
  numbers = numbers.sort(() => Math.random() - 0.5)
  const wires = []
  for (let i = 0; i < count && i < numbers.length; i++) {
    wires.push(
      new WireTile({
        id: `${color}-${numbers[i]}`,
        color,
        number: numbers[i] + offset,
      }),
    )
  }
  return wires
}

// Helper function to select wires for the board and shuffle them
export function prepareWiresForBoard({
  blueWires,
  yellowWires,
  redWires,
  yellowOnBoard,
  redOnBoard,
}) {
  const yellowOnBoardWires = yellowWires.slice(0, yellowOnBoard)
  const redOnBoardWires = redWires.slice(0, redOnBoard)
  const allWiresOnBoard = [...blueWires, ...yellowOnBoardWires, ...redOnBoardWires]
  return allWiresOnBoard.sort(() => Math.random() - 0.5)
}

// Helper function to distribute wires to players
export function distributeWiresToPlayers(players, allWiresOnBoard) {
  let playerIndex = 0
  for (const wire of allWiresOnBoard) {
    players[playerIndex].hand.push(wire)
    playerIndex = (playerIndex + 1) % players.length
  }
  // Sort each player's hand by wire number
  for (const player of players) {
    player.hand.sort((a, b) => a.number - b.number)
  }
}
