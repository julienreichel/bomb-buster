// Player model
export class Player {
  constructor({ id, name, hand = [] }) {
    this.id = id
    this.name = name
    this.hand = hand // Array of WireTile
    this.knownWires = [] // Array of WireTile known to this player
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
  // Improved: Pick the blue card that, if infoToken is set, minimizes the sum of candidatesForSlot set sizes for all cards
  pickCard(gameState) {
    // Only consider blue cards
    let blueIndexes = this.hand
      .map((card, idx) => (card.color === 'blue' ? idx : -1))
      .filter((idx) => idx !== -1)
    if (blueIndexes.length === 0) return null

    // Rule: if you have 3 blue cards of the same number, only consider those
    const blueNumberCounts = {}
    blueIndexes.forEach((idx) => {
      const num = this.hand[idx].number
      blueNumberCounts[num] = (blueNumberCounts[num] || 0) + 1
    })
    const tripleNum = Object.keys(blueNumberCounts).find((num) => blueNumberCounts[num] === 3)
    if (tripleNum !== undefined) {
      blueIndexes = blueIndexes.filter((idx) => String(this.hand[idx].number) === String(tripleNum))
    }

    let bestIdx = null
    let bestSum = Infinity
    for (const idx of blueIndexes) {
      // Simulate infoToken on this card
      const original = this.hand[idx].infoToken
      this.hand[idx].infoToken = true
      // Compute sum of set sizes for all cards
      const sum = this.hand.reduce((acc, card, i) => {
        // Use gameState if available, else fallback to no deduction
        const candidates = gameState.candidatesForSlot(this, i)
        return acc + Math.min(4, candidates.size)
      }, 0)
      this.hand[idx].infoToken = original
      if (sum < bestSum) {
        bestSum = sum
        bestIdx = idx
      }
    }
    if (bestIdx !== null) {
      this.hand[bestIdx].infoToken = true
      return bestIdx
    }
    // fallback to random
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
    if (four) {
      console.log('Picked four of a kind:', four)
      return four
    }
    const two = this._pickTwoOfAKind(valueGroups, gameState)
    if (two) {
      console.log('Picked two of a kind:', two)
      return two
    }
    const infoToken = this._pickInfoToken(unrevealed, gameState)
    if (infoToken) {
      console.log('Picked info token:', infoToken)
      return infoToken
    }
    const best = this._pickBestProbability(gameState)
    if (best) {
      console.log('Picked best probability:', best)
      return best
    }
    // Fallback: try edge strategy
    const edge = this._pickEdgeStrategy(gameState)
    if (edge) {
      console.log('Picked edge strategy:', edge)
      return edge
    }
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
    const slotSets = []
    gameState.players
      .filter((other) => other.id !== this.id)
      .forEach((other) => {
        other.hand.forEach((card, idx) => {
          if (card.revealed || card.infoToken) return
          const candidates = gameState.candidatesForSlot(other, idx, this)
          slotSets.push({ player: other, card, candidates })
          if (candidates.size === 1) {
            const value = candidates.entries().next().value[0]
            const myMatch = this.hand.find(
              (myCard) => !myCard.revealed && String(myCard.number) === String(value),
            )
            if (myMatch) {
              best = {
                sourcePlayerIdx: this.id,
                sourceCardId: myMatch.id,
                targetPlayerIdx: other.id,
                targetCardId: card.id,
              }
            }
          }
        })
      })
    if (best) {
      console.log('Deterministic match found')
      return best
    }
    // use monteCarloSlotProbabilities
    const probabilities = gameState.monteCarloSlotProbabilities(slotSets, this, 10000)

    const myCards = this.hand.filter((c) => !c.revealed)
    let bestProb = 0
    let slot = null
    myCards.forEach((card) => {
      probabilities.forEach((p) => {
        const target = p.slots.find(
          (s) =>
            Number(s.value) === Number(card.number) ||
            (card.color === 'yellow' && s.color === 'yellow'),
        )
        const redSlot = p.slots.find((s) => s.color === 'red')
        if (target && redSlot && redSlot?.probability > target.probability / 4) {
          // Most risky pick allowed: target 80%, red 20%
          return
        }
        if (target && target.probability > bestProb) {
          bestProb = target.probability
          slot = p.slots
          best = {
            sourcePlayerIdx: this.id,
            sourceCardId: card.id,
            targetPlayerIdx: p.info.player.id,
            targetCardId: p.info.card.id,
          }
        }
      })
    })
    console.log('Probabilistic match found:', bestProb, slot)
    return best || null
  }

  _pickEdgeStrategy(gameState) {
    // Try 1/first, 12/last, 2/first, 11/last, 3/first, 10/last
    const fallbackPairs = [
      { my: 1, other: 'first' },
      { my: 12, other: 'last' },
      { my: 2, other: 'first' },
      { my: 11, other: 'last' },
      { my: 3, other: 'first' },
      { my: 10, other: 'last' },
    ]
    for (const { my, other } of fallbackPairs) {
      const myCard = this.hand.find((c) => !c.revealed && c.number === my)
      if (!myCard) continue
      for (const p of gameState.players) {
        if (p.id === this.id) continue
        if (!p.hand.length) continue
        let targetCard = null
        if (other === 'first') {
          const first = p.hand[0]
          if (first && !first.revealed) targetCard = first
        } else if (other === 'last') {
          const last = p.hand[p.hand.length - 1]
          if (last && !last.revealed) targetCard = last
        }
        if (targetCard) {
          return {
            sourcePlayerIdx: this.id,
            sourceCardId: myCard.id,
            targetPlayerIdx: p.id,
            targetCardId: targetCard.id,
          }
        }
      }
    }
    // If no edge found, pick the first valid card in hand and the first possible card in the first other player's hand
    const myCard = this.hand.find((c) => !c.revealed)
    const otherPlayer = gameState.players.find(
      (p) => p.id !== this.id && p.hand.some((c) => !c.revealed),
    )
    if (myCard && otherPlayer) {
      const targetCard = otherPlayer.hand.find((c) => !c.revealed)
      if (targetCard) {
        return {
          sourcePlayerIdx: this.id,
          sourceCardId: myCard.id,
          targetPlayerIdx: otherPlayer.id,
          targetCardId: targetCard.id,
        }
      }
    }
    return null
  }
}
