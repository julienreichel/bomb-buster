// Player model
export class Player {
  constructor({ id, name, hand = [] }) {
    this.id = id
    this.name = name
    this.hand = hand // Array of WireTile
  }
  // Placeholder for pickCard
  async pickCard() {
    throw new Error('pickCard must be implemented by subclasses')
  }
}

export class HumanPlayer extends Player {
  constructor(opts) {
    super(opts)
    this.isAI = false
  }
  // Set infoToken to true for the picked card
  pickCard(card) {
    const idx = this.hand.findIndex((c) => c.id === card.id)
    if (idx !== -1 && this.hand[idx].color === 'blue') {
      this.hand[idx].infoToken = true
      return idx
    }
    return null
  }
}

export class AIPlayer extends Player {
  constructor(opts) {
    super(opts)
    this.isAI = true
  }
  // Pick a blue card at random
  pickCard() {
    const blueIndexes = this.hand
      .map((card, idx) => (card.color === 'blue' ? idx : -1))
      .filter((idx) => idx !== -1)
    if (blueIndexes.length === 0) return null
    const pick = blueIndexes[Math.floor(Math.random() * blueIndexes.length)]
    this.hand[pick].infoToken = true
    return pick
  }

  // AI logic for picking two cards for play round
  pickPlayCards(gameState) {
    // 0. If all unrevealed cards are red, pick the first red card (no second card)
    const unrevealed = this.hand.filter((c) => !c.revealed)
    if (unrevealed.length > 0 && unrevealed.every((c) => c.color === 'red')) {
      return {
        sourcePlayerIdx: this.id,
        sourceCardId: unrevealed[0].id,
        targetPlayerIdx: null,
        targetCardId: null,
      }
    }
    const valueGroups = unrevealed.reduce((acc, card) => {
      const number = card.color === 'blue' ? card.number : card.color
      acc[number] = acc[number] || []
      acc[number].push(card)
      return acc
    }, {})
    const fourOfAKind = Object.values(valueGroups).find((group) => group.length === 4)
    if (fourOfAKind) {
      return {
        sourcePlayerIdx: this.id,
        sourceCardId: fourOfAKind[0].id,
        targetPlayerIdx: this.id,
        targetCardId: fourOfAKind[1].id,
      }
    }
    // 2. If player has 2 cards with same value (and all other cards of that value in all players are revealed), pick the 2 cards
    const twoOfAKindNum = Object.keys(valueGroups).find((num) => {
      if (valueGroups[num].length !== 2) return false
      // Check if all other cards with this value in all players are revealed
      return gameState.players.every((p) =>
        p.hand.every(
          (card) =>
            (p.id === this.id && valueGroups[num].some((c) => c.id === card.id)) ||
            (card.number != num && card.color === 'blue') ||
            (num === 'yellow' && card.color !== num) ||
            card.revealed,
        ),
      )
    })
    if (twoOfAKindNum) {
      return {
        sourcePlayerIdx: this.id,
        sourceCardId: valueGroups[twoOfAKindNum][0].id,
        targetPlayerIdx: this.id,
        targetCardId: valueGroups[twoOfAKindNum][1].id,
      }
    }
    // 3. For each unrevealed card in current player, if there is a card with same value (unrevealed, infoToken true) in another player
    const infoTokenPick = unrevealed
      .map((myCard) => {
        const found = gameState.players
          .filter((p) => p.id !== this.id)
          .flatMap((p) =>
            p.hand
              .filter((card) => !card.revealed && card.number === myCard.number && card.infoToken)
              .map((card) => ({ p, card })),
          )[0]
        if (found) {
          return {
            sourcePlayerIdx: this.id,
            sourceCardId: myCard.id,
            targetPlayerIdx: found.p.id,
            targetCardId: found.card.id,
          }
        }
        return null
      })
      .find(Boolean)
    if (infoTokenPick) return infoTokenPick
    // --- Improved logic: find the card with the highest probability match in other players ---
    let best = null
    let bestProb = 0

    // For each other player
    for (const other of gameState.players) {
      if (other.id === this.id) continue
      for (let idx = 0; idx < other.hand.length; ++idx) {
        const card = other.hand[idx]
        if (card.revealed) continue
        // Compute candidates for this slot from AI's perspective
        const candidates = gameState.candidatesForSlot(other, idx, this)
        if (!candidates || !candidates.mostProbable) continue
        // Only consider if the most probable value matches a card in AI's hand
        const myMatch = this.hand.find(
          (myCard) =>
            !myCard.revealed && String(myCard.number) === String(candidates.mostProbable.value),
        )
        if (myMatch && candidates.mostProbable.probability > bestProb) {
          bestProb = candidates.mostProbable.probability
          best = {
            sourcePlayerIdx: this.id,
            sourceCardId: myMatch.id,
            targetPlayerIdx: other.id,
            targetCardId: card.id,
          }
        }
      }
    }
    if (best) {
      return best
    }
    // If no valid pick, return null
    return null
  }
}
