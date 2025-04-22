// Define building types, costs, and properties
class Building {
  constructor(scene, x, y, type, owner) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.owner = owner;
    this.buildingData = BUILDING_TYPES[type];
    this.isSelected = false;

    // Blueprint and construction properties
    this.isBlueprint = true;
    this.buildProgress = 0;
    this.isComplete = false;
    this.assignedBuilders = []; // Track builders working on this blueprint
    this.maxBuilders = 4; // Maximum number of builders allowed on one blueprint

    // Create the visual representation
    this.createSprite();

    // Set up events
    this.setupEvents();

    // Set owner (for tinting)
    if (owner) {
      this.setOwner(owner);
    }
  }

  createSprite() {
    // Create a graphics object for the building
    this.sprite = this.scene.add.graphics();

    // Draw the building based on its type
    const size = 30; // Base size
    this.size = size; // Store for later use
    let color = this.buildingData.color;

    // Blueprint appearance is different - outline only with semi-transparent fill
    if (this.isBlueprint) {
      color = 0x3498db; // Blueprint blue color
    }

    // Position at the given coordinates
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Fill with the building color
    this.sprite.fillStyle(color, this.isBlueprint ? 0.3 : 1); // Semi-transparent for blueprints

    // Draw the appropriate shape based on building type
    if (this.type === "barracks") {
      // Rectangle
      this.sprite.fillRect(-size / 2, -size / 2, size, size);
    } else if (this.type === "goldMine") {
      // Hexagon for gold mine
      this.drawHexagon(0, 0, size * 0.6);
    } else if (this.type === "factory") {
      // Triangle
      this.sprite.beginPath();
      this.sprite.moveTo(0, -size / 2);
      this.sprite.lineTo(size / 2, size / 2);
      this.sprite.lineTo(-size / 2, size / 2);
      this.sprite.closePath();
      this.sprite.fillPath();
    } else if (this.type === "turret") {
      // Circle with inner circle
      this.sprite.fillCircle(0, 0, size * 0.5);
      this.sprite.fillStyle(0x000000, this.isBlueprint ? 0.3 : 1);
      this.sprite.fillCircle(0, 0, size * 0.25);
    }

    // Add a border
    this.sprite.lineStyle(2, this.isBlueprint ? 0x3498db : 0x000000, 1);
    if (this.type === "barracks") {
      this.sprite.strokeRect(-size / 2, -size / 2, size, size);
    } else if (this.type === "goldMine") {
      this.drawHexagonStroke(0, 0, size * 0.6);
    } else if (this.type === "factory") {
      this.sprite.beginPath();
      this.sprite.moveTo(0, -size / 2);
      this.sprite.lineTo(size / 2, size / 2);
      this.sprite.lineTo(-size / 2, size / 2);
      this.sprite.closePath();
      this.sprite.strokePath();
    } else if (this.type === "turret") {
      this.sprite.lineStyle(2, this.isBlueprint ? 0x3498db : 0x000000, 1);
      this.sprite.strokeCircle(0, 0, size * 0.5);
    }

    // Create progress bar for blueprints
    if (this.isBlueprint) {
      this.createProgressBar();
    }

    // Add hit area for interaction
    this.hitArea = this.scene.add.circle(this.x, this.y, size * 0.6);
    this.hitArea.setInteractive();
  }

  createProgressBar() {
    this.progressBar = this.scene.add.graphics();
    this.progressBar.x = this.x;
    this.progressBar.y = this.y;
    this.updateProgressBar();
  }

  updateProgressBar() {
    if (!this.progressBar) return;

    const width = this.size * 1.2;
    const height = 8;
    const x = -width / 2;
    const y = -this.size * 0.8;

    this.progressBar.clear();

    // Background
    this.progressBar.fillStyle(0x000000, 0.7);
    this.progressBar.fillRect(x, y, width, height);

    // Progress fill
    this.progressBar.fillStyle(0x00ff00, 1);
    this.progressBar.fillRect(x, y, width * this.buildProgress, height);

    // Border
    this.progressBar.lineStyle(1, 0xffffff, 1);
    this.progressBar.strokeRect(x, y, width, height);

    // Display number of builders if any are assigned
    if (this.assignedBuilders.length > 0 && this.isBlueprint) {
      // Remove old builder count text if it exists
      if (this.builderCountText) {
        this.builderCountText.destroy();
      }

      // Create new builder count text
      this.builderCountText = this.scene.add.text(
        this.x,
        this.y + this.size * 0.8,
        `Builders: ${this.assignedBuilders.length}/${this.maxBuilders}`,
        {
          fontSize: "10px",
          fill: "#FFFFFF",
          backgroundColor: "#000000",
          padding: { x: 2, y: 1 },
        }
      );
      this.builderCountText.setOrigin(0.5, 0);
    }
  }

  drawHexagon(x, y, size) {
    this.sprite.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const pointX = x + size * Math.cos(angle);
      const pointY = y + size * Math.sin(angle);

      if (i === 0) {
        this.sprite.moveTo(pointX, pointY);
      } else {
        this.sprite.lineTo(pointX, pointY);
      }
    }
    this.sprite.closePath();
    this.sprite.fillPath();
  }

  drawHexagonStroke(x, y, size) {
    this.sprite.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const pointX = x + size * Math.cos(angle);
      const pointY = y + size * Math.sin(angle);

      if (i === 0) {
        this.sprite.moveTo(pointX, pointY);
      } else {
        this.sprite.lineTo(pointX, pointY);
      }
    }
    this.sprite.closePath();
    this.sprite.strokePath();
  }

  setupEvents() {
    // Object selection handler
    this.hitArea.on("pointerdown", (pointer) => {
      console.log(this.type + " building clicked");
      this.select();

      // Tell the scene this building was selected
      if (this.scene.onBuildingSelected) {
        this.scene.onBuildingSelected(this);
      }

      // Prevent event propagation
      pointer.stopPropagation();
    });

    // Add hover tooltip
    this.hitArea.on("pointerover", () => {
      // Create tooltip if it doesn't exist
      if (!this.tooltip) {
        const tooltipText = this.isSelected
          ? "Click to deselect"
          : `${this.buildingData.name}\nClick to select`;

        this.tooltip = this.scene.add.text(
          this.x,
          this.y - this.size,
          tooltipText,
          {
            fontSize: "10px",
            fill: "#FFFFFF",
            backgroundColor: "#000000",
            padding: { x: 4, y: 2 },
            align: "center",
          }
        );
        this.tooltip.setOrigin(0.5);
        this.tooltip.setDepth(150);
      }
    });

    // Remove tooltip on pointer out
    this.hitArea.on("pointerout", () => {
      if (this.tooltip) {
        this.tooltip.destroy();
        this.tooltip = null;
      }
    });
  }

  select() {
    this.isSelected = true;
    this.drawSelectionIndicator();

    // Update tooltip text if it exists
    if (this.tooltip) {
      this.tooltip.setText("Click to deselect");
    }

    // Note: Don't directly call showBarracksUI here - let game.js handle it
    // The onBuildingSelected handler in game.js will call showBarracksUI when appropriate
  }

  deselect() {
    this.isSelected = false;
    if (this.selectionIndicator) {
      this.selectionIndicator.setVisible(false);
    }

    // Update tooltip text if it exists
    if (this.tooltip) {
      this.tooltip.setText(`${this.buildingData.name}\nClick to select`);
    }

    // Hide barracks UI if shown
    this.hideBarracksUI();
  }

  // Show UI for producing units from barracks
  showBarracksUI() {
    // Hide any existing UI first
    this.hideBarracksUI();

    console.log("Creating barracks UI"); // Debug log

    // Create barracks production UI
    this.barracksUI = [];

    // Get owner color for button styling, default to gray if no owner
    const buttonColor = this.owner ? this.owner.color : 0x555555;
    const buttonBorderColor = 0x000000;

    // Position the UI to the side instead of directly below the building
    const uiX = this.x + this.size * 2.5;
    const uiY = this.y - this.size * 1.5;

    // Background panel - more transparent and larger to fit more units
    const panel = this.scene.add.rectangle(
      uiX,
      uiY,
      this.size * 4,
      this.size * 6, // Increased height to fit more buttons
      0x000000,
      0.5 // More transparent
    );
    panel.setOrigin(0.5, 0);
    panel.setDepth(100);
    panel.setStrokeStyle(1, 0xffffff, 0.3); // Add subtle border
    this.barracksUI.push(panel);

    // Title with building icon
    const title = this.scene.add.text(uiX, uiY + this.size * 0.3, "Barracks", {
      fontSize: "14px",
      fontStyle: "bold",
      fill: "#FFFFFF",
    });
    title.setOrigin(0.5, 0);
    title.setDepth(101);
    this.barracksUI.push(title);

    // Separator line
    const separator = this.scene.add.graphics();
    separator.lineStyle(1, 0xffffff, 0.5);
    separator.beginPath();
    separator.moveTo(uiX - this.size * 1.8, uiY + this.size * 0.8);
    separator.lineTo(uiX + this.size * 1.8, uiY + this.size * 0.8);
    separator.strokePath();
    separator.setDepth(101);
    this.barracksUI.push(separator);

    // Production label
    const productionLabel = this.scene.add.text(
      uiX,
      uiY + this.size * 1.1,
      "Unit Production",
      {
        fontSize: "12px",
        fill: "#FFFFFF",
      }
    );
    productionLabel.setOrigin(0.5, 0);
    productionLabel.setDepth(101);
    this.barracksUI.push(productionLabel);

    // Unit button creation helper function
    const createUnitButton = (unitType, yOffset, cost) => {
      const displayName = unitType.charAt(0).toUpperCase() + unitType.slice(1);
      const btn = this.scene.add.rectangle(
        uiX,
        uiY + yOffset,
        this.size * 3,
        this.size * 0.8,
        buttonColor,
        0.8
      );
      btn.setOrigin(0.5, 0);
      btn.setDepth(101);
      btn.setInteractive({ useHandCursor: true });
      btn.on("pointerdown", () => {
        console.log(`${displayName} button clicked`);
        this.produceUnit(unitType);
      });
      btn.on("pointerover", () => {
        btn.setAlpha(1);
      });
      btn.on("pointerout", () => {
        btn.setAlpha(0.8);
      });
      this.barracksUI.push(btn);

      // Button border
      const btnBorder = this.scene.add.graphics();
      btnBorder.lineStyle(2, buttonBorderColor, 0.5);
      btnBorder.strokeRect(btn.x - btn.width / 2, btn.y, btn.width, btn.height);
      btnBorder.setDepth(101);
      this.barracksUI.push(btnBorder);

      // Button text
      const btnText = this.scene.add.text(
        uiX,
        uiY + yOffset + this.size * 0.2,
        `${displayName} - ${cost}G`,
        {
          fontSize: "10px",
          fill: "#FFFFFF",
          align: "center",
        }
      );
      btnText.setOrigin(0.5, 0);
      btnText.setDepth(102);
      this.barracksUI.push(btnText);
    };

    // Create unit buttons
    createUnitButton(
      "infantry",
      this.size * 1.8,
      CONSTANTS.ECONOMY.INFANTRY_COST
    );
    createUnitButton("builder", this.size * 2.8, 100);
    createUnitButton("scout", this.size * 3.8, 150);
    createUnitButton("sniper", this.size * 4.8, 350);
    createUnitButton("rocketeer", this.size * 5.8, 300);

    // Close button (X in the corner)
    const closeBtn = this.scene.add.text(
      uiX + this.size * 1.8,
      uiY + this.size * 0.3,
      "X",
      {
        fontSize: "12px",
        fontStyle: "bold",
        fill: "#FFFFFF",
      }
    );
    closeBtn.setOrigin(0.5, 0);
    closeBtn.setDepth(102);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => {
      this.hideBarracksUI();
    });
    closeBtn.on("pointerover", () => {
      closeBtn.setColor("#FF0000");
    });
    closeBtn.on("pointerout", () => {
      closeBtn.setColor("#FFFFFF");
    });
    this.barracksUI.push(closeBtn);
  }

  // Hide barracks production UI
  hideBarracksUI() {
    if (this.barracksUI && this.barracksUI.length > 0) {
      this.barracksUI.forEach((element) => {
        if (element) element.destroy();
      });
      this.barracksUI = [];
    }
  }

  // Produce a unit from barracks
  produceUnit(unitType) {
    if (!this.owner) return;

    let cost = 0;
    let unitFactory = this.scene.unitFactory;

    if (!unitFactory) {
      console.error("Unit factory not found!");
      return;
    }

    // Determine cost based on unit type
    switch (unitType) {
      case "infantry":
        cost = CONSTANTS.ECONOMY.INFANTRY_COST;
        break;
      case "builder":
        cost = 100; // Builder cost
        break;
      case "scout":
        cost = 150; // Scout cost
        break;
      case "sniper":
        cost = 350; // Sniper cost
        break;
      case "rocketeer":
        cost = 300; // Rocketeer cost
        break;
      default:
        console.error(`Unknown unit type: ${unitType}`);
        return;
    }

    // Check if player can afford it
    if (!this.owner.canAfford(cost)) {
      // Show error message
      if (this.scene.shop) {
        this.scene.shop.showMessage(`Cannot afford ${unitType}!`);
      }
      return;
    }

    // Charge the player
    this.owner.spendGold(cost);

    // Create units near barracks
    const validTiles = this.scene.hexTiles.filter(
      (hex) =>
        hex.color === CONSTANTS.COLORS.GRASS &&
        Math.sqrt(Math.pow(hex.x - this.x, 2) + Math.pow(hex.y - this.y, 2)) <
          200
    );

    if (validTiles.length === 0) {
      console.error("No valid tiles found near barracks!");
      return;
    }

    // Create the unit
    let createdUnit = null;

    switch (unitType) {
      case "infantry":
        createdUnit = unitFactory.createUnit(Infantry, {
          validTiles: validTiles,
          cost: CONSTANTS.ECONOMY.INFANTRY_COST,
        });
        break;
      case "builder":
        createdUnit = unitFactory.createBuilder({
          validTiles: validTiles,
        });
        break;
      case "scout":
        createdUnit = unitFactory.createUnit(Scout, {
          validTiles: validTiles,
          cost: 150,
        });
        break;
      case "sniper":
        createdUnit = unitFactory.createUnit(Sniper, {
          validTiles: validTiles,
          cost: 350,
        });
        break;
      case "rocketeer":
        createdUnit = unitFactory.createUnit(Rocketeer, {
          validTiles: validTiles,
          cost: 300,
        });
        break;
    }

    // Add the unit to the player's units
    if (createdUnit) {
      if (unitType === "builder") {
        this.owner.addBuilder(createdUnit);
      } else {
        this.owner.addUnit(createdUnit);
      }

      // Show success message
      if (this.scene.shop) {
        this.scene.shop.showMessage(`${unitType} created!`);
      }
    }
  }

  drawSelectionIndicator() {
    // Clear previous indicator if exists
    if (this.selectionIndicator) {
      this.selectionIndicator.clear();
    } else {
      this.selectionIndicator = this.scene.add.graphics();
    }

    // Draw the selection indicator
    const size = 40;
    this.selectionIndicator.x = this.x;
    this.selectionIndicator.y = this.y;
    this.selectionIndicator.lineStyle(2, 0xffffff, 0.8);
    this.selectionIndicator.strokeCircle(0, 0, size * 0.6);
    this.selectionIndicator.setVisible(true);
  }

  getInfo() {
    return {
      type: this.type,
      name: this.buildingData.name,
      description: this.buildingData.description,
      cost: this.buildingData.cost,
      productionRate: this.buildingData.productionRate || 0,
      isBlueprint: this.isBlueprint,
      buildProgress: this.buildProgress,
      assignedBuilders: this.assignedBuilders.length,
    };
  }

  // Add a builder to this blueprint
  assignBuilder(builder) {
    // Check if we can add more builders and if this builder isn't already assigned
    if (
      this.isBlueprint &&
      this.assignedBuilders.length < this.maxBuilders &&
      !this.assignedBuilders.includes(builder)
    ) {
      this.assignedBuilders.push(builder);
      this.updateProgressBar(); // Update UI to show new builder count
      return true;
    }
    return false;
  }

  // Remove a builder from this blueprint
  removeBuilder(builder) {
    if (!this.isBlueprint) return false;

    const index = this.assignedBuilders.indexOf(builder);
    if (index !== -1) {
      this.assignedBuilders.splice(index, 1);
      this.updateProgressBar(); // Update UI to show new builder count
      return true;
    }
    return false;
  }

  updateBuildProgress(progress, builder) {
    // For single builder update, we need to scale progress based on builder count
    if (builder) {
      // Calculate how much this individual builder contributes
      const builderContribution = 0.03 / 60; // Base rate per frame for individual builder

      // Add this builder's contribution to the overall progress
      this.buildProgress = Math.min(
        1,
        this.buildProgress + builderContribution
      );
    } else {
      // Direct progress update (legacy method)
      this.buildProgress = Math.min(1, Math.max(0, progress));
    }

    // Update the progress bar visual
    this.updateProgressBar();

    // Check if construction is complete
    if (this.buildProgress >= 1 && this.isBlueprint) {
      this.completeConstruction();
    }
  }

  // Set the owner of this building
  setOwner(player) {
    if (!player) return;

    this.owner = player;

    // Update the building's color based on the owner if it's not a blueprint
    if (!this.isBlueprint && this.sprite) {
      try {
        // Preserve the building shape but update its color
        this.updateBuildingColor();
      } catch (err) {
        console.error("Error updating building color:", err);
      }
    }
  }

  // Update the building's color based on the owner
  updateBuildingColor() {
    if (!this.owner || !this.sprite || this.isBlueprint) return;

    // Redraw the building with the owner's color
    this.sprite.clear();

    const size = this.size;

    // Fill with the player's color but keep the shape
    this.sprite.fillStyle(this.owner.color, 1);

    // Draw the appropriate shape based on building type
    if (this.type === "barracks") {
      // Rectangle
      this.sprite.fillRect(-size / 2, -size / 2, size, size);
    } else if (this.type === "goldMine") {
      // Hexagon for gold mine
      this.drawHexagon(0, 0, size * 0.6);
    } else if (this.type === "factory") {
      // Triangle
      this.sprite.beginPath();
      this.sprite.moveTo(0, -size / 2);
      this.sprite.lineTo(size / 2, size / 2);
      this.sprite.lineTo(-size / 2, size / 2);
      this.sprite.closePath();
      this.sprite.fillPath();
    } else if (this.type === "turret") {
      // Circle with inner circle
      this.sprite.fillCircle(0, 0, size * 0.5);
      this.sprite.fillStyle(0x000000, 1);
      this.sprite.fillCircle(0, 0, size * 0.25);
    }

    // Add a border
    this.sprite.lineStyle(2, 0x000000, 1);
    if (this.type === "barracks") {
      this.sprite.strokeRect(-size / 2, -size / 2, size, size);
    } else if (this.type === "goldMine") {
      this.drawHexagonStroke(0, 0, size * 0.6);
    } else if (this.type === "factory") {
      this.sprite.beginPath();
      this.sprite.moveTo(0, -size / 2);
      this.sprite.lineTo(size / 2, size / 2);
      this.sprite.lineTo(-size / 2, size / 2);
      this.sprite.closePath();
      this.sprite.strokePath();
    } else if (this.type === "turret") {
      this.sprite.lineStyle(2, 0x000000, 1);
      this.sprite.strokeCircle(0, 0, size * 0.5);
    }
  }

  // When construction completes, change from blueprint to actual building
  completeConstruction() {
    this.isBlueprint = false;
    this.isComplete = true;

    // Remove progress bar
    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = null;
    }

    // Remove builder count text
    if (this.builderCountText) {
      this.builderCountText.destroy();
      this.builderCountText = null;
    }

    // Notify all assigned builders that construction is complete
    this.assignedBuilders.forEach((builder) => {
      if (builder && builder.stopBuilding) {
        builder.stopBuilding();
      }
    });

    // Clear the builder list
    this.assignedBuilders = [];

    // Redraw building with proper appearance
    this.sprite.clear();

    // Update building with owner's color
    this.updateBuildingColor();

    // Show success message
    if (this.scene.shop) {
      this.scene.shop.showMessage(
        `${this.buildingData.name} construction complete!`
      );
    }

    // Activate building's functionality
    this.activateBuilding();

    console.log(`${this.buildingData.name} construction completed!`);
  }

  activateBuilding() {
    // Implement specific functionality when building is complete
    // For example, gold mines start producing, barracks allow unit creation, etc.

    if (this.type === "goldMine" && this.owner) {
      // Update player's production rate for gold mines
      const currentRate = this.owner.getEconomy().getProductionRate();
      const mineRate = this.buildingData.productionRate;
      this.owner.getEconomy().setProductionRate(currentRate + mineRate);
      console.log(`New production rate: ${currentRate + mineRate} gold/min`);
    }
  }

  update() {
    // Building-specific update logic
    if (this.type === "goldMine" && this.owner && !this.isBlueprint) {
      // Gold mines generate gold for the owner (only when construction is complete)
      if (this.lastProductionTime === undefined) {
        this.lastProductionTime = Date.now();
      }

      const currentTime = Date.now();
      const elapsedTimeInMinutes =
        (currentTime - this.lastProductionTime) / 60000;

      if (elapsedTimeInMinutes > 0.1) {
        // Update every 6 seconds for smoother increments
        const goldProduced = Math.floor(
          this.buildingData.productionRate * elapsedTimeInMinutes
        );
        if (goldProduced > 0) {
          this.owner.addGold(goldProduced);
          this.lastProductionTime = currentTime;
        }
      }
    }
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.hitArea) {
      this.hitArea.destroy();
    }
    if (this.selectionIndicator) {
      this.selectionIndicator.destroy();
    }
    if (this.progressBar) {
      this.progressBar.destroy();
    }
    if (this.builderCountText) {
      this.builderCountText.destroy();
    }
    this.hideBarracksUI();
  }
}

// Define the building types, costs and properties
const BUILDING_TYPES = {
  barracks: {
    name: "Barracks",
    description: "Allows production of infantry units",
    cost: 300,
    color: 0x8b4513, // Brown
    buildTime: 30, // seconds (increased for slower building)
    healthPoints: 500,
  },
  goldMine: {
    name: "Gold Mine",
    description: "Produces additional gold over time",
    cost: 400,
    color: 0xffd700, // Gold
    buildTime: 45, // seconds (increased for slower building)
    healthPoints: 400,
    productionRate: 100, // Gold per minute
  },
  factory: {
    name: "Factory",
    description: "Allows production of vehicles",
    cost: 600,
    color: 0x708090, // Slate gray
    buildTime: 60, // seconds (increased for slower building)
    healthPoints: 600,
  },
  turret: {
    name: "Turret",
    description: "Defensive structure that attacks nearby enemies",
    cost: 250,
    color: 0x696969, // Dim gray
    buildTime: 25, // seconds (increased for slower building)
    healthPoints: 300,
    damage: 50,
    range: 200,
  },
};
