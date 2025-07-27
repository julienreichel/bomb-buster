// WireTile model
export default class WireTile {
  constructor({ id, color, revealed = false, infoToken = false, ownerId = null }) {
    this.id = id
    this.color = color // 'blue', 'yellow', 'red'
    this.revealed = revealed
    this.infoToken = infoToken
  }
}
