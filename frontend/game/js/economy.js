class PlayerEconomy {
  constructor(scene, playerId, initialGold = 500, productionRate = 500) {
    this.scene = scene;
    this.playerId = playerId;
    this.gold = initialGold;
    this.productionRate = productionRate; // Gold per minute
    this.lastUpdateTime = Date.now();

    // Create UI elements for displaying gold
    this.createUI();

    // Start gold production
    this.startProduction();
  }

  createUI() {
    // Only show UI for player 1 (current player)
    if (this.playerId !== 1) return;

    // Position the UI element in the top corner
    const x = 20;
    const y = 20;

    // Create background for gold amount - making it wide enough for large numbers
    this.uiBackground = this.scene.add.rectangle(
      x + 15,
      y + 12,
      200,
      30,
      0x000000,
      0.5
    );
    this.uiBackground.setOrigin(0, 0);
    this.uiBackground.setScrollFactor(0); // Fix to camera
    this.uiBackground.setDepth(100); // Ensure UI is on top

    // Gold icon
    this.goldIcon = this.scene.add.text(x, y, "💰", {
      fontSize: "24px",
    });
    this.goldIcon.setScrollFactor(0); // Fix to camera
    this.goldIcon.setDepth(100); // Ensure UI is on top

    // Gold amount text
    this.goldText = this.scene.add.text(x + 30, y, `Gold: ${this.gold}`, {
      fontSize: "18px",
      fill: "#FFD700",
      fontStyle: "bold",
    });
    this.goldText.setScrollFactor(0); // Fix to camera
    this.goldText.setDepth(100); // Ensure UI is on top

    // Create background for gold per minute display
    this.rateBackground = this.scene.add.rectangle(
      x + 15,
      y + 47,
      200,
      26,
      0x000000,
      0.5
    );
    this.rateBackground.setOrigin(0, 0);
    this.rateBackground.setScrollFactor(0);
    this.rateBackground.setDepth(100);

    // Gold per minute text
    this.rateText = this.scene.add.text(
      x + 30,
      y + 35,
      `+${this.productionRate}/min`,
      {
        fontSize: "16px",
        fill: "#90EE90", // Light green
        fontStyle: "bold",
      }
    );
    this.rateText.setScrollFactor(0);
    this.rateText.setDepth(100);
  }

  startProduction() {
    // Create a properly bound callback function
    this.boundUpdateGold = this.updateGold.bind(this);

    // Update gold every second
    this.productionTimer = this.scene.time.addEvent({
      delay: 1000, // 1 second
      callback: this.boundUpdateGold,
      callbackScope: this,
      loop: true,
    });
  }

  updateGold() {
    const currentTime = Date.now();
    const elapsedTimeInMinutes = (currentTime - this.lastUpdateTime) / 60000; // Convert ms to minutes

    // Calculate gold produced based on production rate and elapsed time
    const goldProduced = Math.floor(this.productionRate * elapsedTimeInMinutes);

    if (goldProduced > 0) {
      // Add gold to current total
      this.addGold(goldProduced);
    }

    // Update timestamp
    this.lastUpdateTime = currentTime;
  }

  addGold(amount) {
    if (amount <= 0) return;

    this.gold += amount;
    this.updateUI();
  }

  spendGold(amount) {
    if (this.canAfford(amount)) {
      this.gold -= amount;
      this.updateUI();
      return true;
    }
    return false;
  }

  canAfford(amount) {
    return this.gold >= amount;
  }

  updateUI() {
    if (this.goldText) {
      this.goldText.setText(`Gold: ${Math.floor(this.gold)}`);
    }
    if (this.rateText) {
      this.rateText.setText(`+${this.productionRate}/min`);
    }
  }

  getGold() {
    return this.gold;
  }

  getProductionRate() {
    return this.productionRate;
  }

  setProductionRate(rate) {
    this.productionRate = rate;
    this.updateUI();
  }

  destroy() {
    if (this.productionTimer) {
      this.productionTimer.remove();
    }
    if (this.goldText) {
      this.goldText.destroy();
    }
    if (this.goldIcon) {
      this.goldIcon.destroy();
    }
    if (this.uiBackground) {
      this.uiBackground.destroy();
    }
    if (this.rateText) {
      this.rateText.destroy();
    }
    if (this.rateBackground) {
      this.rateBackground.destroy();
    }
  }
}
