import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PlayerSelector from '../../src/components/PlayerSelector.vue'
import { withQuasar } from '../test-utils.js'

describe('PlayerSelector Component', () => {
  const defaultProps = {
    players: [
      { id: 0, name: 'Alice' },
      { id: 1, name: 'Bob' },
      { id: 2, name: 'Charlie' },
    ],
    selectedPlayerIdx: 0,
  }

  it('renders player buttons with correct names', () => {
    const wrapper = mount(
      PlayerSelector,
      withQuasar({
        props: defaultProps,
      }),
    )

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0].text()).toBe('Alice')
    expect(buttons[1].text()).toBe('Bob')
    expect(buttons[2].text()).toBe('Charlie')
  })

  it('highlights the selected player button', () => {
    const wrapper = mount(
      PlayerSelector,
      withQuasar({
        props: {
          ...defaultProps,
          selectedPlayerIdx: 1,
        },
      }),
    )

    const buttons = wrapper.findAll('.q-btn')
    // The selected button should have primary color class
    expect(buttons[1].classes()).toContain('bg-primary')
    // Non-selected buttons should not have primary color
    expect(buttons[0].classes()).not.toContain('bg-primary')
    expect(buttons[2].classes()).not.toContain('bg-primary')
  })

  it('should notify parent component when user clicks on a player selection button', async () => {
    const wrapper = mount(
      PlayerSelector,
      withQuasar({
        props: defaultProps,
      }),
    )

    const buttons = wrapper.findAll('button')
    await buttons[2].trigger('click')

    expect(wrapper.emitted()).toHaveProperty('update:selectedPlayerIdx')
    expect(wrapper.emitted()['update:selectedPlayerIdx'][0]).toEqual([2])
  })

  it('should display empty component state when no players are provided in array', () => {
    const wrapper = mount(
      PlayerSelector,
      withQuasar({
        props: {
          players: [],
          selectedPlayerIdx: 0,
        },
      }),
    )

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(0)
  })

  it('handles missing player names gracefully', () => {
    const wrapper = mount(
      PlayerSelector,
      withQuasar({
        props: {
          players: [
            { id: 0, name: 'Alice' },
            { id: 1 }, // Missing name
            { id: 2, name: 'Charlie' },
          ],
          selectedPlayerIdx: 0,
        },
      }),
    )

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0].text()).toBe('Alice')
    expect(buttons[1].text()).toBe('') // Should handle missing name
    expect(buttons[2].text()).toBe('Charlie')
  })

  it('should send corresponding player index when different player buttons are clicked', async () => {
    const wrapper = mount(
      PlayerSelector,
      withQuasar({
        props: defaultProps,
      }),
    )

    const buttons = wrapper.findAll('button')

    // Click first button
    await buttons[0].trigger('click')
    expect(wrapper.emitted()['update:selectedPlayerIdx'][0]).toEqual([0])

    // Click second button
    await buttons[1].trigger('click')
    expect(wrapper.emitted()['update:selectedPlayerIdx'][1]).toEqual([1])

    // Click third button
    await buttons[2].trigger('click')
    expect(wrapper.emitted()['update:selectedPlayerIdx'][2]).toEqual([2])
  })

  it('should highlight different player button when selectedPlayerIdx prop changes', async () => {
    const wrapper = mount(
      PlayerSelector,
      withQuasar({
        props: defaultProps,
      }),
    )

    // Initially first button is selected
    let buttons = wrapper.findAll('.q-btn')
    expect(buttons[0].classes()).toContain('bg-primary')

    // Change selected player
    await wrapper.setProps({ selectedPlayerIdx: 2 })

    buttons = wrapper.findAll('.q-btn')
    expect(buttons[0].classes()).not.toContain('bg-primary')
    expect(buttons[2].classes()).toContain('bg-primary')
  })
})
