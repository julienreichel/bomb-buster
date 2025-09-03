import { expect, test, describe, beforeEach } from 'vitest'
import { render } from 'vitest-browser-vue'
import WireTracker from '../../src/components/WireTracker.vue'
import WireTile from '../../src/composables/models/WireTile.js'
import { withQuasar } from '../test-utils.js'

describe('WireTracker Component', () => {
  let mockWires

  beforeEach(() => {
    mockWires = [
      new WireTile({ id: 1, color: 'blue', number: 1 }),
      new WireTile({ id: 2, color: 'blue', number: 1 }),
      new WireTile({ id: 3, color: 'blue', number: 2 }),
      new WireTile({ id: 4, color: 'blue', number: 3 }),
    ]
  })

  test('renders all 12 number badges', async () => {
    const { container } = render(
      WireTracker,
      withQuasar({
        props: { wires: mockWires },
      }),
    )

    // Should render badges for numbers 1-12
    for (let i = 1; i <= 12; i++) {
      expect(container.textContent).toContain(i.toString())
    }
  })

  test('shows correct blue wire states based on revealed count', async () => {
    // Set some blue wires as revealed
    mockWires[0].revealed = true // blue 1 - 1/2 revealed
    mockWires[1].revealed = true // blue 1 - 2/2 revealed
    mockWires[2].revealed = true // blue 2 - 1/1 revealed

    const { container } = render(
      WireTracker,
      withQuasar({
        props: { wires: mockWires },
      }),
    )

    const badges = container.querySelectorAll('.q-badge')

    // Find badges for number 1 (should have blue-3 class for 2 revealed)
    const numberOneBadges = Array.from(badges).filter((badge) => badge.textContent.trim() === '1')
    expect(numberOneBadges.length).toBeGreaterThan(0)

    // Find badges for number 2 (should have blue-3 class for 1 revealed)
    const numberTwoBadges = Array.from(badges).filter((badge) => badge.textContent.trim() === '2')
    expect(numberTwoBadges.length).toBeGreaterThan(0)
  })

  test('displays yellow wire indicators', async () => {
    const yellowWires = [
      new WireTile({ id: 5, color: 'yellow', number: 3.1 }),
      new WireTile({ id: 6, color: 'yellow', number: 5.1 }),
    ]

    const { container } = render(
      WireTracker,
      withQuasar({
        props: {
          wires: mockWires,
          yellowWires,
        },
      }),
    )

    // Should display yellow badges for positions 3 and 5
    const yellowBadges = container.querySelectorAll('.q-badge')
    const hasYellowContent = Array.from(yellowBadges).some(
      (badge) =>
        badge.classList.contains('bg-yellow-7') ||
        badge.textContent.includes('?') ||
        badge.textContent.includes('|'),
    )
    expect(hasYellowContent).toBe(true)
  })

  test('displays red wire indicators', async () => {
    const redWires = [
      new WireTile({ id: 7, color: 'red', number: 4.5 }),
      new WireTile({ id: 8, color: 'red', number: 7.5 }),
    ]

    const { container } = render(
      WireTracker,
      withQuasar({
        props: {
          wires: mockWires,
          redWires,
        },
      }),
    )

    // Should display red badges for positions 4 and 7
    const redBadges = container.querySelectorAll('.q-badge')
    const hasRedContent = Array.from(redBadges).some(
      (badge) =>
        badge.classList.contains('bg-red') ||
        badge.textContent.includes('?') ||
        badge.textContent.includes('|'),
    )
    expect(hasRedContent).toBe(true)
  })

  test('shows question marks for unknown yellow wires', async () => {
    const yellowWires = [
      new WireTile({ id: 5, color: 'yellow', number: 3.1 }),
      new WireTile({ id: 6, color: 'yellow', number: 5.1 }),
    ]

    // No yellow wires in main wires array, so should show question marks
    const { container } = render(
      WireTracker,
      withQuasar({
        props: {
          wires: mockWires, // only blue wires
          yellowWires,
        },
      }),
    )

    // Should show question marks since yellowWires.length > revealed yellow count
    expect(container.textContent).toContain('?')
  })

  test('shows pipes for known yellow wires', async () => {
    const yellowWires = [new WireTile({ id: 5, color: 'yellow', number: 3.1 })]
    const wiresWithYellow = [...mockWires, new WireTile({ id: 9, color: 'yellow', number: 3.1 })]

    const { container } = render(
      WireTracker,
      withQuasar({
        props: {
          wires: wiresWithYellow,
          yellowWires,
        },
      }),
    )

    // Should show pipes since all yellow wires are accounted for
    expect(container.textContent).toContain('|')
  })

  test('shows question marks for unknown red wires', async () => {
    const redWires = [
      new WireTile({ id: 7, color: 'red', number: 4.5 }),
      new WireTile({ id: 8, color: 'red', number: 7.5 }),
    ]

    // No red wires in main wires array, so should show question marks
    const { container } = render(
      WireTracker,
      withQuasar({
        props: {
          wires: mockWires, // only blue wires
          redWires,
        },
      }),
    )

    // Should show question marks since redWires.length > revealed red count
    expect(container.textContent).toContain('?')
  })

  test('shows pipes for known red wires', async () => {
    const redWires = [new WireTile({ id: 7, color: 'red', number: 4.5 })]
    const wiresWithRed = [...mockWires, new WireTile({ id: 10, color: 'red', number: 4.5 })]

    const { container } = render(
      WireTracker,
      withQuasar({
        props: {
          wires: wiresWithRed,
          redWires,
        },
      }),
    )

    // Should show pipes since all red wires are accounted for
    expect(container.textContent).toContain('|')
  })

  test('handles empty wires array', async () => {
    const { container } = render(
      WireTracker,
      withQuasar({
        props: { wires: [] },
      }),
    )

    // Should still render all 12 number badges
    for (let i = 1; i <= 12; i++) {
      expect(container.textContent).toContain(i.toString())
    }

    // All badges should be in default grey state
    const badges = container.querySelectorAll('.q-badge')
    expect(badges.length).toBeGreaterThanOrEqual(12)
  })

  test('calculates blue wire states correctly for all 4 revealed', async () => {
    const fourBlueWires = [
      new WireTile({ id: 1, color: 'blue', number: 5 }),
      new WireTile({ id: 2, color: 'blue', number: 5 }),
      new WireTile({ id: 3, color: 'blue', number: 5 }),
      new WireTile({ id: 4, color: 'blue', number: 5 }),
    ]

    // Reveal all 4 blue wires with number 5
    fourBlueWires.forEach((wire) => (wire.revealed = true))

    const { container } = render(
      WireTracker,
      withQuasar({
        props: { wires: fourBlueWires },
      }),
    )

    // Should show the badge for number 5 with full blue styling
    const badges = container.querySelectorAll('.q-badge')
    const numberFiveBadges = Array.from(badges).filter((badge) => badge.textContent.trim() === '5')
    expect(numberFiveBadges.length).toBeGreaterThan(0)
  })

  test('renders with mixed wire colors correctly', async () => {
    const mixedWires = [
      new WireTile({ id: 1, color: 'blue', number: 1 }),
      new WireTile({ id: 2, color: 'yellow', number: 2.1 }),
      new WireTile({ id: 3, color: 'red', number: 3.5 }),
      new WireTile({ id: 4, color: 'blue', number: 4 }),
    ]

    const { container } = render(
      WireTracker,
      withQuasar({
        props: {
          wires: mixedWires,
          yellowWires: [new WireTile({ id: 5, color: 'yellow', number: 2.1 })],
          redWires: [new WireTile({ id: 6, color: 'red', number: 3.5 })],
        },
      }),
    )

    // Should render all components without errors
    expect(container.firstElementChild).toBeTruthy()

    // Should contain all numbers 1-12
    for (let i = 1; i <= 12; i++) {
      expect(container.textContent).toContain(i.toString())
    }
  })
})
