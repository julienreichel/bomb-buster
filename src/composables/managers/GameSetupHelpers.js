// Game setup helper functions
import GameState from '../models/GameState.js'
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

export function initializeGameState(
  gameState,
  { players, allWires, yellowWires, redWires, numPlayers, autoStart },
) {
  Object.assign(
    gameState,
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

// Advance pick round: AI picks and advances, human waits for UI
export function advancePickRound(gameState) {
  const players = gameState.players
  // If currentPicker is null, start with player 0
  if (gameState.currentPicker === null) {
    gameState.currentPicker = 0
  } else {
    gameState.currentPicker++
  }
  if (gameState.currentPicker < players.length) {
    const current = players[gameState.currentPicker]
    if (current && current.isAI && current.pickCard) {
      current.pickCard(gameState)
      advancePickRound(gameState)
    }
    // If human, UI will prompt for pick
  } else {
    // All players picked, switch to play phase
    gameState.phase = 'play-phase'
    gameState.currentPicker = null
    if (gameState.autoStart) {
      advancePlayRound(gameState)
    }
  }
}
// Advance play round: AI picks and advances, human waits for UI
export function advancePlayRound(gameState) {
  const players = gameState.players
  function allCardsRevealed() {
    return players.every((player) => player.hand.every((card) => card.revealed))
  }
  // If currentPicker is null, start with player 0
  if (gameState.currentPicker === null) {
    gameState.currentPicker = -1
  }
  while (true) {
    // End game if detonatorDial is 0
    if (gameState.detonatorDial === 0) {
      gameState.phase = 'game-over'
      gameState.currentPicker = null
      return
    }
    // End game if all cards are revealed
    if (allCardsRevealed()) {
      gameState.phase = 'game-over'
      gameState.currentPicker = null
      return
    }
    gameState.currentPicker++
    if (gameState.currentPicker === players.length) {
      gameState.currentPicker = 0
    }
    const current = players[gameState.currentPicker]
    if (current.hand.every((card) => card.revealed)) {
      continue
    }
    if (current && current.isAI && typeof current.pickPlayCards === 'function') {
      // AI picks two cards (assume always valid)
      const pick = current.pickPlayCards(gameState)
      playRound(gameState, pick)
      continue
    } else {
      // Human: wait for manual pick
      return
    }
  }
}

// Helper function to validate play round inputs
function validatePlayInputs(
  gameState,
  { sourcePlayerIdx, sourceCardId, _targetPlayerIdx, _targetCardId, secondTargetCardId },
) {
  const players = gameState.players

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
function handleRedCardLogic(gameState, sourcePlayer, sourceCard, logAndReturn) {
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
      detonatorDial: gameState.detonatorDial,
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

function handleDoubleDetectorPlay(
  gameState,
  { sourcePlayer, sourceCard, targetPlayer, targetCard, secondTargetCard, logAndReturn },
) {
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
      gameState.detonatorDial = Math.max(0, gameState.detonatorDial - 1)
      sourcePlayer.knownWires.push(sourceCard) // Add to known wires
      outcome = 'miss'
      revealed = []
      infoToken = true
    } else {
      // Both targets are red - trigger explosion
      const randomCard = Math.random() < 0.5 ? targetCard : secondTargetCard
      revealCardAndRemoveKnown(targetPlayer, randomCard)
      gameState.detonatorDial = 0
      outcome = 'hit-red'
      revealed = [randomCard.id]
      infoToken = false
    }
  }

  return logAndReturn({
    outcome,
    detonatorDial: gameState.detonatorDial,
    revealed,
    infoToken,
  })
}

function handleMatchingCards(
  gameState,
  {
    sourcePlayer,
    sourceCard,
    targetPlayer,
    targetCard,
    sourcePlayerIdx,
    targetPlayerIdx,
    players,
    logAndReturn,
    invalidPick,
  },
) {
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
    detonatorDial: gameState.detonatorDial,
    revealed: toReveal,
    infoToken: false,
  })
}

// Helper function to handle target hit red logic
function handleTargetRedHit(gameState, targetPlayer, targetCard, logAndReturn) {
  if (!targetCard.isColor('red')) return null

  revealCardAndRemoveKnown(targetPlayer, targetCard)
  gameState.detonatorDial = 0

  return logAndReturn({
    outcome: 'hit-red',
    detonatorDial: gameState.detonatorDial,
    revealed: [targetCard.id],
    infoToken: false,
  })
}

// Helper function to handle miss logic
function handleMiss(
  gameState,
  {
    sourcePlayer,
    sourceCard,
    targetCard,
    sourcePlayerIdx,
    targetPlayerIdx,
    logAndReturn,
    invalidPick,
  },
) {
  if (sourcePlayerIdx === targetPlayerIdx) {
    return invalidPick()
  }

  gameState.detonatorDial = Math.max(0, gameState.detonatorDial - 1)
  targetCard.infoToken = true
  sourcePlayer.knownWires.push(sourceCard)

  return logAndReturn({
    outcome: 'miss',
    detonatorDial: gameState.detonatorDial,
    revealed: [],
    infoToken: true,
  })
}

export function playRound(
  gameState,
  { sourcePlayerIdx, sourceCardId, targetPlayerIdx, targetCardId, secondTargetCardId = null },
) {
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

    gameState.history.push(historyEntry)
    return result
  }

  function invalidPick(outcome = 'invalid-pick') {
    return {
      outcome,
      detonatorDial: gameState.detonatorDial,
      revealed: [],
      infoToken: false,
    }
  }

  // Validate initial inputs
  const inputValidation = validatePlayInputs(gameState, {
    sourcePlayerIdx,
    sourceCardId,
    _targetPlayerIdx: targetPlayerIdx,
    _targetCardId: targetCardId,
    secondTargetCardId,
  })
  if (!inputValidation.isValid) return invalidPick()

  const { players, sourcePlayer, sourceCard } = inputValidation

  // Handle red card special logic first
  const redResult = handleRedCardLogic(gameState, sourcePlayer, sourceCard, logAndReturn)
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
    return handleDoubleDetectorPlay(gameState, {
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
    return handleMatchingCards(gameState, {
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
  const redHitResult = handleTargetRedHit(gameState, targetPlayer, targetCard, logAndReturn)
  if (redHitResult) return redHitResult

  // Handle miss case
  return handleMiss(gameState, {
    sourcePlayer,
    sourceCard,
    targetCard,
    sourcePlayerIdx,
    targetPlayerIdx,
    logAndReturn,
    invalidPick,
  })
}
