class Soldier {
  constructor(scene, x, y) {
    this.scene = scene;

    // Create soldier sprite using Graphics
    this.sprite = scene.add.graphics();
    this.sprite.setPosition(x, y); // Set initial position using setPosition

    // Body radius - main size reference
    const bodyRadius = 10;

    // Add a shadow beneath the character
    this.sprite.fillStyle(0x000000, 0.2); // Black with 20% opacity
    this.sprite.fillCircle(1, 1, bodyRadius + 2);

    // Draw the soldier's body (main circle)
    this.sprite.fillStyle(0x3a5f0b, 1); // Olive green
    this.sprite.fillCircle(0, 0, bodyRadius);

    // Draw the helmet (smaller inner circle)
    this.sprite.fillStyle(0x2e3d19, 1); // Darker green
    this.sprite.fillCircle(0, 0, bodyRadius * 0.65);

    // Draw arms as lines
    this.sprite.lineStyle(3, 0xffcc99, 1); // Width 3, skin tone, full opacity
    this.sprite.beginPath();
    this.sprite.moveTo(-7.5, -2.5);
    this.sprite.lineTo(2.5, -17.5);
    this.sprite.strokePath(); // Use strokePath instead of stroke

    this.sprite.beginPath();
    this.sprite.moveTo(7.5, -5);
    this.sprite.lineTo(2.5, -10);
    this.sprite.strokePath();

    // Draw rifle as lines
    this.sprite.lineStyle(3, 0x333333, 1); // Width 3, dark gray
    this.sprite.beginPath();
    this.sprite.moveTo(2.5, -20);
    this.sprite.lineTo(2.5, -7.5);
    this.sprite.strokePath();

    this.sprite.lineStyle(2, 0x333333, 1); // Width 2, dark gray
    this.sprite.beginPath();
    this.sprite.moveTo(2.5, -25);
    this.sprite.lineTo(2.5, -20);
    this.sprite.strokePath();

    // Draw helmet detail
    this.sprite.fillStyle(0x556b2f, 1); // Olive drab
    this.sprite.fillCircle(0, -2.5, 2);

    // Soldier properties
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.moveSpeed = CONSTANTS.MOVEMENT.SOLDIER_SPEED;
    this.isMoving = false;
    this.isSelected = false;

    // Create a hit area for the soldier
    this.hitArea = scene.add.circle(x, y, 20);
    this.hitArea.setStrokeStyle(1, 0xffff00, 0.0); // Invisible stroke
    this.hitArea.setInteractive();

    // Selection circle
    this.selectionCircle = scene.add.graphics();
    this.selectionCircle.setVisible(false);

    // Find closest hex to set initial position
    const startHex = this.findClosestHex(x, y);
    if (startHex) {
      this.currentHex = startHex;
      this.tilePosition = startHex.gridPos;
    }

    // Path-related properties
    this.currentPath = [];
    this.pathFinder = new PathFinder(scene);
    this.pathVisualizer = new PathVisualizer(scene);

    console.log("Soldier created at position", x, y);
  }

  setupEvents() {
    // Soldier selection handler
    this.hitArea.on("pointerdown", (pointer) => {
      console.log("Soldier clicked");
      this.select();

      // Tell the scene this soldier was selected
      if (this.scene.onUnitSelected) {
        this.scene.onUnitSelected(this);
      }

      // Prevent event propagation
      pointer.stopPropagation();
    });

    // Map click handler for movement
    this.mapClickHandler = (pointer) => {
      // Only process clicks if this soldier is selected
      if (!this.isSelected) return;

      console.log("Processing map click for soldier movement");

      // Convert screen coordinates to world coordinates
      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );

      // Find the hex tile that was clicked
      const clickedHex = this.findHexTileAt(worldPoint.x, worldPoint.y);

      if (clickedHex && clickedHex.color === CONSTANTS.COLORS.GRASS) {
        console.log("Soldier moving to grass tile.");

        // Calculate path from current position to target
        const path = this.pathFinder.findPath(
          this.currentHex,
          clickedHex,
          (hex) => hex.color === CONSTANTS.COLORS.GRASS
        );

        if (path && path.length > 0) {
          this.currentPath = path;
          this.pathVisualizer.drawPath(this.sprite.x, this.sprite.y, path);

          // Move to the first point in path
          this.moveToNextPathPoint();
        }
      }
    };

    // Add the map click event listener
    this.scene.input.on("pointerdown", this.mapClickHandler);
  }

  select() {
    this.isSelected = true;
    this.drawSelectionCircle();
    console.log("Soldier selected");
  }

  deselect() {
    this.isSelected = false;
    this.selectionCircle.setVisible(false);
    console.log("Soldier deselected");
  }

  drawSelectionCircle() {
    // Clear previous circle
    this.selectionCircle.clear();

    // Draw new selection circle
    this.selectionCircle.lineStyle(
      CONSTANTS.SELECTION.LINE_WIDTH,
      CONSTANTS.COLORS.SELECTION,
      CONSTANTS.SELECTION.OPACITY
    );

    // Draw circle slightly larger than the soldier
    const radius = 20;
    this.selectionCircle.strokeCircle(0, 0, radius);

    // Position the selection circle at the soldier's position
    this.selectionCircle.x = this.sprite.x;
    this.selectionCircle.y = this.sprite.y;

    // Make the selection circle visible
    this.selectionCircle.setVisible(true);
  }

  update() {
    if (this.isMoving) {
      // Simple movement toward target
      const dx = this.targetX - this.sprite.x;
      const dy = this.targetY - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.moveSpeed) {
        // Arrived at destination
        this.sprite.x = this.targetX;
        this.sprite.y = this.targetY;
        this.isMoving = false;

        // Move to next point in path if available
        if (this.currentPath.length > 0) {
          this.moveToNextPathPoint();
        } else {
          // Path complete, clear the path visualization
          this.pathVisualizer.clear();
        }
      } else {
        // Move toward target
        this.sprite.x += (dx / distance) * this.moveSpeed;
        this.sprite.y += (dy / distance) * this.moveSpeed;

        // Rotate soldier to face movement direction
        // Corrected angle calculation to make the soldier face the direction of movement
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        this.sprite.rotation = angle;

        // Update selection circle position if selected
        if (this.isSelected) {
          this.selectionCircle.x = this.sprite.x;
          this.selectionCircle.y = this.sprite.y;
        }

        // Update hit area position
        this.hitArea.x = this.sprite.x;
        this.hitArea.y = this.sprite.y;
      }
    }
  }

  moveToNextPathPoint() {
    if (this.currentPath.length === 0) {
      this.isMoving = false;
      return;
    }

    // Get the next point from path
    const nextPoint = this.currentPath[0];
    this.currentPath.splice(0, 1); // Remove the first point

    // Set target position
    this.targetX = nextPoint.x;
    this.targetY = nextPoint.y;
    this.isMoving = true;

    // Update current hex
    this.currentHex = nextPoint;
    this.tilePosition = nextPoint.gridPos;

    // Update path visualization to show progress
    // This only updates the progress indicator, not redrawing the whole path
    this.pathVisualizer.updatePathProgress(this.sprite.x, this.sprite.y, [
      nextPoint,
      ...this.currentPath,
    ]);
  }

  // Find the hex tile at the given screen coordinates
  findHexTileAt(x, y) {
    // This will be populated with hex data from the main game
    const hexes = this.scene.hexTiles || [];

    // Find the closest hex
    let closestHex = null;
    let closestDistance = Number.MAX_VALUE;

    for (const hex of hexes) {
      const distance = Math.sqrt(
        Math.pow(hex.x - x, 2) + Math.pow(hex.y - y, 2)
      );

      if (distance < closestDistance && distance < CONSTANTS.HEX_SIZE) {
        closestDistance = distance;
        closestHex = hex;
      }
    }

    return closestHex;
  }

  // Find the closest hex to a point
  findClosestHex(x, y) {
    const hexes = this.scene.hexTiles || [];
    let closestHex = null;
    let closestDistance = Number.MAX_VALUE;

    for (const hex of hexes) {
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

  removeEvents() {
    if (this.mapClickHandler) {
      this.scene.input.off("pointerdown", this.mapClickHandler);
    }

    // Remove hit area pointer events
    this.hitArea.off("pointerdown");
    this.hitArea.disableInteractive();
  }

  destroy() {
    this.removeEvents();
    this.sprite.destroy();
    this.hitArea.destroy();
    this.selectionCircle.destroy();
    this.pathVisualizer.destroy();
  }
}

// Export the Soldier class
if (typeof module !== "undefined") {
  module.exports = { Soldier };
}
