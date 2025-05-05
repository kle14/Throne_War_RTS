import { CONSTANTS } from "../../config/constants.js";
import { PlayerEconomy } from "../economy/player-economy.js";

/**
 * Player - Represents a player in the game
 * Manages player units, buildings, and economy
 */
export class Player {
  /**
   * Constructor for the Player class
   * @param {Phaser.Scene} scene - The scene this player belongs to
   * @param {number} id - Player ID
   * @param {string} name - Player name
   * @param {number} color - Player color
   */
  constructor(scene, id, name, color = 0xff0000) {
    this.scene = scene;
    this.id = id;
    this.name = name;
    this.color = color;
    this.units = [];
    this.builders = []; // Separate array for engineer/builder units

    // Initialize player economy
    try {
      this.economy = new PlayerEconomy(
        scene,
        id,
        CONSTANTS.ECONOMY.INITIAL_GOLD,
        CONSTANTS.ECONOMY.BASE_PRODUCTION_RATE
      );
      console.log(
        `Player ${id} economy initialized with ${CONSTANTS.ECONOMY.INITIAL_GOLD} gold`
      );
    } catch (err) {
      console.error(`Error initializing economy for player ${id}:`, err);
    }
  }

  /**
   * Add a unit to the player
   * @param {Character} unit - The unit to add
   */
  addUnit(unit) {
    if (!unit) return;

    this.units.push(unit);
    try {
      unit.setOwner(this);
    } catch (err) {
      console.error(`Error setting owner for unit:`, err);
    }
  }

  /**
   * Add an engineer/builder unit to the player
   * @param {Engineer} engineer - The engineer unit to add
   */
  addBuilder(engineer) {
    if (!engineer) return;

    this.builders.push(engineer);
    try {
      engineer.setOwner(this);
    } catch (err) {
      console.error(`Error setting owner for engineer:`, err);
    }
  }

  /**
   * Remove a unit from the player
   * @param {Character} unit - The unit to remove
   */
  removeUnit(unit) {
    if (!unit) return;

    const index = this.units.indexOf(unit);
    if (index !== -1) {
      this.units.splice(index, 1);
    }
  }

  /**
   * Remove an engineer/builder unit from the player
   * @param {Engineer} engineer - The engineer unit to remove
   */
  removeBuilder(engineer) {
    if (!engineer) return;

    const index = this.builders.indexOf(engineer);
    if (index !== -1) {
      this.builders.splice(index, 1);
    }
  }

  /**
   * Get the player's economy
   * @returns {PlayerEconomy} The player's economy
   */
  getEconomy() {
    return this.economy;
  }

  /**
   * Get the player's gold amount
   * @returns {number} Current gold amount
   */
  getGold() {
    return this.economy ? this.economy.getGold() : 0;
  }

  /**
   * Check if the player can afford an amount of gold
   * @param {number} amount - The amount to check
   * @returns {boolean} True if the player can afford, false otherwise
   */
  canAfford(amount) {
    return this.economy ? this.economy.canAfford(amount) : false;
  }

  /**
   * Spend gold from the player's economy
   * @param {number} amount - The amount to spend
   * @returns {boolean} True if successful, false otherwise
   */
  spendGold(amount) {
    return this.economy ? this.economy.spendGold(amount) : false;
  }

  /**
   * Add gold to the player's economy
   * @param {number} amount - The amount to add
   */
  addGold(amount) {
    if (this.economy) {
      this.economy.addGold(amount);
    }
  }

  /**
   * Get all regular units (excluding builders)
   * @returns {Array<Character>} Array of units
   */
  getUnits() {
    return this.units;
  }

  /**
   * Get all engineer/builder units
   * @returns {Array<Engineer>} Array of engineer units
   */
  getBuilders() {
    return this.builders;
  }

  /**
   * Get all units including engineers/builders
   * @returns {Array} Combined array of all units
   */
  getAllUnits() {
    return [...this.units, ...this.builders];
  }

  /**
   * Update the player's units and economy
   * Called every frame
   */
  update() {
    // Update regular units
    if (this.units && this.units.length > 0) {
      this.units.forEach((unit) => {
        if (unit) unit.update();
      });
    }

    // Update engineers/builders
    if (this.builders && this.builders.length > 0) {
      this.builders.forEach((engineer) => {
        if (engineer) engineer.update();
      });
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clean up economy
    if (this.economy) {
      this.economy.destroy();
    }

    // Clean up units
    if (this.units && this.units.length > 0) {
      this.units.forEach((unit) => {
        if (unit && unit.destroy) unit.destroy();
      });
    }

    // Clean up engineers/builders
    if (this.builders && this.builders.length > 0) {
      this.builders.forEach((engineer) => {
        if (engineer && engineer.destroy) engineer.destroy();
      });
    }
  }
}

export default Player;
