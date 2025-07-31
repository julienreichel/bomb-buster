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
    const unrevealed = this.hand.filter((c) => !c.revealed)
    if (this._allUnrevealedRed(unrevealed)) return this._pickFirstRed(unrevealed)
    const valueGroups = this._groupByValue(unrevealed)
    const four = this._pickFourOfAKind(valueGroups)
    if (four) return four
    const two = this._pickTwoOfAKind(valueGroups, gameState)
    if (two) return two
    const infoToken = this._pickInfoToken(unrevealed, gameState)
    if (infoToken) return infoToken
    const best = this._pickBestProbability(gameState)
    if (best) return best
    return null
  }

  _allUnrevealedRed(unrevealed) {
    return unrevealed.length > 0 && unrevealed.every((c) => c.color === 'red')
  }

  _pickFirstRed(unrevealed) {
    return {
      sourcePlayerIdx: this.id,
      sourceCardId: unrevealed[0].id,
      targetPlayerIdx: null,
      targetCardId: null,
    }
  }

  _groupByValue(unrevealed) {
    return unrevealed.reduce((acc, card) => {
      const number = card.color === 'blue' ? card.number : card.color
      acc[number] = acc[number] || []
      acc[number].push(card)
      return acc
    }, {})
  }

  _pickFourOfAKind(valueGroups) {
    const group = Object.values(valueGroups).find((g) => g.length === 4)
    if (group) {
      return {
        sourcePlayerIdx: this.id,
        sourceCardId: group[0].id,
        targetPlayerIdx: this.id,
        targetCardId: group[1].id,
      }
    }
    return null
  }

  _pickTwoOfAKind(valueGroups, gameState) {
    const num = Object.keys(valueGroups).find((num) => {
      if (valueGroups[num].length !== 2) return false
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
    if (num) {
      return {
        sourcePlayerIdx: this.id,
        sourceCardId: valueGroups[num][0].id,
        targetPlayerIdx: this.id,
        targetCardId: valueGroups[num][1].id,
      }
    }
    return null
  }

  _pickInfoToken(unrevealed, gameState) {
    return unrevealed
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
  }

  _pickBestProbability(gameState) {
    let best = null
    let bestProb = 0
    gameState.players
      .filter((other) => other.id !== this.id)
      .forEach((other) => {
        other.hand.forEach((card, idx) => {
          if (card.revealed) return
          const candidates = gameState.candidatesForSlot(other, idx, this)
          if (!candidates || !candidates.mostProbable) return
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
        })
      })
    return best
  }
}
