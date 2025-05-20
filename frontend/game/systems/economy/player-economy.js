/**
 * PlayerEconomy - Handles the economic resources and production for a player
 */
export class PlayerEconomy {
  /**
   * Constructor for the PlayerEconomy class
   * @param {Phaser.Scene} scene - The scene this economy belongs to
   * @param {Number} playerId - The ID of the player who owns this economy
   * @param {Number} initialGold - The starting amount of gold
   * @param {Number} initialOil - The starting amount of oil
   * @param {Number} baseProductionRate - Base gold production rate per minute
   * @param {Number} oilProductionRate - Base oil production rate per minute
   */
  constructor(
    scene,
    playerId,
    initialGold = 500,
    initialOil = 0,
    baseProductionRate = 50,
    oilProductionRate = 0
  ) {
    this.scene = scene;
    this.playerId = playerId;
    this.gold = initialGold;
    this.oil = initialOil;
    this.goldProductionRate = baseProductionRate;
    this.oilProductionRate = oilProductionRate;
    this.lastProductionTime = Date.now();
    this.lastLogTime = Date.now(); // Track last time we logged production
    this.debugMode = false; // Set to true for verbose logging

    // Set up timed resource production
    this.setupProduction();
  }

  /**
   * Set up automatic resource production
   */
  setupProduction() {
    // Update resources every 10 seconds
    this.productionInterval = setInterval(() => {
      this.produceResources(true); // true = allow logging
    }, 10000);
  }

  /**
   * Produce resources based on production rates
   * @param {boolean} allowLogging - Whether to allow logging this production
   */
  produceResources(allowLogging = false) {
    const now = Date.now();
    const elapsedMinutes = (now - this.lastProductionTime) / 60000;
    const goldToAdd = Math.floor(this.goldProductionRate * elapsedMinutes);
    const oilToAdd = Math.floor(this.oilProductionRate * elapsedMinutes);

    let resourcesAdded = false;

    if (goldToAdd > 0) {
      this.gold += goldToAdd;
      resourcesAdded = true;
    }

    if (oilToAdd > 0) {
      this.oil += oilToAdd;
      resourcesAdded = true;
    }

    if (resourcesAdded) {
      this.lastProductionTime = now;

      // Only log if specifically allowed and either in debug mode or it's been at least 30 seconds
      if (allowLogging && (this.debugMode || now - this.lastLogTime > 30000)) {
        console.log(
          `Player ${this.playerId} produced ${goldToAdd} gold and ${oilToAdd} oil. New totals: Gold: ${this.gold}, Oil: ${this.oil}`
        );
        this.lastLogTime = now;
      }
    }
  }

  /**
   * Legacy method for backward compatibility
   * @param {boolean} allowLogging - Whether to allow logging
   */
  produceGold(allowLogging = false) {
    return this.produceResources(allowLogging);
  }

  /**
   * Get the current gold amount
   * @returns {Number} Current gold amount
   */
  getGold() {
    // Update resources first to ensure they're current, but don't log
    this.produceResources(false);
    return this.gold;
  }

  /**
   * Get the current oil amount
   * @returns {Number} Current oil amount
   */
  getOil() {
    // Update resources first to ensure they're current, but don't log
    this.produceResources(false);
    return this.oil;
  }

  /**
   * Check if the player can afford a specified amount of gold
   * @param {Number} amount - Amount to check
   * @returns {Boolean} True if player has enough gold
   */
  canAfford(amount) {
    return this.getGold() >= amount;
  }

  /**
   * Check if the player can afford a specified amount of oil
   * @param {Number} amount - Amount to check
   * @returns {Boolean} True if player has enough oil
   */
  canAffordOil(amount) {
    return this.getOil() >= amount;
  }

  /**
   * Spend gold if player has enough
   * @param {Number} amount - Amount to spend
   * @returns {Boolean} True if transaction successful
   */
  spendGold(amount) {
    if (!this.canAfford(amount)) return false;

    this.gold -= amount;

    // Only log in debug mode
    if (this.debugMode) {
      console.log(
        `Player ${this.playerId} spent ${amount} gold. New total: ${this.gold}`
      );
    }
    return true;
  }

  /**
   * Spend oil if player has enough
   * @param {Number} amount - Amount to spend
   * @returns {Boolean} True if transaction successful
   */
  spendOil(amount) {
    if (!this.canAffordOil(amount)) return false;

    this.oil -= amount;

    // Only log in debug mode
    if (this.debugMode) {
      console.log(
        `Player ${this.playerId} spent ${amount} oil. New total: ${this.oil}`
      );
    }
    return true;
  }

  /**
   * Add gold to the player's economy
   * @param {Number} amount - Amount to add
   */
  addGold(amount) {
    this.gold += amount;

    // Only log in debug mode
    if (this.debugMode) {
      console.log(
        `Player ${this.playerId} gained ${amount} gold. New total: ${this.gold}`
      );
    }
  }

  /**
   * Add oil to the player's economy
   * @param {Number} amount - Amount to add
   */
  addOil(amount) {
    this.oil += amount;

    // Only log in debug mode
    if (this.debugMode) {
      console.log(
        `Player ${this.playerId} gained ${amount} oil. New total: ${this.oil}`
      );
    }
  }

  /**
   * Set the gold production rate
   * @param {Number} rate - New production rate per minute
   */
  setGoldProductionRate(rate) {
    this.goldProductionRate = rate;
  }

  /**
   * Set the oil production rate
   * @param {Number} rate - New production rate per minute
   */
  setOilProductionRate(rate) {
    this.oilProductionRate = rate;
  }

  /**
   * Get the current gold production rate
   * @returns {Number} Current gold production rate per minute
   */
  getGoldProductionRate() {
    return this.goldProductionRate;
  }

  /**
   * Get the current oil production rate
   * @returns {Number} Current oil production rate per minute
   */
  getOilProductionRate() {
    return this.oilProductionRate;
  }

  /**
   * Legacy method for backward compatibility
   * @returns {Number} Current gold production rate
   */
  getProductionRate() {
    return this.goldProductionRate;
  }

  /**
   * Legacy method for backward compatibility
   * @param {Number} rate - New gold production rate
   */
  setProductionRate(rate) {
    this.goldProductionRate = rate;
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether debug logging should be enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.productionInterval) {
      clearInterval(this.productionInterval);
    }
  }
}

export default PlayerEconomy;
