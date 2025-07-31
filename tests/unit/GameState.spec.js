import { describe, it, expect } from 'vitest'
import GameState from '../../src/composables/models/GameState.js'

describe('GameState composable', () => {
  it('nearestKnownLeft and nearestKnownRight work as expected', () => {
    const player = {
      hand: [
        { id: 1, color: 'blue', number: 2 },
        { id: 2, color: 'yellow', number: 3 },
        { id: 3, color: 'blue', number: 4, revealed: true },
        { id: 4, color: 'red', number: 5 },
        { id: 5, color: 'blue', number: 6, infoToken: true },
        { id: 6, color: 'yellow', number: 7 },
      ],
    }
    // idx 0: no known left, should return 1
    expect(GameState.nearestKnownLeft(player, 0)).toBe(1)
    // idx 2: current is known
    expect(GameState.nearestKnownLeft(player, 2)).toBe(4)
    // idx 3: left is idx 2 (revealed: 4)
    expect(GameState.nearestKnownLeft(player, 3)).toBe(4)
    // idx 5: left is idx 4 (infoToken: 6)
    expect(GameState.nearestKnownLeft(player, 5)).toBe(6)

    // idx 0: right is idx 1 (not known), idx 2 (revealed: 4)
    expect(GameState.nearestKnownRight(player, 0)).toBe(4)
    // idx 2: current is known
    expect(GameState.nearestKnownRight(player, 2)).toBe(4)
    // idx 5: no right, should return 12
    expect(GameState.nearestKnownRight(player, 5)).toBe(12)
  })
  describe('candidatesForSlot', () => {
    it('blue candidate in open interval', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 8, revealed: true },
        ],
      }
      const gs = new GameState({ players: [player], yellowWires: [], redWires: [] })
      // Slot 1: left 2, right 8, blue 5 is not visible, should be possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([2, 3, 4, 5, 6, 7, 8]))
    })

    it('blue candidate give other player has all 4', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 8, revealed: true },
        ],
      }
      const player2 = {
        hand: [
          { id: 11, color: 'blue', number: 4, revealed: true },
          { id: 12, color: 'blue', number: 4, revealed: true },
          { id: 13, color: 'blue', number: 4, revealed: true },
          { id: 14, color: 'blue', number: 4, revealed: true },
        ],
      }
      const gs = new GameState({ players: [player, player2], yellowWires: [], redWires: [] })
      // Slot 1: left 2, right 8, blue 5 is not visible, should be possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([2, 3, 5, 6, 7, 8]))
    })

    it('blue candidate give other player has other 2', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 8, revealed: true },
        ],
      }
      const player2 = {
        hand: [
          { id: 11, color: 'blue', number: 2, revealed: true },
          { id: 12, color: 'blue', number: 2, revealed: true },
          { id: 13, color: 'blue', number: 2, revealed: true },
        ],
      }
      const gs = new GameState({ players: [player, player2], yellowWires: [], redWires: [] })
      // Slot 1: left 2, right 8, blue 5 is not visible, should be possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([3, 4, 5, 6, 7, 8]))
    })

    it('blue candidate give other players have other 2', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 8, revealed: true },
        ],
      }
      const player2 = {
        hand: [
          { id: 11, color: 'blue', number: 2, revealed: true },
          { id: 12, color: 'blue', number: 2, revealed: true },
        ],
      }
      const player3 = {
        hand: [{ id: 13, color: 'blue', number: 2, revealed: true }],
      }
      const gs = new GameState({
        players: [player, player2, player3],
        yellowWires: [],
        redWires: [],
      })
      // Slot 1: left 2, right 8, blue 5 is not visible, should be possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([3, 4, 5, 6, 7, 8]))
    })

    it('yellow candidate only if wire fits interval: in', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 10, color: 'yellow', number: 5.1 },
          { id: 3, color: 'blue', number: 6, revealed: true },
        ],
      }
      const yellowWires = [
        { id: 10, color: 'yellow', number: 5.1 },
        { id: 11, color: 'yellow', number: 7.1 },
      ]
      const gs = new GameState({ players: [player], yellowWires, redWires: [] })
      // Slot 1: left 2, right 8, yellow 5 and 7 both fit, so yellow is possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(
        new Set([2, 3, 4, 5, 6, 'yellow']),
      )
    })

    it('yellow candidate only if wire fits interval: out', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 5, revealed: true },
        ],
      }
      const yellowWires = [
        { id: 10, color: 'yellow', number: 5.1 },
        { id: 11, color: 'yellow', number: 7.1 },
      ]
      const gs = new GameState({ players: [player], yellowWires, redWires: [] })
      // Slot 1: left 2, right 8, yellow 5 and 7 both fit, so yellow is possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([2, 3, 4, 5]))
    })

    it('no yellow candidate if all founds', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 6, revealed: true },
        ],
      }
      const player2 = {
        hand: [{ id: 11, color: 'yellow', number: 5.1, revealed: true }],
      }
      const yellowWires = [
        { id: 10, color: 'yellow', number: 3.1 },
        { id: 11, color: 'yellow', number: 5.1, revealed: true },
      ]
      const gs = new GameState({ players: [player, player2], yellowWires, redWires: [] })
      // Slot 1: left 2, right 8, yellow 5 and 7 both fit, so yellow is possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([2, 3, 4, 5, 6]))
    })

    it('red candidate only if wire fits interval: in', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 20, color: 'red', number: 4.5 },
          { id: 3, color: 'blue', number: 6, revealed: true },
        ],
      }
      const redWires = [
        { id: 20, color: 'red', number: 4.5 },
        { id: 21, color: 'red', number: 7.5 },
      ]
      const gs = new GameState({ players: [player], yellowWires: [], redWires })
      // Slot 1: left 2, right 8, red 4 and 7 both fit, so red is possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([2, 3, 4, 5, 6, 'red']))
    })

    it('red candidate only if wire fits interval: out', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 4 },
          { id: 3, color: 'blue', number: 6, revealed: true },
        ],
      }
      const redWires = [
        { id: 20, color: 'red', number: 6.5 },
        { id: 21, color: 'red', number: 7.5 },
      ]
      const gs = new GameState({ players: [player], yellowWires: [], redWires })
      // Slot 1: left 2, right 8, red 4 and 7 both fit, so red is possible
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([2, 3, 4, 5, 6]))
    })

    it('only one candidate if token', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 4, infoToken: true },
          { id: 3, color: 'blue', number: 8, revealed: true },
        ],
      }
      const gs = new GameState({ players: [player], yellowWires: [], redWires: [] })
      // Slot 1: left 2, right 8, but blue 4 is already visible, so no blue left
      expect(gs.candidatesForSlot(player, 1).possibilities).toEqual(new Set([4]))
    })

    it('blue candidate given curent player has all 4', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 8, revealed: true },
        ],
      }
      const player2 = {
        hand: [
          { id: 11, color: 'blue', number: 4 },
          { id: 12, color: 'blue', number: 4 },
          { id: 13, color: 'blue', number: 4 },
          { id: 14, color: 'blue', number: 4 },
        ],
      }
      const gs = new GameState({ players: [player, player2], yellowWires: [], redWires: [] })
      // Slot 1: left 2, right 8, blue 5 is not visible, should be possible
      const result = gs.candidatesForSlot(player, 1, player2)
      expect(result.possibilities).toEqual(new Set([2, 3, 5, 6, 7, 8]))
    })

    it('probability: single candidate', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 5, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 5, revealed: true },
        ],
      }
      const gs = new GameState({ players: [player], yellowWires: [], redWires: [] })
      // Only blue 5 is possible, so probability should be 1
      const result = gs.candidatesForSlot(player, 1)
      expect(result.possibilities).toEqual(new Set([5]))
      expect(result.mostProbable).toEqual({ value: '5', probability: 1 })
    })

    it('probability: two blue candidates', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 3 },
          { id: 3, color: 'blue', number: 3, revealed: true },
          { id: 4, color: 'blue', number: 3, revealed: true },
        ],
      }
      const gs = new GameState({ players: [player], yellowWires: [], redWires: [] })

      const result = gs.candidatesForSlot(player, 1)
      expect(result.possibilities).toEqual(new Set([2, 3]))
      expect(result.mostProbable).toEqual({ value: '2', probability: 3 / 5 })
    })

    it('probability: two blue candidates, with player own info', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 2 },
          { id: 3, color: 'blue', number: 3, revealed: true },
        ],
      }
      const player2 = {
        hand: [
          { id: 11, color: 'blue', number: 2 },
          { id: 12, color: 'blue', number: 3 },
          { id: 13, color: 'blue', number: 3 },
          { id: 14, color: 'blue', number: 3 },
        ],
      }
      const gs = new GameState({ players: [player, player2], yellowWires: [], redWires: [] })

      const result = gs.candidatesForSlot(player, 1, player2)
      expect(result.possibilities).toEqual(new Set([2]))
      expect(result.mostProbable).toEqual({ value: '2', probability: 1 })
    })

    it.skip('probability: two blue candidates, with player own info and deductions', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 2 },
          { id: 3, color: 'blue', number: 2 },
          { id: 4, color: 'blue', number: 3, revealed: true },
        ],
      }
      const player2 = {
        hand: [
          { id: 12, color: 'blue', number: 3 },
          { id: 13, color: 'blue', number: 3 },
        ],
      }
      const gs = new GameState({ players: [player, player2], yellowWires: [], redWires: [] })

      // it is not possible for card idx=1 to be 3, as there is only ONE 3 wire left in the game
      const result = gs.candidatesForSlot(player, 1, player2)
      expect(result.possibilities).toEqual(new Set([2]))
      expect(result.mostProbable).toEqual({ value: '2', probability: 1 })
    })
  })
})
