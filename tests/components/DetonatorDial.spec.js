import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DetonatorDial from '../../src/components/DetonatorDial.vue'
import { withQuasar } from '../test-utils.js'

describe('DetonatorDial Component', () => {
  it('renders with value 0 (critical state)', async () => {
    const wrapper = mount(
      DetonatorDial,
      withQuasar({
        props: {
          value: 0,
        },
      }),
    )

    // Check that the badge is rendered
    const badge = wrapper.findComponent({ name: 'QBadge' })
    expect(badge.exists()).toBe(true)

    // Check that the value is displayed
    expect(wrapper.text()).toContain('0')

    // Check critical state styling
    expect(badge.props('color')).toBe('red')
    expect(badge.props('textColor')).toBe('white')
    expect(badge.props('rounded')).toBe(true)

    // Check that the fire icon is present
    const icon = wrapper.findComponent({ name: 'QIcon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('whatshot')
    expect(icon.props('left')).toBe(true)
  })

  it('renders with value 1 (warning state)', async () => {
    const wrapper = mount(
      DetonatorDial,
      withQuasar({
        props: {
          value: 1,
        },
      }),
    )

    const badge = wrapper.findComponent({ name: 'QBadge' })

    // Check that the value is displayed
    expect(wrapper.text()).toContain('1')

    // Check warning state styling
    expect(badge.props('color')).toBe('deep-orange-5')
    expect(badge.props('textColor')).toBe('white')
  })

  it('renders with value 2 (normal state)', async () => {
    const wrapper = mount(
      DetonatorDial,
      withQuasar({
        props: {
          value: 2,
        },
      }),
    )

    const badge = wrapper.findComponent({ name: 'QBadge' })

    // Check that the value is displayed
    expect(wrapper.text()).toContain('2')

    // Check normal state styling
    expect(badge.props('color')).toBe('grey-6')
    expect(badge.props('textColor')).toBe('white')
  })

  it('renders with higher values (normal state)', async () => {
    const wrapper = mount(
      DetonatorDial,
      withQuasar({
        props: {
          value: 5,
        },
      }),
    )

    const badge = wrapper.findComponent({ name: 'QBadge' })

    // Check that the value is displayed
    expect(wrapper.text()).toContain('5')

    // Check that higher values also use normal state styling
    expect(badge.props('color')).toBe('grey-6')
    expect(badge.props('textColor')).toBe('white')
  })

  it('updates display when value prop changes', async () => {
    const wrapper = mount(
      DetonatorDial,
      withQuasar({
        props: {
          value: 3,
        },
      }),
    )

    // Initial state
    expect(wrapper.text()).toContain('3')
    expect(wrapper.findComponent({ name: 'QBadge' }).props('color')).toBe('grey-6')

    // Update to warning state
    await wrapper.setProps({ value: 1 })
    expect(wrapper.text()).toContain('1')
    expect(wrapper.findComponent({ name: 'QBadge' }).props('color')).toBe('deep-orange-5')

    // Update to critical state
    await wrapper.setProps({ value: 0 })
    expect(wrapper.text()).toContain('0')
    expect(wrapper.findComponent({ name: 'QBadge' }).props('color')).toBe('red')
  })
})
