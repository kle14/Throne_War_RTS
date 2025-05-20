/**
 * EconomyUI - Handles the display of economy information on the screen
 */
export class EconomyUI {
  /**
   * Constructor for the EconomyUI class
   * @param {Phaser.Scene} scene - The scene this UI belongs to
   * @param {PlayerEconomy} economy - The economy object to display
   */
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.playerId = economy ? economy.playerId : 1;

    // Create UI elements for displaying resources
    this.createUI();

    // Log for debugging
    console.log("EconomyUI initialized successfully");
  }

  createUI() {
    try {
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
      this.goldText = this.scene.add.text(
        x + 30,
        y,
        `Gold: ${this.economy ? this.economy.getGold() : 0}`,
        {
          fontSize: "18px",
          fill: "#FFD700",
          fontStyle: "bold",
        }
      );
      this.goldText.setScrollFactor(0); // Fix to camera
      this.goldText.setDepth(100); // Ensure UI is on top

      // Create background for gold production rate display
      this.goldRateBackground = this.scene.add.rectangle(
        x + 15,
        y + 47,
        200,
        26,
        0x000000,
        0.5
      );
      this.goldRateBackground.setOrigin(0, 0);
      this.goldRateBackground.setScrollFactor(0);
      this.goldRateBackground.setDepth(100);

      // Gold per minute text
      this.goldRateText = this.scene.add.text(
        x + 30,
        y + 35,
        `+${this.economy ? this.economy.getGoldProductionRate() : 0}/min`,
        {
          fontSize: "16px",
          fill: "#90EE90", // Light green
          fontStyle: "bold",
        }
      );
      this.goldRateText.setScrollFactor(0);
      this.goldRateText.setDepth(100);

      // Make sure all UI elements are visible
      this.uiBackground.setVisible(true);
      this.goldIcon.setVisible(true);
      this.goldText.setVisible(true);
      this.goldRateBackground.setVisible(true);
      this.goldRateText.setVisible(true);

      console.log("EconomyUI elements created");
    } catch (error) {
      console.error("Error creating EconomyUI:", error);
    }
  }

  /**
   * Update the UI display
   */
  update() {
    try {
      if (this.economy) {
        this.updateUI();
      }

      // Ensure UI elements remain visible (gold)
      if (this.uiBackground && !this.uiBackground.visible) {
        this.uiBackground.setVisible(true);
      }
      if (this.goldIcon && !this.goldIcon.visible) {
        this.goldIcon.setVisible(true);
      }
      if (this.goldText && !this.goldText.visible) {
        this.goldText.setVisible(true);
      }
      if (this.goldRateBackground && !this.goldRateBackground.visible) {
        this.goldRateBackground.setVisible(true);
      }
      if (this.goldRateText && !this.goldRateText.visible) {
        this.goldRateText.setVisible(true);
      }
    } catch (error) {
      console.error("Error in EconomyUI update:", error);
    }
  }

  /**
   * Update the UI elements with current values
   */
  updateUI() {
    if (this.goldText && this.economy) {
      this.goldText.setText(`Gold: ${Math.floor(this.economy.getGold())}`);
    }
    if (this.goldRateText && this.economy) {
      this.goldRateText.setText(`+${this.economy.getGoldProductionRate()}/min`);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.goldText) {
      this.goldText.destroy();
    }
    if (this.goldIcon) {
      this.goldIcon.destroy();
    }
    if (this.uiBackground) {
      this.uiBackground.destroy();
    }
    if (this.goldRateText) {
      this.goldRateText.destroy();
    }
    if (this.goldRateBackground) {
      this.goldRateBackground.destroy();
    }
  }
}

export default EconomyUI;
