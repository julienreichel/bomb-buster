import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GameHistory from '../../src/components/GameHistory.vue'
import { withQuasar } from '../test-utils.js'

describe('GameHistory Component', () => {
  const createMockPlayers = () => [
    { id: 0, name: 'Alice' },
    { id: 1, name: 'Bob' },
    { id: 2, name: 'Charlie' },
  ]

  const createMockMove = (overrides = {}) => ({
    type: 'play',
    sourcePlayerIdx: 0,
    sourceCardId: 'b1',
    targetPlayerIdx: 1,
    targetCardId: 'b2',
    result: {
      outcome: 'match',
      infoToken: false,
      detonatorDial: 5,
    },
    ...overrides,
  })

  it('renders with empty move history', () => {
    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: [],
          players: createMockPlayers(),
        },
      }),
    )

    expect(wrapper.text()).toContain('Move History')
    expect(wrapper.text()).toContain('No moves yet.')
    // Check for toggle presence by looking for the label text
    expect(wrapper.html()).toContain('Show Full History')
  })

  it('displays move history correctly', () => {
    const moves = [
      createMockMove({
        sourcePlayerIdx: 0,
        sourceCardId: 'b5',
        targetPlayerIdx: 1,
        targetCardId: 'b7',
        result: { outcome: 'match', infoToken: false, detonatorDial: 5 },
      }),
    ]

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    expect(wrapper.text()).toContain("Alice played b5 vs Bob's b7 → match [dial: 5]")
  })

  it('should display move descriptions with appropriate formatting for different game outcomes', () => {
    const moves = [
      createMockMove({
        sourcePlayerIdx: 0,
        sourceCardId: 'b1',
        targetPlayerIdx: 1,
        targetCardId: 'b2',
        result: { outcome: 'miss', infoToken: true, detonatorDial: 4 },
      }),
      createMockMove({
        sourcePlayerIdx: 1,
        sourceCardId: 'r1',
        targetPlayerIdx: null,
        targetCardId: null,
        result: { outcome: 'red-wire', infoToken: false, detonatorDial: 0 },
      }),
    ]

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    expect(wrapper.text()).toContain("Alice played b1 vs Bob's b2 → miss [info token] [dial: 4]")
    expect(wrapper.text()).toContain('Bob played r1 → red wire [dial: 0]')
  })

  it('shows limited history by default', async () => {
    const moves = Array.from({ length: 6 }, (_, i) =>
      createMockMove({
        sourcePlayerIdx: i % 3,
        sourceCardId: `b${i + 1}`,
      }),
    )

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    // Should show only last 3 moves (number of players) by default
    expect(wrapper.text()).toContain('Showing last 3 of 6 moves')
    expect(wrapper.text()).toContain('b4') // Move 4 should be visible
    expect(wrapper.text()).toContain('b5') // Move 5 should be visible
    expect(wrapper.text()).toContain('b6') // Move 6 should be visible
    expect(wrapper.text()).not.toContain('b1') // Move 1 should not be visible
  })

  it('shows full history when toggle is enabled', async () => {
    const moves = Array.from({ length: 6 }, (_, i) =>
      createMockMove({
        sourcePlayerIdx: i % 3,
        sourceCardId: `b${i + 1}`,
      }),
    )

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    // Initially should show limited history
    expect(wrapper.text()).toContain('Showing last 3 of 6 moves')
    expect(wrapper.text()).not.toContain('b1') // Should not show early moves

    // Manually set the showFullHistory ref to true
    wrapper.vm.showFullHistory = true
    await wrapper.vm.$nextTick()

    // All moves should now be visible
    expect(wrapper.text()).toContain('b1')
    expect(wrapper.text()).toContain('b6')
    expect(wrapper.text()).not.toContain('Showing last')
  })

  it('handles moves without target player', () => {
    const moves = [
      createMockMove({
        sourcePlayerIdx: 0,
        sourceCardId: 'r1',
        targetPlayerIdx: null,
        targetCardId: null,
        result: { outcome: 'red-wire' },
      }),
    ]

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    expect(wrapper.text()).toContain('Alice played r1 → red wire')
  })

  it('handles players with missing names', () => {
    const moves = [
      createMockMove({
        sourcePlayerIdx: 5, // Player index that doesn't exist
        sourceCardId: 'b1',
      }),
    ]

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    expect(wrapper.text()).toContain('P5 played b1') // Should fall back to P{index}
  })

  it('handles non-play type moves', () => {
    const moves = [
      {
        type: 'pick',
        sourcePlayerIdx: 0,
        sourceCardId: 'b1',
      },
    ]

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    expect(wrapper.text()).toContain('Alice action')
  })

  it('handles empty or invalid moves', () => {
    const moves = [null, undefined, {}]

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    // Should handle gracefully and show empty strings
    expect(wrapper.findAll('.text-body2')).toHaveLength(3)
  })

  it('displays double detector usage in move history', () => {
    const moves = [
      createMockMove({
        sourcePlayerIdx: 0,
        sourceCardId: 'b5',
        targetPlayerIdx: 1,
        targetCardId: 'b7',
        secondTargetCardId: 'b8',
        doubleDetector: true,
        result: {
          outcome: 'match-blue',
          infoToken: false,
          detonatorDial: 4,
        },
      }),
      createMockMove({
        sourcePlayerIdx: 1,
        sourceCardId: 'y1',
        targetPlayerIdx: 2,
        targetCardId: 'r3',
        // Regular move without double detector
      }),
    ]

    const wrapper = mount(
      GameHistory,
      withQuasar({
        props: {
          moveHistory: moves,
          players: createMockPlayers(),
        },
      }),
    )

    const historyText = wrapper.text()

    // Check that double detector is indicated
    expect(historyText).toContain('DOUBLE DETECTOR')
    expect(historyText).toContain("Alice played b5 [DOUBLE DETECTOR] vs Bob's b7 & b8")
    expect(historyText).toContain('match blue')

    // Check that regular move doesn't show double detector
    expect(historyText).toContain("Bob played y1 vs Charlie's r3")
  })
})
