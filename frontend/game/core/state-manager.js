import eventBus from "./event-bus.js";

/**
 * StateManager - Manages the global game state
 * Provides a central place to store and access game state with change notifications
 */
class StateManager {
  constructor() {
    this._state = {
      gamePhase: "initializing", // initializing, running, paused, over
      players: [],
      currentPlayer: null,
      selectedEntities: [],
      currentScene: null,
      resources: {},
      gameTime: 0,
      mapData: null,
    };

    // Use Proxy to detect state changes
    this.state = new Proxy(this._state, {
      set: (target, property, value) => {
        const oldValue = target[property];
        // Update the target
        target[property] = value;

        // Emit change events
        if (oldValue !== value) {
          // Emit specific property change event
          eventBus.emit(`state:${property}Changed`, value, oldValue);
          // Emit general state change event
          eventBus.emit("stateChanged", { property, value, oldValue });
        }
        return true;
      },
    });
  }

  /**
   * Get the current value of a state property
   * @param {string} property - The state property to get
   * @returns {any} Current value of the property
   */
  get(property) {
    return this.state[property];
  }

  /**
   * Set a state property value
   * @param {string} property - The state property to set
   * @param {any} value - The new value
   */
  set(property, value) {
    this.state[property] = value;
  }

  /**
   * Update multiple state properties at once
   * @param {Object} updates - Object with property/value pairs to update
   */
  update(updates) {
    Object.entries(updates).forEach(([property, value]) => {
      this.state[property] = value;
    });
  }

  /**
   * Reset the state to initial values
   */
  reset() {
    this.update({
      gamePhase: "initializing",
      players: [],
      currentPlayer: null,
      selectedEntities: [],
      resources: {},
      gameTime: 0,
    });
  }

  /**
   * Subscribe to changes in a specific state property
   * @param {string} property - The state property to watch
   * @param {function} callback - Function called when the property changes
   * @param {object} context - The value of 'this' in the callback
   * @returns {function} Unsubscribe function
   */
  onChange(property, callback, context = null) {
    return eventBus.on(`state:${property}Changed`, callback, context);
  }

  /**
   * Subscribe to any state change
   * @param {function} callback - Function called when any state property changes
   * @param {object} context - The value of 'this' in the callback
   * @returns {function} Unsubscribe function
   */
  onAnyChange(callback, context = null) {
    return eventBus.on("stateChanged", callback, context);
  }

  /**
   * Set the current game phase
   * @param {string} phase - The new game phase
   */
  setGamePhase(phase) {
    this.state.gamePhase = phase;
    eventBus.emit(`phase:${phase}`);
  }

  /**
   * Set the current player
   * @param {object} player - The player object
   */
  setCurrentPlayer(player) {
    this.state.currentPlayer = player;
  }

  /**
   * Add a selected entity
   * @param {object} entity - The entity to select
   */
  selectEntity(entity) {
    if (!entity) return;

    // Check if entity is already selected
    const isAlreadySelected = this.state.selectedEntities.some(
      (e) => e === entity || e.id === entity.id
    );

    if (!isAlreadySelected) {
      const newSelectedEntities = [...this.state.selectedEntities, entity];
      this.state.selectedEntities = newSelectedEntities;
      eventBus.emit("entitySelected", entity);
    }
  }

  /**
   * Remove a selected entity
   * @param {object} entity - The entity to deselect
   */
  deselectEntity(entity) {
    if (!entity) return;

    const newSelectedEntities = this.state.selectedEntities.filter(
      (e) => e !== entity && e.id !== entity.id
    );

    this.state.selectedEntities = newSelectedEntities;
    eventBus.emit("entityDeselected", entity);
  }

  /**
   * Clear all selected entities
   */
  clearSelection() {
    const previousSelection = [...this.state.selectedEntities];
    this.state.selectedEntities = [];
    eventBus.emit("selectionCleared", previousSelection);
  }
}

// Create a singleton instance
const stateManager = new StateManager();

export default stateManager;
