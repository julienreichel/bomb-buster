import { describe, it, expect } from 'vitest'
import Equipment from '../../src/composables/models/Equipment.js'

describe('Equipment composable', () => {
  it('should create an Equipment with default values', () => {
    const equipment = new Equipment({ id: 1, type: 'defuser' })

    expect(equipment.id).toBe(1)
    expect(equipment.type).toBe('defuser')
    expect(equipment.used).toBe(false)
    expect(equipment.ownerId).toBe(null)
  })

  it('should create an Equipment with custom values', () => {
    const equipment = new Equipment({
      id: 2,
      type: 'detector',
      used: true,
      ownerId: 'player1',
    })

    expect(equipment.id).toBe(2)
    expect(equipment.type).toBe('detector')
    expect(equipment.used).toBe(true)
    expect(equipment.ownerId).toBe('player1')
  })

  it('should handle different equipment types', () => {
    const defuser = new Equipment({ id: 1, type: 'defuser' })
    const detector = new Equipment({ id: 2, type: 'detector' })
    const remote = new Equipment({ id: 3, type: 'remote' })

    expect(defuser.type).toBe('defuser')
    expect(detector.type).toBe('detector')
    expect(remote.type).toBe('remote')
  })
})
