class Tank {
  constructor(scene, x, y) {
    this.scene = scene;

    // Create tank sprite - for now using a simple placeholder shape
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(0x505050, 1);
    this.sprite.fillRect(-15, -24, 30, 48);

    // Tank turret
    this.sprite.fillStyle(0x404040, 1);
    this.sprite.fillCircle(0, -6, 12);

    // Tank barrel
    this.sprite.fillStyle(0x303030, 1);
    this.sprite.fillRect(-2.4, -36, 4.8, 24);

    // Tank tracks
    this.sprite.fillStyle(0x353535, 1);
    this.sprite.fillRect(-21, -27, 6, 54);
    this.sprite.fillRect(15, -27, 6, 54);

    // Tank turret hatch
    this.sprite.fillStyle(0x282828, 1);
    this.sprite.fillCircle(0, -9, 3.6);

    // Additional details
    this.sprite.fillStyle(0x202020, 1);
    this.sprite.fillRect(-9, 21, 18, 3);

    // Set initial position
    this.sprite.x = x;
    this.sprite.y = y;
    this.targetX = x;
    this.targetY = y;

    // Tank properties
    this.moveSpeed = CONSTANTS.MOVEMENT.DEFAULT_SPEED;
    this.isMoving = false;
    this.isSelected = false;

    // Create a hit area for the tank
    this.hitArea = scene.add.circle(x, y, 25);
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

    // Path related properties
    this.currentPath = [];
    this.pathFinder = new PathFinder(scene);
    this.pathVisualizer = new PathVisualizer(scene);

    console.log("Tank created at position", x, y);
  }

  setupEvents() {
    // Tank selection handler
    this.hitArea.on("pointerdown", (pointer) => {
      console.log("Tank clicked");
      this.select();

      // Tell the scene this tank was selected
      if (this.scene.onUnitSelected) {
        this.scene.onUnitSelected(this);
      }

      // Prevent event propagation
      pointer.stopPropagation();
    });

    // Map click handler for movement
    this.mapClickHandler = (pointer) => {
      // Only process clicks if this tank is selected
      if (!this.isSelected) return;

      console.log("Processing map click for tank movement");

      // Convert screen coordinates to world coordinates
      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );

      // Find the hex tile that was clicked
      const clickedHex = this.findHexTileAt(worldPoint.x, worldPoint.y);

      if (clickedHex && clickedHex.color === CONSTANTS.COLORS.GRASS) {
        console.log("Tank moving to grass tile.");

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
    console.log("Tank selected");
  }

  deselect() {
    this.isSelected = false;
    this.selectionCircle.setVisible(false);
    console.log("Tank deselected");
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

    // Draw circle slightly larger than the tank
    const radius = 25;
    this.selectionCircle.strokeCircle(0, 0, radius);

    // Position the selection circle at the tank's position
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

            // Rotate tank to face movement direction
            const angle = Math.atan2(dy, dx);
            this.sprite.rotation = angle + Math.PI / 2; // Changed from - to + to fix orientation

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
    // If there are no more points, stop moving
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

    // Update the current hex
    this.currentHex = nextPoint;

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

// Export the Tank class
if (typeof module !== "undefined") {
  module.exports = { Tank };
}
