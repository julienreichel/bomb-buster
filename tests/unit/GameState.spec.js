import { describe, expect, it } from 'vitest'
import GameState from '../../src/composables/models/GameState.js'

describe('GameState composable', () => {
  describe('nearestKnownLeft, nearestKnownRight', () => {
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
      expect(GameState.nearestKnownLeft({ player, idx: 0 })).toBe(1)
      // idx 2: current is known
      expect(GameState.nearestKnownLeft({ player, idx: 2 })).toBe(4)
      // idx 3: left is idx 2 (revealed: 4)
      expect(GameState.nearestKnownLeft({ player, idx: 3 })).toBe(4)
      // idx 5: left is idx 4 (infoToken: 6)
      expect(GameState.nearestKnownLeft({ player, idx: 5 })).toBe(6)

      // idx 0: right is idx 1 (not known), idx 2 (revealed: 4)
      expect(GameState.nearestKnownRight({ player, idx: 0 })).toBe(4)
      // idx 2: current is known
      expect(GameState.nearestKnownRight({ player, idx: 2 })).toBe(4)
      // idx 5: no right, should return 12
      expect(GameState.nearestKnownRight({ player, idx: 5 })).toBe(12)
    })

    it('nearestKnownLeft uses the info of blueCounts', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2 },
          { id: 2, color: 'blue', number: 2 },
          { id: 3, color: 'blue', number: 4, revealed: true },
        ],
      }
      const blueCount = {
        1: 4,
        2: 3,
      }
      expect(GameState.nearestKnownLeft({ player, idx: 0, blueCounts: blueCount })).toBe(2)
      expect(GameState.nearestKnownLeft({ player, idx: 1, blueCounts: blueCount })).toBe(3)
      expect(GameState.nearestKnownLeft({ player, idx: 2, blueCounts: blueCount })).toBe(4)
    })

    it('nearestKnownLeft uses the info of blueCounts in the middle also', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 3 },
          { id: 3, color: 'blue', number: 4 },
        ],
      }
      const blueCount = {
        1: 0,
        2: 4,
        3: 3,
      }
      expect(GameState.nearestKnownLeft({ player, idx: 0, blueCounts: blueCount })).toBe(2)
      expect(GameState.nearestKnownLeft({ player, idx: 1, blueCounts: blueCount })).toBe(3)
      expect(GameState.nearestKnownLeft({ player, idx: 2, blueCounts: blueCount })).toBe(4)
    })

    it('nearestKnownRight uses the info of blueCounts', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 9, revealed: true },
          { id: 2, color: 'blue', number: 10 },
          { id: 3, color: 'blue', number: 10 },
        ],
      }
      const blueCount = {
        12: 4,
        11: 3,
      }
      expect(GameState.nearestKnownRight({ player, idx: 0, blueCounts: blueCount })).toBe(9)
      expect(GameState.nearestKnownRight({ player, idx: 1, blueCounts: blueCount })).toBe(10)
      expect(GameState.nearestKnownRight({ player, idx: 2, blueCounts: blueCount })).toBe(11)
    })
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([2, 3, 4, 5, 6, 7, 8]))
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([2, 3, 5, 6, 7, 8]))
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([3, 4, 5, 6, 7, 8]))
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([3, 4, 5, 6, 7, 8]))
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([2, 3, 4, 5, 5.1, 6]))
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([2, 3, 4, 5]))
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([2, 3, 4, 5, 6]))
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([2, 3, 4, 4.5, 5, 6]))
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
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([2, 3, 4, 5, 6]))
    })

    it('all red candidate only if wire fits interval: out', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'red', number: 6.5 },
          { id: 3, color: 'blue', number: 8, revealed: true },
        ],
      }
      const redWires = [
        { id: 20, color: 'red', number: 6.5 },
        { id: 21, color: 'red', number: 7.5 },
      ]
      const gs = new GameState({ players: [player], yellowWires: [], redWires })
      // Slot 1: left 2, right 8, red 4 and 7 both fit, so red is possible
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set([2, 3, 4, 5, 6, 6.5, 7, 7.5, 8]))
    })

    it('no candidate if token', () => {
      const player = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 4, infoToken: true },
          { id: 3, color: 'blue', number: 8, revealed: true },
        ],
      }
      const gs = new GameState({ players: [player], yellowWires: [], redWires: [] })
      // Slot 1: left 2, right 8, but blue 4 is already visible, so no blue left
      expect(gs.candidatesForSlot(player, 1)).toEqual(new Set())
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
      expect(result).toEqual(new Set([2, 3, 5, 6, 7, 8]))
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
      expect(result).toEqual(new Set([5]))
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
      expect(result).toEqual(new Set([2, 3]))
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
      expect(result).toEqual(new Set([2]))
    })
    it('find the yellow as expected', () => {
      const y1 = { id: 34, color: 'yellow', number: 4.1 }
      const player1 = {
        hand: [
          { id: 1, color: 'blue', number: 2, revealed: true },
          { id: 2, color: 'blue', number: 5 },
          { id: 3, color: 'blue', number: 6, revealed: true },
          { id: 4, color: 'blue', number: 6, revealed: true },
        ],
      }
      const player2 = {
        hand: [
          { id: 23, color: 'blue', number: 3, revealed: true },
          { id: 24, color: 'blue', number: 4, revealed: true },
          { id: 25, color: 'blue', number: 5, revealed: true },
        ],
      }
      const player3 = {
        hand: [
          { id: 30, color: 'blue', number: 2, revealed: true },
          { id: 31, color: 'blue', number: 3, revealed: true },
          { id: 32, color: 'blue', number: 4 },
          { id: 33, color: 'blue', number: 4, revealed: true },
          y1,
          { id: 35, color: 'blue', number: 5 },
          { id: 36, color: 'blue', number: 6, revealed: true },
          { id: 37, color: 'blue', number: 6, revealed: true },
        ],
      }
      const player4 = {
        hand: [
          { id: 41, color: 'blue', number: 3, revealed: true },
          { id: 42, color: 'blue', number: 3, revealed: true },
          { id: 43, color: 'blue', number: 4, infoToken: true },
          { id: 44, color: 'blue', number: 5, revealed: true },
        ],
      }
      const gs = new GameState({
        players: [player1, player2, player3, player4],
        yellowWires: [y1],
        redWires: [],
      })
      const result2 = gs.candidatesForSlot(player3, 2, player1)
      expect(result2).toEqual(new Set([4]))

      const result4 = gs.candidatesForSlot(player3, 4, player1)
      expect(result4).toEqual(new Set([4, 4.1]))

      const result5 = gs.candidatesForSlot(player3, 5, player1)
      expect(result5).toEqual(new Set([4.1, 5]))
    })
  })
  describe('monteCarloSlotProbabilities', () => {
    it('returns correct result for simple blue slots', () => {
      const player = {
        id: 1,
        hand: [
          { id: 1, color: 'blue', number: 1 },
          { id: 2, color: 'blue', number: 2 },
          { id: 3, color: 'blue', number: 3 },
        ],
      }
      // 3 slots, all can be 1, 2, or 3, but only one of each
      const slotPoss = [
        { player, card: player.hand[0], candidates: new Set([1, 2, 3]) },
        { player, card: player.hand[1], candidates: new Set([1, 2, 3]) },
        { player, card: player.hand[2], candidates: new Set([1, 2, 3]) },
      ]
      // Simulate a game state with 1 blue 1, 1 blue 2, 1 blue 3, and a player with 3 slots

      const gs = new GameState({ players: [player] })

      // As the result should be increasing or equal, there is in fact only one possibility
      const res = gs.monteCarloSlotProbabilities(slotPoss, null, 100)

      expect(res[0].slots.length).toEqual(1)
      expect(res[0].slots[0].number).toEqual(1)
      expect(res[0].slots[0].probability).toEqual(1)

      expect(res[1].slots.length).toEqual(1)
      expect(res[1].slots[0].number).toEqual(2)
      expect(res[1].slots[0].probability).toEqual(1)

      expect(res[2].slots.length).toEqual(1)
      expect(res[2].slots[0].number).toEqual(3)
      expect(res[2].slots[0].probability).toEqual(1)
    })

    it('returns correct result for case with yellow cards', () => {
      const yellow1 = { id: 2, color: 'yellow', number: 2.1 }
      const player = {
        id: 1,
        hand: [{ id: 1, color: 'blue', number: 1 }, yellow1, { id: 3, color: 'blue', number: 3 }],
      }
      // 3 slots, all can be 1, 2, or 3, but only one of each
      const slotPoss = [
        { player, card: player.hand[0], candidates: new Set([1, 2.1, 3]) },
        { player, card: player.hand[1], candidates: new Set([1, 2.1, 3]) },
        { player, card: player.hand[2], candidates: new Set([1, 2.1, 3]) },
      ]
      // Simulate a game state with 1 blue 1, 1 blue 2, 1 blue 3, and a player with 3 slots

      const gs = new GameState({ players: [player], yellowWires: [yellow1] })

      // As the result should be increasing or equal, there is in fact only one possibility
      const res = gs.monteCarloSlotProbabilities(slotPoss, null, 100)

      expect(res[0].slots.length).toEqual(1)
      expect(res[0].slots[0].number).toEqual(1)
      expect(res[0].slots[0].probability).toEqual(1)

      expect(res[1].slots.length).toEqual(1)
      expect(res[1].slots[0].number).toEqual(2.1)
      expect(res[1].slots[0].probability).toEqual(1)

      expect(res[2].slots.length).toEqual(1)
      expect(res[2].slots[0].number).toEqual(3)
      expect(res[2].slots[0].probability).toEqual(1)
    })

    it('returns correct result for case with 2 possible yellow cards', () => {
      const yellow1 = { id: 2, color: 'yellow', number: 2.1 }
      const yellow2 = { id: 3, color: 'yellow', number: 3.1 }
      const player = {
        id: 1,
        hand: [{ id: 1, color: 'blue', number: 1 }, yellow1, { id: 4, color: 'blue', number: 4 }],
      }
      // 3 slots, all can be 1, 2, or 3, but only one of each
      const slotPoss = [
        { player, card: player.hand[0], candidates: new Set([1, 2.1, 3.1, 4]) },
        { player, card: player.hand[1], candidates: new Set([1, 2.1, 3.1, 4]) },
        { player, card: player.hand[2], candidates: new Set([1, 2.1, 3.1, 4]) },
      ]
      // Simulate a game state with 1 blue 1, 1 blue 2, 1 blue 3, and a player with 3 slots

      const gs = new GameState({ players: [player], yellowWires: [yellow1, yellow2] })

      // As the result should be increasing or equal, there is in fact only one possibility
      const res = gs.monteCarloSlotProbabilities(slotPoss, null, 100)

      expect(res[0].slots.length).toEqual(1)
      expect(res[0].slots[0].number).toEqual(1)
      expect(res[0].slots[0].probability).toEqual(1)

      expect(res[1].slots.length).toEqual(2)
      expect(res[1].slots.map((s) => s.number).sort()).toEqual([2.1, 3.1])

      expect(res[2].slots.length).toEqual(1)
      expect(res[2].slots[0].number).toEqual(4)
      expect(res[2].slots[0].probability).toEqual(1)
    })

    it('returns correct result for case with red cards', () => {
      const red1 = { id: 2, color: 'red', number: 2.5 }
      const player = {
        id: 1,
        hand: [{ id: 1, color: 'blue', number: 1 }, red1, { id: 3, color: 'blue', number: 3 }],
      }
      // 3 slots, all can be 1, 2, or 3, but only one of each
      const slotPoss = [
        { player, card: player.hand[0], candidates: new Set([1, 2.5, 3]) },
        { player, card: player.hand[1], candidates: new Set([1, 2.5, 3]) },
        { player, card: player.hand[2], candidates: new Set([1, 2.5, 3]) },
      ]
      // Simulate a game state with 1 blue 1, 1 blue 2, 1 blue 3, and a player with 3 slots

      const gs = new GameState({ players: [player], redWires: [red1] })

      // As the result should be increasing or equal, there is in fact only one possibility
      const res = gs.monteCarloSlotProbabilities(slotPoss, null, 100)

      expect(res[0].slots.length).toEqual(1)
      expect(res[0].slots[0].number).toEqual(1)
      expect(res[0].slots[0].probability).toEqual(1)

      expect(res[1].slots.length).toEqual(1)
      expect(res[1].slots[0].number).toEqual(2.5)
      expect(res[1].slots[0].probability).toEqual(1)

      expect(res[2].slots.length).toEqual(1)
      expect(res[2].slots[0].number).toEqual(3)
      expect(res[2].slots[0].probability).toEqual(1)
    })

    it('uses known wires to improve candidate selection', () => {
      const c1 = { id: 1, color: 'blue', number: 1, revealed: true }
      const c2 = { id: 2, color: 'blue', number: 2 }
      const c3 = { id: 3, color: 'blue', number: 3 }
      const c4 = { id: 4, color: 'blue', number: 4 }
      const player1 = {
        id: 1,
        hand: [c1, c2],
        knownWires: [c2],
      }
      const player2 = {
        id: 2,
        hand: [c3, c4],
        knownWires: [c3],
      }
      // 3 slots, all can be 1, 2, or 3, but only one of each
      const slotPoss = [
        { player: player1, card: player1.hand[0], candidates: new Set() },
        { player: player1, card: player1.hand[1], candidates: new Set([2, 3, 4]) },
        { player: player2, card: player2.hand[0], candidates: new Set([2, 3]) },
        { player: player2, card: player2.hand[1], candidates: new Set([2, 3, 4]) },
      ]
      // Simulate a game state with 1 blue 1, 1 blue 2, 1 blue 3, and a player with 3 slots

      const gs = new GameState({ players: [player1, player2] })

      // As the result should be increasing or equal, there is in fact only one possibility
      const res = gs.monteCarloSlotProbabilities(slotPoss, null, 10)

      expect(res[0].slots.length).toEqual(0)

      expect(res[1].slots.length).toEqual(1)
      expect(res[1].slots[0].number).toEqual(2)
      expect(res[1].slots[0].probability).toEqual(1)

      expect(res[2].slots.length).toEqual(1)
      expect(res[2].slots[0].number).toEqual(3)
      expect(res[2].slots[0].probability).toEqual(1)

      expect(res[3].slots.length).toEqual(1)
      expect(res[3].slots[0].number).toEqual(4)
      expect(res[3].slots[0].probability).toEqual(1)
    })
  })
})
