document.addEventListener("DOMContentLoaded", function () {
  // Game configuration
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: CONSTANTS.COLORS.OCEAN, // Ocean blue background
    parent: "game-container",
    scene: {
      preload: preload,
      create: create,
      update: update,
    },
  };

  // Initialize the game
  const game = new Phaser.Game(config);

  // Global variables for camera control
  let keys;

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

  // Global reference to the deselect hint
  let deselectHint = null;

  // Function to show a UI hint for deselection
  function showDeselectHint(scene) {
    // Remove existing hint if there is one
    if (deselectHint) {
      deselectHint.destroy();
    }

    // Create a new hint in bottom corner
    deselectHint = scene.add.text(
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

    // Make sure hint stays in view at the corner of the camera
    deselectHint.setScrollFactor(0);
    deselectHint.setDepth(1000);

    // Add a slight fade animation
    scene.tweens.add({
      targets: deselectHint,
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  function preload() {
    // Preload any assets we need (if we had images, sounds, etc.)
  }

  function create() {
    try {
      const scene = this;

      // Define your land map - 1 for land, 0 for ocean
      const landMap = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1],
        [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1],
        [1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1],
        [1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ];

      // Store hex tiles information
      scene.hexTiles = [];

      // Create hexagonal grid with land map
      createHexagonalGrid(this, landMap);

      // Position camera to show the center of the map
      this.cameras.main.centerOn(0, 0);

      // Set camera bounds based on grid size
      const totalWidth = CONSTANTS.GRID_SIZE * CONSTANTS.HEX_WIDTH;
      const totalHeight = CONSTANTS.GRID_SIZE * CONSTANTS.HEX_HEIGHT * 0.75;
      this.cameras.main.setBounds(
        -totalWidth / 2,
        -totalHeight / 2,
        totalWidth,
        totalHeight
      );

      // Set up keyboard controls for camera
      keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        deselect: Phaser.Input.Keyboard.KeyCodes.E, // Add E key for deselection
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT, // Add SHIFT key for multi-selection
      });

      // Add deselect key handler
      this.input.keyboard.on("keydown-E", () => {
        deselectAll();
        console.log("Deselected all units and buildings with 'E' key");
      });

      // Make deselectAll available to the scene
      scene.deselectAll = deselectAll;

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
          showDeselectHint(scene);
        } else if (deselectHint) {
          deselectHint.destroy();
          deselectHint = null;
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
            showDeselectHint(scene);
          }

          // Clean up selection box
          selectionBox.destroy();
          selectionBox = null;
          selectionStart = null;
        }
      });

      // Background click handler for deselection
      // We use directly the scene instead of scene.input to ensure it runs after unit clicks
      scene.input.on(
        "pointerdown",
        function (pointer) {
          // We no longer auto-deselect units when clicking on the background
          // Units should only be deselected by explicit clicks on the unit or the 'E' key
          // Empty handler - we keep this in case we need to add functionality later
        },
        this
      );

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
        }
      );

      // Handle window resize
      window.addEventListener("resize", function () {
        game.scale.resize(window.innerWidth, window.innerHeight);

        // Recreate the grid when window is resized
        scene.children.removeAll();
        scene.hexTiles = [];
        createHexagonalGrid(scene, landMap);

        // Recreate game objects
        createGameObjects(scene);
      });

      console.log("Hexagonal map created with WASD camera controls");
    } catch (err) {
      console.error("Error in create function:", err);
    }
  }

  // Initialize player system
  function initializePlayers(scene) {
    try {
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

      // Create shop for the current player
      scene.shop = new Shop(scene, currentPlayer);

      console.log("Player system initialized successfully");
    } catch (err) {
      console.error("Error initializing player system:", err);
    }
  }

  // Helper function to create game objects like tanks and infantry units
  function createGameObjects(scene) {
    try {
      // Find grass tiles for placing units
      const grassTiles = scene.hexTiles.filter(
        (hex) => hex.color === CONSTANTS.COLORS.GRASS
      );

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

      // Create a tank using the factory - we'll place it in the center of available tiles
      const centerIndex = Math.floor(grassTiles.length / 2);
      tank = unitFactory.createUnit(Tank, {
        validTiles: grassTiles,
        position: { tileIndex: centerIndex },
        cost: CONSTANTS.ECONOMY.TANK_COST,
      });

      // Add tank to current player
      if (currentPlayer && tank) {
        currentPlayer.addUnit(tank);
      }

      // Create infantry units using the factory
      infantryUnits = unitFactory.createMultipleUnits(Infantry, NUM_INFANTRY, {
        validTiles: grassTiles,
        preventOverlap: true, // Prevent infantry units from spawning on the same tile
        cost: CONSTANTS.ECONOMY.INFANTRY_COST,
      });

      // Add infantry units to current player
      if (currentPlayer && infantryUnits && infantryUnits.length > 0) {
        infantryUnits.forEach((unit) => {
          if (unit) currentPlayer.addUnit(unit);
        });
      }

      // Create specialized units
      // Create rocketeer units
      rocketeerUnits = unitFactory.createMultipleUnits(
        Rocketeer,
        NUM_ROCKETEERS,
        {
          validTiles: grassTiles,
          preventOverlap: true,
          cost: CONSTANTS.ECONOMY.ROCKETEER_COST || 300,
        }
      );

      // Create engineer units
      engineerUnits = unitFactory.createMultipleUnits(Engineer, NUM_ENGINEERS, {
        validTiles: grassTiles,
        preventOverlap: true,
        cost: CONSTANTS.ECONOMY.ENGINEER_COST || 250,
      });

      // Create scout units
      scoutUnits = unitFactory.createMultipleUnits(Scout, NUM_SCOUTS, {
        validTiles: grassTiles,
        preventOverlap: true,
        cost: CONSTANTS.ECONOMY.SCOUT_COST || 150,
      });

      // Create sniper units
      sniperUnits = unitFactory.createMultipleUnits(Sniper, NUM_SNIPERS, {
        validTiles: grassTiles,
        preventOverlap: true,
        cost: CONSTANTS.ECONOMY.SNIPER_COST || 350,
      });

      // Add all specialized units to current player
      if (currentPlayer) {
        [rocketeerUnits, engineerUnits, scoutUnits, sniperUnits].forEach(
          (unitArray) => {
            if (unitArray && unitArray.length > 0) {
              unitArray.forEach((unit) => {
                if (unit) currentPlayer.addUnit(unit);
              });
            }
          }
        );
      }

      // Create a builder for each player
      createBuildersForPlayers(scene, grassTiles);
    } catch (err) {
      console.error("Error creating game objects:", err);
    }
  }

  // Create builders for all players
  function createBuildersForPlayers(scene, validTiles) {
    if (!scene.players || !validTiles) return;

    // Create a builder for each player
    scene.players.forEach((player, index) => {
      if (!player) return;

      // Find a suitable position for the builder
      // For player 1, use the beginning of the valid tiles
      // For player 2, use the end of the valid tiles
      const tileIndex =
        index === 0
          ? Math.floor(validTiles.length * 0.25)
          : Math.floor(validTiles.length * 0.75);

      // Create the builder
      const builder = unitFactory.createBuilder({
        validTiles: validTiles,
        position: { tileIndex: tileIndex },
      });

      if (builder) {
        // Add the builder to the player
        player.addBuilder(builder);
        console.log(`Builder created for Player ${player.id}`);
      }
    });
  }

  // Update function for keyboard controls and game objects
  function update() {
    try {
      // Process WASD keyboard input for camera movement
      if (keys.up.isDown) {
        this.cameras.main.scrollY -= CONSTANTS.MOVEMENT.CAMERA_SPEED;
      }
      if (keys.down.isDown) {
        this.cameras.main.scrollY += CONSTANTS.MOVEMENT.CAMERA_SPEED;
      }
      if (keys.left.isDown) {
        this.cameras.main.scrollX -= CONSTANTS.MOVEMENT.CAMERA_SPEED;
      }
      if (keys.right.isDown) {
        this.cameras.main.scrollX += CONSTANTS.MOVEMENT.CAMERA_SPEED;
      }

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
    } catch (err) {
      console.error("Error in update function:", err);
    }
  }

  // Function to create the entire hexagonal grid
  function createHexagonalGrid(scene, landMap) {
    // Center of the grid in world coordinates
    const centerX = 0;
    const centerY = 0;

    // Calculate the dimensions of the land map
    const landHeight = landMap.length;
    const landWidth = landMap[0].length;

    // Calculate the offset to center the land map
    const landOffsetRow =
      Math.floor(CONSTANTS.GRID_SIZE / 2) - Math.floor(landHeight / 2);
    const landOffsetCol =
      Math.floor(CONSTANTS.GRID_SIZE / 2) - Math.floor(landWidth / 2);

    // Create the grid
    for (let row = 0; row < CONSTANTS.GRID_SIZE; row++) {
      for (let col = 0; col < CONSTANTS.GRID_SIZE; col++) {
        // Calculate hex position (using odd-q offset coordinates)
        let x =
          centerX +
          col * CONSTANTS.HEX_WIDTH -
          (CONSTANTS.GRID_SIZE * CONSTANTS.HEX_WIDTH) / 2;
        let y =
          centerY +
          row * CONSTANTS.HEX_HEIGHT * 0.75 -
          (CONSTANTS.GRID_SIZE * CONSTANTS.HEX_HEIGHT * 0.75) / 2;

        // Offset for odd rows
        if (row % 2 !== 0) {
          x += CONSTANTS.HEX_WIDTH / 2;
        }

        // Determine if this is a grass or ocean tile
        let hexColor = CONSTANTS.COLORS.OCEAN; // Default to ocean

        // Check if this position falls within our land map
        const landMapRow = row - landOffsetRow;
        const landMapCol = col - landOffsetCol;

        if (
          landMapRow >= 0 &&
          landMapRow < landHeight &&
          landMapCol >= 0 &&
          landMapCol < landWidth &&
          landMap[landMapRow][landMapCol] === 1
        ) {
          hexColor = CONSTANTS.COLORS.GRASS; // This is a land tile
        }

        const hexGraphics = drawHexagon(
          scene,
          x,
          y,
          CONSTANTS.HEX_SIZE,
          hexColor
        );

        // Store hex info for tank movement
        scene.hexTiles.push({
          x: x,
          y: y,
          color: hexColor,
          gridPos: { row, col },
        });
      }
    }
  }

  // Function to draw a single hexagon
  function drawHexagon(scene, x, y, size, fillColor) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(fillColor, 1);

    const corners = 6;

    graphics.beginPath();

    for (let i = 0; i < corners; i++) {
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

    // Add a subtle stroke to make hexagons more distinct
    graphics.lineStyle(1, 0x000000, 0.3);
    graphics.strokePath();

    return graphics;
  }

  // Set up building selection handler
  function setupBuildingSelection(scene) {
    // Define building selection handler for the scene
    scene.onBuildingSelected = function (building) {
      // If the building is already selected, deselect it
      if (selectedBuilding === building) {
        building.deselect();
        selectedBuilding = null;
        console.log("Building deselected");

        // Hide deselect hint when nothing is selected
        if (selectedUnits.length === 0 && deselectHint) {
          deselectHint.destroy();
          deselectHint = null;
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

      // Show the deselect hint
      showDeselectHint(scene);
    };
  }
});
