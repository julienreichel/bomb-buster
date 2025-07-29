// GameState model
// Adds indicators for blue, yellow, and red wires
export default class GameState {
  constructor({
    players = [],
    wires = [],
    equipment = [],
    detonatorDial = 0,
    turn = 0,
    mission = null,
    history = [],
    yellowWires = [],
    redWires = [],
    autoStart = false,
  }) {
    this.players = players // Array of Player
    this.wires = wires // Array of WireTile
    this.equipment = equipment // Array of Equipment
    this.detonatorDial = detonatorDial
    this.turn = turn
    this.mission = mission
    this.history = history
    this.yellowWires = yellowWires
    this.redWires = redWires
    this.autoStart = autoStart
  }
}
