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

      // Create background for oil amount
      this.oilBackground = this.scene.add.rectangle(
        x + 15,
        y + 82,
        200,
        30,
        0x000000,
        0.5
      );
      this.oilBackground.setOrigin(0, 0);
      this.oilBackground.setScrollFactor(0);
      this.oilBackground.setDepth(100);

      // Oil icon
      this.oilIcon = this.scene.add.text(x, y + 70, "🛢️", {
        fontSize: "24px",
      });
      this.oilIcon.setScrollFactor(0);
      this.oilIcon.setDepth(100);

      // Oil amount text
      this.oilText = this.scene.add.text(
        x + 30,
        y + 70,
        `Oil: ${this.economy ? this.economy.getOil() : 0}`,
        {
          fontSize: "18px",
          fill: "#0077be", // Blue color for oil
          fontStyle: "bold",
        }
      );
      this.oilText.setScrollFactor(0);
      this.oilText.setDepth(100);

      // Create background for oil production rate display
      this.oilRateBackground = this.scene.add.rectangle(
        x + 15,
        y + 117,
        200,
        26,
        0x000000,
        0.5
      );
      this.oilRateBackground.setOrigin(0, 0);
      this.oilRateBackground.setScrollFactor(0);
      this.oilRateBackground.setDepth(100);

      // Oil per minute text
      this.oilRateText = this.scene.add.text(
        x + 30,
        y + 105,
        `+${this.economy ? this.economy.getOilProductionRate() : 0}/min`,
        {
          fontSize: "16px",
          fill: "#90EE90", // Light green
          fontStyle: "bold",
        }
      );
      this.oilRateText.setScrollFactor(0);
      this.oilRateText.setDepth(100);

      // Make sure all UI elements are visible
      this.uiBackground.setVisible(true);
      this.goldIcon.setVisible(true);
      this.goldText.setVisible(true);
      this.goldRateBackground.setVisible(true);
      this.goldRateText.setVisible(true);
      this.oilBackground.setVisible(true);
      this.oilIcon.setVisible(true);
      this.oilText.setVisible(true);
      this.oilRateBackground.setVisible(true);
      this.oilRateText.setVisible(true);

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

      // Ensure UI elements remain visible (oil)
      if (this.oilBackground && !this.oilBackground.visible) {
        this.oilBackground.setVisible(true);
      }
      if (this.oilIcon && !this.oilIcon.visible) {
        this.oilIcon.setVisible(true);
      }
      if (this.oilText && !this.oilText.visible) {
        this.oilText.setVisible(true);
      }
      if (this.oilRateBackground && !this.oilRateBackground.visible) {
        this.oilRateBackground.setVisible(true);
      }
      if (this.oilRateText && !this.oilRateText.visible) {
        this.oilRateText.setVisible(true);
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
    if (this.oilText && this.economy) {
      this.oilText.setText(`Oil: ${Math.floor(this.economy.getOil())}`);
    }
    if (this.oilRateText && this.economy) {
      this.oilRateText.setText(`+${this.economy.getOilProductionRate()}/min`);
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
    if (this.oilText) {
      this.oilText.destroy();
    }
    if (this.oilIcon) {
      this.oilIcon.destroy();
    }
    if (this.oilBackground) {
      this.oilBackground.destroy();
    }
    if (this.oilRateText) {
      this.oilRateText.destroy();
    }
    if (this.oilRateBackground) {
      this.oilRateBackground.destroy();
    }
  }
}

export default EconomyUI;
