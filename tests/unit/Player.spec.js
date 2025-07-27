import { describe, it, expect } from 'vitest'
import { Player, HumanPlayer, AIPlayer } from '../../src/composables/models/Player.js'

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

  it('HumanPlayer pickCard sets infoToken on selected blue card', async () => {
    const human = new HumanPlayer({
      id: 1,
      name: 'Human',
      hand: [
        { id: 'b1', color: 'blue', infoToken: false },
        { id: 'y1', color: 'yellow', infoToken: false },
      ],
    })
    // Simulate UI picking the first card (index 0)
    const pickPromise = human.pickCard()
    // Simulate UI resolving with index 0
    pickPromise.then((idx) => {
      expect(idx).toBe(0)
      expect(human.hand[0].infoToken).toBe(true)
      expect(human.hand[1].infoToken).toBe(false)
    })
    // Actually resolve the promise
    pickPromise.then = Promise.prototype.then // patch for test
    pickPromise.constructor = Promise
    pickPromise.resolve(0)
  })
})
