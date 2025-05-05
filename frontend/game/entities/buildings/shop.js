/**
 * Shop class - Manages the building shop interface
 * Allows players to select and place buildings
 */

import { BUILDING_TYPES } from "../../config/building-types.js";
import { CONSTANTS } from "../../config/constants.js";

export class Shop {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isOpen = false;
    this.selectedBuildingType = null;
    this.buildingPreview = null;
    this.placementMode = false;
    this.moveHandlerAdded = false;

    // Debug mode - disabled by default
    this.debugMode = false;
    this.debugElements = [];

    // Create UI
    this.createUI();

    // Setup event handlers
    this.setupEvents();

    // Log initialization
    if (this.debugMode) {
      console.log("Shop initialized successfully");
    } else {
      console.log("Shop initialized");
    }

    // Show a hint about F9 debug toggle after a short delay
    setTimeout(() => {
      this.showMessage("Press F9 to toggle debug mode", 3000);
    }, 2000);
  }

  createUI() {
    // Store UI elements
    this.uiElements = [];

    // Panel background
    const panelWidth = 250;
    const panelHeight = 300;
    const panelX = this.scene.cameras.main.width - panelWidth - 20;
    const panelY = 20;

    this.panel = this.scene.add.rectangle(
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      0x000000,
      0.7
    );
    this.panel.setOrigin(0, 0);
    this.panel.setScrollFactor(0);
    this.panel.setDepth(100);
    this.uiElements.push(this.panel);

    // Title
    this.title = this.scene.add.text(
      panelX + panelWidth / 2,
      panelY + 15,
      "BUILDING SHOP",
      {
        fontSize: "20px",
        fill: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    this.title.setOrigin(0.5, 0);
    this.title.setScrollFactor(0);
    this.title.setDepth(101);
    this.uiElements.push(this.title);

    // Close button
    this.closeButton = this.scene.add.text(
      panelX + panelWidth - 15,
      panelY + 10,
      "X",
      {
        fontSize: "18px",
        fill: "#FF0000",
        fontStyle: "bold",
      }
    );
    this.closeButton.setOrigin(0.5, 0);
    this.closeButton.setScrollFactor(0);
    this.closeButton.setDepth(101);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on("pointerdown", () => this.close());
    this.uiElements.push(this.closeButton);

    // Building buttons
    const buttonWidth = 220;
    const buttonHeight = 50;
    const buttonX = panelX + 15;
    let buttonY = panelY + 50;
    const buildingTypes = Object.keys(BUILDING_TYPES);

    buildingTypes.forEach((type, index) => {
      const buildingData = BUILDING_TYPES[type];
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
      button.on("pointerdown", () => this.selectBuildingType(type));
      this.uiElements.push(button);

      // Building name and cost
      const text = this.scene.add.text(
        buttonX + 10,
        buttonY + 8,
        `${buildingData.name}`,
        {
          fontSize: "16px",
          fill: "#FFFFFF",
          fontStyle: "bold",
        }
      );
      text.setScrollFactor(0);
      text.setDepth(102);
      this.uiElements.push(text);

      // Building cost
      const costText = this.scene.add.text(
        buttonX + 10,
        buttonY + 28,
        `Cost: ${buildingData.cost} gold`,
        {
          fontSize: "14px",
          fill: "#FFD700",
        }
      );
      costText.setScrollFactor(0);
      costText.setDepth(102);
      this.uiElements.push(costText);

      // Store button references for later use
      button.buildingType = type;
      button.nameText = text;
      button.costText = costText;

      buttonY += buttonHeight + 10;
    });

    // Initially hide all UI elements
    this.hideUI();
  }

  setupEvents() {
    try {
      // Add shop open button - ensure visibility and position
      const buttonX = this.scene.cameras.main.width - 80;
      const buttonY = this.scene.cameras.main.height - 40;

      this.shopButton = this.scene.add.rectangle(
        buttonX,
        buttonY,
        140,
        60,
        0x222222,
        0.8
      );
      this.shopButton.setOrigin(0.5, 0.5);
      this.shopButton.setScrollFactor(0);
      this.shopButton.setDepth(100);
      this.shopButton.setInteractive({ useHandCursor: true });

      // Add text to the button
      this.shopButtonText = this.scene.add.text(buttonX, buttonY, "SHOP", {
        fontSize: "20px",
        fill: "#FFFFFF",
        fontStyle: "bold",
      });
      this.shopButtonText.setOrigin(0.5, 0.5);
      this.shopButtonText.setScrollFactor(0);
      this.shopButtonText.setDepth(101);

      // Handle click event
      this.shopButton.on("pointerdown", () => {
        if (!this.isOpen) {
          this.open();
        } else {
          this.close();
        }
      });

      // Ensure visibility
      this.shopButton.setVisible(true);
      this.shopButtonText.setVisible(true);

      // Make sure the shop button stays in position when window is resized
      this.scene.scale.on("resize", () => {
        const newX = this.scene.cameras.main.width - 80;
        const newY = this.scene.cameras.main.height - 40;

        this.shopButton.x = newX;
        this.shopButton.y = newY;
        this.shopButtonText.x = newX;
        this.shopButtonText.y = newY;
      });

      // Handle map click for building placement
      this.mapClickHandler = (pointer) => {
        // Debug
        this.debugLog(`Map click detected at (${pointer.x}, ${pointer.y})`);

        // Save the current building type to prevent it from being lost
        const currentBuildingType = this.selectedBuildingType;

        // Force placement mode to be true if preview exists
        if (this.buildingPreview && !this.placementMode) {
          this.debugLog(
            "INCONSISTENCY DETECTED: Preview exists but placement mode is false. Forcing placement mode to true."
          );
          this.placementMode = true;

          // Restore building type if it was lost
          if (!this.selectedBuildingType && currentBuildingType) {
            this.debugLog(
              "Building type was lost! Restoring it to:",
              currentBuildingType
            );
            this.selectedBuildingType = currentBuildingType;
          }
        }

        // Additional debugging
        if (!this.placementMode) {
          this.debugLog("Map click ignored: not in placement mode");
          return;
        }

        this.debugLog("Map click in placement mode detected!");

        // Convert screen coordinates to world coordinates
        const worldPoint = this.scene.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );

        this.debugLog(
          `Converted to world coordinates: (${worldPoint.x}, ${worldPoint.y})`
        );
        this.debugLog(`Current building type: ${this.selectedBuildingType}`);

        // ALWAYS try to place building on click in placement mode, regardless of button
        this.debugLog("Attempting to place building");
        this.tryPlaceBuilding(worldPoint.x, worldPoint.y);
      };

      // Add the map click event listener - use once to ensure it gets called
      this.scene.input.on("pointerdown", this.mapClickHandler);

      // Add pointer move handler for building preview
      this.pointerMoveHandler = (pointer) => {
        // Debug every move
        this.debugLog(`Pointer move detected at (${pointer.x}, ${pointer.y})`);

        // Force placement mode to be true if preview exists
        if (this.buildingPreview && !this.placementMode) {
          this.debugLog(
            "INCONSISTENCY DETECTED: Preview exists but placement mode is false. Forcing placement mode to true."
          );
          this.placementMode = true;
        }

        // Check placement mode and preview existence (for debugging)
        if (!this.placementMode) {
          this.debugLog("Pointer move ignored: not in placement mode");
          return;
        }

        if (!this.buildingPreview) {
          this.debugLog("Pointer move ignored: no building preview exists");
          return;
        }

        // Always get world coordinates, even for debugging
        const worldPoint = this.scene.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );

        this.debugLog(`World position: (${worldPoint.x}, ${worldPoint.y})`);

        // FORCE UPDATE the preview position with a direct assignment
        // and make sure it's visible and interactive
        this.buildingPreview.x = worldPoint.x;
        this.buildingPreview.y = worldPoint.y;
        this.buildingPreview.visible = true;
        this.buildingPreview.alpha = 1.0;
        this.buildingPreview.setDepth(1000); // Ensure it's on top

        // Update label position if it exists
        if (this.previewLabel) {
          this.previewLabel.x = worldPoint.x;
          this.previewLabel.y = worldPoint.y - 40;
          this.previewLabel.visible = true;
          this.previewLabel.alpha = 1.0;
          this.previewLabel.setDepth(1001); // Ensure it's on top
        }

        // Check placement validity and update appearance
        if (this.canPlaceBuilding) {
          const canPlace = this.canPlaceBuilding(worldPoint.x, worldPoint.y);
          this.buildingPreview.alpha = canPlace ? 0.8 : 0.4;
        }
      };
      this.scene.input.on("pointermove", this.pointerMoveHandler);

      // Add keyboard input for ESC to cancel building placement
      this.escKey = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC
      );
      this.escKey.on("down", () => {
        if (this.placementMode) {
          console.log("ESC pressed - cancelling building placement");
          this.cancelPlacement();
        }
      });

      // Add F9 key for toggling debug mode
      this.debugKey = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.F9
      );
      this.debugKey.on("down", () => {
        this.toggleDebugMode();
      });

      console.log("Shop events setup successfully");
    } catch (error) {
      console.error("Error setting up shop events:", error);
    }
  }

  open() {
    this.isOpen = true;
    this.showUI();
  }

  close(shouldCancelPlacement = true) {
    this.isOpen = false;
    this.hideUI();

    // Only cancel placement if explicitly requested
    if (shouldCancelPlacement) {
      this.cancelPlacement();
    }
  }

  showUI() {
    this.uiElements.forEach((element) => {
      element.setVisible(true);
    });
  }

  hideUI() {
    this.uiElements.forEach((element) => {
      element.setVisible(false);
    });
  }

  selectBuildingType(type) {
    this.selectedBuildingType = type;
    const buildingData = BUILDING_TYPES[type];

    this.debugLog(`Selected building type: ${type}`);

    // Check if player can afford this building
    if (!this.player.canAfford(buildingData.cost)) {
      this.showMessage(`Cannot afford ${buildingData.name}!`);
      return;
    }

    // Store this for safety
    const selectedType = type;

    // Activate placement mode BEFORE creating preview
    this.debugLog("EXPLICITLY setting placement mode to TRUE");
    this.placementMode = true;
    this.debugLog("Placement mode activated:", this.placementMode);

    // Close UI but don't call full close() which might cancel placement
    this.hideUI();

    // Create visual preview - make sure we still have the building type
    this.selectedBuildingType = selectedType; // Re-assign to be extra safe
    this.createBuildingPreview(selectedType);

    // Double-check placement mode is still true after creating preview
    if (!this.placementMode) {
      console.error(
        "Placement mode was turned off when creating preview! Re-enabling."
      );
      this.placementMode = true;
    }

    // Triple-check building type is still set
    if (!this.selectedBuildingType) {
      console.error("Building type was lost! Restoring it to:", selectedType);
      this.selectedBuildingType = selectedType;
    }

    // Enable debug tracking for mouse movement
    this.debugMouseTracking();

    this.showMessage(
      `Select location for ${buildingData.name} - Move your mouse to position it`
    );
  }

  createBuildingPreview(type) {
    try {
      this.debugLog("Creating building preview for type:", type);

      // Ensure placement mode is true
      if (!this.placementMode) {
        console.error(
          "Creating building preview but placement mode is FALSE. Fixing..."
        );
        this.placementMode = true;
      }

      // Remove any existing preview
      if (this.buildingPreview) {
        this.buildingPreview.destroy();
        this.buildingPreview = null;
      }

      // Get building data
      const buildingData = BUILDING_TYPES[type];
      const size = 30; // Base size

      // Create a container for all preview elements
      this.buildingPreview = this.scene.add.container(0, 0);
      this.buildingPreview.setDepth(500); // Use a very high depth to ensure visibility

      this.debugLog(
        "Building preview container created at initial position:",
        0,
        0
      );

      // Create the graphics for the building shape
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(buildingData.color, 0.7); // More opaque for better visibility
      graphics.lineStyle(3, 0xffffff, 1.0); // Thicker, fully opaque stroke for better visibility

      // Draw the shape based on building type
      if (type === "barracks") {
        graphics.fillRect(-size / 2, -size / 2, size, size);
        graphics.strokeRect(-size / 2, -size / 2, size, size);
      } else if (type === "goldMine") {
        this.drawHexagon(graphics, 0, 0, size * 0.6);
        this.drawHexagonStroke(graphics, 0, 0, size * 0.6);
      } else if (type === "factory") {
        graphics.beginPath();
        graphics.moveTo(0, -size / 2);
        graphics.lineTo(size / 2, size / 2);
        graphics.lineTo(-size / 2, size / 2);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
      } else if (type === "turret") {
        graphics.fillCircle(0, 0, size * 0.5);
        graphics.strokeCircle(0, 0, size * 0.5);
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillCircle(0, 0, size * 0.25);
      }

      // Add graphics to container
      this.buildingPreview.add(graphics);

      // Add a text label showing the building name
      const label = this.scene.add.text(0, -40, buildingData.name, {
        fontSize: "16px", // Larger font
        fill: "#FFFFFF",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
        stroke: "#000000",
        strokeThickness: 4,
      });
      label.setOrigin(0.5, 0.5);
      label.setDepth(501); // Higher than the preview

      // Store the label reference separately rather than adding to container
      // This allows easier position updates
      this.previewLabel = label;

      // Get current pointer position and set preview position immediately
      const pointer = this.scene.input.activePointer;
      if (pointer && pointer.x !== undefined && pointer.y !== undefined) {
        const worldPoint = this.scene.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );

        // IMPORTANT: Use direct position assignment to force position update
        this.buildingPreview.x = worldPoint.x;
        this.buildingPreview.y = worldPoint.y;
        this.previewLabel.x = worldPoint.x;
        this.previewLabel.y = worldPoint.y - 40;

        // Force visibility
        this.buildingPreview.visible = true;
        this.buildingPreview.alpha = 1.0;
        this.previewLabel.visible = true;
        this.previewLabel.alpha = 1.0;

        // Log position
        this.debugLog(`Initial mouse position: (${pointer.x}, ${pointer.y})`);
        this.debugLog(
          `Initial world position: (${worldPoint.x}, ${worldPoint.y})`
        );
        this.debugLog(
          `Preview position set to: (${this.buildingPreview.x}, ${this.buildingPreview.y})`
        );
      } else {
        console.warn("No valid pointer available for initial positioning");
        // Use scene center as fallback
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        const worldPoint = this.scene.cameras.main.getWorldPoint(
          centerX,
          centerY
        );

        this.buildingPreview.x = worldPoint.x;
        this.buildingPreview.y = worldPoint.y;
        this.previewLabel.x = worldPoint.x;
        this.previewLabel.y = worldPoint.y - 40;

        // Force visibility
        this.buildingPreview.visible = true;
        this.buildingPreview.alpha = 1.0;
        this.previewLabel.visible = true;
        this.previewLabel.alpha = 1.0;
      }

      // Force-enable input to ensure we get mouse position updates
      if (!this.scene.input.enabled) {
        this.scene.input.enabled = true;
        this.debugLog("Input was disabled! Re-enabled it.");
      } else {
        this.debugLog("Input is enabled and active");
      }

      // Check if pointer move handler is properly setup
      this.debugLog("Verifying pointermove handler is registered");
      const listeners = this.scene.input.listenerCount("pointermove");
      this.debugLog(`Number of pointermove listeners: ${listeners}`);

      this.debugLog("Building preview created successfully");

      // Create a help message at the bottom of the screen with high visibility
      this.helpText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height - 50,
        "Move your mouse to position the building, then click to place it.\nPress ESC to cancel.",
        {
          fontSize: "18px", // Larger font
          fill: "#FFFFFF",
          backgroundColor: "#000000",
          padding: { x: 12, y: 6 },
          align: "center",
          stroke: "#000000",
          strokeThickness: 4,
        }
      );
      this.helpText.setOrigin(0.5, 0.5);
      this.helpText.setScrollFactor(0);
      this.helpText.setDepth(1000);

      // Immediately try to force an update with the current mouse position
      if (this.pointerMoveHandler && pointer) {
        this.pointerMoveHandler(pointer);
      }
    } catch (error) {
      console.error("Error creating building preview:", error);
    }
  }

  // Helper functions for drawing shapes
  drawHexagon(graphics, x, y, size) {
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const pointX = x + size * Math.cos(angle);
      const pointY = y + size * Math.sin(angle);

      if (i === 0) {
        graphics.moveTo(pointX, pointY);
      } else {
        graphics.lineTo(pointX, pointY);
      }
    }
    graphics.closePath();
    graphics.fillPath();
  }

  drawHexagonStroke(graphics, x, y, size) {
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const pointX = x + size * Math.cos(angle);
      const pointY = y + size * Math.sin(angle);

      if (i === 0) {
        graphics.moveTo(pointX, pointY);
      } else {
        graphics.lineTo(pointX, pointY);
      }
    }
    graphics.closePath();
    graphics.strokePath();
  }

  canPlaceBuilding(x, y) {
    // Find the nearest hex tile
    const nearestHex = this.findNearestHex(x, y);
    if (!nearestHex) {
      console.log("Cannot place building: No hex found at coordinates");
      return false;
    }

    // Debug the hex information
    console.log(
      `Checking placement at hex: (${nearestHex.x}, ${nearestHex.y}), ` +
        `type: ${nearestHex.color}, grass color is: ${CONSTANTS.COLORS.GRASS}`
    );

    // Explicitly compare with the grass color value
    const isGrass = nearestHex.color === CONSTANTS.COLORS.GRASS;
    console.log(`Is this a grass tile? ${isGrass}`);

    // Check if the hex is a valid placement location - MUST be grass
    if (!isGrass) {
      console.log("Cannot place building: Not a grass tile");
      return false;
    }

    // Check if the tile is already occupied by a building
    if (this.scene.buildings && this.scene.buildings.length > 0) {
      // Check if there's already a building at this exact position
      const existingBuilding = this.scene.buildings.find(
        (building) => building.x === nearestHex.x && building.y === nearestHex.y
      );

      if (existingBuilding) {
        console.log(
          "Cannot place building: Tile already occupied by another building"
        );
        return false;
      }
    }

    console.log("✅ Placement valid: This is a valid placement location");
    return true;
  }

  findNearestHex(x, y) {
    // Find the closest hex tile to the given coordinates
    // This is useful for snapping buildings to the hex grid
    if (!this.scene.hexTiles || this.scene.hexTiles.length === 0) {
      return null;
    }

    let closestHex = null;
    let closestDistance = Number.MAX_VALUE;

    for (const hex of this.scene.hexTiles) {
      const distance = Math.sqrt(
        Math.pow(hex.x - x, 2) + Math.pow(hex.y - y, 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestHex = hex;
      }
    }

    return closestHex;
  }

  tryPlaceBuilding(x, y) {
    console.log(`tryPlaceBuilding called at (${x}, ${y})`);

    // Try to recover building type if missing
    if (!this.selectedBuildingType) {
      // Check if barracks is a valid building type
      if (BUILDING_TYPES["barracks"]) {
        console.log(
          "Recovering missing building type by using default: barracks"
        );
        this.selectedBuildingType = "barracks";
      } else {
        console.log("No building type selected and no default available!");
        this.showMessage("Error: No building type selected", 3000);
        return;
      }
    }

    const buildingData = BUILDING_TYPES[this.selectedBuildingType];
    console.log(`Attempting to place: ${buildingData.name}`);

    // Check if player can afford it
    if (!this.player.canAfford(buildingData.cost)) {
      console.log(
        `Cannot afford ${buildingData.name}: Cost is ${buildingData.cost}, player has ${this.player.gold}`
      );
      this.showMessage(`Cannot afford ${buildingData.name}!`);
      this.cancelPlacement();
      return;
    }

    // Check if scene has createBuilding method
    if (!this.scene.createBuilding) {
      console.error(
        "❌ CRITICAL ERROR: Scene does not have createBuilding method!"
      );
      this.showMessage("Error: Cannot create building", 5000);
      return;
    }

    // Check if this is a valid placement location
    const canPlace = this.canPlaceBuilding(x, y);
    console.log(`Can place at (${x}, ${y}): ${canPlace}`);

    if (!canPlace) {
      // Check if we're trying to place on water
      const nearestHex = this.findNearestHex(x, y);
      if (nearestHex && nearestHex.color !== CONSTANTS.COLORS.GRASS) {
        this.showMessage("Cannot build on water! Find grass tiles.", 2000);
      } else if (nearestHex) {
        // Check if tile is occupied
        const existingBuilding =
          this.scene.buildings &&
          this.scene.buildings.find(
            (building) =>
              building.x === nearestHex.x && building.y === nearestHex.y
          );

        if (existingBuilding) {
          this.showMessage("Tile already occupied by a building!", 2000);
        } else {
          this.showMessage("Cannot build here! Must be on grass.", 2000);
        }
      } else {
        this.showMessage("Cannot build here! Invalid location.", 2000);
      }
      return;
    }

    // Snap to the nearest hex center
    const nearestHex = this.findNearestHex(x, y);
    if (!nearestHex) {
      console.log("No nearest hex found!");
      this.showMessage("Error: Cannot find valid tile", 3000);
      return;
    }

    console.log(`Found nearest hex at (${nearestHex.x}, ${nearestHex.y})`);

    // Place the building
    try {
      this.placeBuilding(nearestHex.x, nearestHex.y);
    } catch (error) {
      console.error("❌ Error while placing building:", error);
      this.showMessage("Error placing building: " + error.message, 5000);
    }
  }

  placeBuilding(x, y) {
    console.log(`placeBuilding called at (${x}, ${y})`);

    // Create the building in the scene
    if (!this.scene.createBuilding) {
      console.error("❌ Scene does not have createBuilding method");
      this.showMessage("Error: Cannot create building (missing method)", 5000);
      return;
    }

    try {
      // Charge the player for the building
      const buildingData = BUILDING_TYPES[this.selectedBuildingType];
      console.log(
        `Charging player ${buildingData.cost} gold for ${buildingData.name}`
      );
      this.player.spendGold(buildingData.cost);

      // Create the building
      console.log("Calling scene.createBuilding");
      const newBuilding = this.scene.createBuilding(
        x,
        y,
        this.selectedBuildingType,
        this.player
      );

      if (!newBuilding) {
        console.error(
          "❌ Failed to create building! scene.createBuilding returned null or undefined"
        );
        this.showMessage("Error: Building creation failed", 5000);
        // Refund the player
        this.player.addGold(buildingData.cost);
        return;
      }

      console.log("✅ Building created successfully:", newBuilding);

      // Find available builder to work on the blueprint
      if (newBuilding && newBuilding.isBlueprint) {
        console.log("Building is a blueprint, assigning builder");
        this.showMessage(`${buildingData.name} blueprint placed!`);

        // Try to assign a builder automatically
        this.assignBuilderToBlueprint(newBuilding);
      } else {
        this.showMessage(`${buildingData.name} placed!`);
      }

      // Clean up placement mode
      console.log("Canceling placement mode");
      this.cancelPlacement();
    } catch (error) {
      console.error("❌ Error in placeBuilding:", error);
      this.showMessage("Error: " + error.message, 5000);

      // Try to cancel placement mode even if there was an error
      try {
        this.cancelPlacement();
      } catch (cancelError) {
        console.error(
          "Error during cleanup after placement error:",
          cancelError
        );
      }
    }
  }

  assignBuilderToBlueprint(blueprint) {
    try {
      // Check if player and builders are defined
      if (!this.player || !this.player.builders) {
        console.warn("Player or builders array is not available");
        this.showMessage("No builders available!");
        return;
      }

      // Find an available builder
      const availableBuilders = this.player.builders.filter(
        (builder) => builder && !builder.isBuilding
      );

      if (availableBuilders && availableBuilders.length > 0) {
        // Assign the first available builder
        const builder = availableBuilders[0];

        // Order the builder to start construction
        if (builder && builder.assignToBlueprint) {
          builder.assignToBlueprint(blueprint);
          this.showMessage("Builder assigned to blueprint!");
        } else {
          console.warn("Builder cannot be assigned to blueprint");
          this.showMessage("Builder cannot be assigned!");
        }
      } else {
        this.showMessage("No available builders! Create more builders.");
      }
    } catch (error) {
      console.error("Error assigning builder to blueprint:", error);
      this.showMessage("Could not assign builder!");
    }
  }

  cancelPlacement() {
    try {
      this.placementMode = false;
      this.selectedBuildingType = null;

      // Clean up building preview
      if (this.buildingPreview) {
        this.buildingPreview.destroy();
        this.buildingPreview = null;
      }

      // Clean up preview label
      if (this.previewLabel) {
        this.previewLabel.destroy();
        this.previewLabel = null;
      }

      // Clean up help text
      if (this.helpText) {
        this.helpText.destroy();
        this.helpText = null;
      }

      // Clean up debug text
      if (this.debugText) {
        this.debugText.destroy();
        this.debugText = null;
      }

      // Clean up input overlay
      if (this.inputOverlay) {
        this.inputOverlay.destroy();
        this.inputOverlay = null;
      }

      // Remove debug move handler if it exists
      if (this.debugMoveHandler) {
        this.scene.input.off("pointermove", this.debugMoveHandler);
        this.debugMoveHandler = null;
      }

      console.log("Building placement cancelled");
    } catch (error) {
      console.error("Error cancelling building placement:", error);
    }
  }

  showMessage(text, duration = 2000) {
    try {
      // Clear any existing message
      if (this.messageText) {
        this.messageText.destroy();
        this.messageText = null;
      }

      // Create new message
      this.messageText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height - 100,
        text,
        {
          fontSize: "18px",
          fill: "#FFFFFF",
          backgroundColor: "#000000",
          padding: { x: 10, y: 5 },
        }
      );
      this.messageText.setOrigin(0.5);
      this.messageText.setScrollFactor(0);
      this.messageText.setDepth(200);
      this.messageText.alpha = 0;

      // Safely apply tween with null checks
      if (this.scene && this.scene.tweens && this.messageText) {
        // Fade in
        this.scene.tweens.add({
          targets: this.messageText,
          alpha: 1,
          duration: 200,
          ease: "Linear",
          onComplete: () => {
            // Make sure scene and message still exist before setting delayed call
            if (this.scene && this.scene.time && this.messageText) {
              // After fade in, start the timeout to fade out
              this.scene.time.delayedCall(duration, () => {
                // Final check before fade out
                if (this.scene && this.scene.tweens && this.messageText) {
                  this.scene.tweens.add({
                    targets: this.messageText,
                    alpha: 0,
                    duration: 200,
                    ease: "Linear",
                    onComplete: () => {
                      if (this.messageText) {
                        this.messageText.destroy();
                        this.messageText = null;
                      }
                    },
                  });
                }
              });
            }
          },
        });
      }
    } catch (error) {
      console.error("Error showing message:", error);
    }
  }

  update() {
    // No longer need to track mouse for building preview in update loop
    // since we're handling it in the pointermove event

    // Check for state consistency
    if (this.buildingPreview && !this.placementMode) {
      console.log(
        "INCONSISTENCY DETECTED in update: Preview exists but placement mode is false. Forcing placement mode to true."
      );
      this.placementMode = true;
    }

    // Make sure shop button stays visible
    if (this.shopButton && !this.shopButton.visible) {
      this.shopButton.setVisible(true);
    }
    if (this.shopButtonText && !this.shopButtonText.visible) {
      this.shopButtonText.setVisible(true);
    }
  }

  destroy() {
    try {
      // First cancel placement if active
      if (this.placementMode) {
        this.cancelPlacement();
      }

      // Clean up all UI elements
      this.uiElements.forEach((element) => {
        if (element) element.destroy();
      });

      // Clean up debug elements
      this.debugElements.forEach((element) => {
        if (element) element.destroy();
      });
      this.debugElements = [];

      if (this.shopButton) this.shopButton.destroy();
      if (this.shopButtonText) this.shopButtonText.destroy();
      if (this.buildingPreview) this.buildingPreview.destroy();
      if (this.messageText) this.messageText.destroy();
      if (this.previewLabel) this.previewLabel.destroy();
      if (this.helpText) this.helpText.destroy();
      if (this.debugText) this.debugText.destroy();
      if (this.inputOverlay) this.inputOverlay.destroy();
      if (this.debugButton) this.debugButton.destroy();
      if (this.debugButtonText) this.debugButtonText.destroy();

      // Remove event listeners
      this.scene.input.off("pointerdown", this.mapClickHandler);
      if (this.pointerMoveHandler) {
        this.scene.input.off("pointermove", this.pointerMoveHandler);
      }
      if (this.debugMoveHandler) {
        this.scene.input.off("pointermove", this.debugMoveHandler);
      }
      if (this.debugKey) {
        this.debugKey.removeAllListeners();
      }

      // Remove keyboard listeners
      if (this.escKey) {
        this.escKey.removeAllListeners();
      }

      console.log("Shop destroyed and all event handlers removed");
    } catch (error) {
      console.error("Error destroying shop:", error);
    }
  }

  // Add this new method for debug tracking
  debugMouseTracking() {
    // Only enable in debug mode
    if (!this.debugMode) return;

    this.debugLog("Starting debug mouse tracking");

    // Check game configuration
    this.checkGameConfig();

    // Create a debug text display
    this.debugText = this.scene.add.text(10, 10, "Mouse tracking debug", {
      fontSize: "14px",
      fill: "#FFFFFF",
      backgroundColor: "#000000",
      padding: { x: 5, y: 2 },
    });
    this.debugText.setScrollFactor(0);
    this.debugText.setDepth(2000); // Very high depth to ensure visibility

    // Add to debug elements
    this.debugElements.push(this.debugText);

    // Track last few mouse positions to detect if updates are happening
    this.mousePositions = [];

    // Create a separate debug move handler
    this.debugMoveHandler = (pointer) => {
      // Only process if in debug mode
      if (!this.debugMode) return;

      // Track this position
      this.mousePositions.push({
        time: Date.now(),
        x: pointer.x,
        y: pointer.y,
        worldX: pointer.worldX,
        worldY: pointer.worldY,
      });

      // Keep only the last 5 positions
      if (this.mousePositions.length > 5) {
        this.mousePositions.shift();
      }

      // IMPORTANT: Check for state inconsistency
      if (this.buildingPreview && !this.placementMode) {
        console.error(
          "CRITICAL STATE ERROR: Building preview exists but placement mode is FALSE"
        );
        // Auto-correct the inconsistency
        this.placementMode = true;
      }

      // Force update preview position if it exists
      if (this.buildingPreview) {
        const worldPoint = this.scene.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );

        // Directly update position, bypassing all checks
        this.buildingPreview.x = worldPoint.x;
        this.buildingPreview.y = worldPoint.y;
        this.buildingPreview.visible = true;

        // Also update label
        if (this.previewLabel) {
          this.previewLabel.x = worldPoint.x;
          this.previewLabel.y = worldPoint.y - 40;
          this.previewLabel.visible = true;
        }

        // Log the force update
        this.debugLog(
          `Force updated preview position to (${worldPoint.x}, ${worldPoint.y})`
        );
      }

      // Update debug display with highlighted state inconsistency warning
      if (this.debugText) {
        const placementActive = this.placementMode ? "YES" : "NO";
        const previewExists = this.buildingPreview ? "YES" : "NO";
        const previewPos = this.buildingPreview
          ? `(${Math.round(this.buildingPreview.x)}, ${Math.round(
              this.buildingPreview.y
            )})`
          : "N/A";

        const stateInconsistency = this.buildingPreview && !this.placementMode;

        // Create text with warning highlight if inconsistent
        let stateText =
          `Placement mode: ${placementActive}\n` +
          `Preview exists: ${previewExists}\n`;

        if (stateInconsistency) {
          stateText += "⚠️ STATE INCONSISTENCY DETECTED! ⚠️\n";
        }

        stateText +=
          `Preview position: ${previewPos}\n` +
          `Mouse: (${Math.round(pointer.x)}, ${Math.round(pointer.y)})\n` +
          `World: (${Math.round(pointer.worldX)}, ${Math.round(
            pointer.worldY
          )})`;

        this.debugText.setText(stateText);

        // Change background color to red if there's a state inconsistency
        if (stateInconsistency) {
          this.debugText.setBackgroundColor("#ff0000");
        } else {
          this.debugText.setBackgroundColor("#000000");
        }
      }
    };

    // Add this debug handler
    this.scene.input.on("pointermove", this.debugMoveHandler);

    // Force update preview position once more immediately
    if (this.scene.input.activePointer) {
      this.pointerMoveHandler(this.scene.input.activePointer);
    }

    // Check event handlers after a short delay
    setTimeout(() => {
      // Skip if debug mode was turned off meanwhile
      if (!this.debugMode) return;

      // Check if mouse movement is being tracked
      this.debugLog(`Mouse positions recorded: ${this.mousePositions.length}`);
      this.debugLog("Last few positions:", this.mousePositions);

      // Check if the regular move handler is being called
      const regularHandlerActive = this.mousePositions.length > 0;
      this.debugLog(
        `Regular move handler seems to be: ${
          regularHandlerActive ? "WORKING" : "NOT WORKING"
        }`
      );

      // Make sure input system is enabled
      if (!this.scene.input.enabled) {
        console.error("INPUT SYSTEM IS DISABLED!");
        this.scene.input.enabled = true;
        this.debugLog("Forcibly re-enabled input system");
      }

      // Log info about the buildingPreview
      if (this.buildingPreview) {
        this.debugLog("Building preview properties:", {
          visible: this.buildingPreview.visible,
          alpha: this.buildingPreview.alpha,
          x: this.buildingPreview.x,
          y: this.buildingPreview.y,
          depth: this.buildingPreview.depth,
          active: this.buildingPreview.active,
        });
      }
    }, 1000);
  }

  // Add this method to check game configuration
  checkGameConfig() {
    try {
      console.log("Checking game configuration...");

      // Check scene
      if (!this.scene) {
        console.error("No scene available!");
        return;
      }

      // Check game reference
      if (!this.scene.game) {
        console.error("No game reference in scene!");
        return;
      }

      // Check input configuration
      console.log("Scene input status:", {
        enabled: this.scene.input.enabled,
        isActive: this.scene.input.isActive,
        topOnly: this.scene.input.topOnly,
        globalTopOnly: this.scene.input.globalTopOnly,
      });

      // Check game config
      if (this.scene.game.config) {
        const inputConfig = this.scene.game.config.input || {};
        console.log("Game input config:", inputConfig);

        // Force enable input
        this.scene.input.enabled = true;

        // Force mouse settings
        if (this.scene.input.mouse) {
          this.scene.input.mouse.disableContextMenu();
          console.log("Disabled context menu");

          // Make sure mouse events are captured
          if (typeof this.scene.input.mouse.capture === "function") {
            this.scene.input.mouse.capture = true;
            console.log("Enabled mouse event capture");
          }
        }
      } else {
        console.log("Game config not available");
      }

      // Check if we properly get active pointer
      if (this.scene.input.activePointer) {
        const { x, y } = this.scene.input.activePointer;
        console.log(`Active pointer position: (${x}, ${y})`);
      } else {
        console.error("No active pointer found!");
      }

      // Check pointermove listeners
      console.log(
        "Pointermove listeners:",
        this.scene.input.listenerCount("pointermove")
      );
      console.log(
        "Pointerdown listeners:",
        this.scene.input.listenerCount("pointerdown")
      );

      // Force creation of a transparent overlay to catch all events
      const width = this.scene.cameras.main.width;
      const height = this.scene.cameras.main.height;

      // Create a fully transparent, interactive overlay that covers the entire screen
      this.inputOverlay = this.scene.add.rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x000000,
        0
      );
      this.inputOverlay.setScrollFactor(0); // Stay with camera
      this.inputOverlay.setDepth(999); // High depth but below UI text
      this.inputOverlay.setInteractive();

      // Add event listeners to the overlay
      this.inputOverlay.on("pointermove", (pointer) => {
        console.log(
          `Overlay detected pointer move: (${pointer.x}, ${pointer.y})`
        );

        // Force preview update
        if (this.buildingPreview) {
          const worldPoint = this.scene.cameras.main.getWorldPoint(
            pointer.x,
            pointer.y
          );

          this.buildingPreview.x = worldPoint.x;
          this.buildingPreview.y = worldPoint.y;

          if (this.previewLabel) {
            this.previewLabel.x = worldPoint.x;
            this.previewLabel.y = worldPoint.y - 40;
          }

          console.log(
            `Overlay force-updated preview to (${worldPoint.x}, ${worldPoint.y})`
          );
        }

        // Then forward to our regular handler
        this.pointerMoveHandler(pointer);
      });

      this.inputOverlay.on("pointerdown", (pointer) => {
        console.log(
          `Overlay detected pointer down: (${pointer.x}, ${pointer.y})`
        );

        // Save current building type
        const currentBuildingType = this.selectedBuildingType;

        // Force placement mode if we have a preview
        if (this.buildingPreview && !this.placementMode) {
          console.log("OVERLAY: Fixing placement mode inconsistency");
          this.placementMode = true;

          // Restore building type if it was lost
          if (!this.selectedBuildingType && currentBuildingType) {
            console.log(
              "OVERLAY: Building type was lost! Restoring it to:",
              currentBuildingType
            );
            this.selectedBuildingType = currentBuildingType;
          }
        }

        // Always try to place building if in placement mode
        if (this.placementMode) {
          console.log("OVERLAY: Direct placement attempt");
          console.log(
            `OVERLAY: Current building type: ${this.selectedBuildingType}`
          );

          const worldPoint = this.scene.cameras.main.getWorldPoint(
            pointer.x,
            pointer.y
          );
          this.directPlacementAttempt(worldPoint.x, worldPoint.y);
        }

        // Then forward to our regular handler
        this.mapClickHandler(pointer);
      });

      // Add a debug force-place button
      this.addDebugPlaceButton();

      console.log("Created interactive overlay to capture all input events");
    } catch (error) {
      console.error("Error checking game configuration:", error);
    }
  }

  // Add a debug button to force place buildings
  addDebugPlaceButton() {
    // Don't create if not in debug mode
    if (!this.debugMode) return;

    // Create a debug button in the top-left corner
    const debugButton = this.scene.add.rectangle(
      120,
      120,
      200,
      40,
      0xff0000,
      0.8
    );
    debugButton.setScrollFactor(0);
    debugButton.setDepth(2000);

    // Add text
    const debugText = this.scene.add.text(120, 120, "DEBUG: FORCE PLACE", {
      fontSize: "16px",
      fill: "#FFFFFF",
      fontStyle: "bold",
    });
    debugText.setOrigin(0.5, 0.5);
    debugText.setScrollFactor(0);
    debugText.setDepth(2001);

    // Make it interactive
    debugButton.setInteractive();
    debugButton.on("pointerdown", () => {
      this.debugLog("Debug button clicked - forcing building placement");

      // Get center of screen in world coordinates
      const centerX = this.scene.cameras.main.midPoint.x;
      const centerY = this.scene.cameras.main.midPoint.y;

      if (!this.selectedBuildingType) {
        // If no building is selected, force select barracks
        this.selectedBuildingType = "barracks";
        this.debugLog("Forced selection of barracks building type");
      }

      // Find valid grass tiles only
      const grassTiles = this.scene.hexTiles.filter(
        (hex) => hex.color === CONSTANTS.COLORS.GRASS
      );

      if (grassTiles.length === 0) {
        console.error("No grass tiles found!");
        this.showMessage("Error: No valid tiles found", 3000);
        return;
      }

      // Use the first grass tile
      const targetTile = grassTiles[0];
      this.debugLog(`Found grass tile at (${targetTile.x}, ${targetTile.y})`);
      this.debugLog(
        `Grass tile color: ${targetTile.color}, GRASS color: ${CONSTANTS.COLORS.GRASS}`
      );

      // Double-check the tile is actually grass
      if (targetTile.color !== CONSTANTS.COLORS.GRASS) {
        console.error("Selected tile is not grass despite filtering!");
        this.showMessage("Error: Selected tile is not grass", 3000);
        return;
      }

      // Verify it's not already occupied
      if (this.scene.buildings && this.scene.buildings.length > 0) {
        const existingBuilding = this.scene.buildings.find(
          (building) =>
            building.x === targetTile.x && building.y === targetTile.y
        );

        if (existingBuilding) {
          this.debugLog("First tile is occupied, looking for another...");

          // Find the first unoccupied grass tile
          for (const tile of grassTiles) {
            const occupied = this.scene.buildings.some(
              (building) => building.x === tile.x && building.y === tile.y
            );

            if (!occupied) {
              this.debugLog(
                `Found unoccupied grass tile at (${tile.x}, ${tile.y})`
              );
              // Force a direct placement attempt on this tile
              this.directPlacementAttempt(tile.x, tile.y);
              return;
            }
          }

          // If we get here, all grass tiles are occupied
          this.showMessage("All grass tiles are occupied!", 3000);
          return;
        }
      }

      // Force a direct placement attempt
      this.directPlacementAttempt(targetTile.x, targetTile.y);
    });

    // Store references
    this.debugButton = debugButton;
    this.debugButtonText = debugText;

    // Add to debug elements array for visibility control
    this.debugElements.push(debugButton, debugText);
  }

  // Add this method to try a direct placement attempt
  directPlacementAttempt(x, y) {
    console.log(`DIRECT placement attempt at (${x}, ${y})`);

    if (!this.scene.createBuilding) {
      console.error(
        "❌ CRITICAL ERROR: scene.createBuilding method is missing!"
      );

      // Show an error message to the user
      this.showMessage("Error: Cannot create building (missing method)", 5000);
      return;
    }

    // Try to recover building type if missing
    if (!this.selectedBuildingType) {
      // Check if barracks is a valid building type
      if (BUILDING_TYPES["barracks"]) {
        console.log(
          "⚠️ Recovering missing building type by using default: barracks"
        );
        this.selectedBuildingType = "barracks";
      } else {
        console.error("❌ No building type selected and no default available!");
        this.showMessage("Error: No building type selected", 3000);
        return;
      }
    }

    // Find nearest hex
    const nearestHex = this.findNearestHex(x, y);
    if (!nearestHex) {
      console.error("❌ Could not find nearest hex!");
      return;
    }

    console.log(`Found nearest hex at (${nearestHex.x}, ${nearestHex.y})`);

    // Verify this is actually a grass tile
    if (nearestHex.color !== CONSTANTS.COLORS.GRASS) {
      console.error(
        `❌ Cannot place on non-grass tile! Color: ${nearestHex.color}, GRASS: ${CONSTANTS.COLORS.GRASS}`
      );
      this.showMessage("Cannot build on water! Must be grass.", 2000);
      return;
    }

    // Verify it's not already occupied
    if (this.scene.buildings && this.scene.buildings.length > 0) {
      const existingBuilding = this.scene.buildings.find(
        (building) => building.x === nearestHex.x && building.y === nearestHex.y
      );

      if (existingBuilding) {
        console.error("❌ Tile already occupied by a building!");
        this.showMessage("Tile already occupied by a building!", 2000);
        return;
      }
    }

    try {
      // Directly create the building at the hex position
      const buildingData = BUILDING_TYPES[this.selectedBuildingType];

      // Check if player can afford it
      if (!this.player.canAfford(buildingData.cost)) {
        console.log(`Cannot afford ${buildingData.name}`);
        this.showMessage(`Cannot afford ${buildingData.name}!`);
        return;
      }

      console.log(
        `Attempting to directly create ${this.selectedBuildingType} at (${nearestHex.x}, ${nearestHex.y})`
      );

      // Store type for safety
      const typeToCreate = this.selectedBuildingType;

      // Create building directly
      const newBuilding = this.scene.createBuilding(
        nearestHex.x,
        nearestHex.y,
        typeToCreate,
        this.player
      );

      if (!newBuilding) {
        console.error(
          "❌ Building creation failed - null or undefined returned"
        );
        this.showMessage("Error: Building creation failed", 5000);
        return;
      }

      console.log("✅ Building created successfully:", newBuilding);

      // Charge the player
      this.player.spendGold(buildingData.cost);

      // Show success message
      this.showMessage(`${buildingData.name} placed!`);

      // Cancel placement mode
      this.cancelPlacement();
    } catch (error) {
      console.error("❌ Error in direct placement:", error);
      this.showMessage("Error: " + error.message, 5000);
    }
  }

  // Helper method to only log when debug mode is on
  debugLog(...args) {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  // Helper to toggle debug elements visibility
  updateDebugElementsVisibility() {
    this.debugElements.forEach((element) => {
      if (element && element.setVisible) {
        element.setVisible(this.debugMode);
      }
    });
  }

  // Toggle debug mode on/off
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    console.log(`Debug mode ${this.debugMode ? "enabled" : "disabled"}`);

    // Update visibility of debug elements
    this.updateDebugElementsVisibility();

    // If enabling debug mode, create debug elements if they don't exist
    if (this.debugMode) {
      // Create debug button if it doesn't exist
      if (!this.debugButton) {
        this.addDebugPlaceButton();
      }

      // Create debug text display if it doesn't exist
      if (!this.debugText) {
        // Create a debug text display in top-left corner
        this.debugText = this.scene.add.text(10, 10, "Debug Mode Active", {
          fontSize: "14px",
          fill: "#FFFFFF",
          backgroundColor: "#000000",
          padding: { x: 5, y: 2 },
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(2000);

        // Add to debug elements array
        this.debugElements.push(this.debugText);
      }
    }

    // Show a message to the user
    this.showMessage(
      `Debug mode ${this.debugMode ? "enabled" : "disabled"}`,
      1500
    );
  }
}

export default Shop;
