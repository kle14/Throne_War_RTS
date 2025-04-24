class Shop {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isOpen = false;
    this.selectedBuildingType = null;
    this.buildingPreview = null;
    this.placementMode = false;

    // Create UI
    this.createUI();

    // Setup event handlers
    this.setupEvents();
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
    // Add shop open button
    this.shopButton = this.scene.add.rectangle(
      this.scene.cameras.main.width - 80,
      this.scene.cameras.main.height - 40,
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
    this.shopButtonText = this.scene.add.text(
      this.scene.cameras.main.width - 80,
      this.scene.cameras.main.height - 40,
      "SHOP",
      {
        fontSize: "20px",
        fill: "#FFFFFF",
        fontStyle: "bold",
      }
    );
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

    // Make sure the shop button stays in position when window is resized
    this.scene.scale.on("resize", () => {
      this.shopButton.x = this.scene.cameras.main.width - 80;
      this.shopButton.y = this.scene.cameras.main.height - 40;
      this.shopButtonText.x = this.scene.cameras.main.width - 80;
      this.shopButtonText.y = this.scene.cameras.main.height - 40;
    });

    // Handle map click for building placement
    this.mapClickHandler = (pointer) => {
      if (!this.placementMode) return;

      // Convert screen coordinates to world coordinates
      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );

      this.tryPlaceBuilding(worldPoint.x, worldPoint.y);
    };

    // Add the map click event listener
    this.scene.input.on("pointerdown", this.mapClickHandler);

    // Handle pointer move for building preview
    this.scene.input.on("pointermove", (pointer) => {
      if (!this.placementMode || !this.buildingPreview) return;

      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );

      // Update preview position
      this.buildingPreview.x = worldPoint.x;
      this.buildingPreview.y = worldPoint.y;

      // Check placement validity
      const canPlace = this.canPlaceBuilding(worldPoint.x, worldPoint.y);

      // Update preview color based on placement validity
      if (canPlace) {
        this.buildingPreview.setTint(0x00ff00); // Green tint for valid placement
      } else {
        this.buildingPreview.setTint(0xff0000); // Red tint for invalid placement
      }
    });
  }

  open() {
    this.isOpen = true;
    this.showUI();
  }

  close() {
    this.isOpen = false;
    this.hideUI();
    this.cancelPlacement();
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

    // Check if player can afford it
    if (!this.player.canAfford(buildingData.cost)) {
      console.log(`Cannot afford ${buildingData.name}!`);
      // Show error message (could be enhanced)
      this.showMessage(`Cannot afford ${buildingData.name}!`);
      return;
    }

    // Enter placement mode
    this.placementMode = true;

    // Close the shop UI
    this.hideUI();

    // Create building preview
    this.createBuildingPreview(type);

    // Show placement instructions
    this.showMessage("Click on the map to place the building");
  }

  createBuildingPreview(type) {
    const buildingData = BUILDING_TYPES[type];
    let previewSprite;

    // Create appropriate preview based on building type
    switch (type) {
      case "barracks":
        previewSprite = this.scene.add.rectangle(
          0,
          0,
          30,
          30,
          buildingData.color,
          0.6
        );
        break;
      case "goldMine":
        previewSprite = this.scene.add.circle(
          0,
          0,
          20,
          buildingData.color,
          0.6
        );
        break;
      case "factory":
        previewSprite = this.scene.add.triangle(
          0,
          0,
          0,
          -15,
          15,
          15,
          -15,
          15,
          buildingData.color,
          0.6
        );
        break;
      case "turret":
        previewSprite = this.scene.add.circle(
          0,
          0,
          15,
          buildingData.color,
          0.6
        );
        break;
      default:
        previewSprite = this.scene.add.rectangle(
          0,
          0,
          30,
          30,
          buildingData.color,
          0.6
        );
    }

    previewSprite.setDepth(50);
    this.buildingPreview = previewSprite;
  }

  canPlaceBuilding(x, y) {
    // Find the nearest hex
    const hex = this.findNearestHex(x, y);

    if (!hex) return false;

    // Can only place on grass tiles
    if (hex.color !== CONSTANTS.COLORS.GRASS) return false;

    // Check if hex is already occupied
    if (
      this.scene.buildings &&
      this.scene.buildings.some(
        (b) => Math.abs(b.x - hex.x) < 10 && Math.abs(b.y - hex.y) < 10
      )
    ) {
      return false;
    }

    return true;
  }

  findNearestHex(x, y) {
    const hexes = this.scene.hexTiles || [];
    let nearestHex = null;
    let minDistance = Number.MAX_VALUE;

    for (const hex of hexes) {
      const distance = Math.sqrt(
        Math.pow(hex.x - x, 2) + Math.pow(hex.y - y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestHex = hex;
      }
    }

    return nearestHex;
  }

  tryPlaceBuilding(x, y) {
    // Find the nearest hex
    const hex = this.findNearestHex(x, y);

    if (!this.canPlaceBuilding(x, y)) {
      this.showMessage("Cannot place building here!");
      return;
    }

    // Get building data
    const buildingData = BUILDING_TYPES[this.selectedBuildingType];

    // Charge the player
    if (!this.player.spendGold(buildingData.cost)) {
      this.showMessage("Not enough gold!");
      return;
    }

    // Create the building
    this.placeBuilding(hex.x, hex.y);

    // Exit placement mode
    this.cancelPlacement();

    // Show success message
    this.showMessage(`${buildingData.name} placed successfully!`);
  }

  placeBuilding(x, y) {
    // Initialize buildings array if it doesn't exist
    if (!this.scene.buildings) {
      this.scene.buildings = [];
    }

    // Create the building as a blueprint
    const building = new Building(
      this.scene,
      x,
      y,
      this.selectedBuildingType,
      this.player
    );

    // Building starts as a blueprint
    building.isBlueprint = true;
    building.buildProgress = 0;

    // Add to the scene's buildings array
    this.scene.buildings.push(building);

    // Show message to assign a builder
    this.showMessage(
      `${building.buildingData.name} blueprint placed. Assign builders to construct it.`
    );

    // Try to find a free builder to assign automatically
    this.assignBuilderToBlueprint(building);
  }

  // Find an available builder and assign to the blueprint
  assignBuilderToBlueprint(blueprint) {
    // Look for a builder owned by the current player
    if (this.player && this.player.getBuilders) {
      const builders = this.player.getBuilders();

      if (builders && builders.length > 0) {
        // Find a builder that isn't currently building anything
        const freeBuilder = builders.find((builder) => !builder.isBuilding);

        if (freeBuilder) {
          freeBuilder.assignToBlueprint(blueprint);
          this.showMessage(
            `Builder assigned to construct ${blueprint.buildingData.name}`,
            1500
          );
        }
      }
    }
  }

  cancelPlacement() {
    this.placementMode = false;
    this.selectedBuildingType = null;

    if (this.buildingPreview) {
      this.buildingPreview.destroy();
      this.buildingPreview = null;
    }
  }

  showMessage(text, duration = 2000) {
    // Remove existing message if any
    if (this.messageText) {
      this.messageText.destroy();
    }

    // Create message text
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
    this.messageText.setOrigin(0.5, 0.5);
    this.messageText.setScrollFactor(0);
    this.messageText.setDepth(110);

    // Auto-hide after duration
    this.scene.time.delayedCall(duration, () => {
      if (this.messageText) {
        this.messageText.destroy();
        this.messageText = null;
      }
    });
  }

  update() {
    // Update building preview if in placement mode
  }

  destroy() {
    // Clean up resources
    this.uiElements.forEach((element) => {
      element.destroy();
    });

    if (this.shopButton) {
      this.shopButton.destroy();
    }
    if (this.shopButtonText) {
      this.shopButtonText.destroy();
    }
    if (this.messageText) {
      this.messageText.destroy();
    }
    if (this.buildingPreview) {
      this.buildingPreview.destroy();
    }

    // Remove event listeners
    this.scene.input.off("pointerdown", this.mapClickHandler);
  }
}
