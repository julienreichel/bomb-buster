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
        ],
      })
      const other2 = new AIPlayer({
        id: 2,
        name: 'Other2',
        hand: [
          { id: 'b12', color: 'blue', number: 7 },
          { id: 'b13', color: 'blue', number: 8 },
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
      expect(result.targetCardId).toBe('r1')
    })
  })
})
