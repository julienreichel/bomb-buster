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

  // Helper: get the nearest known wire number to the left of idx, or 1 if not found
  static nearestKnownLeft(player, idx) {
    for (let i = idx; i >= 0; --i) {
      const c = player.hand[i]
      if (c.revealed || c.infoToken) return c.number
    }
    return 1
  }

  // Helper: get the nearest known wire number to the right of idx, or 12 if not found
  static nearestKnownRight(player, idx) {
    for (let i = idx; i < player.hand.length; ++i) {
      const c = player.hand[i]
      if (c.revealed || c.infoToken) return c.number
    }
    return 12
  }

  // INTERVAL_FOR_SLOT: returns [L_rank, U_rank] for a slot
  static intervalForSlot(player, idx) {
    const L = GameState.nearestKnownLeft(player, idx)
    const U = GameState.nearestKnownRight(player, idx)
    return [L, U]
  }

  // CANDIDATES_FOR_SLOT: returns a Set of possible wire kinds for a slot
  // This version computes remaining counts from all players' hands and the board
  /**
   * Returns a Set of possible wire kinds for a slot.
   * @param {Object} player - The player whose slot is being checked
   * @param {number} idx - The index in the player's hand
   * @param {Object} [currentPlayer] - If provided, all cards of this player are considered visible
   */
  candidatesForSlot(player, idx, currentPlayer = null) {
    const [L, U] = GameState.intervalForSlot(player, idx)
    const S = new Set()

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
    // For blue, check if not present in play
    for (let k = 1; k <= 12; ++k) {
      if (blueCounts[k] < blueMax && L <= k && k <= U) {
        S.add(k)
      }
    }
    // For yellow, if any left and fits interval
    if (yellowCount < yellowMax) {
      this.yellowWires.forEach((wire) => {
        if (L < wire.number && wire.number < U) {
          S.add('yellow')
        }
      })
    }
    // For red, if any left and fits interval
    if (redCount < redMax) {
      this.redWires.forEach((wire) => {
        if (L < wire.number && wire.number < U) {
          S.add('red')
        }
      })
    }
    return S
  }
}
