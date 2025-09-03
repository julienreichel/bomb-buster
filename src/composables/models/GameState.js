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
      let max = 4 - (blueCounts[k] || 0)
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
      let max = 4 - (blueCounts[k] || 0)
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
  static intervalForSlot(player, idx, blueCounts = null, yellowWires = null, redWires = null) {
    const L = GameState.nearestKnownLeft(player, idx, blueCounts, yellowWires, redWires)
    const U = GameState.nearestKnownRight(player, idx, blueCounts, yellowWires, redWires)
    return [L, U]
  }

  // CANDIDATES_FOR_SLOT: returns a Set of possible wire kinds for a slot
  // This version computes remaining counts from all players' hands and the board
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

    // For blue, check if not present in play
    for (let k = 1; k <= 12; ++k) {
      if (blueCounts[k] < blueMax && L <= k && k <= U) {
        S.add(k)
      }
    }
    // For yellow, if any left and fits interval
    if (yellowCount < yellowMax) {
      this.yellowWires.forEach((wire) => {
        if (
          !wire.revealed &&
          !currentPlayerCardIds?.has(wire.id) &&
          L <= wire.number &&
          wire.number <= U
        ) {
          S.add(wire.number)
        }
      })
    }
    // For red, if any left and fits interval
    if (redCount < redMax) {
      this.redWires.forEach((wire) => {
        if (
          !wire.revealed &&
          !currentPlayerCardIds?.has(wire.id) &&
          L <= wire.number &&
          wire.number <= U
        ) {
          S.add(wire.number)
        }
      })
    }

    return S
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
    // Build a set of card ids for currentPlayer if provided
    const currentPlayerCardIds = currentPlayer ? new Set(currentPlayer.hand.map((c) => c.id)) : null

    // Count all cards in play (no double-counting)
    const allCardsInHands = this.players.flatMap((p) => p.hand)

    // Count visible blue, yellow, red
    let yellowCount = 0
    let redCount = 0
    const pool = []

    for (const c of allCardsInHands) {
      const isVisible = c.revealed || c.infoToken || currentPlayerCardIds?.has(c.id)
      if (c.color === 'blue' && !isVisible) pool.push(c)
      if (c.color === 'yellow' && !isVisible) yellowCount++
      if (c.color === 'red' && !isVisible) redCount++
    }
    const yellowPool = []
    for (const y of this.yellowWires) {
      if (!y.revealed && !y.infoToken && !currentPlayerCardIds?.has(y.id)) {
        yellowPool.push(y)
      }
    }
    const redPool = []
    for (const r of this.redWires) {
      if (!r.revealed && !r.infoToken && !currentPlayerCardIds?.has(r.id)) {
        redPool.push(r)
      }
    }
    pool.sort((a, b) => a.number - b.number) // Sort by number ascending
    // Monte Carlo sampling
    const slotValueCounts = Array(numSlots)
      .fill(0)
      .map(() => ({}))

    let successRun = 0
    for (let sim = 0; (sim < N || successRun < 10) && sim < N * 10; ++sim) {
      // Shuffle pool
      let randomYellow = []
      let randomRed = []
      if (yellowCount) {
        // lets put yellowMax - yellowCount yellow wires in the pool
        randomYellow = [...yellowPool].sort(() => Math.random() - 0.5).slice(0, yellowCount)
      }
      if (redCount) {
        randomRed = [...redPool].sort(() => Math.random() - 0.5).slice(0, redCount)
      }
      // shuffle, but give some preference to lower numbers
      let shuffled = [...pool, ...randomYellow, ...randomRed].sort(
        (a, b) => a.number - b.number + Math.random() * 10 - 5,
      )
      if (shuffled.length < numSlots - numEmptySlots) {
        console.warn(
          'Not enough cards in pool for Monte Carlo sampling:',
          'pool',
          pool.length,
          'yellow',
          randomYellow.length,
          'red',
          randomRed.length,
          'needed',
          numSlots,
        )
        break
      }
      // Try to assign to slots
      let valid = true
      let minVal = 1
      let currentPlayerId = null
      const assignment = Array(numSlots)
      // --- Assign knownCards to random valid slots for each player ---
      // Group slots by player
      const playerSlotIndices = {}
      for (let s = 0; s < numSlots; ++s) {
        const pid = slotSets[s].player.id

        if (!slotSets[s].player.knownWires) continue // No known cards for this player
        if (!playerSlotIndices[pid]) playerSlotIndices[pid] = []
        playerSlotIndices[pid].push(s)
      }

      // For each player, assign their knownCards
      Object.entries(playerSlotIndices).forEach(([, slots]) => {
        const knownWires = [...(slotSets[slots[0]].player.knownWires || [])]
        knownWires.forEach((knownCard) => {
          if (knownCard.color === 'yellow') {
            // not supported yet
            return
          }
          // Find all slots for this player that accept this knownCard
          const validSlots = slots.filter(
            (s) => !assignment[s] && slotSets[s].candidates.has(knownCard.number),
          )
          if (validSlots.length) {
            // Pick one at random
            const pickIdx = validSlots[Math.floor(Math.random() * validSlots.length)]
            assignment[pickIdx] = knownCard.number
            // Remove the card from shuffled
            const removeIdx = shuffled.findIndex((c) => c.number === knownCard.number)
            if (removeIdx !== -1) shuffled.splice(removeIdx, 1)
          }
        })
      })
      // --- End knownCards assignment ---
      for (let s = 0; s < numSlots; ++s) {
        if (slotSets[s].candidates.size === 0) {
          continue
        }
        if (assignment[s]) continue // Already assigned by knownCards
        // Find a value in shuffled that is in slotSets[s]
        let foundIdx = -1
        if (slotSets[s].player.id !== currentPlayerId) {
          currentPlayerId = slotSets[s].player.id
          minVal = 1
        }

        for (let k = 0; k < shuffled.length; ++k) {
          const value = shuffled[k].number
          if (value >= minVal && slotSets[s].candidates.has(value)) {
            foundIdx = k
            minVal = value
            break
          }
        }
        if (foundIdx === -1) {
          valid = false
          break
        }

        assignment[s] = shuffled[foundIdx].number
        shuffled.splice(foundIdx, 1)
      }
      if (!valid) continue
      successRun++
      // Accumulate
      for (let s = 0; s < numSlots; ++s) {
        const v = assignment[s]
        if (v === null || v === undefined) continue // No candidates, skip this slot
        slotValueCounts[s][v] = (slotValueCounts[s][v] || 0) + 1
      }
    }
    if (successRun < N / 100) {
      console.warn('Monte Carlo sampling did not find enough valid runs:', successRun, 'out of', N)
    }
    // Compute probabilities
    return slotValueCounts.map((counts, idx) => {
      let total = 0
      const slots = []
      Object.entries(counts).forEach(([val, count]) => {
        total += count
        const digit = (Number(val) * 10) % 10
        const color = digit === 0 ? 'blue' : digit === 1 ? 'yellow' : 'red'
        slots.push({ value: Number(val), count, color })
      })
      slots.sort((a, b) => b.count - a.count)

      return {
        slots: slots.map((s) => ({
          value: s.value,
          color: s.color,
          probability: total > 0 ? s.count / total : 0,
        })),
        info: slotSets[idx],
      }
    })
  }
}
