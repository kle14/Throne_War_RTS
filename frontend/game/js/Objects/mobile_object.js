// filepath: c:\Users\Khoi Le\workspace\Throne_Wars_RTS\frontend\game\js\Objects\mobile_object.js
/**
 * Mobile_Object - Base class for all movable game objects (characters and vehicles)
 * This class handles common functionality like:
 * - Movement
 * - Path finding
 * - Selection
 * - Hex grid navigation
 * - Event handling
 * - Player ownership
 */
class Mobile_Object {
  /**
   * Constructor for the Mobile_Object class
   * @param {Phaser.Scene} scene - The scene this object belongs to
   * @param {Object} objectProps - Properties for this object
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, objectProps, x, y) {
    this.scene = scene;

    // Store initial position
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;

    // Common properties
    this.moveSpeed = objectProps.moveSpeed || CONSTANTS.MOVEMENT.DEFAULT_SPEED;
    this.bodyRadius = objectProps.bodyRadius || 10;
    this.isMoving = false;
    this.isSelected = false;
    this.objectProps = objectProps;
    this.type = objectProps.type || "generic";
    this.owner = null; // Initialize owner as null
    this.cost = objectProps.cost || 0; // Cost of the unit

    // Selection circle (invisible by default)
    this.selectionCircle = scene.add.graphics();
    this.selectionCircle.setVisible(false);
    this.selectionCircle.setDepth(5); // Set depth between path (1) and sprites (10)

    // Path-related properties
    this.currentPath = [];
    this.currentHex = null;
    this.tilePosition = null;

    // Initialize pathfinding
    if (scene.pathFinder) {
      this.pathFinder = scene.pathFinder;
    } else {
      this.pathFinder = new PathFinder(scene);
    }

    // Initialize path visualizer
    this.pathVisualizer = new PathVisualizer(scene);

    // Find closest hex to set initial position
    this.findAndSetInitialHex(x, y);
  }

  /**
   * Set the owner of this unit
   * @param {Player} player - The player who owns this unit
   */
  setOwner(player) {
    if (!player) return;

    this.owner = player;

    // If this unit has a sprite, tint it with the player's color
    if (this.sprite && player.color) {
      try {
        this.sprite.setTint(player.color);
      } catch (err) {
        console.error("Error setting sprite tint:", err);
      }
    }
  }

  /**
   * Get the owner of this unit
   * @returns {Player} The player who owns this unit
   */
  getOwner() {
    return this.owner;
  }

  /**
   * Check if this unit is owned by the specified player
   * @param {Player} player - The player to check
   * @returns {boolean} True if the unit is owned by the player
   */
  isOwnedBy(player) {
    return this.owner && this.owner.id === player.id;
  }

  /**
   * Set up the object with initial hex tile
   */
  findAndSetInitialHex(x, y) {
    const startHex = this.findClosestHex(x, y);
    if (startHex) {
      this.currentHex = startHex;
      this.tilePosition = startHex.gridPos;
    }
  }

  /**
   * Find the closest hex to a given point
   */
  findClosestHex(x, y) {
    const hexes = this.scene.hexTiles || [];
    let closestHex = null;
    let closestDistance = Number.MAX_VALUE;

    for (const hex of hexes) {
      // Only consider valid tiles for movement
      if (!this.isValidMovementTile(hex)) continue;

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

  /**
   * Find the hex at a given position
   */
  findHexTileAt(x, y) {
    const hexes = this.scene.hexTiles || [];
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

  /**
   * Set up event listeners
   */
  setupEvents() {
    // Object selection handler
    this.hitArea.on("pointerdown", (pointer) => {
      console.log(this.type + " clicked");
      this.select();

      // Tell the scene this object was selected
      if (this.scene.onUnitSelected) {
        this.scene.onUnitSelected(this);
      }

      // Prevent event propagation
      pointer.stopPropagation();
    });

    // Map click handler for movement
    this.mapClickHandler = (pointer) => {
      // Only process clicks if this object is selected
      if (!this.isSelected) return;

      // Convert screen coordinates to world coordinates
      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );

      this.handleMovementToPoint(worldPoint.x, worldPoint.y);
    };

    // Add the map click event listener
    this.scene.input.on("pointerdown", this.mapClickHandler);
  }

  /**
   * Handle movement to a specified point
   */
  handleMovementToPoint(x, y) {
    // Find the tile that was clicked
    const clickedHex = this.findHexTileAt(x, y);

    if (clickedHex && this.isValidMovementTarget(clickedHex)) {
      // When clicking a new destination, we need to use the current actual position
      // rather than the stored hex position which might not be up-to-date during movement
      const currentPosition = {
        x: this.sprite.x,
        y: this.sprite.y,
      };

      // Find the closest hex to the current position for accurate pathfinding
      const startHex = this.findClosestHex(
        currentPosition.x,
        currentPosition.y
      );

      if (!startHex) {
        console.error("Could not find a valid starting hex for pathfinding");
        return;
      }

      // Cancel any current movement and clear existing path
      this.isMoving = false;
      this.currentPath = [];
      this.pathVisualizer.clear();

      // Calculate path from current position to target
      const path = this.pathFinder.findPath(
        startHex,
        clickedHex,
        this.isValidMovementTile.bind(this)
      );

      if (path && path.length > 0) {
        // Update current position to ensure we're starting from the right place
        this.currentHex = startHex;

        // Set the new path
        this.currentPath = path;
        this.pathVisualizer.drawPath(this.sprite.x, this.sprite.y, path);

        // Move to the first point in path
        this.moveToNextPathPoint();
      } else {
        console.log("No valid path found to destination");
      }
    } else {
      console.log("Invalid movement target or no hex at click location");
    }
  }

  /**
   * Check if a hex is a valid movement target
   * Default implementation, should be overridden by subclasses
   */
  isValidMovementTarget(hex) {
    return hex && hex.color === CONSTANTS.COLORS.GRASS;
  }

  /**
   * Check if a hex is a valid tile for pathfinding
   * Default implementation, should be overridden by subclasses
   */
  isValidMovementTile(hex) {
    return hex && hex.color === CONSTANTS.COLORS.GRASS;
  }

  /**
   * Select this object
   */
  select() {
    this.isSelected = true;
    this.drawSelectionCircle();

    // Make the path fully visible if it exists
    if (this.pathVisualizer && this.currentPath.length > 0) {
      this.pathVisualizer.setTransparent(false);
    }

    console.log(this.type + " selected");
  }

  /**
   * Deselect this object
   */
  deselect() {
    this.isSelected = false;
    this.selectionCircle.setVisible(false);

    // Make the path more transparent if it exists
    if (this.pathVisualizer && this.currentPath.length > 0) {
      this.pathVisualizer.setTransparent(true);
    }

    console.log(this.type + " deselected");
  }

  /**
   * Draw selection circle around the object
   */
  drawSelectionCircle() {
    // Clear previous circle
    this.selectionCircle.clear();

    // Draw new selection circle
    this.selectionCircle.lineStyle(
      CONSTANTS.SELECTION.LINE_WIDTH,
      CONSTANTS.COLORS.SELECTION,
      CONSTANTS.SELECTION.OPACITY
    );

    // Draw circle slightly larger than the object
    const radius = this.bodyRadius * CONSTANTS.SELECTION.CIRCLE_SIZE || 20;
    this.selectionCircle.strokeCircle(0, 0, radius);

    // Position the selection circle at the object's position
    this.selectionCircle.x = this.sprite.x;
    this.selectionCircle.y = this.sprite.y;

    // Make the selection circle visible
    this.selectionCircle.setVisible(true);
  }

  /**
   * Move to next point in the path
   */
  moveToNextPathPoint() {
    if (this.currentPath.length === 0) {
      this.isMoving = false;
      return;
    }

    // Get the next point from path
    const nextPoint = this.currentPath[0];

    // Verify the next point is valid (double-check)
    if (!this.isValidMovementTile(nextPoint)) {
      console.error(
        "Invalid movement tile detected in path, canceling movement"
      );
      this.currentPath = [];
      this.isMoving = false;
      this.pathVisualizer.clear();
      return;
    }

    this.currentPath.splice(0, 1); // Remove the first point

    // Set target position
    this.targetX = nextPoint.x;
    this.targetY = nextPoint.y;
    this.isMoving = true;

    // Update current hex
    this.currentHex = nextPoint;
    this.tilePosition = nextPoint.gridPos;

    // Update path visualization to show progress
    this.pathVisualizer.updatePathProgress(this.sprite.x, this.sprite.y, [
      nextPoint,
      ...this.currentPath,
    ]);
  }

  /**
   * Update method called every frame
   */
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

        // Update hit area position
        if (this.hitArea) {
          this.hitArea.x = this.sprite.x;
          this.hitArea.y = this.sprite.y;
        }

        // Update selection circle if visible
        if (this.isSelected) {
          this.selectionCircle.x = this.sprite.x;
          this.selectionCircle.y = this.sprite.y;
        }

        // Move to next point in path if available
        if (this.currentPath.length > 0) {
          this.moveToNextPathPoint();
        } else {
          // Path complete, clear the path visualization
          this.pathVisualizer.clear();
        }
      } else {
        // Continue moving
        this.sprite.x += (dx / distance) * this.moveSpeed;
        this.sprite.y += (dy / distance) * this.moveSpeed;

        // Rotate object to face movement direction
        // This can be overridden by subclasses for different rotation behavior
        this.updateRotation(dx, dy);

        // Update hit area position
        if (this.hitArea) {
          this.hitArea.x = this.sprite.x;
          this.hitArea.y = this.sprite.y;
        }

        // Update selection circle if visible
        if (this.isSelected) {
          this.selectionCircle.x = this.sprite.x;
          this.selectionCircle.y = this.sprite.y;
        }

        // Continuously update path visualization every frame to ensure
        // the buffer zone moves with the troop
        if (this.currentPath.length > 0) {
          this.pathVisualizer.updatePathProgress(
            this.sprite.x,
            this.sprite.y,
            this.currentPath
          );
        }
      }
    }
  }

  /**
   * Update rotation based on movement direction
   * Can be overridden by subclasses
   */
  updateRotation(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      this.sprite.rotation = angle;
    }
  }

  /**
   * Remove all event listeners
   */
  removeEvents() {
    if (this.mapClickHandler) {
      this.scene.input.off("pointerdown", this.mapClickHandler);
    }

    // Remove hit area pointer events if it exists
    if (this.hitArea) {
      this.hitArea.off("pointerdown");
      this.hitArea.disableInteractive();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.removeEvents();
    if (this.pathVisualizer) this.pathVisualizer.destroy();
    if (this.sprite) this.sprite.destroy();
    if (this.hitArea) this.hitArea.destroy();
    if (this.selectionCircle) this.selectionCircle.destroy();
  }
}

// Export the Mobile_Object class
if (typeof module !== "undefined") {
  module.exports = { Mobile_Object };
}
