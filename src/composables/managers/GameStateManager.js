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
        phase: null,
        currentPicker: null,
        pickedCards: [],
      }),
    )
  }
  // Start the pick round: set phase and picker, and auto-advance through all players
  function startPickRound() {
    gameStateInstance.phase = 'pick-card'
    gameStateInstance.pickedCards = []
    advancePickRound()
  }

  // Advance pick round: AI picks and advances, human waits for UI
  function advancePickRound() {
    const players = gameStateInstance.players
    // If currentPicker is null, start with player 0
    if (gameStateInstance.currentPicker == null) {
      gameStateInstance.currentPicker = 0
    } else {
      gameStateInstance.currentPicker++
    }
    if (gameStateInstance.currentPicker < players.length) {
      const current = players[gameStateInstance.currentPicker]
      if (current && current.isAI && current.pickCard) {
        current.pickCard()
        advancePickRound()
      }
      // If human, UI will prompt for pick
    } else {
      // All players picked, switch to play phase
      gameStateInstance.phase = 'play-phase'
      gameStateInstance.currentPicker = null
    }
  }

  // Advance play round: AI picks and advances, human waits for UI
  function advancePlayRound() {
    const players = gameStateInstance.players
    function allCardsRevealed() {
      return players.every((player) => player.hand.every((card) => card.revealed))
    }
    // If currentPicker is null, start with player 0
    if (gameStateInstance.currentPicker == null) {
      gameStateInstance.currentPicker = -1
    }
    while (true) {
      // End game if detonatorDial is 0
      if (gameStateInstance.detonatorDial === 0) {
        gameStateInstance.phase = 'game-over'
        gameStateInstance.currentPicker = null
        return
      }
      // End game if all cards are revealed
      if (allCardsRevealed()) {
        gameStateInstance.phase = 'game-over'
        gameStateInstance.currentPicker = null
        return
      }
      gameStateInstance.currentPicker++
      if (gameStateInstance.currentPicker === players.length) {
        gameStateInstance.currentPicker = 0
      }
      const current = players[gameStateInstance.currentPicker]
      if (current.hand.every((card) => card.revealed)) {
        continue
      }
      if (current && current.isAI && typeof current.pickPlayCards === 'function') {
        // AI picks two cards (assume always valid)
        const pick = current.pickPlayCards(gameStateInstance)
        playRound(pick)
        continue
      } else {
        // Human: wait for manual pick
        return
      }
    }
  }

  /**
   * Play round logic: user selects a source card (from their hand, unrevealed), then a target card (from another player's hand, unrevealed).
   * Applies the following rules:
   * - If both cards are blue and have the same value, reveal both.
   * - If both cards are yellow, reveal both.
   * - If target is red, set detonatorDial to 0 and reveal target.
   * - If number or color do not match, decrease detonatorDial by 1 and set infoToken on target.
   * @param {Object} params
   * @param {number} sourcePlayerIdx
   * @param {string} sourceCardId
   * @param {number} targetPlayerIdx
   * @param {string} targetCardId
   * @returns {Object} result { outcome, detonatorDial, revealed, infoToken }
   */
  function playRound({ sourcePlayerIdx, sourceCardId, targetPlayerIdx, targetCardId }) {
    function invalidPick() {
      return {
        outcome: 'invalid-pick',
        detonatorDial: gameStateInstance.detonatorDial,
        revealed: [],
        infoToken: false,
      }
    }
    const players = gameStateInstance.players
    if (sourcePlayerIdx == null) {
      return invalidPick()
    }
    const sourcePlayer = players[sourcePlayerIdx]
    if (!sourcePlayer) {
      return invalidPick()
    }
    const sourceCard = sourcePlayer.hand.find((c) => c.id === sourceCardId)
    if (!sourceCard) {
      return invalidPick()
    }
    if (sourceCard.revealed) {
      return invalidPick()
    }

    // Special red logic: if source card is red and all cards in player's hand are revealed, reveal all red cards in that hand
    if (sourceCard.color === 'red') {
      const playerRedCards = sourcePlayer.hand.filter((c) => c.color === 'red')
      const allRevealed = sourcePlayer.hand.every((c) => c.color === 'red' || c.revealed)
      if (allRevealed) {
        let toReveal = []
        for (const card of playerRedCards) {
          card.revealed = true
          toReveal.push(card.id)
        }
        return {
          outcome: 'match-red',
          detonatorDial: gameStateInstance.detonatorDial,
          revealed: toReveal,
          infoToken: false,
        }
      }
    }

    if (targetPlayerIdx == null) {
      return invalidPick()
    }
    const targetPlayer = players[targetPlayerIdx]
    if (!targetPlayer) {
      return invalidPick()
    }
    const targetCard = targetPlayer.hand.find((c) => c.id === targetCardId)
    if (!sourceCard || !targetCard) {
      return invalidPick()
    }
    if (targetCard.revealed) {
      return invalidPick()
    }

    let outcome = ''
    let revealed = []
    let infoToken = false

    // Blue logic: if both cards are blue and same value
    if (sourceCard.number === targetCard.number) {
      let toReveal = []
      if (sourcePlayerIdx === targetPlayerIdx) {
        const value = sourceCard.number
        // Check if all blue cards with this value in other players' hands are revealed
        let allRevealed = true
        for (let i = 0; i < players.length; i++) {
          if (i === sourcePlayerIdx) continue
          for (const card of players[i].hand) {
            if (card.color === 'blue' && card.number === value && !card.revealed) {
              allRevealed = false
              break
            }
          }
          if (!allRevealed) break
        }
        if (!allRevealed) {
          return invalidPick()
        }
        // Both cards from same player: reveal all blue cards with this value in that hand
        for (const card of sourcePlayer.hand) {
          if (card.color === 'blue' && card.number === value) {
            card.revealed = true
            toReveal.push(card.id)
          }
        }
      } else {
        // Cards from different players: only reveal the selected cards
        sourceCard.revealed = true
        toReveal.push(sourceCard.id)
        targetCard.revealed = true
        toReveal.push(targetCard.id)
      }
      outcome = 'match-blue'
      revealed = toReveal
      return { outcome, detonatorDial: gameStateInstance.detonatorDial, revealed, infoToken }
    }

    // Yellow logic: if both cards are yellow
    if (sourceCard.color === 'yellow' && targetCard.color === 'yellow') {
      let toReveal = []
      if (sourcePlayerIdx === targetPlayerIdx) {
        // Check if all yellow cards in other players' hands are revealed
        let allRevealed = true
        for (let i = 0; i < players.length; i++) {
          if (i === sourcePlayerIdx) continue
          for (const card of players[i].hand) {
            if (card.color === 'yellow' && !card.revealed) {
              allRevealed = false
              break
            }
          }
          if (!allRevealed) break
        }
        if (!allRevealed) {
          return invalidPick()
        }
        // Both cards from same player: reveal all yellow cards in that hand
        for (const card of sourcePlayer.hand) {
          if (card.color === 'yellow') {
            card.revealed = true
            toReveal.push(card.id)
          }
        }
      } else {
        // Cards from different players: only reveal the selected cards
        sourceCard.revealed = true
        toReveal.push(sourceCard.id)
        targetCard.revealed = true
        toReveal.push(targetCard.id)
      }
      outcome = 'match-yellow'
      revealed = toReveal
      return { outcome, detonatorDial: gameStateInstance.detonatorDial, revealed, infoToken }
    }

    // Previous rules: red, miss, etc.
    if (targetCard.color === 'red') {
      targetCard.revealed = true
      gameStateInstance.detonatorDial = 0
      outcome = 'hit-red'
      revealed = [targetCard.id]
      return { outcome, detonatorDial: gameStateInstance.detonatorDial, revealed, infoToken }
    }
    if (sourceCard.number !== targetCard.number) {
      gameStateInstance.detonatorDial = Math.max(0, gameStateInstance.detonatorDial - 1)
      targetCard.infoToken = true
      infoToken = true
      outcome = 'miss'
      revealed = []
      return { outcome, detonatorDial: gameStateInstance.detonatorDial, revealed, infoToken }
    }
    return invalidPick()
  }

  return {
    state: gameStateInstance,
    createNewGame,
    startPickRound,
    advancePickRound,
    advancePlayRound,
    playRound,
    // ...other methods
  }
}
