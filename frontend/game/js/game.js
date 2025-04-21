document.addEventListener("DOMContentLoaded", function () {
  // Game configuration
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: CONSTANTS.COLORS.OCEAN, // Ocean blue background
    parent: "game-container",
    scene: {
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
  let selectedUnit = null;
  let unitFactory;
  const NUM_INFANTRY = 3; // Changed from NUM_SOLDIERS to NUM_INFANTRY

  function create() {
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
    });

    // Define unit selection handler for the scene
    scene.onUnitSelected = function (unit) {
      // If a unit was previously selected, deselect it
      if (selectedUnit && selectedUnit !== unit) {
        selectedUnit.deselect();
      }

      // Set the new selected unit
      selectedUnit = unit;

      console.log("Unit selected, id:", unit.sprite.x + "-" + unit.sprite.y);
    };

    // Background click handler for deselection
    // We use directly the scene instead of scene.input to ensure it runs after unit clicks
    scene.input.on(
      "pointerdown",
      function (pointer) {
        // Delay the check slightly to ensure unit clicks are processed first
        setTimeout(() => {
          // Check if we have a selection and if the click wasn't on a unit
          if (selectedUnit && !pointer.wasTouch) {
            console.log("Background clicked, deselecting units");
            selectedUnit.deselect();
            selectedUnit = null;
          }
        }, 10);
      },
      this
    );

    // Create unit factory
    unitFactory = new UnitFactory(scene);

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
  }

  // Helper function to create game objects like tanks and infantry units
  function createGameObjects(scene) {
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

    // Create a tank using the factory - we'll place it in the center of available tiles
    const centerIndex = Math.floor(grassTiles.length / 2);
    tank = unitFactory.createUnit(Tank, {
      validTiles: grassTiles,
      position: { tileIndex: centerIndex },
    });

    // Create infantry units using the factory
    infantryUnits = unitFactory.createMultipleUnits(Infantry, NUM_INFANTRY, {
      validTiles: grassTiles,
      preventOverlap: true, // Prevent infantry units from spawning on the same tile
    });
  }

  // Update function for keyboard controls and game objects
  function update() {
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

    // Update game objects
    if (tank) {
      tank.update();
    }

    if (infantryUnits.length > 0) {
      infantryUnits.forEach((unit) => unit.update());
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
});
