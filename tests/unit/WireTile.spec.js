import { describe, expect, it } from 'vitest'
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

  describe('matches method', () => {
    it('should match blue cards by number', () => {
      const blueCard1 = new WireTile({ id: 'b1', color: 'blue', number: 5 })
      const blueCard2 = new WireTile({ id: 'b2', color: 'blue', number: 5 })
      const blueCard3 = new WireTile({ id: 'b3', color: 'blue', number: 7 })

      expect(blueCard1.matches(blueCard2)).toBe(true)
      expect(blueCard1.matches(blueCard3)).toBe(false)
    })

    it('should match yellow cards by color', () => {
      const yellowCard1 = new WireTile({ id: 'y1', color: 'yellow', number: 1.1 })
      const yellowCard2 = new WireTile({ id: 'y2', color: 'yellow', number: 2.1 })
      const blueCard = new WireTile({ id: 'b1', color: 'blue', number: 5 })

      expect(yellowCard1.matches(yellowCard2)).toBe(true)
      expect(yellowCard1.matches(blueCard)).toBe(false)
    })

    it('should match red cards by color', () => {
      const redCard1 = new WireTile({ id: 'r1', color: 'red', number: 1.5 })
      const redCard2 = new WireTile({ id: 'r2', color: 'red', number: 2.5 })
      const blueCard = new WireTile({ id: 'b1', color: 'blue', number: 5 })

      expect(redCard1.matches(redCard2)).toBe(true)
      expect(redCard1.matches(blueCard)).toBe(false)
    })

    it('should return false for null/undefined input', () => {
      const card = new WireTile({ id: 'test', color: 'blue', number: 5 })

      expect(card.matches(null)).toBe(false)
      expect(card.matches(undefined)).toBe(false)
    })
  })

  describe('isColor method', () => {
    it('should correctly identify when two cards have same color for matching logic', () => {
      const blueCard = new WireTile({ id: 'test', color: 'blue', number: 5 })
      const yellowCard = new WireTile({ id: 'test', color: 'yellow', number: 1.1 })
      const redCard = new WireTile({ id: 'test', color: 'red', number: 1.5 })

      expect(blueCard.isColor('blue')).toBe(true)
      expect(yellowCard.isColor('yellow')).toBe(true)
      expect(redCard.isColor('red')).toBe(true)
    })

    it('should correctly identify when two cards have different colors for matching logic', () => {
      const blueCard = new WireTile({ id: 'test', color: 'blue', number: 5 })

      expect(blueCard.isColor('yellow')).toBe(false)
      expect(blueCard.isColor('red')).toBe(false)
    })
  })
})
