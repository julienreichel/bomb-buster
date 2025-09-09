import { beforeEach, describe, expect, it } from 'vitest'
import {
  advancePickRound,
  createBlueWires,
  createColoredWires,
  createGamePlayers,
  distributeWiresToPlayers,
  prepareWiresForBoard,
  validateGameParameters,
} from '../../src/composables/managers/GameSetupHelpers.js'
import GameState from '../../src/composables/models/GameState.js'

describe('GameSetupHelpers', () => {
  describe('validateGameParameters', () => {
    it('should not throw for valid number of players (3)', () => {
      expect(() => validateGameParameters(3)).not.toThrow()
    })

    it('should not throw for valid number of players (4)', () => {
      expect(() => validateGameParameters(4)).not.toThrow()
    })

    it('should not throw for valid number of players (5)', () => {
      expect(() => validateGameParameters(5)).not.toThrow()
    })

    it('should throw for too few players (2)', () => {
      expect(() => validateGameParameters(2)).toThrow('Number of players must be between 3 and 5.')
    })

    it('should throw for too many players (6)', () => {
      expect(() => validateGameParameters(6)).toThrow('Number of players must be between 3 and 5.')
    })
  })

  describe('createGamePlayers', () => {
    it('should create all AI players when hasHuman is false', () => {
      const players = createGamePlayers(3, false, true)
      expect(players).toHaveLength(3)
      expect(players.every((p) => p.isAI)).toBe(true)
      expect(players[0].name).toBe('AI 1')
      expect(players[1].name).toBe('AI 2')
      expect(players[2].name).toBe('AI 3')
    })

    it('should create human player first when hasHuman is true', () => {
      const players = createGamePlayers(4, true, true)
      expect(players).toHaveLength(4)
      expect(players[0].isAI).toBe(false)
      expect(players[0].name).toBe('Human')
      expect(players[1].isAI).toBe(true)
      expect(players[2].isAI).toBe(true)
      expect(players[3].isAI).toBe(true)
    })

    it('should set doubleDetectorEnabled correctly', () => {
      const playersWithDD = createGamePlayers(3, false, true)
      const playersWithoutDD = createGamePlayers(3, false, false)

      expect(playersWithDD.every((p) => p.hasDoubleDetector)).toBe(true)
      expect(playersWithoutDD.every((p) => p.hasDoubleDetector)).toBe(false)
    })

    it('should assign correct player IDs', () => {
      const players = createGamePlayers(3, true, true)
      expect(players[0].id).toBe(0)
      expect(players[1].id).toBe(1)
      expect(players[2].id).toBe(2)
    })
  })

  describe('createBlueWires', () => {
    it('should create 48 blue wires (4 of each number 1-12)', () => {
      const blueWires = createBlueWires()
      expect(blueWires).toHaveLength(48)
      expect(blueWires.every((w) => w.color === 'blue')).toBe(true)
    })

    it('should create exactly 4 wires for each number from 1 to 12', () => {
      const blueWires = createBlueWires()
      for (let num = 1; num <= 12; num++) {
        const wiresForNumber = blueWires.filter((w) => w.number === num)
        expect(wiresForNumber).toHaveLength(4)
      }
    })

    it('should create wires with unique IDs', () => {
      const blueWires = createBlueWires()
      const ids = blueWires.map((w) => w.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(blueWires.length)
    })

    it('should follow ID pattern blue-{number}-{index}', () => {
      const blueWires = createBlueWires()
      const firstFour = blueWires.slice(0, 4)
      expect(firstFour[0].id).toBe('blue-1-0')
      expect(firstFour[1].id).toBe('blue-1-1')
      expect(firstFour[2].id).toBe('blue-1-2')
      expect(firstFour[3].id).toBe('blue-1-3')
    })
  })

  describe('createColoredWires', () => {
    it('should create yellow wires with correct properties', () => {
      const yellowWires = createColoredWires('yellow', 3)
      expect(yellowWires).toHaveLength(3)
      expect(yellowWires.every((w) => w.color === 'yellow')).toBe(true)
      expect(yellowWires.every((w) => Math.abs((w.number % 1) - 0.1) < 0.0001)).toBe(true)
    })

    it('should create red wires with correct properties', () => {
      const redWires = createColoredWires('red', 2)
      expect(redWires).toHaveLength(2)
      expect(redWires.every((w) => w.color === 'red')).toBe(true)
      expect(redWires.every((w) => Math.abs((w.number % 1) - 0.5) < 0.0001)).toBe(true)
    })

    it('should not exceed maximum available numbers (11)', () => {
      const manyWires = createColoredWires('yellow', 15)
      expect(manyWires.length).toBeLessThanOrEqual(11)
    })

    it('should create unique numbers within the same color', () => {
      const wires = createColoredWires('yellow', 5)
      const baseNumbers = wires.map((w) => Math.floor(w.number))
      const uniqueNumbers = new Set(baseNumbers)
      expect(uniqueNumbers.size).toBe(wires.length)
    })

    it('should follow ID pattern {color}-{number}', () => {
      const yellowWires = createColoredWires('yellow', 2)
      yellowWires.forEach((wire) => {
        const baseNumber = Math.floor(wire.number)
        expect(wire.id).toBe(`yellow-${baseNumber}`)
      })
    })
  })

  describe('prepareWiresForBoard', () => {
    it('should select correct number of yellow and red wires for board', () => {
      const blueWires = createBlueWires()
      const yellowWires = createColoredWires('yellow', 4)
      const redWires = createColoredWires('red', 3)

      const boardWires = prepareWiresForBoard({
        blueWires,
        yellowWires,
        redWires,
        yellowOnBoard: 2,
        redOnBoard: 1,
      })

      const yellowCount = boardWires.filter((w) => w.color === 'yellow').length
      const redCount = boardWires.filter((w) => w.color === 'red').length
      const blueCount = boardWires.filter((w) => w.color === 'blue').length

      expect(yellowCount).toBe(2)
      expect(redCount).toBe(1)
      expect(blueCount).toBe(48)
      expect(boardWires.length).toBe(51)
    })

    it('should handle zero yellow and red wires on board', () => {
      const blueWires = createBlueWires()
      const yellowWires = createColoredWires('yellow', 2)
      const redWires = createColoredWires('red', 2)

      const boardWires = prepareWiresForBoard({
        blueWires,
        yellowWires,
        redWires,
        yellowOnBoard: 0,
        redOnBoard: 0,
      })

      expect(boardWires.filter((w) => w.color === 'yellow').length).toBe(0)
      expect(boardWires.filter((w) => w.color === 'red').length).toBe(0)
      expect(boardWires.filter((w) => w.color === 'blue').length).toBe(48)
    })

    it('should return shuffled array (order different from input)', () => {
      const blueWires = createBlueWires()
      const yellowWires = []
      const redWires = []

      const boardWires = prepareWiresForBoard({
        blueWires,
        yellowWires,
        redWires,
        yellowOnBoard: 0,
        redOnBoard: 0,
      })

      // The order should likely be different due to shuffling
      // We can't guarantee this, but we can check the wires are the same
      expect(boardWires).toHaveLength(48)
      expect(new Set(boardWires.map((w) => w.id))).toEqual(new Set(blueWires.map((w) => w.id)))
    })
  })

  describe('distributeWiresToPlayers', () => {
    beforeEach(() => {
      // Clear player hands before each test
    })

    it('should distribute wires evenly among players', () => {
      const players = createGamePlayers(4, false, true)
      const wires = createBlueWires().slice(0, 12) // Use 12 wires for even distribution

      distributeWiresToPlayers(players, wires)

      expect(players[0].hand).toHaveLength(3)
      expect(players[1].hand).toHaveLength(3)
      expect(players[2].hand).toHaveLength(3)
      expect(players[3].hand).toHaveLength(3)
    })

    it('should distribute remaining wires when not evenly divisible', () => {
      const players = createGamePlayers(3, false, true)
      const wires = createBlueWires().slice(0, 10) // 10 wires for 3 players

      distributeWiresToPlayers(players, wires)

      const totalCards = players.reduce((sum, p) => sum + p.hand.length, 0)
      expect(totalCards).toBe(10)

      // First player should get one extra card
      expect(players[0].hand.length).toBe(4)
      expect(players[1].hand.length).toBe(3)
      expect(players[2].hand.length).toBe(3)
    })

    it('should sort each player hand by wire number', () => {
      const players = createGamePlayers(3, false, true)
      const wires = [
        { id: 'w1', number: 5 },
        { id: 'w2', number: 2 },
        { id: 'w3', number: 8 },
        { id: 'w4', number: 1 },
        { id: 'w5', number: 12 },
        { id: 'w6', number: 3 },
      ]

      distributeWiresToPlayers(players, wires)

      players.forEach((player) => {
        const numbers = player.hand.map((w) => w.number)
        const sorted = [...numbers].sort((a, b) => a - b)
        expect(numbers).toEqual(sorted)
      })
    })

    it('should ensure all wires are distributed', () => {
      const players = createGamePlayers(4, false, true)
      const wires = createBlueWires().slice(0, 16)
      const originalWireIds = new Set(wires.map((w) => w.id))

      distributeWiresToPlayers(players, wires)

      const distributedWireIds = new Set(players.flatMap((p) => p.hand.map((w) => w.id)))

      expect(distributedWireIds).toEqual(originalWireIds)
    })
  })

  describe('advancePickRound', () => {
    let gameState

    beforeEach(() => {
      // Create a simple game state for testing
      const players = createGamePlayers(3, false, true) // 3 AI players
      const wires = createBlueWires().slice(0, 12)
      distributeWiresToPlayers(players, wires)

      gameState = new GameState({
        players,
        wires,
        yellowWires: [],
        redWires: [],
        detonatorDial: 3,
        autoStart: false, // Don't auto-start to avoid triggering play phase
        phase: 'pick-card',
      })

      // Set initial picker
      gameState.currentPicker = 0
    })

    it('should advance to next player when current AI player picks', async () => {
      // To test single advance, we'll pre-pick cards for future players
      // so the function doesn't continue recursively
      gameState.players[1].hand[0].infoToken = true // Next player already picked
      gameState.players[2].hand[0].infoToken = true // Last player already picked

      const initialPicker = gameState.currentPicker

      await advancePickRound(gameState)

      // Should have gone through all rounds and reached play-phase
      // since all players now have picked
      expect(gameState.phase).toBe('play-phase')
      expect(gameState.currentPicker).toBe(null)

      // Initial player should have picked a card (have an infoToken)
      expect(gameState.players[initialPicker].hand.some((card) => card.infoToken)).toBe(true)
    })

    it('should transition to play-phase when all players have picked', async () => {
      // Pre-select cards for first two players
      gameState.players[0].hand[0].infoToken = true
      gameState.players[1].hand[0].infoToken = true
      gameState.currentPicker = 2 // Last player to pick

      await advancePickRound(gameState)

      // Should transition to play-phase
      expect(gameState.phase).toBe('play-phase')
      expect(gameState.currentPicker).toBe(null)
    })

    it('should automatically start play round when autoStart is true and all picked', async () => {
      // Create a special test case with autoStart enabled
      const autoStartGameState = new GameState({
        players: gameState.players,
        wires: gameState.wires,
        yellowWires: [],
        redWires: [],
        detonatorDial: 3,
        autoStart: true, // This is the key test
        phase: 'pick-card',
      })

      // Pre-select cards for first two players
      autoStartGameState.players[0].hand[0].infoToken = true
      autoStartGameState.players[1].hand[0].infoToken = true
      autoStartGameState.currentPicker = 2 // Last player to pick

      // Verify initial state
      expect(autoStartGameState.phase).toBe('pick-card')

      await advancePickRound(autoStartGameState)

      // When autoStart is true, it should call advancePlayRound which
      // immediately ends the game due to no cards being revealed
      expect(autoStartGameState.phase).toBe('game-over')
      expect(autoStartGameState.currentPicker).toBe(null)

      // The key assertion: all players should have picked
      expect(
        autoStartGameState.players.every((player) => player.hand.some((card) => card.infoToken)),
      ).toBe(true)
    })

    it('should not auto-start play round when autoStart is false', async () => {
      gameState.autoStart = false

      // Pre-select cards for first two players
      gameState.players[0].hand[0].infoToken = true
      gameState.players[1].hand[0].infoToken = true
      gameState.currentPicker = 2 // Last player to pick

      await advancePickRound(gameState)

      // Should transition to play-phase but not start playing automatically
      expect(gameState.phase).toBe('play-phase')
      expect(gameState.currentPicker).toBe(null)
    })

    it('should wait for human player input and not advance automatically', async () => {
      // Create game with human player
      const players = createGamePlayers(3, true, true) // Human + 2 AI
      const wires = createBlueWires().slice(0, 12)
      distributeWiresToPlayers(players, wires)

      const humanGameState = new GameState({
        players,
        wires,
        yellowWires: [],
        redWires: [],
        detonatorDial: 3,
        autoStart: false,
        phase: 'pick-card',
      })

      humanGameState.currentPicker = 0 // Human player's turn
      const initialPicker = humanGameState.currentPicker

      await advancePickRound(humanGameState)

      // Should not advance past human player who hasn't picked
      expect(humanGameState.currentPicker).toBe(initialPicker)
      expect(humanGameState.players[0].hand.some((card) => card.infoToken)).toBe(false)
    })

    it('should continue with next player after human picks', async () => {
      // Create game with human player
      const players = createGamePlayers(3, true, true) // Human + 2 AI
      const wires = createBlueWires().slice(0, 12)
      distributeWiresToPlayers(players, wires)

      const humanGameState = new GameState({
        players,
        wires,
        yellowWires: [],
        redWires: [],
        detonatorDial: 3,
        autoStart: false,
        phase: 'pick-card',
      })

      humanGameState.currentPicker = 0 // Human player's turn
      // Simulate human picking a card
      humanGameState.players[0].hand[0].infoToken = true

      // Pre-pick for the last AI player so we don't go through all rounds
      humanGameState.players[2].hand[0].infoToken = true

      await advancePickRound(humanGameState)

      // Should have completed the pick round and transitioned to play-phase
      expect(humanGameState.phase).toBe('play-phase')
      expect(humanGameState.currentPicker).toBe(null)

      // All players should have picked
      expect(
        humanGameState.players.every((player) => player.hand.some((card) => card.infoToken)),
      ).toBe(true)
    })

    it('should call advancePlayRound function when autoStart flag is enabled (regression test)', async () => {
      // This test specifically checks the regression where the autoStart branch was missing
      const autoStartGameState = new GameState({
        players: gameState.players,
        wires: gameState.wires,
        yellowWires: [],
        redWires: [],
        detonatorDial: 3,
        autoStart: true,
        phase: 'pick-card',
      })

      // Pre-select cards for all players
      autoStartGameState.players[0].hand[0].infoToken = true
      autoStartGameState.players[1].hand[0].infoToken = true
      autoStartGameState.players[2].hand[0].infoToken = true
      autoStartGameState.currentPicker = 0 // Start from beginning since all are already picked

      await advancePickRound(autoStartGameState)

      // The critical test: if autoStart works, advancePlayRound should be called
      // which ends the game immediately (since no cards are revealed)
      // If the bug existed, the phase would stay at 'play-phase' instead of 'game-over'
      expect(autoStartGameState.phase).toBe('game-over')

      // Additional verification that we went through the full flow
      expect(
        autoStartGameState.players.every((player) => player.hand.some((card) => card.infoToken)),
      ).toBe(true)
    })
  })
})
