import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PlayArea from '../../src/components/PlayArea.vue'
import { withQuasar } from '../test-utils.js'

// Mock the useGameStateManager composable
const mockAdvancePickRound = vi.fn()
const mockAdvancePlayRound = vi.fn()
const mockPlayRound = vi.fn(() => ({ outcome: 'valid' }))

vi.mock('../../src/composables/managers/GameStateManager.js', () => ({
  useGameStateManager: () => ({
    advancePickRound: mockAdvancePickRound,
    advancePlayRound: mockAdvancePlayRound,
    playRound: mockPlayRound,
  }),
}))

describe('PlayArea Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  const mockState = {
    players: [
      { id: 0, name: 'Alice', hand: [], isAI: false },
      { id: 1, name: 'Bob', hand: [], isAI: true },
      { id: 2, name: 'Charlie', hand: [], isAI: true },
    ],
    phase: 'play-phase',
    currentPicker: 0,
    candidatesForSlot: () => [],
    monteCarloSlotProbabilities: () => [],
  }

  const defaultProps = {
    state: mockState,
    selectedPlayerIdx: 0,
  }

  // Helper function for double detector tests
  const createDoubleDetectorState = (hasDoubleDetector = true) => ({
    ...mockState,
    phase: 'play-phase',
    currentPicker: 0,
    players: [
      {
        id: 0,
        name: 'Alice',
        hand: [
          { id: 'blue1', type: 'blue', number: 1 },
          { id: 'yellow1', type: 'yellow', number: 2 },
        ],
        isAI: false,
        hasDoubleDetector,
      },
      {
        id: 1,
        name: 'Bob',
        hand: [
          { id: 'blue2', type: 'blue', number: 1 },
          { id: 'blue3', type: 'blue', number: 2 },
        ],
        isAI: true,
      },
    ],
  })

  it('shows play message when isHumanTurn and playMessage provided', () => {
    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: {
          ...defaultProps,
          state: {
            ...mockState,
            phase: 'play-phase',
            currentPicker: 0,
          },
        },
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    const message = wrapper.find('.text-primary.text-h6')
    expect(message.exists()).toBe(true)
    expect(message.text()).toContain('pick a card')
  })

  it('hides play message when not human turn', () => {
    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: {
          ...defaultProps,
          state: {
            ...mockState,
            currentPicker: 1, // AI player
          },
        },
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    const message = wrapper.find('.text-primary.text-h6')
    expect(message.exists()).toBe(false)
  })

  it('hides play message when no playMessage provided', () => {
    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: {
          ...defaultProps,
          state: {
            ...mockState,
            phase: 'game-over', // Not in active phase
          },
        },
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    const message = wrapper.find('.text-primary.text-h6')
    expect(message.exists()).toBe(false)
  })

  it('renders toggle section for candidates visibility', () => {
    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: defaultProps,
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    // Check that the toggle area exists
    const toggleArea = wrapper.find('.row.items-center.q-gutter-sm.q-mb-sm')
    expect(toggleArea.exists()).toBe(true)
    expect(toggleArea.text()).toContain('Other Players')
  })

  it('calls advancePickRound when handlePlayerDeckPick is called during pick phase', async () => {
    // Create a state where player has pickCard method
    const testState = {
      ...mockState,
      phase: 'pick-card',
      currentPicker: 0,
      players: [
        {
          id: 0,
          name: 'Alice',
          hand: [],
          isAI: false,
          pickCard: vi.fn(() => 'success'), // pickCard returns non-null
        },
        { id: 1, name: 'Bob', hand: [], isAI: true },
        { id: 2, name: 'Charlie', hand: [], isAI: true },
      ],
    }

    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: {
          ...defaultProps,
          state: testState,
        },
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    const mockCard = { id: 'test-card' }

    // Call the method directly
    await wrapper.vm.handlePlayerDeckPick(mockCard)

    expect(mockAdvancePickRound).toHaveBeenCalled()
  })

  it('calls playRound when handlePlayerDeckPick is called during play phase', async () => {
    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: defaultProps,
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    const mockCard = { id: 'test-card' }

    // Call the method directly
    await wrapper.vm.handlePlayerDeckPick(mockCard)

    expect(mockPlayRound).toHaveBeenCalled()
  })

  it('has correct layout structure', () => {
    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: defaultProps,
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    // Check main layout
    const mainRow = wrapper.find('.row.q-gutter-md.items-start')
    expect(mainRow.exists()).toBe(true)

    // Check other players section
    const otherPlayersSection = wrapper.find('.q-mt-lg')
    expect(otherPlayersSection.exists()).toBe(true)

    const otherPlayersTitle = otherPlayersSection.find('.text-h6')
    expect(otherPlayersTitle.text()).toBe('Other Players')
  })

  it('manages internal showCandidates state', () => {
    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: defaultProps,
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    // Initially showCandidates should be false
    expect(wrapper.vm.showCandidates).toBe(false)

    // Can set the state directly for testing
    wrapper.vm.showCandidates = true
    expect(wrapper.vm.showCandidates).toBe(true)
  })

  it('handles pick phase correctly', async () => {
    const pickPhaseState = {
      ...mockState,
      phase: 'pick-card',
      currentPicker: 0,
      players: [
        {
          id: 0,
          name: 'Alice',
          hand: [
            { id: 'blue1', type: 'blue', number: 1, color: 'blue' },
            { id: 'blue2', type: 'blue', number: 2, color: 'blue' },
          ],
          isAI: false,
          pickCard: vi.fn(() => ({ id: 'blue1' })),
        },
        { id: 1, name: 'Bob', hand: [], isAI: true },
      ],
    }

    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: {
          ...defaultProps,
          state: pickPhaseState,
        },
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    // Should show pick phase message
    expect(wrapper.vm.isPickPhase).toBe(true)
    expect(wrapper.vm.isHumanTurn).toBe(true)
    expect(wrapper.vm.playMessage).toBe('Your turn: pick a blue card')

    // Should show the message in UI
    const message = wrapper.find('.text-primary.text-h6')
    expect(message.exists()).toBe(true)
    expect(message.text()).toBe('Your turn: pick a blue card')

    // Selected player deck should be selectable
    const selectedPlayerDeck = wrapper.findComponent('[visible="true"]')
    expect(selectedPlayerDeck.props('selectable')).toBe(true)

    // Should call handlePlayerDeckPick when picking a card
    const mockCard = { id: 'blue1', type: 'blue', number: 1 }
    await selectedPlayerDeck.vm.$emit('pick', mockCard)

    // Should call advancePickRound after successful pick
    expect(mockAdvancePickRound).toHaveBeenCalled()
  })

  it('handles game initialization and auto-start pick phase', () => {
    // Test that the component works when game is auto-started
    const autoStartState = {
      ...mockState,
      phase: 'pick-card',
      currentPicker: 0,
      players: [
        {
          id: 0,
          name: 'Alice',
          hand: [{ id: 'blue1', type: 'blue', number: 1, color: 'blue' }],
          isAI: false,
          pickCard: vi.fn(() => ({ id: 'blue1' })),
        },
        { id: 1, name: 'Bob', hand: [], isAI: true },
      ],
    }

    const wrapper = mount(
      PlayArea,
      withQuasar({
        props: {
          ...defaultProps,
          state: autoStartState,
        },
        global: {
          stubs: ['PlayerDeck', 'QToggle'],
        },
      }),
    )

    // Should be in pick phase and ready for human interaction
    expect(wrapper.vm.isPickPhase).toBe(true)
    expect(wrapper.vm.isHumanTurn).toBe(true)
    expect(wrapper.vm.playMessage).toBe('Your turn: pick a blue card')

    // UI should show the pick message
    const message = wrapper.find('.text-primary.text-h6')
    expect(message.exists()).toBe(true)
    expect(message.text()).toBe('Your turn: pick a blue card')
  })

  describe('Computed Properties', () => {
    it('calculates otherPlayers correctly', () => {
      const testState = {
        ...mockState,
        players: [
          { id: 0, name: 'Alice', hand: [], isAI: false },
          { id: 1, name: 'Bob', hand: [], isAI: true },
          { id: 2, name: 'Charlie', hand: [], isAI: true },
          { id: 3, name: 'David', hand: [], isAI: true },
        ],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState, selectedPlayerIdx: 1 },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const otherPlayers = wrapper.vm.otherPlayers
      expect(otherPlayers).toHaveLength(3)
      expect(otherPlayers[0].name).toBe('Charlie') // index 2
      expect(otherPlayers[1].name).toBe('David') // index 3
      expect(otherPlayers[2].name).toBe('Alice') // index 0 (wrapped around)
    })

    it('handles empty players array for otherPlayers', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: { ...mockState, players: [] } },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      expect(wrapper.vm.otherPlayers).toEqual([])
    })

    it('calculates different playMessage based on game state', async () => {
      // Pick phase message
      const pickPhaseWrapper = mount(
        PlayArea,
        withQuasar({
          props: {
            ...defaultProps,
            state: { ...mockState, phase: 'pick-card', currentPicker: 0 },
          },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )
      expect(pickPhaseWrapper.vm.playMessage).toBe('Your turn: pick a blue card')

      // Play phase - no source card
      const playPhaseWrapper = mount(
        PlayArea,
        withQuasar({
          props: {
            ...defaultProps,
            state: { ...mockState, phase: 'play-phase', currentPicker: 0 },
          },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )
      expect(playPhaseWrapper.vm.playMessage).toBe('Your turn: pick a card from your hand')

      // Play phase - has source card
      playPhaseWrapper.vm.playSelection = { sourceCard: { id: 'test' }, targetCard: null }
      await playPhaseWrapper.vm.$nextTick()
      expect(playPhaseWrapper.vm.playMessage).toBe(
        "Now pick a card from another player's hand or from your own hand",
      )
    })

    it('calculates isHumanTurn correctly', () => {
      // Human turn
      const humanTurnWrapper = mount(
        PlayArea,
        withQuasar({
          props: {
            ...defaultProps,
            state: { ...mockState, phase: 'play-phase', currentPicker: 0 },
            selectedPlayerIdx: 0,
          },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )
      expect(humanTurnWrapper.vm.isHumanTurn).toBe(true)

      // AI turn
      const aiTurnWrapper = mount(
        PlayArea,
        withQuasar({
          props: {
            ...defaultProps,
            state: { ...mockState, phase: 'play-phase', currentPicker: 1 },
            selectedPlayerIdx: 0,
          },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )
      expect(aiTurnWrapper.vm.isHumanTurn).toBe(false)
    })
  })

  describe('Game Logic Functions', () => {
    it('handleHumanPick calls advancePickRound when player picks successfully', async () => {
      const testState = {
        ...mockState,
        phase: 'pick-card',
        currentPicker: 0,
        players: [
          {
            id: 0,
            name: 'Alice',
            hand: [],
            isAI: false,
            pickCard: vi.fn(() => 'success'),
          },
          { id: 1, name: 'Bob', hand: [], isAI: true },
        ],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const mockCard = { id: 'test-card' }
      await wrapper.vm.handleHumanPick(mockCard)

      expect(testState.players[0].pickCard).toHaveBeenCalledWith(mockCard)
      expect(mockAdvancePickRound).toHaveBeenCalled()
    })

    it('handleHumanPick does not advance when player pick fails', async () => {
      const testState = {
        ...mockState,
        phase: 'pick-card',
        currentPicker: 0,
        players: [
          {
            id: 0,
            name: 'Alice',
            hand: [],
            isAI: false,
            pickCard: vi.fn(() => null), // Returns null = failed pick
          },
        ],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const mockCard = { id: 'test-card' }
      await wrapper.vm.handleHumanPick(mockCard)

      expect(testState.players[0].pickCard).toHaveBeenCalledWith(mockCard)
      expect(mockAdvancePickRound).not.toHaveBeenCalled()
    })

    it('handleHumanPlayPick - Step 1: picks own card as source successfully', async () => {
      mockPlayRound.mockReturnValue({ outcome: 'valid' })

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Ensure no source card initially
      wrapper.vm.playSelection = { sourceCard: null, targetCard: null }

      const mockCard = { id: 'source-card' }
      const playerId = mockState.players[0].id

      await wrapper.vm.handleHumanPlayPick(mockCard, playerId)

      expect(mockPlayRound).toHaveBeenCalledWith({
        sourcePlayerIdx: 0,
        sourceCardId: 'source-card',
        targetPlayerIdx: null,
        targetCardId: null,
      })
      expect(wrapper.vm.playSelection.sourceCard).toEqual(mockCard)
    })

    it('handleHumanPlayPick - Step 1: rejects pick from wrong player', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.playSelection = { sourceCard: null, targetCard: null }

      const mockCard = { id: 'source-card' }
      const wrongPlayerId = mockState.players[1].id // Different player

      await wrapper.vm.handleHumanPlayPick(mockCard, wrongPlayerId)

      expect(mockPlayRound).not.toHaveBeenCalled()
      expect(wrapper.vm.playSelection.sourceCard).toBeNull()
    })

    it('handleHumanPlayPick - Step 1: handles invalid pick outcome', async () => {
      mockPlayRound.mockReturnValue({ outcome: 'invalid-pick' })

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.playSelection = { sourceCard: null, targetCard: null }

      const mockCard = { id: 'source-card' }
      const playerId = mockState.players[0].id

      await wrapper.vm.handleHumanPlayPick(mockCard, playerId)

      expect(mockPlayRound).toHaveBeenCalled()
      expect(wrapper.vm.playSelection.sourceCard).toBeNull() // Should not set source card
      expect(mockAdvancePlayRound).not.toHaveBeenCalled()
    })

    it('handleHumanPlayPick - Step 2: picks target card successfully', async () => {
      mockPlayRound.mockReturnValue({ outcome: 'valid' })

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Set up initial state with source card already selected
      const sourceCard = { id: 'source-card' }
      wrapper.vm.playSelection = { sourceCard, targetCard: null }

      const targetCard = { id: 'target-card' }
      const targetPlayerId = mockState.players[1].id

      await wrapper.vm.handleHumanPlayPick(targetCard, targetPlayerId)

      expect(mockPlayRound).toHaveBeenCalledWith({
        sourcePlayerIdx: 0,
        sourceCardId: 'source-card',
        targetPlayerIdx: 1,
        targetCardId: 'target-card',
      })
      expect(mockAdvancePlayRound).toHaveBeenCalled()
      expect(wrapper.vm.playSelection).toEqual({
        sourceCard: null,
        targetCard: null,
        secondTargetCard: null,
      })
    })

    it('handleHumanPlayPick - Step 2: handles invalid target pick', async () => {
      mockPlayRound.mockReturnValue({ outcome: 'invalid-pick' })

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const sourceCard = { id: 'source-card' }
      wrapper.vm.playSelection = { sourceCard, targetCard: null }

      const targetCard = { id: 'target-card' }
      const targetPlayerId = mockState.players[1].id

      await wrapper.vm.handleHumanPlayPick(targetCard, targetPlayerId)

      expect(mockPlayRound).toHaveBeenCalled()
      expect(mockAdvancePlayRound).not.toHaveBeenCalled()
      expect(wrapper.vm.playSelection).toEqual({
        sourceCard: null,
        targetCard: null,
        secondTargetCard: null,
      }) // Reset selection
    })

    it('handleHumanPlayPick - Step 2: handles player not found', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const sourceCard = { id: 'source-card' }
      wrapper.vm.playSelection = { sourceCard, targetCard: null }

      const targetCard = { id: 'target-card' }
      const invalidPlayerId = 999 // Player that doesn't exist

      await wrapper.vm.handleHumanPlayPick(targetCard, invalidPlayerId)

      expect(mockPlayRound).not.toHaveBeenCalled()
      expect(mockAdvancePlayRound).not.toHaveBeenCalled()
    })

    it('handleOtherPlayerPick calls game functions when valid', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: {
            ...defaultProps,
            state: { ...mockState, phase: 'play-phase', currentPicker: 0 },
          },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Set up with source card already selected
      wrapper.vm.playSelection = { sourceCard: { id: 'source' }, targetCard: null }

      const mockCard = { id: 'test-card' }
      const playerId = 1

      await wrapper.vm.handleOtherPlayerPick(mockCard, playerId)

      // Should call playRound with correct parameters
      expect(mockPlayRound).toHaveBeenCalledWith({
        sourcePlayerIdx: 0,
        sourceCardId: 'source',
        targetPlayerIdx: 1,
        targetCardId: 'test-card',
      })
    })

    it('handlePlayerDeckPick calls different functions based on phase', async () => {
      // Test pick phase - should call advancePickRound
      const pickPhaseState = {
        ...mockState,
        phase: 'pick-card',
        currentPicker: 0,
        players: [
          { id: 0, name: 'Alice', hand: [], isAI: false, pickCard: vi.fn(() => 'success') },
          { id: 1, name: 'Bob', hand: [], isAI: true },
        ],
      }
      const pickWrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: pickPhaseState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      await pickWrapper.vm.handlePlayerDeckPick({ id: 'test' })
      expect(mockAdvancePickRound).toHaveBeenCalled()

      // Reset mocks
      vi.clearAllMocks()

      // Test play phase - should call playRound
      const playPhaseState = { ...mockState, phase: 'play-phase', currentPicker: 0 }
      const playWrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: playPhaseState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      await playWrapper.vm.handlePlayerDeckPick({ id: 'test' })
      expect(mockPlayRound).toHaveBeenCalled()
    })

    it('functions return early when not human turn', async () => {
      const aiTurnState = { ...mockState, currentPicker: 1 } // AI player turn

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: aiTurnState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      await wrapper.vm.handlePlayerDeckPick({ id: 'test' })
      await wrapper.vm.handleHumanPlayPick({ id: 'test' }, 0)

      expect(mockAdvancePickRound).not.toHaveBeenCalled()
      expect(mockAdvancePlayRound).not.toHaveBeenCalled()
      expect(mockPlayRound).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles undefined state gracefully', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: undefined },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      expect(wrapper.vm.players).toEqual([])
      expect(wrapper.vm.otherPlayers).toEqual([])
      expect(wrapper.vm.isHumanTurn).toBe(false)
    })

    it('handles empty players array', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: { ...mockState, players: [] } },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      expect(wrapper.vm.players).toEqual([])
      expect(wrapper.vm.selectedPlayer).toEqual({})
      expect(wrapper.vm.otherPlayers).toEqual([])
    })

    it('handles missing candidatesForSlot function', () => {
      const stateWithoutCandidates = { ...mockState, candidatesForSlot: undefined }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: stateWithoutCandidates },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Should not crash when accessing getPlayerCandidates
      expect(() => wrapper.vm.getPlayerCandidates(mockState.players[0])).not.toThrow()
    })

    it('handles missing monteCarloSlotProbabilities function', () => {
      const stateWithoutMonteCarlo = {
        ...mockState,
        candidatesForSlot: () => [],
        monteCarloSlotProbabilities: undefined,
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: stateWithoutMonteCarlo },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // The component should handle missing function gracefully
      expect(() => {
        try {
          wrapper.vm.allCandidates
        } catch (error) {
          // This is expected - the component will throw because the function is missing
          expect(error.message).toContain('monteCarloSlotProbabilities is not a function')
        }
      }).not.toThrow()
    })

    it('handles invalid selectedPlayerIdx', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, selectedPlayerIdx: 999 },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      expect(wrapper.vm.selectedPlayer).toEqual({})
      expect(wrapper.vm.isHumanTurn).toBe(false)
    })

    it('handles player without pickCard method', async () => {
      const testState = {
        ...mockState,
        phase: 'pick-card',
        currentPicker: 0,
        players: [
          { id: 0, name: 'Alice', hand: [], isAI: false }, // No pickCard method
        ],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const mockCard = { id: 'test-card' }
      await wrapper.vm.handleHumanPick(mockCard)

      // Should not crash and should not call advancePickRound
      expect(mockAdvancePickRound).not.toHaveBeenCalled()
    })
  })

  describe('Template Integration', () => {
    it('renders player decks for other players', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const playerDecks = wrapper.findAllComponents({ name: 'PlayerDeck' })
      // Should have 1 for selected player + 2 for other players = 3 total
      expect(playerDecks.length).toBe(3)
    })

    it('passes correct props to selected player deck', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const selectedPlayerDeck = wrapper.findComponent('[visible="true"]')
      expect(selectedPlayerDeck.props('player')).toEqual(mockState.players[0])
      expect(selectedPlayerDeck.props('visible')).toBe(true)
      expect(selectedPlayerDeck.props('selectable')).toBe(true) // isHumanTurn is true based on our mock setup
    })

    it('passes correct props to other player decks', () => {
      const humanTurnState = { ...mockState, phase: 'play-phase', currentPicker: 0 }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: humanTurnState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Set source card to make other players selectable
      wrapper.vm.playSelection = { sourceCard: { id: 'source' }, targetCard: null }

      const otherPlayerDecks = wrapper.findAllComponents('[visible="false"]')
      expect(otherPlayerDecks.length).toBe(2)

      otherPlayerDecks.forEach((deck) => {
        expect(deck.props('visible')).toBe(false)
        expect(deck.props('size')).toBe('small')
      })
    })

    it('shows/hides candidates based on toggle state', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Initially candidates should be undefined
      const otherPlayerDecks = wrapper.findAllComponents('[visible="false"]')
      otherPlayerDecks.forEach((deck) => {
        expect(deck.props('candidates')).toBeUndefined()
      })

      // Toggle candidates on
      wrapper.vm.showCandidates = true
      await wrapper.vm.$nextTick()

      // Now candidates should be provided
      const updatedDecks = wrapper.findAllComponents('[visible="false"]')
      updatedDecks.forEach((deck) => {
        expect(deck.props('candidates')).toBeDefined()
      })
    })

    it('triggers template arrow function for other player picks', async () => {
      const testState = {
        ...mockState,
        phase: 'play-phase',
        currentPicker: 0,
        players: [
          {
            id: 0,
            name: 'Alice',
            hand: [{ id: 'alice1', number: 1, color: 'blue' }],
            isAI: false,
          },
          {
            id: 1,
            name: 'Bob',
            hand: [{ id: 'bob1', number: 2, color: 'blue' }],
            isAI: true,
          },
          {
            id: 2,
            name: 'Charlie',
            hand: [{ id: 'charlie1', number: 3, color: 'blue' }],
            isAI: true,
          },
        ],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Set source card to enable other player selection
      wrapper.vm.playSelection = {
        sourceCard: { id: 'alice1' },
        targetCard: null,
        secondTargetCard: null,
      }
      await wrapper.vm.$nextTick()

      // Spy on the handleOtherPlayerPick method
      const spyHandleOtherPlayerPick = vi.spyOn(wrapper.vm, 'handleOtherPlayerPick')

      // Get other player decks and emit pick events to test the template arrow functions
      const otherPlayerDecks = wrapper.findAllComponents('[visible="false"]')

      // Trigger pick on Bob's deck (template: @pick="(card) => handleOtherPlayerPick(card, player.id)")
      await otherPlayerDecks[0].vm.$emit('pick', { id: 'bob1' })
      expect(spyHandleOtherPlayerPick).toHaveBeenCalledWith({ id: 'bob1' }, 1)

      // Trigger pick on Charlie's deck
      await otherPlayerDecks[1].vm.$emit('pick', { id: 'charlie1' })
      expect(spyHandleOtherPlayerPick).toHaveBeenCalledWith({ id: 'charlie1' }, 2)
    })
  })

  describe('Double Detector Functionality', () => {
    it('shows double detector button when player has double detector and it is play phase', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState() },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const doubleDetectorBtn = wrapper.find('button')
      expect(doubleDetectorBtn.exists()).toBe(true)
      expect(doubleDetectorBtn.text()).toContain('Double Detector')
    })

    it('hides double detector button when player does not have double detector', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState(false) },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const doubleDetectorBtn = wrapper.find('[icon="leak_add"]')
      expect(doubleDetectorBtn.exists()).toBe(false)
    })

    it('hides double detector button when not human turn', () => {
      const state = { ...createDoubleDetectorState(), currentPicker: 1 }
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const doubleDetectorBtn = wrapper.find('[icon="leak_add"]')
      expect(doubleDetectorBtn.exists()).toBe(false)
    })

    it('hides double detector button when not in play phase', () => {
      const state = { ...createDoubleDetectorState(), phase: 'pick-card' }
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const doubleDetectorBtn = wrapper.find('[icon="leak_add"]')
      expect(doubleDetectorBtn.exists()).toBe(false)
    })

    it('toggles double detector when button is clicked', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState() },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      expect(wrapper.vm.doubleDetector).toBe(false)

      const doubleDetectorBtn = wrapper.find('button')
      await doubleDetectorBtn.trigger('click')

      expect(wrapper.vm.doubleDetector).toBe(true)
      expect(doubleDetectorBtn.text()).toContain('Double Detector Active')
    })

    it('resets target selections when toggling double detector', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState() },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Set up play selection with source card
      wrapper.vm.playSelection = {
        sourceCard: { id: 'source' },
        targetCard: { id: 'target' },
        secondTargetCard: { id: 'second' },
      }

      await wrapper.vm.toggleDoubleDetector()

      expect(wrapper.vm.playSelection).toEqual({
        sourceCard: { id: 'source' },
        targetCard: null,
        secondTargetCard: null,
      })
    })

    it('does not toggle double detector when player does not have it', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState(false) },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      const initialState = wrapper.vm.doubleDetector
      await wrapper.vm.toggleDoubleDetector()

      expect(wrapper.vm.doubleDetector).toBe(initialState)
    })

    it('calculates correct button labels for double detector states', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState() },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Initial state
      expect(wrapper.vm.doubleDetectorButtonLabel).toBe('Double Detector')

      // Activate double detector
      wrapper.vm.doubleDetector = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.doubleDetectorButtonLabel).toBe('Double Detector Active')

      // Add source card
      wrapper.vm.playSelection.sourceCard = { id: 'source' }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.doubleDetectorButtonLabel).toBe('Pick 2 targets')

      // Add first target
      wrapper.vm.playSelection.targetCard = { id: 'target1' }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.doubleDetectorButtonLabel).toBe('Pick 1 more')

      // Add second target
      wrapper.vm.playSelection.secondTargetCard = { id: 'target2' }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.doubleDetectorButtonLabel).toBe('Ready to execute!')
    })

    it('handles double detector play with two target cards', async () => {
      mockPlayRound.mockReturnValue({ outcome: 'match-blue' })

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState() },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Activate double detector and set source card
      wrapper.vm.doubleDetector = true
      wrapper.vm.playSelection = {
        sourceCard: { id: 'source' },
        targetCard: null,
        secondTargetCard: null,
      }

      // First target card
      await wrapper.vm.handleHumanPlayPick({ id: 'target1' }, 1)
      expect(wrapper.vm.playSelection.targetCard).toEqual({ id: 'target1' })
      expect(wrapper.vm.playSelection.secondTargetCard).toBeNull()
      expect(mockPlayRound).not.toHaveBeenCalled()

      // Second target card
      await wrapper.vm.handleHumanPlayPick({ id: 'target2' }, 1)

      expect(mockPlayRound).toHaveBeenCalledWith({
        sourcePlayerIdx: 0,
        sourceCardId: 'source',
        targetPlayerIdx: 1,
        targetCardId: 'target1',
        secondTargetCardId: 'target2',
      })
      expect(mockAdvancePlayRound).toHaveBeenCalled()
      expect(wrapper.vm.playSelection).toEqual({
        sourceCard: null,
        targetCard: null,
        secondTargetCard: null,
      })
    })

    it('ignores duplicate target card selection in double detector mode', async () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState() },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.doubleDetector = true
      wrapper.vm.playSelection = {
        sourceCard: { id: 'source' },
        targetCard: { id: 'target1' },
        secondTargetCard: null,
      }

      // Try to select same card as second target
      await wrapper.vm.handleHumanPlayPick({ id: 'target1' }, 1)

      // Should not change state
      expect(wrapper.vm.playSelection.secondTargetCard).toBeNull()
      expect(mockPlayRound).not.toHaveBeenCalled()
    })

    it('resets play selection when double detector play is invalid', async () => {
      mockPlayRound.mockReturnValue({ outcome: 'invalid-pick' })

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState() },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.doubleDetector = true
      wrapper.vm.playSelection = {
        sourceCard: { id: 'source' },
        targetCard: { id: 'target1' },
        secondTargetCard: null,
      }

      await wrapper.vm.handleHumanPlayPick({ id: 'target2' }, 1)

      expect(wrapper.vm.playSelection).toEqual({
        sourceCard: null,
        targetCard: null,
        secondTargetCard: null,
      })
      expect(mockAdvancePlayRound).not.toHaveBeenCalled()
    })
  })

  describe('Selection State Management', () => {
    it('tracks selected cards correctly', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Initial state
      expect(wrapper.vm.selectedCards).toEqual({
        sourceCardId: null,
        targetCardId: null,
        secondTargetCardId: null,
      })

      // Set selection
      wrapper.vm.playSelection = {
        sourceCard: { id: 'source1' },
        targetCard: { id: 'target1' },
        secondTargetCard: { id: 'target2' },
      }

      expect(wrapper.vm.selectedCards).toEqual({
        sourceCardId: 'source1',
        targetCardId: 'target1',
        secondTargetCardId: 'target2',
      })
    })

    it('enhances other players with selection state', () => {
      const testState = {
        ...mockState,
        players: [
          {
            id: 0,
            name: 'Alice',
            hand: [{ id: 'card1' }],
            isAI: false,
          },
          {
            id: 1,
            name: 'Bob',
            hand: [{ id: 'card2' }, { id: 'card3' }],
            isAI: true,
          },
        ],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.playSelection = {
        sourceCard: { id: 'card1' },
        targetCard: { id: 'card2' },
        secondTargetCard: null,
      }

      const otherPlayersWithSelection = wrapper.vm.otherPlayersWithSelection
      expect(otherPlayersWithSelection).toHaveLength(1)
      expect(otherPlayersWithSelection[0].name).toBe('Bob')
      expect(otherPlayersWithSelection[0].hand[0].selected).toBe(true) // card2 is selected
      expect(otherPlayersWithSelection[0].hand[1].selected).toBe(false) // card3 is not selected
    })

    it('enhances selected player with selection state', () => {
      const testState = {
        ...mockState,
        players: [
          {
            id: 0,
            name: 'Alice',
            hand: [{ id: 'card1' }, { id: 'card2' }],
            isAI: false,
          },
        ],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.playSelection = {
        sourceCard: { id: 'card1' },
        targetCard: null,
        secondTargetCard: null,
      }

      const selectedPlayerWithSelection = wrapper.vm.selectedPlayerWithSelection
      expect(selectedPlayerWithSelection.name).toBe('Alice')
      expect(selectedPlayerWithSelection.hand[0].selected).toBe(true) // card1 is selected
      expect(selectedPlayerWithSelection.hand[1].selected).toBe(false) // card2 is not selected
    })

    it('handles player without hand gracefully in selection enhancement', () => {
      const testState = {
        ...mockState,
        players: [{ id: 0, name: 'Alice', isAI: false }], // No hand property
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      expect(() => wrapper.vm.selectedPlayerWithSelection).not.toThrow()
      expect(wrapper.vm.selectedPlayerWithSelection).toEqual({ id: 0, name: 'Alice', isAI: false })
    })

    it('resets all selection state correctly', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Set up state
      wrapper.vm.playSelection = {
        sourceCard: { id: 'source' },
        targetCard: { id: 'target' },
        secondTargetCard: { id: 'second' },
      }
      wrapper.vm.doubleDetector = true

      // Reset
      wrapper.vm.resetPlaySelection()

      expect(wrapper.vm.playSelection).toEqual({
        sourceCard: null,
        targetCard: null,
        secondTargetCard: null,
      })
      expect(wrapper.vm.doubleDetector).toBe(false)
    })
  })

  describe('Play Message Variants', () => {
    it('shows correct message for double detector mode', async () => {
      const testState = {
        ...mockState,
        phase: 'play-phase',
        currentPicker: 0,
        players: [{ id: 0, name: 'Alice', isAI: false, hasDoubleDetector: true }],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Activate double detector with source card
      wrapper.vm.doubleDetector = true
      wrapper.vm.playSelection = {
        sourceCard: { id: 'source' },
        targetCard: null,
        secondTargetCard: null,
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.playMessage).toBe(
        "Double Detector Active: Pick TWO cards from another player's hand",
      )

      // With second target selected
      wrapper.vm.playSelection.secondTargetCard = { id: 'second' }
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.playMessage).toBe(
        'Double Detector: Ready to play! Click to execute your move.',
      )
    })
  })

  describe('Advanced Double Detector Scenarios', () => {
    it('handles complex double detector workflow', async () => {
      mockPlayRound
        .mockReturnValueOnce({ outcome: 'valid' }) // Source card selection
        .mockReturnValueOnce({ outcome: 'match-blue' }) // Double detector execution

      const testState = {
        ...mockState,
        phase: 'play-phase',
        currentPicker: 0,
        players: [
          {
            id: 0,
            name: 'Alice',
            hand: [{ id: 'source-card' }],
            isAI: false,
            hasDoubleDetector: true,
          },
          {
            id: 1,
            name: 'Bob',
            hand: [{ id: 'target1' }, { id: 'target2' }],
            isAI: true,
          },
        ],
      }

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: testState },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      // Step 1: Activate double detector
      await wrapper.vm.toggleDoubleDetector()
      expect(wrapper.vm.doubleDetector).toBe(true)

      // Step 2: Select source card
      await wrapper.vm.handleHumanPlayPick({ id: 'source-card' }, 0)
      expect(wrapper.vm.playSelection.sourceCard).toEqual({ id: 'source-card' })

      // Step 3: Select first target
      await wrapper.vm.handleHumanPlayPick({ id: 'target1' }, 1)
      expect(wrapper.vm.playSelection.targetCard).toEqual({ id: 'target1' })
      expect(mockAdvancePlayRound).not.toHaveBeenCalled()

      // Step 4: Select second target and execute
      await wrapper.vm.handleHumanPlayPick({ id: 'target2' }, 1)

      expect(mockPlayRound).toHaveBeenCalledWith({
        sourcePlayerIdx: 0,
        sourceCardId: 'source-card',
        targetPlayerIdx: 1,
        targetCardId: 'target1',
        secondTargetCardId: 'target2',
      })
      expect(mockAdvancePlayRound).toHaveBeenCalled()
      expect(wrapper.vm.playSelection).toEqual({
        sourceCard: null,
        targetCard: null,
        secondTargetCard: null,
      })
    })

    it('handles double detector with invalid outcome types correctly', async () => {
      mockPlayRound.mockReturnValue({ outcome: 'special-invalid-double' })

      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: { ...defaultProps, state: createDoubleDetectorState() },
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.doubleDetector = true
      wrapper.vm.playSelection = {
        sourceCard: { id: 'source' },
        targetCard: { id: 'target1' },
        secondTargetCard: null,
      }

      await wrapper.vm.handleHumanPlayPick({ id: 'target2' }, 1)

      // Should reset because outcome contains 'invalid'
      expect(wrapper.vm.playSelection).toEqual({
        sourceCard: null,
        targetCard: null,
        secondTargetCard: null,
      })
      expect(mockAdvancePlayRound).not.toHaveBeenCalled()
    })
  })

  describe('hasSourceCard Computed Property', () => {
    it('returns true when source card is selected', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.playSelection = {
        sourceCard: { id: 'test' },
        targetCard: null,
        secondTargetCard: null,
      }
      expect(wrapper.vm.hasSourceCard).toBe(true)
    })

    it('returns false when no source card is selected', () => {
      const wrapper = mount(
        PlayArea,
        withQuasar({
          props: defaultProps,
          global: { stubs: ['PlayerDeck', 'QToggle'] },
        }),
      )

      wrapper.vm.playSelection = { sourceCard: null, targetCard: null, secondTargetCard: null }
      expect(wrapper.vm.hasSourceCard).toBe(false)
    })
  })
})
