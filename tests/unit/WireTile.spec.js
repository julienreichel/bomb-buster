import { describe, it, expect } from 'vitest'
import WireTile from '../../src/composables/models/WireTile.js'

describe('WireTile composable', () => {
  it('should create a WireTile with correct default values', () => {
    const wireTile = new WireTile({
      id: 1,
      color: 'blue',
      number: 5,
    })

    expect(wireTile.id).toBe(1)
    expect(wireTile.color).toBe('blue')
    expect(wireTile.number).toBe(5)
    expect(wireTile.revealed).toBe(false)
    expect(wireTile.infoToken).toBe(false)
    expect(wireTile.selected).toBe(false)
  })
})
