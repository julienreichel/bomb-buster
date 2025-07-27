// Player model
export default class Player {
  constructor({ id, name, isAI, hand = [], character = null, infoTokens = 0 }) {
    this.id = id;
    this.name = name;
    this.isAI = isAI;
    this.hand = hand; // Array of WireTile
    this.character = character;
    this.infoTokens = infoTokens;
  }
}
