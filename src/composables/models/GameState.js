// GameState model
// Adds indicators for blue, yellow, and red wires
export default class GameState {
  constructor({
    players = [],
    wires = [],
    equipment = [],
    detonatorDial = 0,
    turn = 0,
    mission = null,
    history = [],
    yellowWires = [],
    redWires = [],
    autoStart = false,
  }) {
    this.players = players // Array of Player
    this.wires = wires // Array of WireTile
    this.equipment = equipment // Array of Equipment
    this.detonatorDial = detonatorDial
    this.turn = turn
    this.mission = mission
    this.history = history
    this.yellowWires = yellowWires
    this.redWires = redWires
    this.autoStart = autoStart
  }
  // --- Wire deduction helpers ---

  // Helper: get the nearest known wire number to the left of idx, or the lowest possible value given remaining cards
  static nearestKnownLeft(player, idx, blueCounts = null, yellowWires = null, redWires = null) {
    // Find the nearest revealed/infoToken card to the left
    let leftIdx = -1
    let leftValue = 1
    for (let i = idx; i >= 0; --i) {
      const c = player.hand[i]
      if (c.revealed || c.infoToken) {
        leftIdx = i
        leftValue = c.number
        break
      }
    }
    // If no deduction info, fallback to previous logic
    if (leftIdx === idx || !blueCounts) return leftValue

    // Build a pool of available cards (blue and red)
    let candidates = []
    for (let k = leftValue; k <= 12; ++k) {
      for (let j = 4 - (blueCounts[k] || 0); j > 0; j--) {
        candidates.push({ num: k })
      }
    }
    // Add yellow and red wires
    yellowWires?.forEach((w) => {
      if (!w.revealed && w.number >= leftValue) {
        candidates.push({ num: w.number })
      }
    })
    redWires?.forEach((w) => {
      if (!w.revealed && w.number >= leftValue) {
        candidates.push({ num: w.number })
      }
    })
    // Sort by number ascending
    candidates.sort((a, b) => a.num - b.num)

    // Number of slots to fill
    const slot = idx - leftIdx - 1
    return candidates[slot].num
  }

  // Helper: get the nearest known wire number to the right of idx, or the highest possible value given remaining cards
  static nearestKnownRight(player, idx, blueCounts = null, yellowWires = null, redWires = null) {
    // Find the nearest revealed/infoToken card to the right
    let rightIdx = player.hand.length
    let rightValue = 12
    for (let i = idx; i < player.hand.length; ++i) {
      const c = player.hand[i]
      if (c.revealed || c.infoToken) {
        rightIdx = i
        rightValue = c.number
        break
      }
    }

    // If no deduction info, fallback to previous logic
    if (rightIdx === idx || !blueCounts) return rightValue

    // Build a pool of available cards (blue and red)
    let candidates = []
    for (let k = rightValue; k >= 1; --k) {
      for (let j = 4 - (blueCounts[k] || 0); j > 0; j--) {
        candidates.push({ num: k })
      }
    }
    // Add yellow and red wires
    yellowWires?.forEach((w) => {
      if (!w.revealed && w.number <= rightValue) {
        candidates.push({ num: w.number })
      }
    })
    redWires?.forEach((w) => {
      if (!w.revealed && w.number <= rightValue) {
        candidates.push({ num: w.number })
      }
    })
    // Sort by number descending
    candidates.sort((a, b) => b.num - a.num)
    // Number of slots to fill
    const slot = rightIdx - idx - 1
    return candidates[slot].num
  }

  // INTERVAL_FOR_SLOT: returns [L_rank, U_rank] for a slot, optionally with deduction info
  static intervalForSlot(player, idx, blueCounts = null, yellowWires = null, redWires = null) {
    const L = GameState.nearestKnownLeft(player, idx, blueCounts, yellowWires, redWires)
    const U = GameState.nearestKnownRight(player, idx, blueCounts, yellowWires, redWires)
    return [L, U]
  }

  // CANDIDATES_FOR_SLOT: returns a Set of possible wire kinds for a slot
  // This version computes remaining counts from all players' hands and the board
  /**
   * Returns an object with:
   *   - possibilities: Set of possible wire kinds for a slot
   *   - mostProbable: { value, probability } for the most likely wire
   * @param {Object} player - The player whose slot is being checked
   * @param {number} idx - The index in the player's hand
   * @param {Object} [currentPlayer] - If provided, all cards of this player are considered visible
   */
  candidatesForSlot(player, idx, currentPlayer = null) {
    // Build a set of card ids for currentPlayer if provided
    const currentPlayerCardIds = currentPlayer ? new Set(currentPlayer.hand.map((c) => c.id)) : null

    // Count all cards in play (no double-counting)
    const allCardsInHands = this.players.flatMap((p) => p.hand)

    // Count visible blue, yellow, red
    const blueCounts = Array(13).fill(0) // 1..12
    let yellowCount = 0
    let redCount = 0
    for (const c of allCardsInHands) {
      const isVisible = c.revealed || c.infoToken || currentPlayerCardIds?.has(c.id)
      if (c.color === 'blue' && isVisible) blueCounts[c.number]++
      if (c.color === 'yellow' && isVisible) yellowCount++
      if (c.color === 'red' && isVisible) redCount++
    }

    const blueMax = 4
    const yellowMax = allCardsInHands.filter((c) => c.color === 'yellow').length
    const redMax = allCardsInHands.filter((c) => c.color === 'red').length

    // Use deduction-aware interval
    const [L, U] = GameState.intervalForSlot(
      player,
      idx,
      blueCounts,
      yellowCount < yellowMax ? this.yellowWires : null,
      redCount < redMax ? this.redWires : null,
    )
    const S = new Set()

    // Track possible wires and their counts for probability
    const wireCounts = {}
    let totalPossibilities = 0

    // For blue, check if not present in play
    for (let k = 1; k <= 12; ++k) {
      if (blueCounts[k] < blueMax && L <= k && k <= U) {
        S.add(k)
        wireCounts[k] = blueMax - blueCounts[k]
        totalPossibilities += blueMax - blueCounts[k]
      }
    }
    // For yellow, if any left and fits interval
    let yellowWireCount = 0
    if (yellowCount < yellowMax) {
      this.yellowWires.forEach((wire) => {
        if (!wire.revealed && L < wire.number && wire.number < U) {
          yellowWireCount++
        }
      })
      if (yellowWireCount > 0) {
        S.add('yellow')
        wireCounts['yellow'] = yellowCount
        totalPossibilities += yellowCount
      }
    }
    // For red, if any left and fits interval
    let redWireCount = 0
    if (redCount < redMax) {
      this.redWires.forEach((wire) => {
        if (!wire.revealed && L < wire.number && wire.number < U) {
          redWireCount++
        }
      })
      if (redWireCount > 0) {
        S.add('red')
        wireCounts['red'] = redCount
        totalPossibilities += redCount
      }
    }

    // Find most probable
    let mostProbable = null
    let maxProb = 0
    for (const [val, count] of Object.entries(wireCounts)) {
      if (totalPossibilities > 0) {
        const prob = count / totalPossibilities
        if (prob > maxProb) {
          maxProb = prob
          mostProbable = { value: val, probability: prob }
        }
      }
    }

    return { possibilities: S, mostProbable }
  }
}
