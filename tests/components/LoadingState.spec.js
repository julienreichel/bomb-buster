import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LoadingState from '../../src/components/LoadingState.vue'
import { withQuasar } from '../test-utils.js'

describe('LoadingState Component', () => {
  it('should display centered spinner with size large and orange color', () => {
    const wrapper = mount(LoadingState, withQuasar({}))

    const spinner = wrapper.findComponent({ name: 'QSpinner' })
    expect(spinner.exists()).toBe(true)
    expect(spinner.props('color')).toBe('primary')
    expect(spinner.props('size')).toBe('3em')
  })

  it('should show standard "Loading game..." message when no custom message provided', () => {
    const wrapper = mount(LoadingState, withQuasar({}))

    const messageDiv = wrapper.find('.q-ml-md')
    expect(messageDiv.exists()).toBe(true)
    expect(messageDiv.text()).toBe('Loading...')
  })

  it('should display custom loading message when message prop is provided', () => {
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

  it('should dynamically change displayed text when message prop is updated', async () => {
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

  it('should apply appropriate CSS classes and container structure for loading display', () => {
    const wrapper = mount(LoadingState, withQuasar({}))

    const container = wrapper.find('.q-pa-xl.flex.flex-center')
    expect(container.exists()).toBe(true)

    // Should contain both spinner and message
    const spinner = container.findComponent({ name: 'QSpinner' })
    const message = container.find('.q-ml-md')

    expect(spinner.exists()).toBe(true)
    expect(message.exists()).toBe(true)
  })

  it('should display fallback content when message prop is empty string', () => {
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

  it('should properly display and format very long loading message text without breaking layout', () => {
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
