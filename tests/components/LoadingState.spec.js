import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingState from '../../src/components/LoadingState.vue'
import { withQuasar } from '../test-utils.js'

describe('LoadingState Component', () => {
  it('renders loading spinner with correct props', () => {
    const wrapper = mount(LoadingState, withQuasar({}))

    const spinner = wrapper.findComponent({ name: 'QSpinner' })
    expect(spinner.exists()).toBe(true)
    expect(spinner.props('color')).toBe('primary')
    expect(spinner.props('size')).toBe('3em')
  })

  it('displays default loading message', () => {
    const wrapper = mount(LoadingState, withQuasar({}))

    const messageDiv = wrapper.find('.q-ml-md')
    expect(messageDiv.exists()).toBe(true)
    expect(messageDiv.text()).toBe('Loading...')
  })

  it('displays custom message when provided', () => {
    const customMessage = 'Initializing game...'
    const wrapper = mount(
      LoadingState,
      withQuasar({
        props: {
          message: customMessage,
        },
      }),
    )

    const messageDiv = wrapper.find('.q-ml-md')
    expect(messageDiv.text()).toBe(customMessage)
  })

  it('updates message when prop changes', async () => {
    const wrapper = mount(
      LoadingState,
      withQuasar({
        props: {
          message: 'Initial message',
        },
      }),
    )

    let messageDiv = wrapper.find('.q-ml-md')
    expect(messageDiv.text()).toBe('Initial message')

    await wrapper.setProps({ message: 'Updated message' })

    messageDiv = wrapper.find('.q-ml-md')
    expect(messageDiv.text()).toBe('Updated message')
  })

  it('has correct container structure and classes', () => {
    const wrapper = mount(LoadingState, withQuasar({}))

    const container = wrapper.find('.q-pa-xl.flex.flex-center')
    expect(container.exists()).toBe(true)

    // Should contain both spinner and message
    const spinner = container.findComponent({ name: 'QSpinner' })
    const message = container.find('.q-ml-md')

    expect(spinner.exists()).toBe(true)
    expect(message.exists()).toBe(true)
  })

  it('handles empty message string', () => {
    const wrapper = mount(
      LoadingState,
      withQuasar({
        props: {
          message: '',
        },
      }),
    )

    const messageDiv = wrapper.find('.q-ml-md')
    expect(messageDiv.text()).toBe('')
    expect(messageDiv.exists()).toBe(true) // Div should still exist, just empty
  })

  it('handles long message text', () => {
    const longMessage =
      'This is a very long loading message that might wrap to multiple lines in the UI'
    const wrapper = mount(
      LoadingState,
      withQuasar({
        props: {
          message: longMessage,
        },
      }),
    )

    const messageDiv = wrapper.find('.q-ml-md')
    expect(messageDiv.text()).toBe(longMessage)
  })
})
