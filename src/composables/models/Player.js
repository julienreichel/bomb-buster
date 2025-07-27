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
  // Wait for user to pick a blue card (UI integration needed)
  async pickCard() {
    // This should be implemented in the UI layer, here we just return null
    return new Promise((resolve) => {
      // UI should call resolve(cardIndex) when user picks
      // When resolved, set infoToken to true
      // Example usage in UI: resolve(cardIndex)
    }).then((cardIndex) => {
      if (
        typeof cardIndex === 'number' &&
        this.hand[cardIndex] &&
        this.hand[cardIndex].color === 'blue'
      ) {
        this.hand[cardIndex].infoToken = true
        return cardIndex
      }
      return null
    })
  }
}

export class AIPlayer extends Player {
  constructor(opts) {
    super(opts)
    this.isAI = true
  }
  // Pick a blue card at random
  async pickCard() {
    const blueIndexes = this.hand
      .map((card, idx) => (card.color === 'blue' ? idx : -1))
      .filter((idx) => idx !== -1)
    if (blueIndexes.length === 0) return null
    const pick = blueIndexes[Math.floor(Math.random() * blueIndexes.length)]
    this.hand[pick].infoToken = true
    return pick
  }
}
