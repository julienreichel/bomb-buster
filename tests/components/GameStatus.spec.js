import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameStatus from '../../src/components/GameStatus.vue'

describe('GameStatus Component', () => {
  const defaultState = {
    wires: [
      { color: 'blue', revealed: true },
      { color: 'yellow', revealed: false },
    ],
    yellowWires: [1, 3],
    redWires: [2, 4],
    detonatorDial: 5,
  }

  it('renders WireTracker component with correct props from state', () => {
    const wrapper = mount(GameStatus, {
      props: { state: defaultState },
      global: {
        stubs: {
          WireTracker: true,
          DetonatorDial: true,
        },
      },
    })

    const wireTracker = wrapper.findComponent({ name: 'WireTracker' })
    expect(wireTracker.exists()).toBe(true)
    expect(wireTracker.props('wires')).toEqual(defaultState.wires)
    expect(wireTracker.props('yellowWires')).toEqual(defaultState.yellowWires)
    expect(wireTracker.props('redWires')).toEqual(defaultState.redWires)
  })

  it('renders DetonatorDial component with correct props from state', () => {
    const wrapper = mount(GameStatus, {
      props: { state: defaultState },
      global: {
        stubs: {
          WireTracker: true,
          DetonatorDial: true,
        },
      },
    })

    const detonatorDial = wrapper.findComponent({ name: 'DetonatorDial' })
    expect(detonatorDial.exists()).toBe(true)
    expect(detonatorDial.props('value')).toBe(defaultState.detonatorDial)
  })

  it('renders with default values when state is empty', () => {
    const wrapper = mount(GameStatus, {
      props: { state: {} },
      global: {
        stubs: {
          WireTracker: true,
          DetonatorDial: true,
        },
      },
    })

    const wireTracker = wrapper.findComponent({ name: 'WireTracker' })
    const detonatorDial = wrapper.findComponent({ name: 'DetonatorDial' })

    expect(wireTracker.props('wires')).toEqual([])
    expect(wireTracker.props('yellowWires')).toEqual([])
    expect(wireTracker.props('redWires')).toEqual([])
    expect(detonatorDial.props('value')).toBe(0)
  })

  it('updates child components when state changes', async () => {
    const wrapper = mount(GameStatus, {
      props: { state: defaultState },
      global: {
        stubs: {
          WireTracker: true,
          DetonatorDial: true,
        },
      },
    })

    const newState = {
      wires: [{ color: 'red', revealed: true }],
      yellowWires: [5],
      redWires: [6],
      detonatorDial: 3,
    }

    await wrapper.setProps({ state: newState })

    const wireTracker = wrapper.findComponent({ name: 'WireTracker' })
    const detonatorDial = wrapper.findComponent({ name: 'DetonatorDial' })

    expect(wireTracker.props('wires')).toEqual(newState.wires)
    expect(wireTracker.props('yellowWires')).toEqual(newState.yellowWires)
    expect(wireTracker.props('redWires')).toEqual(newState.redWires)
    expect(detonatorDial.props('value')).toBe(newState.detonatorDial)
  })

  it('renders both components in the same container', () => {
    const wrapper = mount(GameStatus, {
      props: { state: defaultState },
      global: {
        stubs: {
          WireTracker: true,
          DetonatorDial: true,
        },
      },
    })

    const container = wrapper.find('.row.items-center.q-gutter-lg.q-mb-md.justify-center')
    expect(container.exists()).toBe(true)

    const wireTracker = container.findComponent({ name: 'WireTracker' })
    const detonatorDial = container.findComponent({ name: 'DetonatorDial' })

    expect(wireTracker.exists()).toBe(true)
    expect(detonatorDial.exists()).toBe(true)
  })

  it('handles undefined state gracefully', () => {
    const wrapper = mount(GameStatus, {
      props: { state: undefined },
      global: {
        stubs: {
          WireTracker: true,
          DetonatorDial: true,
        },
      },
    })

    const wireTracker = wrapper.findComponent({ name: 'WireTracker' })
    const detonatorDial = wrapper.findComponent({ name: 'DetonatorDial' })

    // Should use default values when state is undefined
    expect(wireTracker.props('wires')).toEqual([])
    expect(wireTracker.props('yellowWires')).toEqual([])
    expect(wireTracker.props('redWires')).toEqual([])
    expect(detonatorDial.props('value')).toBe(0)
  })
})
