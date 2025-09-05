// Equipment model
export default class Equipment {
  constructor({ id, type, used = false, ownerId = null }) {
    this.id = id
    this.type = type
    this.used = used
    this.ownerId = ownerId
  }
}
