import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStateManager } from '../../src/composables/managers/GameStateManager.js'

describe('useGameStateManager composable', () => {
  let gameStateManager
  beforeEach(() => {
    // Reset singleton for each test
    gameStateManager = useGameStateManager()
  })

  it('should initialize with a reactive GameState', () => {
    expect(gameStateManager.state).toBeDefined()
    expect(gameStateManager.state.players).toBeDefined()
    expect(gameStateManager.state.wires).toBeDefined()
  })
  it('should create the correct number of players and wires', () => {
    gameStateManager.createNewGame({ numPlayers: 3, hasHuman: true })
    expect(gameStateManager.state.players.length).toBe(3)
    // 48 blue wires
    expect(gameStateManager.state.wires.filter((w) => w.color === 'blue').length).toBe(48)
  })

  it('should sort each player hand by wire number', () => {
    gameStateManager.createNewGame({ numPlayers: 4 })
    for (const player of gameStateManager.state.players) {
      const numbers = player.hand.map((w) => w.number)
      const sorted = [...numbers].sort((a, b) => a - b)
      expect(numbers).toEqual(sorted)
    }
  })

  it('should create the correct number of yellow and red wires', () => {
    gameStateManager.createNewGame({
      numPlayers: 4,
      yellow: { created: 4, onBoard: 2 },
      red: { created: 3, onBoard: 1 },
    })
    // Only onBoard yellow/red wires are distributed
    expect(gameStateManager.state.wires.filter((w) => w.color === 'yellow').length).toBe(2)
    expect(gameStateManager.state.wires.filter((w) => w.color === 'red').length).toBe(1)
    // All yellowWires and redWires are tracked
    expect(gameStateManager.state.yellowWires.length).toBe(4)
    expect(gameStateManager.state.redWires.length).toBe(3)
  })

  it('should distribute wires evenly to players', () => {
    gameStateManager.createNewGame({ numPlayers: 4 })
    const handSizes = gameStateManager.state.players.map((p) => p.hand.length)
    // All hands should be nearly equal in size
    expect(Math.max(...handSizes) - Math.min(...handSizes)).toBeLessThanOrEqual(1)
  })

  it('should allow all players to be AI', () => {
    gameStateManager.createNewGame({ numPlayers: 4, hasHuman: false })
    expect(gameStateManager.state.players.every((p) => p.isAI)).toBe(true)
  })

  it('should only allow 3 to 5 players', () => {
    // 2 players: should throw or clamp to 3
    expect(() => gameStateManager.createNewGame({ numPlayers: 2 })).toThrow()
    // 6 players: should throw or clamp to 5
    expect(() => gameStateManager.createNewGame({ numPlayers: 6 })).toThrow()
    // 3, 4, 5 players: should work
    expect(() => gameStateManager.createNewGame({ numPlayers: 3 })).not.toThrow()
    expect(() => gameStateManager.createNewGame({ numPlayers: 4 })).not.toThrow()
    expect(() => gameStateManager.createNewGame({ numPlayers: 5 })).not.toThrow()
  })
  describe('startPickRound, advancePickRound', () => {
    it('startPickRound sets phase and currentPicker, and advances AI picks', () => {
      gameStateManager.createNewGame({ numPlayers: 3, hasHuman: false })
      gameStateManager.startPickRound()
      // All AI, so should immediately advance to play-phase
      expect(gameStateManager.state.phase).toBe('play-phase')
      expect(gameStateManager.state.currentPicker).toBe(null)
    })

    it('startPickRound waits for human to pick before advancing', () => {
      gameStateManager.createNewGame({ numPlayers: 3, hasHuman: true })
      gameStateManager.startPickRound()
      // Should be in pick-card phase, and currentPicker should be the human
      expect(gameStateManager.state.phase).toBe('pick-card')
      const humanIndex = gameStateManager.state.players.findIndex((p) => !p.isAI)
      expect(gameStateManager.state.currentPicker).toBe(humanIndex)
      // Simulate human picking a card
      const human = gameStateManager.state.players[humanIndex]
      const cardToPick = human.hand.find((card) => card.color === 'blue')
      human.pickCard(cardToPick)
      gameStateManager.advancePickRound()
      // After human picks, should advance to play-phase
      expect(gameStateManager.state.phase).toBe('play-phase')
      expect(gameStateManager.state.currentPicker).toBe(null)
    })

    it('advancePickRound advances to next player and switches to play-phase at end', () => {
      gameStateManager.createNewGame({ numPlayers: 3, hasHuman: false })
      // Manually set up for pick round
      gameStateManager.state.phase = 'pick-card'
      gameStateManager.state.currentPicker = 1
      gameStateManager.advancePickRound()
      // Should finish with play-phase
      expect(gameStateManager.state.phase).toBe('play-phase')
      expect(gameStateManager.state.currentPicker).toBe(null)
    })
  })

  describe('playRound deterministic tests', () => {
    beforeEach(() => {
      // Set up 3 players with empty hands
      gameStateManager.state.players = [
        { id: 0, hand: [], isAI: false, name: 'Human' },
        { id: 1, hand: [], isAI: true, name: 'AI 2' },
        { id: 2, hand: [], isAI: true, name: 'AI 3' },
      ]
      gameStateManager.state.detonatorDial = 3
    })

    it('red: player has 2 red cards, picks one as source, both are revealed', () => {
      // Setup: player 0 has 2 red cards, both not revealed
      const redA = { id: 'rA', color: 'red', number: 7.5 }
      const redB = { id: 'rB', color: 'red', number: 8.5 }
      const blueA = { id: 'bA', color: 'blue', number: 5, revealed: true }
      gameStateManager.state.players[0].hand = [redA, redB, blueA]
      gameStateManager.state.players[1].hand = []
      gameStateManager.state.players[2].hand = []
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'rA',
      })
      expect(result.outcome).toBe('match-red')
      expect([redA.revealed, redB.revealed].every(Boolean)).toBe(true)
      expect(result.revealed.sort()).toEqual(['rA', 'rB'].sort())
    })

    it('red: player has a red card, cannot pick it, because bluw is not revealed', () => {
      // Setup: player 0 has 1 red card, not revealed
      const redA = { id: 'rA', color: 'red', number: 7.5 }
      const blueA = { id: 'bA', color: 'blue', number: 5 }
      gameStateManager.state.players[0].hand = [redA, blueA]
      gameStateManager.state.players[1].hand = []
      gameStateManager.state.players[2].hand = []
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'rA',
      })
      expect(result.outcome).toBe('invalid-pick')
    })

    it('blue: player has 4 cards with same value, picks two from self, all are revealed', () => {
      // Setup: player 0 has 4 blue 5s
      const blueA = { id: 'bA', color: 'blue', number: 5 }
      const blueB = { id: 'bB', color: 'blue', number: 5 }
      const blueC = { id: 'bC', color: 'blue', number: 5 }
      const blueD = { id: 'bD', color: 'blue', number: 5 }
      gameStateManager.state.players[0].hand = [blueA, blueB, blueC, blueD]
      gameStateManager.state.players[1].hand = []
      gameStateManager.state.players[2].hand = []
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'bA',
        targetPlayerIdx: 0,
        targetCardId: 'bB',
      })
      expect(result.outcome).toBe('match-blue')
      expect([blueA.revealed, blueB.revealed, blueC.revealed, blueD.revealed].every(Boolean)).toBe(
        true,
      )
      expect(result.revealed.sort()).toEqual(['bA', 'bB', 'bC', 'bD'].sort())
    })

    it('blue: player has 3 cards, 4th in another player and both are revealed, pick is valid', () => {
      // Setup: player 0 has 3 blue 7s, player 1 has 1 blue 7 (revealed)
      const blueA = { id: 'bA', color: 'blue', number: 7 }
      const blueB = { id: 'bB', color: 'blue', number: 7 }
      const blueC = { id: 'bC', color: 'blue', number: 7, revealed: true }
      const blueD = { id: 'bD', color: 'blue', number: 7, revealed: true }
      gameStateManager.state.players[0].hand = [blueA, blueB, blueC]
      gameStateManager.state.players[1].hand = [blueD]
      gameStateManager.state.players[2].hand = []
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'bA',
        targetPlayerIdx: 0,
        targetCardId: 'bB',
      })
      expect(result.outcome).toBe('match-blue')
      expect([blueA.revealed, blueB.revealed, blueC.revealed].every(Boolean)).toBe(true)
      expect(result.revealed.sort()).toEqual(['bA', 'bB', 'bC'].sort())
    })

    it('blue: player has 3 cards, 4th in another player and not revealed, pick is invalid', () => {
      // Setup: player 0 has 3 blue 8s, player 1 has 1 blue 8 (not revealed)
      const blueA = { id: 'bA', color: 'blue', number: 8 }
      const blueB = { id: 'bB', color: 'blue', number: 8 }
      const blueC = { id: 'bC', color: 'blue', number: 8 }
      const blueD = { id: 'bD', color: 'blue', number: 8 }
      gameStateManager.state.players[0].hand = [blueA, blueB, blueC]
      gameStateManager.state.players[1].hand = [blueD]
      gameStateManager.state.players[2].hand = []
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'bA',
        targetPlayerIdx: 0,
        targetCardId: 'bB',
      })
      expect(result.outcome).toBe('invalid-pick')
      expect([blueA.revealed, blueB.revealed, blueC.revealed, blueD.revealed].some(Boolean)).toBe(
        false,
      )
      expect(result.revealed).toEqual([])
    })

    it('blue: player has 2 cards, other 2 in other players and both are revealed, pick is valid', () => {
      // Setup: player 0 has 2 blue 9s, player 1 and 2 have 1 blue 9 each (both revealed)
      const blueA = { id: 'bA', color: 'blue', number: 9 }
      const blueB = { id: 'bB', color: 'blue', number: 9 }
      const blueC = { id: 'bC', color: 'blue', number: 9, revealed: true }
      const blueD = { id: 'bD', color: 'blue', number: 9, revealed: true }
      gameStateManager.state.players[0].hand = [blueA, blueB]
      gameStateManager.state.players[1].hand = [blueC]
      gameStateManager.state.players[2].hand = [blueD]
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'bA',
        targetPlayerIdx: 0,
        targetCardId: 'bB',
      })
      expect(result.outcome).toBe('match-blue')
      expect([blueA.revealed, blueB.revealed].every(Boolean)).toBe(true)
      expect(result.revealed.sort()).toEqual(['bA', 'bB'].sort())
    })

    it('yellow: player has 2 yellow cards, 4 yellow cards in game, slef pick is invalid', () => {
      // Setup: player 0 has 2 yellow cards, 2 other yellow cards in other players (not revealed)
      const yellowA = { id: 'yA', color: 'yellow', number: 1.1 }
      const yellowB = { id: 'yB', color: 'yellow', number: 2.1 }
      const yellowC = { id: 'yC', color: 'yellow', number: 3.1 }
      const yellowD = { id: 'yD', color: 'yellow', number: 4.1 }
      gameStateManager.state.players[0].hand = [yellowA, yellowB]
      gameStateManager.state.players[1].hand = [yellowC]
      gameStateManager.state.players[2].hand = [yellowD]
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'yA',
        targetPlayerIdx: 0,
        targetCardId: 'yB',
      })
      expect(result.outcome).toBe('invalid-pick')
      expect(
        [yellowA.revealed, yellowB.revealed, yellowC.revealed, yellowD.revealed].some(Boolean),
      ).toBe(false)
      expect(result.revealed).toEqual([])
    })
    it('yellow: only 2 yellow cards in game, both in same player, both picked from self, both are revealed', () => {
      // Setup: player 0 has 2 yellow cards, no other yellow cards in game
      const yellowA = { id: 'yA', color: 'yellow', number: 1.1 }
      const yellowB = { id: 'yB', color: 'yellow', number: 2.1 }
      gameStateManager.state.players[0].hand = [yellowA, yellowB]
      gameStateManager.state.players[1].hand = []
      gameStateManager.state.players[2].hand = []
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'yA',
        targetPlayerIdx: 0,
        targetCardId: 'yB',
      })
      expect(result.outcome).toBe('match-yellow')
      expect([yellowA.revealed, yellowB.revealed].every(Boolean)).toBe(true)
      expect(result.revealed.sort()).toEqual(['yA', 'yB'].sort())
    })

    it('miss decreases detonatorDial and sets infoToken', () => {
      const blueA = { id: 'bA', color: 'blue', number: 1 }
      const blueB = { id: 'bB', color: 'blue', number: 2 }
      gameStateManager.state.players[0].hand = [blueA]
      gameStateManager.state.players[1].hand = [blueB]
      gameStateManager.state.detonatorDial = 3
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'bA',
        targetPlayerIdx: 1,
        targetCardId: 'bB',
      })
      expect(result.outcome).toBe('miss')
      expect(gameStateManager.state.detonatorDial).toBe(2)
      expect(blueB.infoToken).toBe(true)
      expect(result.infoToken).toBe(true)
    })

    it('blue match reveals both cards', () => {
      const blueA = { id: 'bA', color: 'blue', number: 5 }
      const blueB = { id: 'bB', color: 'blue', number: 5 }
      gameStateManager.state.players[0].hand = [blueA]
      gameStateManager.state.players[1].hand = [blueB]
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'bA',
        targetPlayerIdx: 1,
        targetCardId: 'bB',
      })
      expect(result.outcome).toBe('match-blue')
      expect(blueA.revealed).toBe(true)
      expect(blueB.revealed).toBe(true)
      expect(result.revealed).toEqual(['bA', 'bB'])
    })

    it('yellow match reveals both cards', () => {
      const yellowA = { id: 'yA', color: 'yellow', number: 1.1 }
      const yellowB = { id: 'yB', color: 'yellow', number: 2.1 }
      gameStateManager.state.players[0].hand = [yellowA]
      gameStateManager.state.players[2].hand = [yellowB]
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'yA',
        targetPlayerIdx: 2,
        targetCardId: 'yB',
      })
      expect(result.outcome).toBe('match-yellow')
      expect(yellowA.revealed).toBe(true)
      expect(yellowB.revealed).toBe(true)
      expect(result.revealed).toEqual(['yA', 'yB'])
    })

    it('red target sets detonatorDial to 0 and reveals red', () => {
      const blueA = { id: 'bA', color: 'blue', number: 3 }
      const redB = { id: 'rB', color: 'red', number: 7.5 }
      gameStateManager.state.players[0].hand = [blueA]
      gameStateManager.state.players[1].hand = [redB]
      gameStateManager.state.detonatorDial = 3
      const result = gameStateManager.playRound({
        sourcePlayerIdx: 0,
        sourceCardId: 'bA',
        targetPlayerIdx: 1,
        targetCardId: 'rB',
      })
      expect(result.outcome).toBe('hit-red')
      expect(redB.revealed).toBe(true)
      expect(gameStateManager.state.detonatorDial).toBe(0)
      expect(result.revealed).toEqual(['rB'])
    })
  })
  describe('advancePlayRound', () => {
    it('should stop and wait for human pick if a player is human', () => {
      gameStateManager.createNewGame({ numPlayers: 3, hasHuman: true })

      // Give each player 1 blue card, player 2 gets 2
      gameStateManager.state.players[0].hand = [{ id: 'b0', color: 'blue', number: 1 }]
      gameStateManager.state.players[1].hand = [{ id: 'b1', color: 'blue', number: 1 }]
      gameStateManager.state.players[2].hand = [
        { id: 'b2', color: 'blue', number: 1 },
        { id: 'b3', color: 'blue', number: 1 },
      ]

      gameStateManager.state.players[1].pickPlayCards = () => ({
        sourcePlayerIdx: 1,
        sourceCardId: 'b1',
        targetPlayerIdx: 2,
        targetCardId: 'b2',
      })
      gameStateManager.state.players[2].pickPlayCards = () => ({
        sourcePlayerIdx: 2,
        sourceCardId: 'b3',
        targetPlayerIdx: 0,
        targetCardId: 'b0',
      })
      gameStateManager.state.detonatorDial = 3
      gameStateManager.phase = 'play-phase'

      gameStateManager.advancePlayRound()
      // Should be waiting for human pick
      expect(gameStateManager.state.phase).toBe('play-phase')
      expect(gameStateManager.state.currentPicker).toBe(0)

      // resume other players
      gameStateManager.advancePlayRound()

      // All cards should be revealed
      expect(gameStateManager.state.players.every((p) => p.hand.every((c) => c.revealed))).toBe(
        true,
      )
      expect(gameStateManager.state.phase).toBe('game-over')
    })
    it('should advance through AI players and end game when all cards are revealed', () => {
      gameStateManager.createNewGame({ numPlayers: 3, hasHuman: false })
      // Player 0: 1 blue card, Player 1: 1 blue card, Player 2: 2 blue cards
      gameStateManager.state.players[0].hand = [{ id: 'b0', color: 'blue', number: 1 }]
      gameStateManager.state.players[1].hand = [{ id: 'b1', color: 'blue', number: 1 }]
      gameStateManager.state.players[2].hand = [
        { id: 'b2', color: 'blue', number: 1 },
        { id: 'b3', color: 'blue', number: 1 },
      ]
      gameStateManager.state.detonatorDial = 3
      // Player 0 picks b2 from Player 2, Player 1 picks b3 from Player 2
      gameStateManager.state.players[0].pickPlayCards = () => ({
        sourcePlayerIdx: 0,
        sourceCardId: 'b0',
        targetPlayerIdx: 2,
        targetCardId: 'b2',
      })
      gameStateManager.state.players[1].pickPlayCards = () => ({
        sourcePlayerIdx: 1,
        sourceCardId: 'b1',
        targetPlayerIdx: 2,
        targetCardId: 'b3',
      })
      // Player 2 will never pick (game ends before their turn)
      gameStateManager.state.players[2].pickPlayCards = () => null
      gameStateManager.advancePlayRound()
      // All cards should be revealed
      expect(gameStateManager.state.players.every((p) => p.hand.every((c) => c.revealed))).toBe(
        true,
      )
      expect(gameStateManager.state.phase).toBe('game-over')
    })

    it('should end game if detonatorDial reaches 0', () => {
      gameStateManager.createNewGame({ numPlayers: 3, hasHuman: false })
      // Give each player 1 blue card and 1 red card
      gameStateManager.state.players.forEach((p, i) => {
        p.hand = [
          { id: `b${i}`, color: 'blue', number: 1 },
          { id: `r${i}`, color: 'red', number: 7.5 },
        ]
      })
      gameStateManager.state.detonatorDial = 1
      // AI always picks blue vs red (causes detonatorDial to hit 0)
      gameStateManager.state.players.forEach((p, i) => {
        p.pickPlayCards = () => {
          const next = (i + 1) % 3
          return {
            sourcePlayerIdx: i,
            sourceCardId: `b${i}`,
            targetPlayerIdx: next,
            targetCardId: `r${next}`,
          }
        }
      })
      gameStateManager.advancePlayRound()
      expect(gameStateManager.state.detonatorDial).toBe(0)
      expect(gameStateManager.state.phase).toBe('game-over')
    })
  })
})
