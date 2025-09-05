// GameStateManager composable
import { reactive } from 'vue'
import GameState from '../models/GameState.js'
import { AIPlayer, HumanPlayer } from '../models/Player.js'
import WireTile from '../models/WireTile.js'

let gameStateInstance

export function useGameStateManager() {
  if (!gameStateInstance) {
    gameStateInstance = reactive(new GameState({}))
  }

  // Helper function to validate game parameters
  function validateGameParameters(numPlayers) {
    if (numPlayers < 3 || numPlayers > 5) {
      throw new Error('Number of players must be between 3 and 5.')
    }
  }

  // Helper function to create game players
  function createGamePlayers(numPlayers, hasHuman, doubleDetectorEnabled) {
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
  function createBlueWires() {
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
  function createColoredWires(color, count) {
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
  function prepareWiresForBoard({ blueWires, yellowWires, redWires, yellowOnBoard, redOnBoard }) {
    const yellowOnBoardWires = yellowWires.slice(0, yellowOnBoard)
    const redOnBoardWires = redWires.slice(0, redOnBoard)
    const allWiresOnBoard = [...blueWires, ...yellowOnBoardWires, ...redOnBoardWires]
    return allWiresOnBoard.sort(() => Math.random() - 0.5)
  }

  // Helper function to distribute wires to players
  function distributeWiresToPlayers(players, allWiresOnBoard) {
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

  // Helper function to initialize game state
  function initializeGameState({
    players,
    allWires,
    yellowWires,
    redWires,
    numPlayers,
    autoStart,
  }) {
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
        autoStart,
      }),
    )
  }

  // Create a new game with the given configuration
  function createNewGame({
    numPlayers = 4,
    hasHuman = true,
    doubleDetectorEnabled = true,
    yellow: { created: yellowCreated = 0, onBoard: yellowOnBoard = 0 } = {},
    red: { created: redCreated = 0, onBoard: redOnBoard = 0 } = {},
    autoStart = false,
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

    initializeGameState({
      players,
      allWires,
      yellowWires,
      redWires,
      numPlayers,
      autoStart,
    })

    if (autoStart) {
      startPickRound()
    }
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
    if (gameStateInstance.currentPicker === null) {
      gameStateInstance.currentPicker = 0
    } else {
      gameStateInstance.currentPicker++
    }
    if (gameStateInstance.currentPicker < players.length) {
      const current = players[gameStateInstance.currentPicker]
      if (current && current.isAI && current.pickCard) {
        current.pickCard(gameStateInstance)
        advancePickRound()
      }
      // If human, UI will prompt for pick
    } else {
      // All players picked, switch to play phase
      gameStateInstance.phase = 'play-phase'
      gameStateInstance.currentPicker = null
      if (gameStateInstance.autoStart) {
        advancePlayRound()
      }
    }
  }

  // Advance play round: AI picks and advances, human waits for UI
  function advancePlayRound() {
    const players = gameStateInstance.players
    function allCardsRevealed() {
      return players.every((player) => player.hand.every((card) => card.revealed))
    }
    // If currentPicker is null, start with player 0
    if (gameStateInstance.currentPicker === null) {
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
   * @param {string} secondTargetCardId - Second target card when using double detector (optional)
   * @returns {Object} result { outcome, detonatorDial, revealed, infoToken }
   */
  function revealCardAndRemoveKnown(player, card) {
    card.revealed = true
    if (Array.isArray(player.knownWires)) {
      const idx = player.knownWires.findIndex(
        (w) => w.number === card.number || (w.color === card.color && w.color !== 'blue'),
      )
      if (idx !== -1) {
        player.knownWires.splice(idx, 1)
      }
    }
  }

  function handleDoubleDetectorPlay({
    sourcePlayer,
    sourceCard,
    targetPlayer,
    targetCard,
    secondTargetCard,
    logAndReturn,
  }) {
    // Use the double detector
    sourcePlayer.hasDoubleDetector = false

    // Check if either target matches the source
    const firstMatches = sourceCard.matches(targetCard)
    const secondMatches = sourceCard.matches(secondTargetCard)

    let outcome = ''
    let revealed = []
    let infoToken = false

    if (firstMatches && secondMatches) {
      // Both match: reveal one at random
      const randomCard = Math.random() < 0.5 ? targetCard : secondTargetCard
      revealCardAndRemoveKnown(targetPlayer, randomCard)
      revealCardAndRemoveKnown(sourcePlayer, sourceCard)
      outcome = sourceCard.color === 'blue' ? 'match-blue' : 'match-yellow'
      revealed = [sourceCard.id, randomCard.id]
    } else if (firstMatches || secondMatches) {
      // One matches: reveal both source and matching target
      const matchingCard = firstMatches ? targetCard : secondTargetCard
      revealCardAndRemoveKnown(sourcePlayer, sourceCard)
      revealCardAndRemoveKnown(targetPlayer, matchingCard)
      outcome = sourceCard.color === 'blue' ? 'match-blue' : 'match-yellow'
      revealed = [sourceCard.id, matchingCard.id]
    } else {
      // Neither matches: place info token on one at random and decrease detonator dial
      // Don't reveal red cards - only place info token, unless all targets are red
      const nonRedTargets = [targetCard, secondTargetCard].filter((card) => card.color !== 'red')
      if (nonRedTargets.length > 0) {
        // Place info token on a random non-red card
        const randomCard = nonRedTargets[Math.floor(Math.random() * nonRedTargets.length)]
        randomCard.infoToken = true
        gameStateInstance.detonatorDial = Math.max(0, gameStateInstance.detonatorDial - 1)
        sourcePlayer.knownWires.push(sourceCard) // Add to known wires
        outcome = 'miss'
        revealed = []
        infoToken = true
      } else {
        // Both targets are red - trigger explosion
        const randomCard = Math.random() < 0.5 ? targetCard : secondTargetCard
        revealCardAndRemoveKnown(targetPlayer, randomCard)
        gameStateInstance.detonatorDial = 0
        outcome = 'hit-red'
        revealed = [randomCard.id]
        infoToken = false
      }
    }

    return logAndReturn({
      outcome,
      detonatorDial: gameStateInstance.detonatorDial,
      revealed,
      infoToken,
    })
  }

  function handleMatchingCards({
    sourcePlayer,
    sourceCard,
    targetPlayer,
    targetCard,
    sourcePlayerIdx,
    targetPlayerIdx,
    players,
    logAndReturn,
    invalidPick,
  }) {
    const cardColor = sourceCard.color
    const toReveal = []

    if (sourcePlayerIdx === targetPlayerIdx) {
      // Both cards from same player: check if all matching cards in other players' hands are revealed
      let allRevealed = true
      for (let i = 0; i < players.length; i++) {
        if (i === sourcePlayerIdx) continue
        for (const card of players[i].hand) {
          const isMatchingCard = sourceCard.matches(card)
          if (isMatchingCard && !card.revealed) {
            allRevealed = false
            break
          }
        }
        if (!allRevealed) break
      }
      if (!allRevealed) return invalidPick()

      // Reveal all matching cards in the source player's hand
      for (const card of sourcePlayer.hand) {
        const shouldReveal = sourceCard.matches(card)
        if (shouldReveal) {
          revealCardAndRemoveKnown(sourcePlayer, card)
          toReveal.push(card.id)
        }
      }
    } else {
      // Cards from different players: only reveal the selected cards
      revealCardAndRemoveKnown(sourcePlayer, sourceCard)
      toReveal.push(sourceCard.id)
      revealCardAndRemoveKnown(targetPlayer, targetCard)
      toReveal.push(targetCard.id)
    }

    return logAndReturn({
      outcome: `match-${cardColor}`,
      detonatorDial: gameStateInstance.detonatorDial,
      revealed: toReveal,
      infoToken: false,
    })
  }
  function playRound({
    sourcePlayerIdx,
    sourceCardId,
    targetPlayerIdx,
    targetCardId,
    secondTargetCardId = null,
  }) {
    function logAndReturn(result) {
      const historyEntry = {
        type: 'play',
        sourcePlayerIdx,
        sourceCardId,
        targetPlayerIdx,
        targetCardId,
        result,
      }

      // Add double detector information if it was used
      if (secondTargetCardId) {
        historyEntry.doubleDetector = true
        historyEntry.secondTargetCardId = secondTargetCardId
      }

      gameStateInstance.history.push(historyEntry)
      return result
    }
    function invalidPick(outcome = 'invalid-pick') {
      const result = {
        outcome,
        detonatorDial: gameStateInstance.detonatorDial,
        revealed: [],
        infoToken: false,
      }
      return result
    }
    const players = gameStateInstance.players
    if (sourcePlayerIdx === null || sourcePlayerIdx === undefined) return invalidPick()
    const sourcePlayer = players[sourcePlayerIdx]
    if (!sourcePlayer) return invalidPick()
    const sourceCard = sourcePlayer.hand.find((c) => c.id === sourceCardId)
    if (!sourceCard) return invalidPick()
    if (sourceCard.revealed) return invalidPick()

    // Check if using double detector is valid
    if (secondTargetCardId) {
      if (!sourcePlayer.hasDoubleDetector) {
        return invalidPick()
      }
    }

    // Special red logic: if source card is red and all cards in player's hand are revealed, reveal all red cards in that hand
    if (sourceCard.isColor('red')) {
      const playerRedCards = sourcePlayer.hand.filter((c) => c.isColor('red'))
      const allRevealed = sourcePlayer.hand.every((c) => c.isColor('red') || c.revealed)
      if (allRevealed) {
        const toReveal = []
        for (const card of playerRedCards) {
          if (!card.revealed) {
            revealCardAndRemoveKnown(sourcePlayer, card)
            toReveal.push(card.id)
          }
        }
        return logAndReturn({
          outcome: 'match-red',
          detonatorDial: gameStateInstance.detonatorDial,
          revealed: toReveal,
          infoToken: false,
        })
      }
    }

    // Target validation - comes after red card logic
    if (targetPlayerIdx === null || targetPlayerIdx === undefined)
      return invalidPick('incomplete-pick')
    const targetPlayer = players[targetPlayerIdx]
    if (!targetPlayer) return invalidPick()
    const targetCard = targetPlayer.hand.find((c) => c.id === targetCardId)

    // Double detector logic: allows selecting two target cards
    if (secondTargetCardId) {
      const secondTargetCard = targetPlayer.hand.find((c) => c.id === secondTargetCardId)

      if (!targetCard || !secondTargetCard) return invalidPick()
      if (targetCard.revealed || secondTargetCard.revealed) return invalidPick()
      if (targetCard.id === secondTargetCard.id) return invalidPick()

      return handleDoubleDetectorPlay({
        sourcePlayer,
        sourceCard,
        targetPlayer,
        targetCard,
        secondTargetCard,
        logAndReturn,
      })
    }

    if (!sourceCard || !targetCard) return invalidPick()
    if (targetCard.revealed) return invalidPick()

    let outcome = ''
    let revealed = []
    let infoToken = false

    // Blue and Yellow logic: if cards match (blue same number or yellow same color)
    if (sourceCard.matches(targetCard)) {
      return handleMatchingCards({
        sourcePlayer,
        sourceCard,
        targetPlayer,
        targetCard,
        sourcePlayerIdx,
        targetPlayerIdx,
        players,
        logAndReturn,
        invalidPick,
      })
    }

    // Previous rules: red, miss, etc.
    if (targetCard.isColor('red')) {
      revealCardAndRemoveKnown(targetPlayer, targetCard)
      gameStateInstance.detonatorDial = 0
      outcome = 'hit-red'
      revealed = [targetCard.id]
      return logAndReturn({
        outcome,
        detonatorDial: gameStateInstance.detonatorDial,
        revealed,
        infoToken,
      })
    }

    if (sourcePlayerIdx === targetPlayerIdx) {
      // Cannot pick two cards from the same player
      return invalidPick()
    }
    gameStateInstance.detonatorDial = Math.max(0, gameStateInstance.detonatorDial - 1)
    targetCard.infoToken = true
    infoToken = true
    outcome = 'miss'
    revealed = []
    sourcePlayer.knownWires.push(sourceCard) // Add to known wires
    return logAndReturn({
      outcome,
      detonatorDial: gameStateInstance.detonatorDial,
      revealed,
      infoToken,
    })
  }

  return {
    state: gameStateInstance,
    createNewGame,
    startPickRound,
    advancePickRound,
    advancePlayRound,
    playRound,
    // Helper functions for testing
    validateGameParameters,
    createGamePlayers,
    createBlueWires,
    createColoredWires,
    prepareWiresForBoard,
    distributeWiresToPlayers,
    initializeGameState,
    // ...other methods
  }
}
