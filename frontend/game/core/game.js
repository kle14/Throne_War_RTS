/**
 * Main Game Module
 * This is the entry point for the game that initializes the Phaser game instance
 * and loads all necessary systems and components.
 */

// Import necessary modules
import { CONSTANTS } from "../config/constants.js";
import { UnitFactory } from "../systems/factories/unitFactory.js";
import { EconomyUI } from "../systems/economy/economy-ui.js";
import { Player } from "../systems/players/player.js";
import { Shop } from "../entities/buildings/shop.js";
import { Building } from "../entities/buildings/building.js";
import mapLoader from "../maps/utils/map-loader.js";
import { mapRegistry, getAvailableMaps } from "../maps/map-registry.js";

document.addEventListener("DOMContentLoaded", function () {
  // Game configuration
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: CONSTANTS.COLORS.OCEAN, // Ocean blue background
    parent: "game-container",
    disableContextMenu: true,
    scene: [
      {
        key: "GameScene",
        active: true,
        visible: true,
        preload: preload,
        create: create,
        update: update,
      },
      {
        key: "UIScene",
        active: true,
        visible: true,
        preload: function () {},
        create: createUI,
        update: updateUI,
      },
    ],
    input: {
      activePointers: 1,
      mouse: {
        preventDefaultMove: false, // This is critical - allow mouse to move freely
        preventDefaultDown: false,
        preventDefaultUp: false,
        preventDefaultWheel: false,
      },
    },
  };

  // Initialize the game
  const game = new Phaser.Game(config);

  // Global variables for camera control
  let keys;
  // Camera controller for smooth movement
  let cameraController = {
    targetX: 0,
    targetY: 0,
    lerpFactor: 0.2, // Smoothing factor (0-1), adjusted for better responsiveness
    initialize: function (camera) {
      this.targetX = camera.scrollX;
      this.targetY = camera.scrollY;
    },
    update: function (camera) {
      // Smooth camera movement using linear interpolation (lerp)
      camera.scrollX = Phaser.Math.Linear(
        camera.scrollX,
        this.targetX,
        this.lerpFactor
      );
      camera.scrollY = Phaser.Math.Linear(
        camera.scrollY,
        this.targetY,
        this.lerpFactor
      );
    },
  };

  // Game objects
  let tank;
  let infantryUnits = []; // Changed from soldiers to infantryUnits
  let rocketeerUnits = []; // New array for rocketeer units
  let engineerUnits = []; // New array for engineer units
  let scoutUnits = []; // New array for scout units
  let sniperUnits = []; // New array for sniper units
  let selectedUnit = null;
  let selectedUnits = []; // Array to track multiple selected units
  let selectedBuilding = null; // Track selected building
  let unitFactory;
  const NUM_INFANTRY = 3; // Changed from NUM_SOLDIERS to NUM_INFANTRY
  const NUM_ROCKETEERS = 2; // Number of rocketeers to create
  const NUM_ENGINEERS = 2; // Number of engineers to create
  const NUM_SCOUTS = 2; // Number of scouts to create
  const NUM_SNIPERS = 2; // Number of snipers to create

  // Player management
  let players = [];
  let currentPlayer;

  // Define global variables
  let gameState = "running";
  let player;
  let enemyPlayer;
  let shop;
  let enemyUnits = [];
  let miniMap;
  let cameraControls;
  let enemyAI;
  let lastEnemySpawnTime = 0;
  let economyUI; // Add reference to the economy UI
  let currentMapId = "default"; // Default map ID

  // Global reference to the deselect hint
  let deselectHint = null;

  // Helper function to deselect everything
  function deselectAll() {
    // Deselect unit if one is selected
    if (selectedUnit) {
      selectedUnit.deselect();
      selectedUnit = null;
    }

    // Deselect all units in the multi-selection array
    if (selectedUnits.length > 0) {
      selectedUnits.forEach((unit) => {
        if (unit) unit.deselect();
      });
      selectedUnits = [];
    }

    // Deselect building if one is selected
    if (selectedBuilding) {
      selectedBuilding.deselect();
      selectedBuilding = null;
    }

    // Hide deselect helper hint if it exists
    if (deselectHint) {
      deselectHint.destroy();
      deselectHint = null;
    }
  }

  function preload() {
    // Preload any assets we need (if we had images, sounds, etc.)
  }

  function create() {
    try {
      const scene = this;

      // Load the map using the map loader
      const mapData = mapLoader.loadMap(currentMapId, scene);
      if (!mapData) {
        console.error(`Failed to load map: ${currentMapId}`);
        return;
      }

      console.log(`Loaded map: ${mapData.name}`);

      // Position camera to show the center of the map
      this.cameras.main.centerOn(0, 0);
      this.cameras.main.setName("mainCamera");

      // Set a smaller initial zoom level to show more of the map
      this.cameras.main.setZoom(0.5);

      // Initialize camera controller with current camera position
      cameraController.initialize(this.cameras.main);

      // Make the main scene accessible from the UI scene
      this.game.gameScene = this;

      // Set up keyboard controls for camera
      keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        deselect: Phaser.Input.Keyboard.KeyCodes.E, // Add E key for deselection
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT, // Add SHIFT key for multi-selection
        map: Phaser.Input.Keyboard.KeyCodes.M, // Add M key for showing map info
      });

      // Add deselect key handler
      this.input.keyboard.on("keydown-E", () => {
        console.log("'E' key pressed - deselecting all units and buildings");

        // Log current selection state for debugging
        if (selectedUnit || selectedUnits.length > 0 || selectedBuilding) {
          console.log("Selection state before deselect:", {
            hasSelectedUnit: !!selectedUnit,
            selectedUnitsCount: selectedUnits.length,
            hasSelectedBuilding: !!selectedBuilding,
          });
        }

        // Call the deselect function
        deselectAll();

        // Double-check that selection was cleared
        console.log("Selection state after deselect:", {
          hasSelectedUnit: !!selectedUnit,
          selectedUnitsCount: selectedUnits.length,
          hasSelectedBuilding: !!selectedBuilding,
        });
      });

      // Add map info key handler
      this.input.keyboard.on("keydown-M", () => {
        console.log("'M' key pressed - showing map info");
        if (mapData) {
          // Instead of directly creating map info, pass it to the UI scene
          this.scene.get("UIScene").events.emit("showMapInfo", mapData);
        }
      });

      // Make deselectAll available to the scene
      scene.deselectAll = deselectAll;

      // Import and initialize input manager if available
      try {
        import("../core/input.js")
          .then((module) => {
            const inputManager = module.default;

            // Initialize the input manager with this scene
            inputManager.init(scene);

            console.log("Input manager initialized successfully");
          })
          .catch((err) => {
            console.error("Error importing input manager:", err);
          });
      } catch (error) {
        console.error("Error initializing input manager:", error);
      }

      // Define unit selection handler for the scene
      scene.onUnitSelected = function (unit) {
        // Check if shift key is being held down for multi-selection
        const isShiftDown = keys.shift.isDown;

        // If the unit is already selected
        if (selectedUnits.includes(unit)) {
          // If shift is down, only remove this unit from selection
          if (isShiftDown) {
            unit.deselect();
            // Remove the unit from the selected units array
            selectedUnits = selectedUnits.filter((u) => u !== unit);

            // If it was also the primary selected unit, clear that reference
            if (selectedUnit === unit) {
              selectedUnit = selectedUnits.length > 0 ? selectedUnits[0] : null;
            }

            console.log("Unit removed from selection");
          } else {
            // If shift is not down, deselect all units and select only this one
            deselectAll();
            unit.select();
            selectedUnit = unit;
            selectedUnits = [unit];
            console.log("Unit selected, others deselected");
          }
        } else {
          // Unit is not already selected
          if (!isShiftDown) {
            // If shift is not down, deselect everything else first
            deselectAll();
            selectedUnits = [];
          } else if (selectedBuilding) {
            // If shift is down but we have a building selected, deselect it
            selectedBuilding.deselect();
            selectedBuilding = null;
          }

          // Select the unit and add it to our arrays
          unit.select();
          selectedUnit = selectedUnit || unit; // Set as primary if we don't have one
          selectedUnits.push(unit);

          console.log(
            "Unit selected, id:",
            unit.sprite.x + "-" + unit.sprite.y
          );
        }

        // Show or hide the deselect hint based on selection state
        if (selectedUnits.length > 0 || selectedBuilding) {
          // Tell the UI scene to show deselect hint
          scene.scene.get("UIScene").events.emit("showDeselectHint");
        } else {
          // Tell the UI scene to hide deselect hint
          scene.scene.get("UIScene").events.emit("hideDeselectHint");
        }
      };

      // Set up building selection handler
      setupBuildingSelection(scene);

      // Add selection box functionality for multi-selection
      let selectionBox = null;
      let selectionStart = null;

      scene.input.on("pointerdown", function (pointer) {
        // Only start box selection with shift key down
        if (keys.shift.isDown) {
          selectionStart = { x: pointer.worldX, y: pointer.worldY };

          // Create selection box graphics
          if (selectionBox) selectionBox.destroy();
          selectionBox = scene.add.graphics();
          selectionBox.lineStyle(2, 0xffffff, 0.8);
          selectionBox.setDepth(1000);
        }
      });

      scene.input.on("pointermove", function (pointer) {
        // Update selection box while dragging
        if (selectionStart && selectionBox) {
          selectionBox.clear();
          const width = pointer.worldX - selectionStart.x;
          const height = pointer.worldY - selectionStart.y;
          selectionBox.strokeRect(
            selectionStart.x,
            selectionStart.y,
            width,
            height
          );
        }
      });

      scene.input.on("pointerup", function (pointer) {
        if (selectionStart && selectionBox) {
          // Get selection box bounds
          const x1 = Math.min(selectionStart.x, pointer.worldX);
          const x2 = Math.max(selectionStart.x, pointer.worldX);
          const y1 = Math.min(selectionStart.y, pointer.worldY);
          const y2 = Math.max(selectionStart.y, pointer.worldY);

          // If box is too small, treat as a click (already handled by unit click handler)
          if (Math.abs(x2 - x1) < 5 || Math.abs(y2 - y1) < 5) {
            selectionBox.destroy();
            selectionBox = null;
            selectionStart = null;
            return;
          }

          // If not holding shift, clear current selection
          if (!keys.shift.isDown) {
            deselectAll();
            selectedUnits = [];
          }

          // Find all units within the selection box
          const allUnits = currentPlayer ? currentPlayer.getAllUnits() : [];

          allUnits.forEach((unit) => {
            if (unit && unit.sprite) {
              const unitX = unit.sprite.x;
              const unitY = unit.sprite.y;

              // Check if unit is within selection box
              if (unitX >= x1 && unitX <= x2 && unitY >= y1 && unitY <= y2) {
                // Add unit to selection if not already selected
                if (!selectedUnits.includes(unit)) {
                  unit.select();
                  selectedUnits.push(unit);

                  // First selected unit becomes the primary selection
                  if (!selectedUnit) {
                    selectedUnit = unit;
                  }
                }
              }
            }
          });

          // Show selection hint if we have units selected
          if (selectedUnits.length > 0) {
            // Tell the UI scene to show deselect hint
            scene.scene.get("UIScene").events.emit("showDeselectHint");
          }

          // Clean up selection box
          selectionBox.destroy();
          selectionBox = null;
          selectionStart = null;
        }
      });

      console.log("Setting up player system...");
      // Initialize player system
      initializePlayers(this);

      console.log("Setting up unit factory...");
      // Create unit factory
      unitFactory = new UnitFactory(scene);
      // Make unit factory available to the scene for building production
      scene.unitFactory = unitFactory;

      console.log("Creating game objects...");
      // Create game objects
      createGameObjects(this);

      // Mouse wheel for zoom (keeping this functionality)
      this.input.on(
        "wheel",
        function (pointer, gameObjects, deltaX, deltaY, deltaZ) {
          const zoomAmount = deltaY > 0 ? 0.9 : 1.1;
          const newZoom = Phaser.Math.Clamp(
            scene.cameras.main.zoom * zoomAmount,
            0.5,
            2
          );
          scene.cameras.main.zoom = newZoom;

          // Reset camera controller target after zoom to prevent jerky movement
          cameraController.initialize(scene.cameras.main);
        }
      );

      // Handle window resize
      window.addEventListener("resize", function () {
        game.scale.resize(window.innerWidth, window.innerHeight);

        // Reload the current map when window is resized
        scene.children.removeAll();
        scene.hexTiles = [];

        // Reload map with current ID
        const reloadedMap = mapLoader.loadMap(currentMapId, scene);

        // Recreate game objects
        createGameObjects(scene);

        // Reset camera controller target
        cameraController.initialize(scene.cameras.main);

        // Notify UI scene about resize
        scene.scene.get("UIScene").events.emit("windowResized");
      });

      console.log("Hexagonal map created with WASD camera controls");
    } catch (err) {
      console.error("Error in create function:", err);
    }
  }

  // UI Scene's create function
  function createUI() {
    const uiScene = this;

    // Make the UI scene accessible globally
    this.game.uiScene = this;

    // UI scene elements
    this.mapInfo = null;
    this.deselectHint = null;

    // This scene's camera never moves or zooms
    this.cameras.main.setName("uiCamera");
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setZoom(1.0);

    // Get a reference to the game scene for placement operations
    this.gameScene = this.scene.get("GameScene");

    // Setup event listeners from the main scene
    this.events.on("showMapInfo", (mapData) => {
      showMapInfo(uiScene, mapData);
    });

    this.events.on("showDeselectHint", () => {
      showDeselectHint(uiScene);
    });

    this.events.on("hideDeselectHint", () => {
      if (uiScene.deselectHint) {
        uiScene.deselectHint.destroy();
        uiScene.deselectHint = null;
      }
    });

    this.events.on("showBarracksUI", (building) => {
      if (building && building.showBarracksUI) {
        // We'll implement this if needed
      }
    });

    this.events.on("windowResized", () => {
      // Reposition UI elements if needed
      if (this.mapInfo) {
        this.mapInfo.x = this.cameras.main.width / 2;
        this.mapInfo.y = this.cameras.main.height / 3;
      }

      if (this.deselectHint) {
        this.deselectHint.y = this.cameras.main.height - 40;
      }

      // Resize any other UI elements here
      if (this.shop && this.shop.onWindowResize) {
        this.shop.onWindowResize();
      }

      if (this.economyUI && this.economyUI.onWindowResize) {
        this.economyUI.onWindowResize();
      }
    });

    // Create a special input handler that forwards pointer events to the game scene
    // This allows building placement to work correctly
    this.input.on("pointerdown", (pointer) => {
      // If we're in building placement mode in the shop
      if (this.shop && this.shop.placementMode) {
        // Convert pointer position to world position in game scene
        const worldPoint = this.gameScene.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );

        // Forward the placement attempt to the shop's placement handler
        if (this.shop.tryPlaceBuilding) {
          this.shop.tryPlaceBuilding(worldPoint.x, worldPoint.y);
        }
      }
    });

    // Forward pointermove events to update building preview position
    this.input.on("pointermove", (pointer) => {
      // If we have a shop and it's in placement mode with a preview
      if (this.shop && this.shop.placementMode && this.shop.buildingPreview) {
        // Convert pointer position to world position in the game scene
        const worldPoint = this.gameScene.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );

        // Update the preview position directly in the game world
        this.shop.buildingPreview.x = worldPoint.x;
        this.shop.buildingPreview.y = worldPoint.y;

        // Update the label if it exists
        if (this.shop.previewLabel) {
          this.shop.previewLabel.x = worldPoint.x;
          this.shop.previewLabel.y = worldPoint.y - 40;
        }

        // Check placement validity and update appearance
        if (this.shop.canPlaceBuilding) {
          const canPlace = this.shop.canPlaceBuilding(
            worldPoint.x,
            worldPoint.y
          );
          this.shop.buildingPreview.alpha = canPlace ? 0.8 : 0.4;
        }
      }
    });

    // Override placeBuilding to use the game scene
    const originalPlaceBuilding = uiScene.shop.placeBuilding;
    uiScene.shop.placeBuilding = function (x, y) {
      // Store current scene temporarily
      const tempScene = this.scene;

      // Use game scene for actual building placement
      this.scene = this.gameScene;

      // Call original method
      const result = originalPlaceBuilding.call(this, x, y);

      // Restore UI scene
      this.scene = tempScene;

      return result;
    };

    console.log("UI Scene initialized");
  }

  // UI Scene's update function
  function updateUI() {
    // Update any UI animations or elements that need regular updates
  }

  // Function to show a UI hint for deselection
  function showDeselectHint(scene) {
    // Remove existing hint if there is one
    if (scene.deselectHint) {
      scene.deselectHint.destroy();
    }

    // Create a new hint in bottom corner
    scene.deselectHint = scene.add.text(
      10,
      scene.cameras.main.height - 40,
      "Press 'E' to deselect",
      {
        fontSize: "14px",
        backgroundColor: "#000000",
        padding: { x: 8, y: 5 },
        fill: "#FFFFFF",
      }
    );

    // Make sure hint stays in view
    scene.deselectHint.setDepth(1000);

    // Add a slight fade animation
    scene.tweens.add({
      targets: scene.deselectHint,
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  // Function to display current map info
  function showMapInfo(scene, mapData) {
    // Remove any existing map info text
    if (scene.mapInfo) {
      scene.mapInfo.destroy();
    }

    // Create map info text in the center of the screen
    const mapInfo = scene.add.text(
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 3,
      `Map: ${mapData.name}`,
      {
        fontSize: "24px",
        backgroundColor: "#00000080",
        padding: { x: 20, y: 10 },
        fill: "#FFFFFF",
      }
    );

    // Center the text
    mapInfo.setOrigin(0.5);
    mapInfo.setDepth(1000);

    // Add fade-in animation
    mapInfo.setAlpha(0);
    scene.tweens.add({
      targets: mapInfo,
      alpha: 1,
      duration: 200,
      ease: "Power1",
      onComplete: () => {
        // Add fade-out animation after 3 seconds
        scene.time.delayedCall(3000, () => {
          scene.tweens.add({
            targets: mapInfo,
            alpha: 0,
            duration: 500,
            ease: "Power1",
            onComplete: () => {
              mapInfo.destroy();
              scene.mapInfo = null;
            },
          });
        });
      },
    });

    // Store reference to the object
    scene.mapInfo = mapInfo;
  }

  // Initialize player system
  function initializePlayers(scene) {
    try {
      console.log("Starting player initialization...");

      // Create player 1 (human player)
      const player1 = new Player(scene, 1, "Player 1", 0xff0000); // Red color

      // Create player 2 (AI or another human player)
      const player2 = new Player(scene, 2, "Player 2", 0x0000ff); // Blue color

      // Add players to the global players array
      players = [player1, player2];

      // Set the current player (in this case, player 1 is always active)
      currentPlayer = player1;

      // Add to scene for easy access
      scene.players = players;
      scene.currentPlayer = currentPlayer;

      // Initialize building system
      scene.buildings = [];

      // Get reference to UI scene
      const uiScene = scene.scene.get("UIScene");

      console.log("Creating shop for current player...");
      // Create shop UI in the UI scene
      uiScene.shop = new Shop(uiScene, currentPlayer);
      scene.shop = uiScene.shop; // Reference it in the main scene for compatibility

      // Set a reference to the game scene so the shop can create building previews there
      uiScene.shop.gameScene = scene;

      // Override building preview creation to use the game scene
      const originalCreateBuildingPreview = uiScene.shop.createBuildingPreview;
      uiScene.shop.createBuildingPreview = function (type) {
        // Store current scene temporarily
        const tempScene = this.scene;

        // Use game scene for creating previews
        this.scene = this.gameScene;

        // Call original method
        originalCreateBuildingPreview.call(this, type);

        // Restore UI scene for other operations
        this.scene = tempScene;
      };

      // Override canPlaceBuilding to use the game scene for hex checks
      const originalCanPlaceBuilding = uiScene.shop.canPlaceBuilding;
      uiScene.shop.canPlaceBuilding = function (x, y) {
        // Store current scene temporarily
        const tempScene = this.scene;

        // Use game scene for placement checks
        this.scene = this.gameScene;

        // Call original method
        const result = originalCanPlaceBuilding.call(this, x, y);

        // Restore UI scene
        this.scene = tempScene;

        return result;
      };

      // Override tryPlaceBuilding to use the game scene
      const originalTryPlaceBuilding = uiScene.shop.tryPlaceBuilding;
      uiScene.shop.tryPlaceBuilding = function (x, y) {
        // Store current scene temporarily
        const tempScene = this.scene;

        // Use game scene for placement
        this.scene = this.gameScene;

        // Call original method
        const result = originalTryPlaceBuilding.call(this, x, y);

        // Restore UI scene
        this.scene = tempScene;

        return result;
      };

      console.log("Creating economy UI for current player...");
      // Create the economy UI for the current player in the UI scene
      uiScene.economyUI = new EconomyUI(uiScene, currentPlayer.economy);
      economyUI = uiScene.economyUI;
      scene.economyUI = uiScene.economyUI; // Reference it in the main scene for compatibility

      // Add createBuilding method to the scene
      scene.createBuilding = function (x, y, type, owner) {
        const building = new Building(scene, x, y, type, owner);
        scene.buildings.push(building);
        return building;
      };

      console.log("Player system initialized successfully");

      // Force a resize event to position UI elements correctly
      scene.scale.resize(window.innerWidth, window.innerHeight);
    } catch (err) {
      console.error("Error initializing player system:", err);
    }
  }

  // Helper function to create game objects like tanks and infantry units
  function createGameObjects(scene) {
    try {
      // Find grass tiles for placing units
      const grassTiles = scene.hexTiles.filter((hex) => hex.type === "land");

      if (grassTiles.length === 0) {
        console.error("No grass tiles found to place units!");
        return;
      }

      // Clean up any existing objects first
      if (tank) {
        tank.destroy();
        tank = null;
      }

      if (infantryUnits.length > 0) {
        infantryUnits.forEach((unit) => unit.destroy());
        infantryUnits = [];
      }

      // Clean up new unit types
      if (rocketeerUnits.length > 0) {
        rocketeerUnits.forEach((unit) => unit.destroy());
        rocketeerUnits = [];
      }

      if (engineerUnits.length > 0) {
        engineerUnits.forEach((unit) => unit.destroy());
        engineerUnits = [];
      }

      if (scoutUnits.length > 0) {
        scoutUnits.forEach((unit) => unit.destroy());
        scoutUnits = [];
      }

      if (sniperUnits.length > 0) {
        sniperUnits.forEach((unit) => unit.destroy());
        sniperUnits = [];
      }

      // Create a builder for each player (only 1 builder per player at start)
      createBuildersForPlayers(scene, grassTiles);
    } catch (err) {
      console.error("Error creating game objects:", err);
    }
  }

  // Create builders for all players
  function createBuildersForPlayers(scene, validTiles) {
    console.log(
      "Starting createBuildersForPlayers with",
      scene.players?.length || 0,
      "players"
    );
    console.log("Valid tiles:", validTiles?.length || 0);

    if (!scene.players || !validTiles) {
      console.error("Missing players or valid tiles:", {
        hasPlayers: !!scene.players,
        playersLength: scene.players?.length || 0,
        hasValidTiles: !!validTiles,
        tilesLength: validTiles?.length || 0,
      });
      return;
    }

    // Create a single engineer for each player
    scene.players.forEach((player, index) => {
      if (!player) {
        console.error("Player is undefined at index", index);
        return;
      }
      console.log(`Creating engineer for Player ${player.id}`);

      // Find a suitable position for the engineer
      // For player 1, use the beginning of the valid tiles
      // For player 2, use the end of the valid tiles
      const tileIndex =
        index === 0
          ? Math.floor(validTiles.length * 0.25)
          : Math.floor(validTiles.length * 0.75);

      console.log(`Using tile index ${tileIndex} for player ${player.id}`);

      try {
        // Create the engineer (uses Engineer class)
        const engineer = unitFactory.createEngineer({
          validTiles: validTiles,
          position: { tileIndex: tileIndex },
        });

        if (engineer) {
          // Add the engineer to the player
          player.addBuilder(engineer);
          console.log(
            `Initial engineer created and added for Player ${player.id}`
          );
        } else {
          console.error(`Failed to create engineer for Player ${player.id}`);
        }
      } catch (error) {
        console.error(
          `Error creating engineer for Player ${player.id}:`,
          error
        );
      }
    });
  }

  // Update function for keyboard controls and game objects
  function update() {
    try {
      // Process WASD keyboard input for camera movement
      if (keys.up.isDown) {
        cameraController.targetY -= CONSTANTS.MOVEMENT.CAMERA_SPEED;
      }
      if (keys.down.isDown) {
        cameraController.targetY += CONSTANTS.MOVEMENT.CAMERA_SPEED;
      }
      if (keys.left.isDown) {
        cameraController.targetX -= CONSTANTS.MOVEMENT.CAMERA_SPEED;
      }
      if (keys.right.isDown) {
        cameraController.targetX += CONSTANTS.MOVEMENT.CAMERA_SPEED;
      }

      // Update camera position with smooth movement
      cameraController.update(this.cameras.main);

      // Update players
      if (players && players.length > 0) {
        players.forEach((player) => {
          if (player) player.update();
        });
      }

      // Update game objects
      if (tank) {
        tank.update();
      }

      if (infantryUnits && infantryUnits.length > 0) {
        infantryUnits.forEach((unit) => {
          if (unit) unit.update();
        });
      }

      // Update specialized units
      if (rocketeerUnits && rocketeerUnits.length > 0) {
        rocketeerUnits.forEach((unit) => {
          if (unit) unit.update();
        });
      }

      if (engineerUnits && engineerUnits.length > 0) {
        engineerUnits.forEach((unit) => {
          if (unit) unit.update();
        });
      }

      if (scoutUnits && scoutUnits.length > 0) {
        scoutUnits.forEach((unit) => {
          if (unit) unit.update();
        });
      }

      if (sniperUnits && sniperUnits.length > 0) {
        sniperUnits.forEach((unit) => {
          if (unit) unit.update();
        });
      }

      // Update buildings
      if (this.buildings && this.buildings.length > 0) {
        this.buildings.forEach((building) => {
          if (building) building.update();
        });
      }

      // Update shop if it exists
      if (this.shop) {
        this.shop.update();
      }

      // Update economy UI if it exists
      if (this.economyUI) {
        this.economyUI.update();
      }
    } catch (err) {
      console.error("Error in update function:", err);
    }
  }

  // Function to set up building selection handler
  function setupBuildingSelection(scene) {
    // Define building selection handler for the scene
    scene.onBuildingSelected = function (building) {
      console.log("Building selection handler called for:", building.type);

      // If the building is already selected, deselect it
      if (selectedBuilding === building) {
        console.log("Building was already selected, deselecting it");
        building.deselect();
        selectedBuilding = null;

        // Hide deselect hint when nothing is selected
        if (selectedUnits.length === 0) {
          scene.scene.get("UIScene").events.emit("hideDeselectHint");
        }
        return;
      }

      // If units were previously selected, deselect them unless shift is held
      if (!keys.shift.isDown) {
        if (selectedUnit) {
          selectedUnit.deselect();
          selectedUnit = null;
        }

        if (selectedUnits.length > 0) {
          selectedUnits.forEach((unit) => {
            if (unit) unit.deselect();
          });
          selectedUnits = [];
        }
      }

      // If a different building was previously selected, deselect it
      if (selectedBuilding && selectedBuilding !== building) {
        selectedBuilding.deselect();
      }

      // Set the newly selected building
      selectedBuilding = building;

      // Handle building selection (can be extended for building-specific UI)
      console.log("Building selected:", building.getInfo());

      // Show barracks UI if the selected building is a barracks
      if (building.type === "barracks" && !building.isBlueprint) {
        building.showBarracksUI();
      }

      // Show the deselect hint in the UI scene
      scene.scene.get("UIScene").events.emit("showDeselectHint");
    };
  }
});

export default {};
