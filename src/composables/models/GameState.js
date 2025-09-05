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
    phase = null,
    pickedCards = [],
    autoStart = false,
    isSimulation = true,
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
    this.phase = phase
    this.pickedCards = pickedCards
    this.autoStart = autoStart
    this.isSimulation = isSimulation // True for simulations, false for regular gameplay
    this.currentPicker = null // Index of current player picking a card (null if none)
  }
  // --- Wire deduction helpers ---

  // Helper: get the nearest known wire number to the left of idx, or the lowest possible value given remaining cards
  static nearestKnownLeft({ player, idx, blueCounts = null, yellowWires = null, redWires = null }) {
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
    const candidates = []
    for (let k = leftValue; k <= 12; ++k) {
      const max = 4 - (blueCounts[k] || 0)
      for (let j = max; j > 0; j--) {
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
  static nearestKnownRight({
    player,
    idx,
    blueCounts = null,
    yellowWires = null,
    redWires = null,
  }) {
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
    const candidates = []
    for (let k = rightValue; k >= 1; --k) {
      const max = 4 - (blueCounts[k] || 0)
      for (let j = max; j > 0; j--) {
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
  static intervalForSlot({ player, idx, blueCounts = null, yellowWires = null, redWires = null }) {
    const L = GameState.nearestKnownLeft({ player, idx, blueCounts, yellowWires, redWires })
    const U = GameState.nearestKnownRight({ player, idx, blueCounts, yellowWires, redWires })
    return [L, U]
  }

  // CANDIDATES_FOR_SLOT: returns a Set of possible wire kinds for a slot
  // This version computes remaining counts from all players' hands and the board
  /**
   * Helper method to count visible cards by color
   * @param {Array} allCardsInHands - All cards from all players
   * @param {Set|null} currentPlayerCardIds - Card IDs to consider as visible
   * @returns {Object} Object with blueCounts array, yellowCount, and redCount
   */
  _countVisibleCards(allCardsInHands, currentPlayerCardIds) {
    const blueCounts = Array(13).fill(0) // 1..12
    let yellowCount = 0
    let redCount = 0

    for (const c of allCardsInHands) {
      const isVisible = c.revealed || c.infoToken || currentPlayerCardIds?.has(c.id)
      if (c.color === 'blue' && isVisible) blueCounts[c.number]++
      if (c.color === 'yellow' && isVisible) yellowCount++
      if (c.color === 'red' && isVisible) redCount++
    }

    return { blueCounts, yellowCount, redCount }
  }

  /**
   * Helper method to add blue wire candidates
   * @param {Set} candidates - Set to add candidates to
   * @param {Array} blueCounts - Count of visible blue cards by number
   * @param {number} L - Lower bound of interval
   * @param {number} U - Upper bound of interval
   */
  _addBlueCandidates(candidates, blueCounts, L, U) {
    const blueMax = 4
    for (let k = 1; k <= 12; ++k) {
      if (blueCounts[k] < blueMax && L <= k && k <= U) {
        candidates.add(k)
      }
    }
  }

  /**
   * Helper method to add colored wire candidates (yellow or red)
   * @param {Set} candidates - Set to add candidates to
   * @param {Object} params - Object containing wires, currentPlayerCardIds, L, U
   */
  _addColoredWireCandidates(candidates, { wires, currentPlayerCardIds, L, U }) {
    wires.forEach((wire) => {
      if (
        !wire.revealed &&
        !currentPlayerCardIds?.has(wire.id) &&
        L <= wire.number &&
        wire.number <= U
      ) {
        candidates.add(wire.number)
      }
    })
  }

  /**
   * Returns a Set of possible wire kinds for a slot
   * @param {Object} player - The player whose slot is being checked
   * @param {number} idx - The index in the player's hand
   * @param {Object} [currentPlayer] - If provided, all cards of this player are considered visible
   */
  candidatesForSlot(player, idx, currentPlayer = null) {
    const card = player.hand[idx]
    if (card.revealed || card.infoToken) return new Set()

    // Build a set of card ids for currentPlayer if provided
    const currentPlayerCardIds = currentPlayer ? new Set(currentPlayer.hand.map((c) => c.id)) : null

    // Count all cards in play (no double-counting)
    const allCardsInHands = this.players.flatMap((p) => p.hand)

    // Count visible cards by color
    const { blueCounts, yellowCount, redCount } = this._countVisibleCards(
      allCardsInHands,
      currentPlayerCardIds,
    )

    const yellowMax = allCardsInHands.filter((c) => c.color === 'yellow').length
    const redMax = allCardsInHands.filter((c) => c.color === 'red').length

    // Use deduction-aware interval
    const [L, U] = GameState.intervalForSlot({
      player,
      idx,
      blueCounts,
      yellowWires: yellowCount < yellowMax ? this.yellowWires : null,
      redWires: redCount < redMax ? this.redWires : null,
    })

    const candidates = new Set()

    // Add blue candidates
    this._addBlueCandidates(candidates, blueCounts, L, U)

    // Add yellow candidates if any left
    if (yellowCount < yellowMax) {
      this._addColoredWireCandidates(candidates, {
        wires: this.yellowWires,
        currentPlayerCardIds,
        L,
        U,
      })
    }

    // Add red candidates if any left
    if (redCount < redMax) {
      this._addColoredWireCandidates(candidates, {
        wires: this.redWires,
        currentPlayerCardIds,
        L,
        U,
      })
    }

    return candidates
  }

  /**
   * Helper method to build card pools for Monte Carlo simulation
   * @param {Set|null} currentPlayerCardIds - Card IDs to consider as visible
   * @returns {Object} Object containing pool arrays and counts
   */
  _buildCardPools(currentPlayerCardIds) {
    const allCardsInHands = this.players.flatMap((p) => p.hand)
    let yellowCount = 0
    let redCount = 0
    const pool = []

    for (const c of allCardsInHands) {
      const isVisible = c.revealed || c.infoToken || currentPlayerCardIds?.has(c.id)
      if (c.color === 'blue' && !isVisible) pool.push(c)
      if (c.color === 'yellow' && !isVisible) yellowCount++
      if (c.color === 'red' && !isVisible) redCount++
    }

    const yellowPool = this.yellowWires.filter(
      (y) => !y.revealed && !y.infoToken && !currentPlayerCardIds?.has(y.id),
    )

    const redPool = this.redWires.filter(
      (r) => !r.revealed && !r.infoToken && !currentPlayerCardIds?.has(r.id),
    )

    pool.sort((a, b) => a.number - b.number)

    return { pool, yellowPool, redPool, yellowCount, redCount }
  }

  /**
   * Helper method to create shuffled deck for one simulation
   * @param {Object} pools - Card pools from _buildCardPools
   * @returns {Array} Shuffled array of cards
   */
  _createShuffledDeck({ pool, yellowPool, redPool, yellowCount, redCount }) {
    let randomYellow = []
    let randomRed = []

    if (yellowCount) {
      randomYellow = [...yellowPool].sort(() => Math.random() - 0.5).slice(0, yellowCount)
    }
    if (redCount) {
      randomRed = [...redPool].sort(() => Math.random() - 0.5).slice(0, redCount)
    }

    return [...pool, ...randomYellow, ...randomRed].sort(
      (a, b) => a.number - b.number + Math.random() * 10 - 5,
    )
  }

  /**
   * Helper method to assign known cards to valid slots
   * @param {Array} slotSets - Slot sets with candidates
   * @param {Array} assignment - Assignment array to modify
   * @param {Array} shuffled - Shuffled deck to modify
   */
  _assignKnownCards(slotSets, assignment, shuffled) {
    const playerSlotIndices = {}

    // Group slots by player
    for (let s = 0; s < slotSets.length; ++s) {
      const pid = slotSets[s].player.id
      if (!slotSets[s].player.knownWires) continue
      if (!playerSlotIndices[pid]) playerSlotIndices[pid] = []
      playerSlotIndices[pid].push(s)
    }

    // Assign known cards for each player
    Object.values(playerSlotIndices).forEach((slots) => {
      const knownWires = [...(slotSets[slots[0]].player.knownWires || [])]
      knownWires.forEach((knownCard) => {
        if (knownCard.color === 'yellow') return // Not supported yet

        const validSlots = slots.filter(
          (s) => !assignment[s] && slotSets[s].candidates.has(knownCard.number),
        )

        if (validSlots.length) {
          const pickIdx = validSlots[Math.floor(Math.random() * validSlots.length)]
          assignment[pickIdx] = knownCard.number
          const removeIdx = shuffled.findIndex((c) => c.number === knownCard.number)
          if (removeIdx !== -1) shuffled.splice(removeIdx, 1)
        }
      })
    })
  }

  /**
   * Helper method to assign cards to remaining slots
   * @param {Array} slotSets - Slot sets with candidates
   * @param {Array} assignment - Assignment array to modify
   * @param {Array} shuffled - Shuffled deck to modify
   * @returns {boolean} Whether assignment was successful
   */
  _assignRemainingSlots(slotSets, assignment, shuffled) {
    let minVal = 1
    let currentPlayerId = null

    for (let s = 0; s < slotSets.length; ++s) {
      if (slotSets[s].candidates.size === 0 || assignment[s]) continue

      if (slotSets[s].player.id !== currentPlayerId) {
        currentPlayerId = slotSets[s].player.id
        minVal = 1
      }

      let foundIdx = -1
      for (let k = 0; k < shuffled.length; ++k) {
        const number = shuffled[k].number
        if (number >= minVal && slotSets[s].candidates.has(number)) {
          foundIdx = k
          minVal = number
          break
        }
      }

      if (foundIdx === -1) return false

      assignment[s] = shuffled[foundIdx].number
      shuffled.splice(foundIdx, 1)
    }

    return true
  }

  /**
   * Helper method to determine wire color from number
   * @param {number} number - Wire number
   * @returns {string} Color (blue, yellow, or red)
   */
  _getWireColor(number) {
    const digit = (number * 10) % 10
    if (digit === 0) return 'blue'
    if (digit === 1) return 'yellow'
    return 'red'
  }

  /**
   * Helper method to compute final probabilities from counts
   * @param {Array} slotNumberCounts - Count arrays for each slot
   * @param {Array} slotSets - Original slot sets
   * @returns {Array} Probability results
   */
  _computeProbabilities(slotNumberCounts, slotSets) {
    return slotNumberCounts.map((counts, idx) => {
      let total = 0
      const slots = []

      Object.entries(counts).forEach(([val, count]) => {
        total += count
        const number = Number(val)
        const color = this._getWireColor(number)
        slots.push({ number, count, color })
      })

      slots.sort((a, b) => b.count - a.count)

      return {
        slots: slots.map((s) => ({
          number: s.number,
          color: s.color,
          probability: total > 0 ? s.count / total : 0,
        })),
        info: slotSets[idx],
      }
    })
  }

  /**
   * Given an array of slot possibilities (from candidatesForSlot),
   * perform Monte Carlo sampling to estimate the most probable wire for each slot.
   * @param {Array<Set|{possibilities:Set}>} slotPossibilities - Array of Sets or objects with .possibilities for each slot
   * @param {number} N - Number of simulations (default 100)
   * @returns {Array<{mostProbable: any, probability: number, counts: Object}>}
   */
  monteCarloSlotProbabilities(slotSets, currentPlayer = null, N = 100) {
    const numSlots = slotSets.length
    const numEmptySlots = slotSets.filter((s) => s.candidates.size === 0).length
    const currentPlayerCardIds = currentPlayer ? new Set(currentPlayer.hand.map((c) => c.id)) : null

    const pools = this._buildCardPools(currentPlayerCardIds)
    const slotNumberCounts = Array(numSlots)
      .fill(0)
      .map(() => ({}))

    let successRun = 0
    for (let sim = 0; (sim < N || successRun < 10) && sim < N * 10; ++sim) {
      const shuffled = this._createShuffledDeck(pools)

      if (shuffled.length < numSlots - numEmptySlots) {
        console.warn(
          'Not enough cards in pool for Monte Carlo sampling:',
          'pool',
          pools.pool.length,
          'yellow',
          pools.yellowCount,
          'red',
          pools.redCount,
          'needed',
          numSlots,
        )
        break
      }

      const assignment = Array(numSlots)
      this._assignKnownCards(slotSets, assignment, shuffled)

      if (!this._assignRemainingSlots(slotSets, assignment, shuffled)) continue

      successRun++

      // Accumulate results
      for (let s = 0; s < numSlots; ++s) {
        const v = assignment[s]
        if (v !== null && v !== undefined) {
          slotNumberCounts[s][v] = (slotNumberCounts[s][v] || 0) + 1
        }
      }
    }

    if (successRun < N / 100) {
      console.warn('Monte Carlo sampling did not find enough valid runs:', successRun, 'out of', N)
    }

    return this._computeProbabilities(slotNumberCounts, slotSets)
  }
}
