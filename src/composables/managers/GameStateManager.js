// GameStateManager composable
import { reactive } from 'vue'
import GameState from '../models/GameState.js'
import {
  createBlueWires,
  createColoredWires,
  createGamePlayers,
  distributeWiresToPlayers,
  prepareWiresForBoard,
  validateGameParameters,
} from './GameSetupHelpers.js'

let gameStateInstance

export function useGameStateManager() {
  if (!gameStateInstance) {
    gameStateInstance = reactive(new GameState({}))
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
  // Helper function to validate play round inputs
  function validatePlayInputs({
    sourcePlayerIdx,
    sourceCardId,
    _targetPlayerIdx,
    _targetCardId,
    secondTargetCardId,
  }) {
    const players = gameStateInstance.players

    if (sourcePlayerIdx === null || sourcePlayerIdx === undefined) return { isValid: false }
    const sourcePlayer = players[sourcePlayerIdx]
    if (!sourcePlayer) return { isValid: false }

    const sourceCard = sourcePlayer.hand.find((c) => c.id === sourceCardId)
    if (!sourceCard || sourceCard.revealed) return { isValid: false }

    // Check if using double detector is valid
    if (secondTargetCardId && !sourcePlayer.hasDoubleDetector) {
      return { isValid: false }
    }

    return {
      isValid: true,
      players,
      sourcePlayer,
      sourceCard,
    }
  }

  // Helper function to handle red card special logic
  function handleRedCardLogic(sourcePlayer, sourceCard, logAndReturn) {
    if (!sourceCard.isColor('red')) return null

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
    return null
  }

  // Helper function to validate target inputs
  function validateTargetInputs(players, targetPlayerIdx, targetCardId, secondTargetCardId) {
    if (targetPlayerIdx === null || targetPlayerIdx === undefined) {
      return { isValid: false, errorType: 'incomplete-pick' }
    }

    const targetPlayer = players[targetPlayerIdx]
    if (!targetPlayer) return { isValid: false }

    const targetCard = targetPlayer.hand.find((c) => c.id === targetCardId)
    if (!targetCard || targetCard.revealed) return { isValid: false }

    let secondTargetCard = null
    if (secondTargetCardId) {
      secondTargetCard = targetPlayer.hand.find((c) => c.id === secondTargetCardId)
      if (!secondTargetCard || secondTargetCard.revealed || targetCard.id === secondTargetCard.id) {
        return { isValid: false }
      }
    }

    return {
      isValid: true,
      targetPlayer,
      targetCard,
      secondTargetCard,
    }
  }

  // Helper function to handle target hit red logic
  function handleTargetRedHit(targetPlayer, targetCard, logAndReturn) {
    if (!targetCard.isColor('red')) return null

    revealCardAndRemoveKnown(targetPlayer, targetCard)
    gameStateInstance.detonatorDial = 0

    return logAndReturn({
      outcome: 'hit-red',
      detonatorDial: gameStateInstance.detonatorDial,
      revealed: [targetCard.id],
      infoToken: false,
    })
  }

  // Helper function to handle miss logic
  function handleMiss({
    sourcePlayer,
    sourceCard,
    targetCard,
    sourcePlayerIdx,
    targetPlayerIdx,
    logAndReturn,
    invalidPick,
  }) {
    if (sourcePlayerIdx === targetPlayerIdx) {
      return invalidPick()
    }

    gameStateInstance.detonatorDial = Math.max(0, gameStateInstance.detonatorDial - 1)
    targetCard.infoToken = true
    sourcePlayer.knownWires.push(sourceCard)

    return logAndReturn({
      outcome: 'miss',
      detonatorDial: gameStateInstance.detonatorDial,
      revealed: [],
      infoToken: true,
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

      if (secondTargetCardId) {
        historyEntry.doubleDetector = true
        historyEntry.secondTargetCardId = secondTargetCardId
      }

      gameStateInstance.history.push(historyEntry)
      return result
    }

    function invalidPick(outcome = 'invalid-pick') {
      return {
        outcome,
        detonatorDial: gameStateInstance.detonatorDial,
        revealed: [],
        infoToken: false,
      }
    }

    // Validate initial inputs
    const inputValidation = validatePlayInputs({
      sourcePlayerIdx,
      sourceCardId,
      _targetPlayerIdx: targetPlayerIdx,
      _targetCardId: targetCardId,
      secondTargetCardId,
    })
    if (!inputValidation.isValid) return invalidPick()

    const { players, sourcePlayer, sourceCard } = inputValidation

    // Handle red card special logic first
    const redResult = handleRedCardLogic(sourcePlayer, sourceCard, logAndReturn)
    if (redResult) return redResult

    // Validate target inputs
    const targetValidation = validateTargetInputs(
      players,
      targetPlayerIdx,
      targetCardId,
      secondTargetCardId,
    )
    if (!targetValidation.isValid) {
      return invalidPick(targetValidation.errorType || 'invalid-pick')
    }

    const { targetPlayer, targetCard, secondTargetCard } = targetValidation

    // Handle double detector case
    if (secondTargetCard) {
      return handleDoubleDetectorPlay({
        sourcePlayer,
        sourceCard,
        targetPlayer,
        targetCard,
        secondTargetCard,
        logAndReturn,
      })
    }

    // Handle card matching
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

    // Handle target red hit
    const redHitResult = handleTargetRedHit(targetPlayer, targetCard, logAndReturn)
    if (redHitResult) return redHitResult

    // Handle miss case
    return handleMiss({
      sourcePlayer,
      sourceCard,
      targetCard,
      sourcePlayerIdx,
      targetPlayerIdx,
      logAndReturn,
      invalidPick,
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
