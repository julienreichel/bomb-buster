import { describe, it, expect } from 'vitest'
import { Player, HumanPlayer, AIPlayer } from '../../src/composables/models/Player.js'
import GameState from '../../src/composables/models/GameState.js'

describe('Player composable', () => {
  it('should create a Player with default values', () => {
    const p = new Player({ id: 1, name: 'Test' })
    expect(p.id).toBe(1)
    expect(p.name).toBe('Test')
    expect(p.hand).toEqual([])
  })

  it('should distinguish between AI and human', () => {
    const ai = new AIPlayer({ id: 2, name: 'AI' })
    const human = new HumanPlayer({ id: 3, name: 'Human' })
    expect(ai.isAI).toBe(true)
    expect(human.isAI).toBe(false)
  })
  describe('pickCard', () => {
    it('AIPlayer pickCard should set infoToken on a blue card', async () => {
      const ai = new AIPlayer({
        id: 1,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', infoToken: false },
          { id: 'r1', color: 'red', infoToken: false },
        ],
      })
      const idx = await ai.pickCard()
      expect(idx).toBe(0)
      expect(ai.hand[0].infoToken).toBe(true)
      expect(ai.hand[1].infoToken).toBe(false)
    })

    it('AIPlayer pickCard returns null if no blue card', async () => {
      const ai = new AIPlayer({
        id: 1,
        name: 'AI',
        hand: [{ id: 'r1', color: 'red', infoToken: false }],
      })
      const idx = await ai.pickCard()
      expect(idx).toBe(null)
    })

    it('HumanPlayer pickCard sets infoToken on selected blue card', () => {
      const human = new HumanPlayer({
        id: 1,
        name: 'Human',
        hand: [
          { id: 'b1', color: 'blue', infoToken: false },
          { id: 'y1', color: 'yellow', infoToken: false },
          { id: 'r1', color: 'red', infoToken: false },
        ],
      })
      // Simulate UI picking the first card (the blue one)
      const idx = human.pickCard(human.hand[0])
      expect(idx).toBe(0)
      expect(human.hand[0].infoToken).toBe(true)
      expect(human.hand[1].infoToken).toBe(false)
      expect(human.hand[2].infoToken).toBe(false)
    })

    it('HumanPlayer pickCard does not allow picking red or yellow cards', () => {
      const human = new HumanPlayer({
        id: 1,
        name: 'Human',
        hand: [
          { id: 'b1', color: 'blue', infoToken: false },
          { id: 'y1', color: 'yellow', infoToken: false },
          { id: 'r1', color: 'red', infoToken: false },
        ],
      })
      // Try to pick yellow
      const idxYellow = human.pickCard(human.hand[1])
      expect(idxYellow).toBe(null)
      expect(human.hand[1].infoToken).toBe(false)
      // Try to pick red
      const idxRed = human.pickCard(human.hand[2])
      expect(idxRed).toBe(null)
      expect(human.hand[2].infoToken).toBe(false)
      // Blue should still be pickable
      const idxBlue = human.pickCard(human.hand[0])
      expect(idxBlue).toBe(0)
      expect(human.hand[0].infoToken).toBe(true)
    })
  })

  describe('pickPlayCards', () => {
    it('AIPlayer with 6 cards, 4 of them the same, picks two matching cards', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 5 },
          { id: 'b2', color: 'blue', number: 5 },
          { id: 'b3', color: 'blue', number: 5 },
          { id: 'b4', color: 'blue', number: 5 },
          { id: 'b5', color: 'blue', number: 2 },
          { id: 'b6', color: 'blue', number: 3 },
        ],
      })
      const gs = new GameState({ players: [ai] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toMatch(/^b[1-4]$/)
      expect(result.targetCardId).toMatch(/^b[1-4]$/)
      expect(result.sourceCardId).not.toBe(result.targetCardId)
    })

    it('AIPlayer with 3 matching, 1 revealed, 4th in another player and revealed', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 7 },
          { id: 'b2', color: 'blue', number: 7 },
          { id: 'b3', color: 'blue', number: 7, revealed: true },
          { id: 'b4', color: 'blue', number: 2 },
          { id: 'b5', color: 'blue', number: 3 },
          { id: 'b6', color: 'blue', number: 4 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [{ id: 'b7', color: 'blue', number: 7, revealed: true }],
      })
      const gs = new GameState({ players: [ai, other] })
      const result = ai.pickPlayCards(gs)
      expect([result.sourceCardId, result.targetCardId]).toContain('b1')
      expect([result.sourceCardId, result.targetCardId]).toContain('b2')
      expect(result.sourcePlayerIdx).toBe(0)
      expect(result.targetPlayerIdx).toBe(0)
    })

    it('AIPlayer with 2 yellow cards, no other players have yellow, picks both yellow', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'y1', color: 'yellow', number: 1.1 },
          { id: 'y2', color: 'yellow', number: 2.1 },
          { id: 'b1', color: 'blue', number: 2 },
          { id: 'b2', color: 'blue', number: 3 },
          { id: 'b3', color: 'blue', number: 4 },
          { id: 'b4', color: 'blue', number: 5 },
        ],
      })
      const other = new AIPlayer({ id: 1, name: 'Other', hand: [] })
      const gs = new GameState({ players: [ai, other] })
      const result = ai.pickPlayCards(gs)
      expect([result.sourceCardId, result.targetCardId]).toContain('y1')
      expect([result.sourceCardId, result.targetCardId]).toContain('y2')
      expect(result.sourcePlayerIdx).toBe(0)
      expect(result.targetPlayerIdx).toBe(0)
    })

    it('AIPlayer with a red card, all 5 blue cards revealed, picks the red card', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'r1', color: 'red', number: 7.5 },
          { id: 'b1', color: 'blue', number: 1, revealed: true },
          { id: 'b2', color: 'blue', number: 2, revealed: true },
          { id: 'b3', color: 'blue', number: 3, revealed: true },
          { id: 'b4', color: 'blue', number: 4, revealed: true },
          { id: 'b5', color: 'blue', number: 5, revealed: true },
        ],
      })
      const gs = new GameState({ players: [ai] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('r1')
      expect(result.sourcePlayerIdx).toBe(0)
    })

    it('AIPlayer picks matching card if another player has infoToken', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 8 },
          { id: 'b2', color: 'blue', number: 2 },
          { id: 'b3', color: 'blue', number: 3 },
          { id: 'b4', color: 'blue', number: 4 },
          { id: 'b5', color: 'blue', number: 5 },
          { id: 'b6', color: 'blue', number: 6 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [{ id: 'b7', color: 'blue', number: 8, infoToken: true }],
      })
      const gs = new GameState({ players: [ai, other] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b1')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('b7')
    })

    it('AIPlayer picks good card if it can be guessed', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b2', color: 'blue', number: 2 },
          { id: 'b3', color: 'blue', number: 3 },
          { id: 'b4', color: 'blue', number: 7 },
          { id: 'b5', color: 'blue', number: 8 },
          { id: 'b6', color: 'blue', number: 10 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b7', color: 'blue', number: 7 },
          { id: 'b8', color: 'blue', number: 8, revealed: true },
          { id: 'b9', color: 'blue', number: 8 },
          { id: 'b10', color: 'blue', number: 8, revealed: true },
          { id: 'b11', color: 'blue', number: 9 },
        ],
      })
      const gs = new GameState({ players: [ai, other] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b5')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('b9')
    })

    it('AIPlayer picks most probable card', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b2', color: 'blue', number: 2 },
          { id: 'b3', color: 'blue', number: 3 },
          { id: 'b4', color: 'blue', number: 7 },
          { id: 'b5', color: 'blue', number: 8 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b6', color: 'blue', number: 6 },
          { id: 'b7', color: 'blue', number: 7, revealed: true },
          { id: 'b8', color: 'blue', number: 7, revealed: true },
          { id: 'b9', color: 'blue', number: 8 },
          { id: 'b10', color: 'blue', number: 8, revealed: true },
          { id: 'b11', color: 'blue', number: 9 },
        ],
      })
      const gs = new GameState({ players: [ai, other] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b5')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('b9')
    })

    it('AIPlayer picks a card even is not very likelly', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b2', color: 'blue', number: 2 },
          { id: 'b3', color: 'blue', number: 3 },
          { id: 'b4', color: 'blue', number: 8 },
          { id: 'b5', color: 'blue', number: 10 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b6', color: 'blue', number: 6 },
          { id: 'b8', color: 'blue', number: 7, revealed: true },
          { id: 'b9', color: 'blue', number: 8 },
          { id: 'b10', color: 'blue', number: 8, revealed: true },
          { id: 'b11', color: 'blue', number: 8, revealed: true },
        ],
      })
      const gs = new GameState({ players: [ai, other] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b4')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('b9')
    })
  })
})
