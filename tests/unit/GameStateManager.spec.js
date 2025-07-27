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
})
