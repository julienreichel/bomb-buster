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
      acc[card.number] = acc[card.number] || []
      acc[card.number].push(card)
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
            card.number != num ||
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
    // 4. Otherwise, pick one card at random, and one card at random in another player
    if (unrevealed.length > 0) {
      const myCard = unrevealed[Math.floor(Math.random() * unrevealed.length)]
      // Find other players with at least one unrevealed card
      const others = gameState.players.filter(
        (p) => p.id !== this.id && p.hand.some((c) => !c.revealed),
      )
      if (others.length > 0) {
        const other = others[Math.floor(Math.random() * others.length)]
        const otherUnrev = other.hand.filter((c) => !c.revealed)
        if (otherUnrev.length > 0) {
          const otherCard = otherUnrev[Math.floor(Math.random() * otherUnrev.length)]
          return {
            sourcePlayerIdx: this.id,
            sourceCardId: myCard.id,
            targetPlayerIdx: other.id,
            targetCardId: otherCard.id,
          }
        }
      }
      // Fallback: pick two of own unrevealed if no other options
      if (unrevealed.length >= 2) {
        return {
          sourcePlayerIdx: this.id,
          sourceCardId: unrevealed[0].id,
          targetPlayerIdx: this.id,
          targetCardId: unrevealed[1].id,
        }
      }
    }
    // If no valid pick, return null
    return null
  }
}
