/**
 * Building class - Base class for all buildings in the game
 */

import { BUILDING_TYPES } from "../../config/building-types.js";
import { CONSTANTS } from "../../config/constants.js";
import { Infantry } from "../units/infantry/infantry.js";
import { Scout } from "../units/infantry/scout.js";
import { Sniper } from "../units/infantry/sniper.js";
import { Rocketeer } from "../units/infantry/rocketeer.js";
import { Tank } from "../units/vehicles/tank.js";

export class Building {
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

      // If already selected, deselect it
      if (this.isSelected) {
        console.log("Building already selected, deselecting");
        this.deselect();

        // Tell the scene this building was deselected
        if (this.scene.onBuildingSelected) {
          this.scene.onBuildingSelected(this);
        }
      } else {
        // Otherwise select it
        this.select();

        // Tell the scene this building was selected
        if (this.scene.onBuildingSelected) {
          this.scene.onBuildingSelected(this);
        }
      }

      // Prevent event propagation if method exists
      if (pointer && typeof pointer.stopPropagation === "function") {
        pointer.stopPropagation();
      }
    });
  }

  select() {
    this.isSelected = true;
    this.drawSelectionIndicator();

    // Show UI for barracks if this is a complete barracks
    if (this.type === "barracks" && !this.isBlueprint) {
      this.showBarracksUI();
    }

    // Show UI for factory if this is a complete factory
    if (this.type === "factory" && !this.isBlueprint) {
      this.showFactoryUI();
    }
  }

  deselect() {
    this.isSelected = false;

    // Hide the selection indicator
    if (this.selectionIndicator) {
      this.selectionIndicator.clear();
      this.selectionIndicator.setVisible(false);
    }

    // Hide UI for barracks if this is a complete barracks
    if (this.type === "barracks") {
      this.hideBarracksUI();
    }

    // Hide UI for factory if this is a complete factory
    if (this.type === "factory") {
      this.hideFactoryUI();
    }
  }

  // UI methods for various building types are abbreviated here
  // The full implementation would include showBarracksUI, hideBarracksUI, etc.

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

  assignBuilder(engineer) {
    // Check if we can add more engineers and if this engineer isn't already assigned
    if (
      this.isBlueprint &&
      this.assignedBuilders.length < this.maxBuilders &&
      !this.assignedBuilders.includes(engineer)
    ) {
      this.assignedBuilders.push(engineer);
      this.updateProgressBar(); // Update UI to show new engineer count
      return true;
    }
    return false;
  }

  removeBuilder(engineer) {
    if (!this.isBlueprint) return false;

    const index = this.assignedBuilders.indexOf(engineer);
    if (index !== -1) {
      this.assignedBuilders.splice(index, 1);
      this.updateProgressBar(); // Update UI to show new engineer count
      return true;
    }
    return false;
  }

  updateBuildProgress(progress, engineer) {
    // If progress is provided, use it
    if (progress !== null && progress !== undefined) {
      this.buildProgress = progress;
    }
    // Otherwise calculate progress based on engineer contribution
    else if (engineer) {
      // Each engineer contributes build rate per second
      const buildRate = engineer.buildRate || 0.03; // Default 3% per second
      this.buildProgress = Math.min(1, this.buildProgress + buildRate);
    }

    // Update the progress bar
    this.updateProgressBar();

    // Check if building is complete
    if (this.buildProgress >= 1 && this.isBlueprint) {
      this.completeConstruction();
    }
  }

  setOwner(player) {
    this.owner = player;
    this.updateBuildingColor();
  }

  updateBuildingColor() {
    if (!this.owner) return;

    // Get player color index
    const colorIndex = this.owner.id % CONSTANTS.COLORS.PLAYER_COLORS.length;
    const playerColor = CONSTANTS.COLORS.PLAYER_COLORS[colorIndex];

    // Tint building sprite
    if (this.isBlueprint) {
      // Don't change blueprint color, but we could add a player-colored indicator
    } else {
      // Use the building's original color mixed with player color
      const buildingColor = this.buildingData.color;
      const mixedColor = this.mixColors(buildingColor, playerColor, 0.7);
      this.sprite.clear();

      // Redraw with the mixed color
      const size = this.size;
      this.sprite.fillStyle(mixedColor, 1);

      // Redraw shape based on type
      if (this.type === "barracks") {
        this.sprite.fillRect(-size / 2, -size / 2, size, size);
        this.sprite.lineStyle(2, 0x000000, 1);
        this.sprite.strokeRect(-size / 2, -size / 2, size, size);
      } else if (this.type === "goldMine") {
        this.drawHexagon(0, 0, size * 0.6);
        this.sprite.lineStyle(2, 0x000000, 1);
        this.drawHexagonStroke(0, 0, size * 0.6);
      } else if (this.type === "factory") {
        this.sprite.beginPath();
        this.sprite.moveTo(0, -size / 2);
        this.sprite.lineTo(size / 2, size / 2);
        this.sprite.lineTo(-size / 2, size / 2);
        this.sprite.closePath();
        this.sprite.fillPath();
        this.sprite.lineStyle(2, 0x000000, 1);
        this.sprite.beginPath();
        this.sprite.moveTo(0, -size / 2);
        this.sprite.lineTo(size / 2, size / 2);
        this.sprite.lineTo(-size / 2, size / 2);
        this.sprite.closePath();
        this.sprite.strokePath();
      } else if (this.type === "turret") {
        this.sprite.fillCircle(0, 0, size * 0.5);
        this.sprite.lineStyle(2, 0x000000, 1);
        this.sprite.strokeCircle(0, 0, size * 0.5);
        this.sprite.fillStyle(0x000000, 1);
        this.sprite.fillCircle(0, 0, size * 0.25);
      }
    }
  }

  mixColors(color1, color2, weight) {
    // Simple color mixing utility
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.floor(r1 * (1 - weight) + r2 * weight);
    const g = Math.floor(g1 * (1 - weight) + g2 * weight);
    const b = Math.floor(b1 * (1 - weight) + b2 * weight);

    return (r << 16) | (g << 8) | b;
  }

  completeConstruction() {
    console.log(`${this.type} construction completed!`);

    this.isBlueprint = false;
    this.isComplete = true;

    // Release all assigned builders
    for (const builder of this.assignedBuilders) {
      if (builder.stopBuilding) {
        builder.stopBuilding();
      }
    }
    this.assignedBuilders = [];

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

    // Update appearance
    this.updateBuildingColor();

    // Activate building functionality
    this.activateBuilding();

    // Show success message
    if (this.scene.shop) {
      this.scene.shop.showMessage(
        `${this.buildingData.name} construction complete!`
      );
    }
  }

  activateBuilding() {
    // Specific actions based on building type
    if (this.type === "goldMine") {
      // Start gold production
      this.startProduction();
    }
  }

  update() {
    // Main update loop for the building
    // For gold mines, update production
    if (this.type === "goldMine" && this.isComplete) {
      this.updateProduction();
    }
  }

  destroy() {
    // Clean up resources
    if (this.sprite) this.sprite.destroy();
    if (this.hitArea) this.hitArea.destroy();
    if (this.progressBar) this.progressBar.destroy();
    if (this.builderCountText) this.builderCountText.destroy();
    if (this.selectionIndicator) this.selectionIndicator.destroy();

    // Specific cleanup for different building types
    if (this.type === "barracks") {
      this.hideBarracksUI();
    } else if (this.type === "factory") {
      this.hideFactoryUI();
    }
  }

  showBarracksUI() {
    // Clean up any existing UI first
    this.hideBarracksUI();

    // Create an array to store the UI elements
    this.barracksUI = [];

    // Panel background at the bottom of the screen
    const panelHeight = 100;
    const panelWidth = 600;
    const panelX = this.scene.cameras.main.width / 2 - panelWidth / 2;
    const panelY = this.scene.cameras.main.height - panelHeight - 10;

    this.barracksPanel = this.scene.add.rectangle(
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      0x000000,
      0.7
    );
    this.barracksPanel.setOrigin(0, 0);
    this.barracksPanel.setScrollFactor(0);
    this.barracksPanel.setDepth(100);
    this.barracksUI.push(this.barracksPanel);

    // Title
    const title = this.scene.add.text(
      panelX + panelWidth / 2,
      panelY + 10,
      "RECRUIT UNITS",
      {
        fontSize: "18px",
        fill: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    title.setDepth(101);
    this.barracksUI.push(title);

    // Unit buttons
    const unitTypes = [
      {
        type: "infantry",
        name: "Infantry",
        cost: CONSTANTS.ECONOMY.INFANTRY_COST,
      },
      { type: "builder", name: "Builder", cost: 100 },
      { type: "scout", name: "Scout", cost: 150 },
      { type: "sniper", name: "Sniper", cost: 350 },
      { type: "rocketeer", name: "Rocketeer", cost: 300 },
    ];

    const buttonWidth = 100;
    const buttonHeight = 60;
    const spacing = 15;
    let buttonX =
      panelX +
      (panelWidth -
        (buttonWidth * unitTypes.length + spacing * (unitTypes.length - 1))) /
        2;
    const buttonY = panelY + 35;

    unitTypes.forEach((unit) => {
      // Button background
      const button = this.scene.add.rectangle(
        buttonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        0x333333,
        0.9
      );
      button.setOrigin(0, 0);
      button.setScrollFactor(0);
      button.setDepth(101);
      button.setInteractive({ useHandCursor: true });

      // Set up the click event to produce the unit
      button.on("pointerdown", () => {
        this.produceUnit(unit.type);
      });

      this.barracksUI.push(button);

      // Unit name
      const nameText = this.scene.add.text(
        buttonX + buttonWidth / 2,
        buttonY + 10,
        unit.name,
        {
          fontSize: "14px",
          fill: "#FFFFFF",
          fontStyle: "bold",
        }
      );
      nameText.setOrigin(0.5, 0);
      nameText.setScrollFactor(0);
      nameText.setDepth(102);
      this.barracksUI.push(nameText);

      // Unit cost
      const costText = this.scene.add.text(
        buttonX + buttonWidth / 2,
        buttonY + 35,
        `${unit.cost} gold`,
        {
          fontSize: "12px",
          fill: "#FFD700",
        }
      );
      costText.setOrigin(0.5, 0);
      costText.setScrollFactor(0);
      costText.setDepth(102);
      this.barracksUI.push(costText);

      // Move to the next button position
      buttonX += buttonWidth + spacing;
    });

    // Make sure UI is visible
    this.barracksUI.forEach((element) => {
      element.setVisible(true);
    });
  }

  hideBarracksUI() {
    // Destroy all UI elements if they exist
    if (this.barracksUI && this.barracksUI.length > 0) {
      this.barracksUI.forEach((element) => {
        if (element) element.destroy();
      });
      this.barracksUI = [];
    }
  }

  showFactoryUI() {}
  hideFactoryUI() {}
  produceVehicle() {}
  startProduction() {}
  updateProduction() {}
}

export default Building;
