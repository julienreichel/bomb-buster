import { describe, expect, it } from 'vitest'
import GameState from '../../src/composables/models/GameState.js'
import { AIPlayer, HumanPlayer, Player } from '../../src/composables/models/Player.js'
import WireTile from '../../src/composables/models/WireTile.js'

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
          { id: 'b1', color: 'blue', number: 1, infoToken: false },
          { id: 'r1', color: 'red', number: 1.5, infoToken: false },
        ],
      })
      const gs = new GameState({ players: [ai], yellowWires: [], redWires: [] })
      const idx = await ai.pickCard(gs)
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
      const gs = new GameState({ players: [ai], yellowWires: [], redWires: [] })
      const idx = await ai.pickCard(gs)
      expect(idx).toBe(null)
    })

    it('AIPlayer pickCard pick best cards', async () => {
      const ai = new AIPlayer({
        id: 1,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 2, infoToken: false },
          { id: 'b2', color: 'blue', number: 12, infoToken: false },
          { id: 'b3', color: 'blue', number: 12, infoToken: false },
        ],
      })
      const gs = new GameState({ players: [ai], yellowWires: [], redWires: [] })
      const idx = await ai.pickCard(gs)
      expect(idx).toBe(1)
      expect(ai.hand[0].infoToken).toBe(false)
      expect(ai.hand[1].infoToken).toBe(true)
      expect(ai.hand[2].infoToken).toBe(false)
    })

    it('AIPlayer pickCard pick from tripple if any', async () => {
      const ai = new AIPlayer({
        id: 1,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 2, infoToken: false },
          { id: 'b2', color: 'blue', number: 11, infoToken: false },
          { id: 'b3', color: 'blue', number: 11, infoToken: false },
          { id: 'b4', color: 'blue', number: 11, infoToken: false },
          { id: 'b5', color: 'blue', number: 12, infoToken: false },
          { id: 'b6', color: 'blue', number: 12, infoToken: false },
        ],
      })
      const gs = new GameState({ players: [ai], yellowWires: [], redWires: [] })
      const idx = await ai.pickCard(gs)
      expect(idx).toBe(1)
      expect(ai.hand[0].infoToken).toBe(false)
      expect(ai.hand[1].infoToken).toBe(true)
      expect(ai.hand[4].infoToken).toBe(false)
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

    it('AIPlayer pickCard avoids numbers already picked by other players', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 5, infoToken: false },
          { id: 'b2', color: 'blue', number: 7, infoToken: false },
          { id: 'b3', color: 'blue', number: 9, infoToken: false },
        ],
      })
      const otherPlayer = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b4', color: 'blue', number: 5, infoToken: true }, // Already picked number 5
          { id: 'b5', color: 'blue', number: 8, infoToken: false },
        ],
      })
      const gs = new GameState({ players: [ai, otherPlayer], yellowWires: [], redWires: [] })

      const idx = ai.pickCard(gs)

      // Should not pick number 5 (already picked by other player)
      // Should pick either number 7 or 9
      expect(idx).not.toBe(0) // Index 0 is number 5
      expect([1, 2].includes(idx)).toBe(true) // Should be index 1 (number 7) or 2 (number 9)
      expect(ai.hand[idx].infoToken).toBe(true)
      expect(ai.hand[idx].number).not.toBe(5)
    })
  })

  describe('pickPlayCards', () => {
    it('picks two matching cards when 4 cards are present', () => {
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

    it('picks two of a kind, when other 2 are revealed (player has 3)', () => {
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

    it('picks two of a kind, when other 2 are revealed (and there is a red in the game)', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b4', color: 'blue', number: 2 },
          { id: 'b5', color: 'blue', number: 3 },
          { id: 'b6', color: 'blue', number: 4 },
          { id: 'b1', color: 'blue', number: 7 },
          { id: 'b2', color: 'blue', number: 7 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'r1', color: 'red', number: 2.1 },
          { id: 'b7', color: 'blue', number: 7, revealed: true },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [{ id: 'b8', color: 'blue', number: 7, revealed: true }],
      })
      const gs = new GameState({ players: [ai, other, other2] })
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
          { id: 'b1', color: 'blue', number: 2 },
          { id: 'y2', color: 'yellow', number: 2.1 },
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

    it('does not pick 2 red cards', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'r1', color: 'red', number: 1.5 },
          { id: 'b1', color: 'blue', number: 2 },
          { id: 'r2', color: 'red', number: 2.5 },
          { id: 'b2', color: 'blue', number: 3 },
          { id: 'b3', color: 'blue', number: 4 },
          { id: 'b4', color: 'blue', number: 5 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [{ id: 'b5', color: 'blue', number: 5, infoToken: true }],
      })
      const gs = new GameState({ players: [ai, other] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b4')
      expect(result.targetCardId).toBe('b5')
      expect(result.sourcePlayerIdx).toBe(0)
      expect(result.targetPlayerIdx).toBe(1)
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
          { id: 'b2', color: 'blue', number: 2 },
          { id: 'b3', color: 'blue', number: 3 },
          { id: 'b4', color: 'blue', number: 4 },
          { id: 'b5', color: 'blue', number: 5 },
          { id: 'b6', color: 'blue', number: 6 },
          { id: 'b1', color: 'blue', number: 8 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b7', color: 'blue', number: 2 },
          { id: 'b8', color: 'blue', number: 8, infoToken: true },
        ],
      })
      const gs = new GameState({ players: [ai, other] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b1')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('b8')
    })

    it('AIPlayer picks matching card if no other choices are left', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b0', color: 'blue', number: 6, revealed: true },
          { id: 'b1', color: 'blue', number: 6 },
          { id: 'b2', color: 'blue', number: 7, revealed: true },
          { id: 'b3', color: 'blue', number: 7, revealed: true },
          { id: 'b4', color: 'blue', number: 7, revealed: true },
          { id: 'b5', color: 'blue', number: 8 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b6', color: 'blue', number: 6, revealed: true },
          { id: 'b7', color: 'blue', number: 6 },
          { id: 'b8', color: 'blue', number: 7, revealed: true },
          { id: 'b9', color: 'blue', number: 8 },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b10', color: 'blue', number: 8 },
          { id: 'b11', color: 'blue', number: 9 },
        ],
      })
      const gs = new GameState({ players: [ai, other, other2] })
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
          { id: 'b2', color: 'blue', number: 6 },
          { id: 'b3', color: 'blue', number: 7 },
          { id: 'b4', color: 'blue', number: 8 },
          { id: 'b5', color: 'blue', number: 9 },
          { id: 'b6', color: 'blue', number: 10 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b7', color: 'blue', number: 7 },
          { id: 'b8', color: 'blue', number: 7, revealed: true },
          { id: 'b9', color: 'blue', number: 8 },
          { id: 'b10', color: 'blue', number: 8, revealed: true },
          { id: 'b11', color: 'blue', number: 9 },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b12', color: 'blue', number: 6 },
          { id: 'b8', color: 'blue', number: 10, revealed: true },
          { id: 'b13', color: 'blue', number: 10 },
        ],
      })
      const gs = new GameState({ players: [ai, other, other2] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b6')
      expect(result.targetPlayerIdx).toBe(2)
      expect(result.targetCardId).toBe('b13')
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
          { id: 'b11b', color: 'blue', number: 10 },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b12', color: 'blue', number: 7 },
          { id: 'b13', color: 'blue', number: 8 },
          { id: 'b13b', color: 'blue', number: 10 },
        ],
      })
      const gs = new GameState({ players: [ai, other, other2] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b5')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('b9')
    })

    it('AIPlayer picks a card even is not corect one', () => {
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
          { id: 'b6', color: 'blue', number: 7 },
          { id: 'b8', color: 'blue', number: 7, revealed: true },
          { id: 'b9', color: 'blue', number: 8 },
          { id: 'b10', color: 'blue', number: 8, revealed: true },
          { id: 'b11', color: 'blue', number: 8, revealed: true },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b12', color: 'blue', number: 6 },
          { id: 'b13', color: 'blue', number: 7 },
          { id: 'b14', color: 'blue', number: 7 },
        ],
      })
      const gs = new GameState({ players: [ai, other, other2] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b4')
      // targetCardId can be either b9 or b14
      expect(['b9', 'b14'].includes(result.targetCardId)).toBe(true)
    })

    it('AIPlayer picks yellow card', () => {
      const y1 = { id: 'y1', color: 'yellow', number: 3.1 }
      const y2 = { id: 'y2', color: 'yellow', number: 7.1 }
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [{ id: 'b2', color: 'blue', number: 2 }, { id: 'b3', color: 'blue', number: 3 }, y1],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b6', color: 'blue', number: 6 },
          { id: 'b7', color: 'blue', number: 7, revealed: true },
          { id: 'b8', color: 'blue', number: 7, revealed: true },
          y2,
          { id: 'b10', color: 'blue', number: 8, revealed: true },
          { id: 'b11', color: 'blue', number: 9 },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b12', color: 'blue', number: 7 },
          { id: 'b13', color: 'blue', number: 8, revealed: true },
          { id: 'b14', color: 'blue', number: 8 },
          { id: 'b5', color: 'blue', number: 8 },
        ],
      })
      const gs = new GameState({ players: [ai, other, other2], yellowWires: [y1, y2] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('y1')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('y2')
    })

    it('AIPlayer do not picks red card', () => {
      const r1 = { id: 'r1', color: 'red', number: 3.5 }
      const r2 = { id: 'r2', color: 'red', number: 7.5 }
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b2', color: 'blue', number: 2 },
          { id: 'b3', color: 'blue', number: 3 },
          r1,
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
          r2,
          { id: 'b10', color: 'blue', number: 8, revealed: true },
          { id: 'b11', color: 'blue', number: 9 },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b12', color: 'blue', number: 7, revealed: true },
          { id: 'b13', color: 'blue', number: 8, revealed: true },
          { id: 'b14', color: 'blue', number: 8 },
        ],
      })
      const gs = new GameState({ players: [ai, other, other2], redWires: [r1, r2] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b5')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('b11')
    })

    it('do not picks potential red card', () => {
      const r1 = { id: 'r1', color: 'red', number: 3.5 }
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 3, revealed: true },
          { id: 'b2', color: 'blue', number: 3 },
          { id: 'b3', color: 'blue', number: 4, revealed: true },
          { id: 'b4', color: 'blue', number: 5, revealed: true },
          { id: 'b5', color: 'blue', number: 6 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b11', color: 'blue', number: 2, revealed: true },
          { id: 'b12', color: 'blue', number: 3 },
          { id: 'b13', color: 'blue', number: 3, revealed: true },
          r1,
          { id: 'b14', color: 'blue', number: 4 },
          { id: 'b15', color: 'blue', number: 4, revealed: true },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b21', color: 'blue', number: 2 },
          { id: 'b22', color: 'blue', number: 2 },
          { id: 'b23', color: 'blue', number: 2 },
          { id: 'b24', color: 'blue', number: 4, revealed: true },
        ],
      })
      const gs = new GameState({ players: [ai, other, other2], redWires: [r1] })
      const result = ai.pickPlayCards(gs)
      expect(result.sourceCardId).toBe('b2')
      expect(result.targetPlayerIdx).toBe(1)
      expect(result.targetCardId).toBe('b12')
    })

    it('do not picks potential red card unles it is the last one', () => {
      const r1 = { id: 'r1', color: 'red', number: 3.5 }
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 3, revealed: true },
          { id: 'b2', color: 'blue', number: 3 },
          { id: 'b3', color: 'blue', number: 4, revealed: true },
          { id: 'b4', color: 'blue', number: 5, revealed: true },
        ],
        doubleDetectorEnabled: false,
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b11', color: 'blue', number: 2, revealed: true },
          { id: 'b12', color: 'blue', number: 3 },
          { id: 'b13', color: 'blue', number: 3, revealed: true },
          r1,
          { id: 'b14', color: 'blue', number: 4 },
          { id: 'b15', color: 'blue', number: 4, revealed: true },
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b21', color: 'blue', number: 2 },
          { id: 'b22', color: 'blue', number: 2 },
          { id: 'b23', color: 'blue', number: 2 },
          { id: 'b24', color: 'blue', number: 4, revealed: true },
        ],
      })
      const gs = new GameState({ players: [ai, other, other2], redWires: [r1] })
      const result = ai.pickPlayCards(gs)
      expect(result).toMatchObject({
        sourceCardId: 'b2',
        sourcePlayerIdx: 0,
        targetCardId: 'r1',
        targetPlayerIdx: 1,
      })
    })
  })

  describe('_pickEdgeStrategy', () => {
    it('should use edge strategy when no other options available', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 1 },
          { id: 'b2', color: 'blue', number: 2 },
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b3', color: 'blue', number: 3 },
          { id: 'b4', color: 'blue', number: 4 },
        ],
      })
      const gs = new GameState({ players: [ai, other] })

      const result = ai._pickEdgeStrategy(gs)
      expect(result).toBeTruthy()
      expect(result.sourcePlayerIdx).toBe(0)
      expect(result.targetPlayerIdx).toBe(1)
    })

    it('should return null when no cards available', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [],
      })
      const gs = new GameState({ players: [ai, other] })

      const result = ai._pickEdgeStrategy(gs)
      expect(result).toBe(null)
    })

    it('should handle first and last edge card selections', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b1', color: 'blue', number: 1, revealed: false }, // lowest value
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b2', color: 'blue', number: 2, revealed: false },
          { id: 'b3', color: 'blue', number: 3, revealed: false },
        ],
      })
      const gs = new GameState({ players: [ai, other] })

      const result = ai._pickEdgeStrategy(gs)
      expect(result).toBeTruthy()
      expect(result.targetCardId).toBe('b2') // should pick first card
    })

    it('should handle last edge card selection for high values', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b10', color: 'blue', number: 10, revealed: false }, // highest value
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b2', color: 'blue', number: 2, revealed: false },
          { id: 'b3', color: 'blue', number: 3, revealed: false },
        ],
      })
      const gs = new GameState({ players: [ai, other] })

      const result = ai._pickEdgeStrategy(gs)
      expect(result).toBeTruthy()
      expect(result.targetCardId).toBe('b3') // should pick last card
    })

    it('should fall back to first available cards when no edge found', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [
          { id: 'b5', color: 'blue', number: 5, revealed: false }, // middle value
        ],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [{ id: 'b6', color: 'blue', number: 6, revealed: false }],
      })
      const gs = new GameState({ players: [ai, other] })

      const result = ai._pickEdgeStrategy(gs)
      expect(result).toBeTruthy()
      expect(result.sourceCardId).toBe('b5')
      expect(result.targetCardId).toBe('b6')
    })

    it('should return null when no other players have unrevealed cards', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [{ id: 'b1', color: 'blue', number: 1, revealed: false }],
      })
      const other = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'b2', color: 'blue', number: 2, revealed: true }, // all revealed
        ],
      })
      const gs = new GameState({ players: [ai, other] })

      const result = ai._pickEdgeStrategy(gs)
      expect(result).toBe(null)
    })
  })

  describe('_allUnrevealedRed', () => {
    it('should return true when all unrevealed cards are red', () => {
      const ai = new AIPlayer({ id: 0, name: 'AI', hand: [] })
      const redCards = [
        { id: 'r1', color: 'red', revealed: false },
        { id: 'r2', color: 'red', revealed: false },
      ]

      expect(ai._allUnrevealedRed(redCards)).toBe(true)
    })

    it('should return false when some unrevealed cards are not red', () => {
      const ai = new AIPlayer({ id: 0, name: 'AI', hand: [] })
      const mixedCards = [
        { id: 'r1', color: 'red', revealed: false },
        { id: 'b1', color: 'blue', revealed: false },
      ]

      expect(ai._allUnrevealedRed(mixedCards)).toBe(false)
    })

    it('should return false when array is empty', () => {
      const ai = new AIPlayer({ id: 0, name: 'AI', hand: [] })

      expect(ai._allUnrevealedRed([])).toBe(false)
    })
  })

  describe('Double Detector AI Logic', () => {
    it('should use double detector when regular probability is low and safe double detector play exists', () => {
      // Create AI player with double detector and a blue card
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [{ id: 'ai_blue1', color: 'blue', number: 5, revealed: false }],
        hasDoubleDetector: true,
      })

      // Create other player with cards that guarantee a match
      const otherPlayer = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'other_blue1', color: 'blue', number: 5, revealed: false, infoToken: false },
          { id: 'other_blue2', color: 'blue', number: 6, revealed: false, infoToken: false },
        ],
      })

      // Mock game state with candidates that show both cards are number 5
      const gameState = {
        players: [ai, otherPlayer],
        // eslint-disable-next-line no-unused-vars
        candidatesForSlot: (player, cardIndex) => {
          // Both target cards are guaranteed to be blue number 5
          return new Set([
            { color: 'blue', number: 5 },
            { color: 'blue', number: 6 },
          ])
        },
        monteCarloSlotProbabilities: () => {
          return [
            {
              info: { player: otherPlayer, card: otherPlayer.hand[0] },
              slots: [
                { color: 'blue', number: 5, probability: 0.7 },
                { color: 'blue', number: 6, probability: 0.3 },
              ],
            },
            {
              info: { player: otherPlayer, card: otherPlayer.hand[1] },
              slots: [
                { color: 'blue', number: 5, probability: 0.3 },
                { color: 'blue', number: 6, probability: 0.7 },
              ],
            },
          ]
        },
      }

      const result = ai._pickBestProbability(gameState)

      // Should return double detector play
      expect(result).toBeTruthy()
      expect(result).toMatchObject({
        doubleDetector: true,
        secondTargetCardId: 'other_blue2',
        sourceCardId: 'ai_blue1',
        sourcePlayerIdx: 0,
        targetCardId: 'other_blue1',
        targetPlayerIdx: 1,
      })
    })

    it('should not use double detector when player does not have it', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [{ id: 'ai_blue1', color: 'blue', number: 5, revealed: false }],
      })
      // Explicitly set hasDoubleDetector to false after construction
      ai.hasDoubleDetector = false

      const result = ai._checkDoubleDetectorAdvantage({}, [], 0.7)
      expect(result).toBeNull()
    })

    it('should not use double detector when advantage is insufficient', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [{ id: 'ai_blue1', color: 'blue', number: 5, revealed: false }],
        hasDoubleDetector: true,
      })

      const otherPlayer = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'other_unknown1', color: 'blue', number: 1, revealed: false, infoToken: false },
          { id: 'other_unknown2', color: 'blue', number: 6, revealed: false, infoToken: false },
        ],
      })
      const otherPlayer2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'other_unknown3', color: 'red', number: 1.5, revealed: false, infoToken: false },
          { id: 'other_unknown4', color: 'blue', number: 5, revealed: false, infoToken: false },
        ],
      })

      const gameState = {
        players: [ai, otherPlayer, otherPlayer2],
      }

      const probabilities = [
        {
          info: { player: otherPlayer, card: otherPlayer.hand[0] },
          slots: [{ color: 'blue', number: 5, probability: 0.1 }],
        },
        {
          info: { player: otherPlayer, card: otherPlayer.hand[1] },
          slots: [{ color: 'blue', number: 5, probability: 0.4 }],
        },
        {
          info: { player: otherPlayer2, card: otherPlayer2.hand[0] },
          slots: [{ color: 'blue', number: 5, probability: 0.1 }],
        },
        {
          info: { player: otherPlayer2, card: otherPlayer2.hand[1] },
          slots: [{ color: 'blue', number: 5, probability: 0.4 }],
        },
      ]
      const result = ai._checkDoubleDetectorAdvantage(gameState, probabilities, 0.4)
      expect(result).toBeNull()
    })

    it('should use double detector when it provides significant advantage', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [{ id: 'ai_yellow1', color: 'yellow', number: 3.1, revealed: false }],
        hasDoubleDetector: true,
      })

      const otherPlayer = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'other_other_blue', color: 'blue', number: 7, revealed: false, infoToken: false },
          { id: 'other_yellow2', color: 'yellow', number: 8.1, revealed: false, infoToken: false },
        ],
      })

      const gameState = {
        players: [ai, otherPlayer],
      }

      // Single card probability is 0.5, double detector gives 1.0 (improvement of 0.5 > 0.2 threshold)
      const probabilities = [
        {
          info: { player: otherPlayer, card: otherPlayer.hand[0] },
          slots: [
            { color: 'blue', number: 7, probability: 0.5 },
            { color: 'yellow', number: 8.1, probability: 0.5 },
          ],
        },
        {
          info: { player: otherPlayer, card: otherPlayer.hand[1] },
          slots: [
            { color: 'blue', number: 7, probability: 0.5 },
            { color: 'yellow', number: 8.1, probability: 0.5 },
          ],
        },
      ]
      const result = ai._checkDoubleDetectorAdvantage(gameState, probabilities, 0.5)
      expect(result).toBeTruthy()
      expect(result).toMatchObject({
        doubleDetector: true,
        secondTargetCardId: 'other_yellow2',
        sourceCardId: 'ai_yellow1',
        sourcePlayerIdx: 0,
        targetCardId: 'other_other_blue',
        targetPlayerIdx: 1,
      })
    })

    it('should not use double detector when doubleDetectorEnabled is false', () => {
      const ai = new AIPlayer({
        id: 0,
        name: 'AI',
        hand: [{ id: 'ai_yellow1', color: 'yellow', number: 3.1, revealed: false }],
        doubleDetectorEnabled: false, // Feature disabled globally
      })

      const otherPlayer = new AIPlayer({
        id: 1,
        name: 'Other',
        hand: [
          { id: 'other_other_blue', color: 'blue', number: 7, revealed: false, infoToken: false },
          { id: 'other_yellow2', color: 'yellow', number: 8.1, revealed: false, infoToken: false },
        ],
      })

      const gameState = {
        players: [ai, otherPlayer],
      }

      // Even with good probabilities, should not use double detector when feature is disabled
      const probabilities = [
        {
          info: { player: otherPlayer, card: otherPlayer.hand[0] },
          slots: [
            { color: 'blue', number: 7, probability: 0.5 },
            { color: 'yellow', number: 8.1, probability: 0.5 },
          ],
        },
        {
          info: { player: otherPlayer, card: otherPlayer.hand[1] },
          slots: [
            { color: 'blue', number: 7, probability: 0.5 },
            { color: 'yellow', number: 8.1, probability: 0.5 },
          ],
        },
      ]
      const result = ai._checkDoubleDetectorAdvantage(gameState, probabilities, 0.5)
      expect(result).toBeNull()
    })
  })

  describe('Double Detector Helper Functions', () => {
    describe('_groupProbabilitiesByPlayer', () => {
      it('should group probabilities by player ID', () => {
        const ai = new AIPlayer({ id: 0, name: 'AI' })
        const probabilities = [
          { info: { player: { id: 1 }, card: { id: 'a' } }, slots: [] },
          { info: { player: { id: 1 }, card: { id: 'b' } }, slots: [] },
          { info: { player: { id: 2 }, card: { id: 'c' } }, slots: [] },
        ]

        const result = ai._groupProbabilitiesByPlayer(probabilities)

        expect(result.size).toBe(2)
        expect(result.get(1)).toHaveLength(2)
        expect(result.get(2)).toHaveLength(1)
      })
    })

    describe('_countMatchingCards', () => {
      it('should count matching blue cards across other players', () => {
        const ai = new AIPlayer({ id: 0, name: 'AI' })
        const myCard = new WireTile({ color: 'blue', number: 5 })
        const gameState = {
          players: [
            { id: 0, hand: [myCard] },
            {
              id: 1,
              hand: [
                new WireTile({ color: 'blue', number: 5 }),
                new WireTile({ color: 'blue', number: 3 }),
              ],
            },
            {
              id: 2,
              hand: [new WireTile({ color: 'blue', number: 5 })],
            },
          ],
        }

        const result = ai._countMatchingCards(gameState, myCard)
        expect(result).toBe(2)
      })
    })
  })
})
