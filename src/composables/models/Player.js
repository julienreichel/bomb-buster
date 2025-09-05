// Player model
import WireTile from './WireTile.js'

export class Player {
  constructor({ id, name, hand = [], doubleDetectorEnabled = true }) {
    this.id = id
    this.name = name
    // Convert plain objects to WireTile instances if needed
    this._hand = []
    this.hand = hand // Use setter to convert
    this.knownWires = [] // Array of WireTile known to this player
    this.hasDoubleDetector = doubleDetectorEnabled // Global flag to enable/disable double detector feature
    this.verbose = false
  }

  // Getter for hand
  get hand() {
    return this._hand
  }

  // Setter for hand that converts plain objects to WireTile instances
  set hand(cards) {
    this._hand = cards.map((card) => (card instanceof WireTile ? card : new WireTile(card)))
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
    if (idx !== -1 && this.hand[idx].isColor('blue')) {
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
      .map((card, idx) => (card.isColor('blue') ? idx : -1))
      .filter((idx) => idx !== -1)
    if (blueIndexes.length === 0) return null

    // Get numbers already picked by other players (cards with infoToken)
    const pickedNumbers = new Set()
    gameState.players.forEach((player) => {
      if (player.id !== this.id) {
        player.hand.forEach((card) => {
          if (card.infoToken && card.isColor('blue')) {
            pickedNumbers.add(card.number)
          }
        })
      }
    })

    // Filter out blue cards with numbers already picked by other players
    blueIndexes = blueIndexes.filter((idx) => !pickedNumbers.has(this.hand[idx].number))
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
      if (this.verbose) console.log('Picked four of a kind:', four)
      return four
    }
    const two = this._pickTwoOfAKind(valueGroups, gameState)
    if (two) {
      if (this.verbose) console.log('Picked two of a kind:', two)
      return two
    }
    const infoToken = this._pickInfoToken(unrevealed, gameState)
    if (infoToken) {
      if (this.verbose) console.log('Picked info token:', infoToken)
      return infoToken
    }
    const best = this._pickBestProbability(gameState)
    if (best) {
      if (this.verbose) console.log('Picked best probability:', best)
      return best
    }
    // Fallback: try edge strategy
    const edge = this._pickEdgeStrategy(gameState)
    if (edge) {
      if (this.verbose) console.log('Picked edge strategy:', edge)
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
      const number = card.isColor('blue') ? card.number : card.color
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
      if (num === 'red') return false // No two of a kind for red

      // Count all unrevealed cards that match this number/color across all players
      const referenceCard = valueGroups[num][0] // Use first card as reference for matching
      const matchingUnrevealedCount = gameState.players
        .flatMap((p) => p.hand)
        .filter((card) => {
          if (card.revealed) return false
          return referenceCard.matches(card)
        }).length

      return matchingUnrevealedCount === 2
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
              .filter((card) => !card.revealed && myCard.matches(card) && card.infoToken)
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
      if (this.verbose) console.log('Deterministic match found')
      return best
    }
    // use monteCarloSlotProbabilities
    const probabilities = gameState.monteCarloSlotProbabilities(slotSets, this, 1000)

    const myCards = this.hand.filter((c) => !c.revealed)
    let bestProb = 0
    let slot = null
    const isLastCard = myCards.length === 1
    myCards.forEach((card) => {
      probabilities.forEach((p) => {
        const target = p.slots.find(
          (s) =>
            Number(s.number) === Number(card.number) ||
            (card.color === 'yellow' && s.color === 'yellow'),
        )
        const redSlot = p.slots.find((s) => s.color === 'red')
        if (!isLastCard && target && redSlot && redSlot?.probability > target.probability / 10) {
          // Most risky pick allowed: target 90%, red 8%
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
    if (this.verbose) console.log('Probabilistic match found:', bestProb, slot)

    // Check for double detector usage if no deterministic solution and bestProb < 90%
    if (!best || bestProb < 0.9) {
      const doubleDetectorPlay = this._checkDoubleDetectorAdvantage(
        gameState,
        probabilities,
        bestProb,
      )
      if (doubleDetectorPlay) {
        if (this.verbose)
          console.log('Double detector advantageous play found:', doubleDetectorPlay)
        return doubleDetectorPlay
      }
    }

    return best || null
  }

  _checkDoubleDetectorAdvantage(gameState, singleCardProbabilities, bestSingleProb) {
    // Only use double detector if we still have it
    if (!this.hasDoubleDetector) return null

    const myCards = this.hand.filter((c) => !c.revealed)
    let bestDoubleDetectorPlay = null
    let bestDoubleDetectorProb = bestSingleProb

    // Group probabilities by player to find best pairs within same player
    const probabilitiesByPlayer = this._groupProbabilitiesByPlayer(singleCardProbabilities)

    // Use existing probability data to find best double detector combinations
    for (const myCard of myCards) {
      const totalMatchingCards = this._countMatchingCards(gameState, myCard)
      const cardPlay = this._findBestDoubleDetectorPlay(
        myCard,
        probabilitiesByPlayer,
        totalMatchingCards,
        bestDoubleDetectorProb,
      )

      if (cardPlay && cardPlay.probability > bestDoubleDetectorProb) {
        bestDoubleDetectorProb = cardPlay.probability
        bestDoubleDetectorPlay = cardPlay.play
      }
    }

    // Only use double detector if it significantly improves our probability
    // Require at least 10% improvement to justify using the double detector
    if (bestDoubleDetectorProb > bestSingleProb + 0.15 || bestDoubleDetectorProb > 0.9) {
      if (this.verbose) {
        console.log(
          `Double detector improves probability from ${bestSingleProb} to ${bestDoubleDetectorProb}`,
        )
      }
      return bestDoubleDetectorPlay
    }

    return null
  }

  _groupProbabilitiesByPlayer(singleCardProbabilities) {
    const probabilitiesByPlayer = new Map()
    singleCardProbabilities.forEach((prob) => {
      const playerId = prob.info.player.id
      if (!probabilitiesByPlayer.has(playerId)) {
        probabilitiesByPlayer.set(playerId, [])
      }
      probabilitiesByPlayer.get(playerId).push(prob)
    })
    return probabilitiesByPlayer
  }

  _countMatchingCards(gameState, myCard) {
    const myCardValue = myCard.isColor('blue') ? myCard.number : myCard.color
    return gameState.players
      .filter((p) => p.id !== this.id)
      .reduce((count, player) => {
        return (
          count +
          player.hand.filter((card) => {
            if (card.revealed) return false
            const cardValue = card.isColor('blue') ? card.number : card.color
            return cardValue === myCardValue
          }).length
        )
      }, 0)
  }

  _findBestDoubleDetectorPlay(myCard, probabilitiesByPlayer, totalMatchingCards, bestProb) {
    let bestPlay = null
    let bestProbability = bestProb

    for (const [, playerProbs] of probabilitiesByPlayer) {
      if (playerProbs.length < 2) continue

      const playerPlay = this._evaluatePlayerCardPairs(
        myCard,
        playerProbs,
        totalMatchingCards,
        bestProbability,
      )

      if (playerPlay && playerPlay.probability > bestProbability) {
        bestProbability = playerPlay.probability
        bestPlay = playerPlay.play
      }
    }

    return bestPlay ? { play: bestPlay, probability: bestProbability } : null
  }

  _evaluatePlayerCardPairs(myCard, playerProbs, totalMatchingCards, bestProb) {
    let bestPlay = null
    let bestProbability = bestProb

    for (let i = 0; i < playerProbs.length - 1; i++) {
      for (let j = i + 1; j < playerProbs.length; j++) {
        const pairResult = this._evaluateCardPair(
          myCard,
          playerProbs[i],
          playerProbs[j],
          totalMatchingCards,
        )

        if (pairResult && pairResult.probability > bestProbability) {
          bestProbability = pairResult.probability
          bestPlay = pairResult.play
        }
      }
    }

    return bestPlay ? { play: bestPlay, probability: bestProbability } : null
  }

  _evaluateCardPair(myCard, prob1, prob2, totalMatchingCards) {
    const prob1Value = this._getProbFromSlot(myCard, prob1.slots)
    const prob2Value = this._getProbFromSlot(myCard, prob2.slots)

    if (prob1Value === 0 || prob2Value === 0) return null

    // Apply joint probability calculation based on number of matching cards
    const doubleDetectorProb =
      totalMatchingCards === 1
        ? Math.min(1.0, prob1Value + prob2Value)
        : Math.min(1.0, prob1Value + prob2Value - prob1Value * prob2Value)

    return {
      probability: doubleDetectorProb,
      play: {
        sourcePlayerIdx: this.id,
        sourceCardId: myCard.id,
        targetPlayerIdx: prob1.info.player.id,
        targetCardId: prob1.info.card.id,
        secondTargetCardId: prob2.info.card.id,
        doubleDetector: true,
      },
    }
  }

  _getProbFromSlot(myCard, slots) {
    for (const slot of slots) {
      if (
        (myCard.isColor('blue') && slot.number === myCard.number) ||
        (myCard.isColor('yellow') && slot.color === 'yellow')
      ) {
        return slot.probability
      }
    }
    return 0
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
