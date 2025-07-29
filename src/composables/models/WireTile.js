// WireTile model
// For blue: number 1-12, index 0-3
// For yellow: number 1.1-11.1, x.1
// For red: number 1.5-11.5, x.5
export default class WireTile {
  constructor({ id, color, number }) {
    this.id = id
    this.color = color // 'blue', 'yellow', 'red'
    this.number = number // 1-12
    this.revealed = false
    this.infoToken = false
    this.selected = false // Indicates if the tile is currently selected by a player
  }
}
