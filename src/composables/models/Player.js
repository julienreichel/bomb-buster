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
}
