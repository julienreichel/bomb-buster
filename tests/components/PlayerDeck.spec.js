import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PlayerDeck from '../../src/components/PlayerDeck.vue'
import WireCard from '../../src/components/WireCard.vue'
import { HumanPlayer } from '../../src/composables/models/Player.js'
import WireTile from '../../src/composables/models/WireTile.js'
import { withQuasar } from '../test-utils.js'

describe('PlayerDeck Component', () => {
  const createTestPlayer = (name = 'Test Player', handCards = []) => {
    const player = new HumanPlayer({ id: 1, name })
    player.hand = handCards
    player.knownWires = []
    return player
  }

  const createTestWire = (id, color, number = undefined, revealed = false) => {
    const wire = new WireTile({ id, color, revealed })
    if (number !== undefined) {
      wire.number = number
    }
    return wire
  }

  it('renders player deck with player name', async () => {
    const player = createTestPlayer('John Doe')
    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    // Check that the player name is displayed
    expect(wrapper.text()).toContain("John Doe's Hand")

    // Check that the card section exists
    const cardSection = wrapper.findComponent({ name: 'QCardSection' })
    expect(cardSection.exists()).toBe(true)
  })

  it('renders with default player name when no name provided', async () => {
    const player = createTestPlayer('')
    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    expect(wrapper.text()).toContain("Player's Hand")
  })

  it('renders correct number of wire cards for player hand', async () => {
    const cards = [
      createTestWire(1, 'blue', 5),
      createTestWire(2, 'yellow'),
      createTestWire(3, 'red'),
    ]
    const player = createTestPlayer('Test Player', cards)

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    // Check that the correct number of WireCard components are rendered
    const wireCards = wrapper.findAllComponents(WireCard)
    expect(wireCards).toHaveLength(3)

    // Verify each card receives the correct card data
    expect(wireCards[0].props('card')).toStrictEqual(cards[0])
    expect(wireCards[1].props('card')).toStrictEqual(cards[1])
    expect(wireCards[2].props('card')).toStrictEqual(cards[2])
  })

  it('passes all props correctly to wire cards', async () => {
    const cards = [createTestWire(1, 'blue', 5)]
    const player = createTestPlayer('Test Player', cards)
    const candidates = [new Set(['blue', 'yellow'])]

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: {
          player,
          visible: true,
          size: 'small',
          selectable: true,
          candidates,
        },
      }),
    )

    const wireCard = wrapper.findComponent(WireCard)
    expect(wireCard.props('visible')).toBe(true)
    expect(wireCard.props('size')).toBe('small')
    expect(wireCard.props('selectable')).toBe(true)
    expect(wireCard.props('candidates')).toStrictEqual(candidates[0])
  })

  it('handles undefined candidates prop gracefully', async () => {
    const cards = [createTestWire(1, 'blue', 5)]
    const player = createTestPlayer('Test Player', cards)

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: {
          player,
          candidates: undefined,
        },
      }),
    )

    const wireCard = wrapper.findComponent(WireCard)
    expect(wireCard.props('candidates')).toBeUndefined()
  })

  it('delegates pick events from wire cards', async () => {
    const cards = [createTestWire(1, 'blue', 5)]
    const player = createTestPlayer('Test Player', cards)

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    const wireCard = wrapper.findComponent(WireCard)
    await wireCard.vm.$emit('pick', cards[0])

    // Check that the pick event was emitted with the correct card
    expect(wrapper.emitted('pick')).toBeTruthy()
    expect(wrapper.emitted('pick')[0]).toEqual([cards[0]])
  })

  it('displays known wires section when player has known wires', async () => {
    const player = createTestPlayer('Test Player')
    player.knownWires = [
      createTestWire(1, 'blue', 5),
      createTestWire(2, 'yellow', 1),
      createTestWire(3, 'red', 1),
    ]

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    expect(wrapper.text()).toContain('Known wires:')
    expect(wrapper.text()).toContain('5, Yellow, Red')
  })

  it('formats known wires correctly', async () => {
    const player = createTestPlayer('Test Player')
    player.knownWires = [
      createTestWire(1, 'blue', 5),
      createTestWire(2, 'blue', 12),
      createTestWire(3, 'yellow', 1),
      createTestWire(4, 'red', 1),
    ]

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    // Blue wires show as numbers, colored wires show as capitalized color names
    expect(wrapper.text()).toContain('5, 12, Yellow, Red')
  })

  it('hides known wires section when player has no known wires', async () => {
    const player = createTestPlayer('Test Player')
    player.knownWires = []

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    expect(wrapper.text()).not.toContain('Known wires:')
  })

  it('handles player with undefined knownWires', async () => {
    const player = createTestPlayer('Test Player')
    delete player.knownWires

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    expect(wrapper.text()).not.toContain('Known wires:')
  })

  it('renders empty hand correctly', async () => {
    const player = createTestPlayer('Test Player', [])

    const wrapper = mount(
      PlayerDeck,
      withQuasar({
        props: { player },
      }),
    )

    const wireCards = wrapper.findAllComponents(WireCard)
    expect(wireCards).toHaveLength(0)
    expect(wrapper.text()).toContain("Test Player's Hand")
  })
})
