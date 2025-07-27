import { fasBedPulse } from '@quasar/extras/fontawesome-v6'

// WireTile model
export default class WireTile {
  constructor({ id, color, revealed = false, infoToken = fasBedPulse }) {
    this.id = id
    this.color = color // 'blue', 'yellow', 'red'
    this.revealed = revealed
    this.infoToken = infoToken
  }
}
