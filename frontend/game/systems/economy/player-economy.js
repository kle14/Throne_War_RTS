/**
 * PlayerEconomy - Handles the economic resources and production for a player
 */
export class PlayerEconomy {
  /**
   * Constructor for the PlayerEconomy class
   * @param {Phaser.Scene} scene - The scene this economy belongs to
   * @param {Number} playerId - The ID of the player who owns this economy
   * @param {Number} initialGold - The starting amount of gold
   * @param {Number} baseProductionRate - Base production rate per minute
   */
  constructor(scene, playerId, initialGold = 500, baseProductionRate = 50) {
    this.scene = scene;
    this.playerId = playerId;
    this.gold = initialGold;
    this.productionRate = baseProductionRate;
    this.lastProductionTime = Date.now();
    this.lastLogTime = Date.now(); // Track last time we logged gold production
    this.debugMode = false; // Set to true for verbose logging

    // Set up timed gold production
    this.setupProduction();
  }

  /**
   * Set up automatic gold production
   */
  setupProduction() {
    // Update gold every 10 seconds
    this.productionInterval = setInterval(() => {
      this.produceGold(true); // true = allow logging
    }, 10000);
  }

  /**
   * Produce gold based on production rate
   * @param {boolean} allowLogging - Whether to allow logging this production
   */
  produceGold(allowLogging = false) {
    const now = Date.now();
    const elapsedMinutes = (now - this.lastProductionTime) / 60000;
    const goldToAdd = Math.floor(this.productionRate * elapsedMinutes);

    if (goldToAdd > 0) {
      this.gold += goldToAdd;
      this.lastProductionTime = now;

      // Only log if specifically allowed and either in debug mode or it's been at least 30 seconds
      if (allowLogging && (this.debugMode || now - this.lastLogTime > 30000)) {
        console.log(
          `Player ${this.playerId} produced ${goldToAdd} gold. New total: ${this.gold}`
        );
        this.lastLogTime = now;
      }
    }
  }

  /**
   * Get the current gold amount
   * @returns {Number} Current gold amount
   */
  getGold() {
    // Update gold first to ensure it's current, but don't log
    this.produceGold(false);
    return this.gold;
  }

  /**
   * Check if the player can afford a specified amount
   * @param {Number} amount - Amount to check
   * @returns {Boolean} True if player has enough gold
   */
  canAfford(amount) {
    return this.getGold() >= amount;
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
   * Set the production rate
   * @param {Number} rate - New production rate per minute
   */
  setProductionRate(rate) {
    this.productionRate = rate;
  }

  /**
   * Get the current production rate
   * @returns {Number} Current production rate per minute
   */
  getProductionRate() {
    return this.productionRate;
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
