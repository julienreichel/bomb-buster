// WireTile model
// For blue: number 1-12, index 0-3
// For yellow: number 1.1-11.1, x.1
// For red: number 1.5-11.5, x.5
export default class WireTile {
  constructor({ id, color, number, revealed = false, infoToken = false, selected = false }) {
    this.id = id
    this.color = color // 'blue', 'yellow', 'red'
    this.number = number // 1-12
    this.revealed = revealed
    this.infoToken = infoToken
    this.selected = selected // Indicates if the tile is currently selected by a player
  }

  /**
   * Check if this tile matches another tile according to game rules
   * - Blue cards match by number
   * - Yellow and red cards match by color
   * @param {WireTile} otherTile - The tile to compare against
   * @returns {boolean} True if the tiles match
   */
  matches(otherTile) {
    if (!otherTile) return false

    if (this.color === 'blue' && otherTile.color === 'blue') {
      return this.number === otherTile.number
    }

    // For yellow and red cards, they match if they have the same color
    return this.color === otherTile.color
  }

  /**
   * Check if this tile is a specific color
   * @param {string} color - The color to check ('blue', 'yellow', 'red')
   * @returns {boolean} True if the tile is the specified color
   */
  isColor(color) {
    return this.color === color
  }
}
