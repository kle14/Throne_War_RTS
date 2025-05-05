import { Entity } from "./entity.js";
import { CONSTANTS } from "../../config/constants.js";
import { PathFinder } from "../../utils/pathfinding.js";
import { PathVisualizer } from "../../utils/path-visualizer.js";

/**
 * Mobile - Base class for all movable game entities (characters and vehicles)
 * This class handles common functionality like:
 * - Movement
 * - Path finding
 * - Selection
 * - Hex grid navigation
 * - Event handling
 * - Player ownership
 *
 * Migrated from the original Mobile_Object class
 */
export class Mobile extends Entity {
  /**
   * Constructor for Abstract Mobile Entity
   * @param {Phaser.Scene} scene - the Phaser scene
   * @param {Object} config - configuration object
   */
  constructor(scene, config) {
    console.log("Mobile constructor called");
    try {
      super(scene, config);
      console.log("Mobile: Entity constructor completed");

      // Setup display components
      this.sprite = scene.add.graphics();
      console.log("Mobile: Sprite created");

      // Initialize position and state
      this.x = config.x || 0;
      this.y = config.y || 0;
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.destination = null;
      this.path = [];
      this.currentPath = []; // Ensure currentPath is always initialized as an empty array
      this.speed = config.speed || CONSTANTS.MOBILE.DEFAULT_SPEED;
      this.selected = false;
      this.isMoving = false;
      this.selectionRing = null;
      this.bodyRadius =
        config.bodyRadius || CONSTANTS.CHARACTER.DEFAULT_BODY_RADIUS;
      console.log("Mobile: Base properties initialized");

      // Initialize selection and interaction properties
      this.makeClickable();
      this.targetables = []; // Entities this unit can target
      this.enemies = []; // Cached list of enemy entities
      this.team = config.team || 0;
      this.attackRange =
        config.attackRange || CONSTANTS.MOBILE.DEFAULT_ATTACK_RANGE;
      console.log("Mobile: Interaction properties initialized");

      // Create a Phaser Graphics object for drawing the entity
      this.selectionCircle = scene.add.graphics();
      this.selectionCircle.x = this.x;
      this.selectionCircle.y = this.y;
      this.selectionCircle.setVisible(false);
      console.log("Mobile: Selection circle created");

      // Make this a Phaser game object
      scene.add.existing(this.sprite);

      // Setup hit area for interactions
      this.hitArea = scene.add.circle(this.x, this.y, this.bodyRadius * 1.5);
      this.hitArea.setStrokeStyle(1, 0xffffff, 0.1);
      // Make sure hit area is interactive
      this.hitArea.setInteractive();
      console.log("Mobile: Hit area created");

      // Set up pathfinding
      try {
        console.log("Mobile: Creating PathFinder");
        this.pathFinder = new PathFinder(scene);
        console.log("Mobile: PathFinder created");
        console.log("Mobile: Creating PathVisualizer");
        this.pathVisualizer = new PathVisualizer(scene);
        console.log("Mobile: PathVisualizer created");
      } catch (error) {
        console.error("Error creating PathFinder or PathVisualizer:", error);
        // Create dummy objects to avoid errors
        this.pathFinder = { findPath: () => null };
        this.pathVisualizer = {
          drawPath: () => {},
          updatePathProgress: () => {},
          clear: () => {},
          destroy: () => {},
        };
      }

      // Find and set the initial hex this entity is on
      this.findAndSetInitialHex(this.x, this.y);
      console.log("Mobile: Initial hex set");

      // Set up event listeners
      this.setupEvents();
      console.log("Mobile: Events set up");

      // Call the draw method to render unit appearance
      this.draw();
      console.log("Mobile constructor completed successfully");
    } catch (error) {
      console.error("Error in Mobile constructor:", error);
      throw error; // Re-throw to see where it's failing
    }
  }

  /**
   * Set the owner of this entity
   * @param {Player} player - The player who owns this entity
   */
  setOwner(player) {
    super.setOwner(player);
  }

  /**
   * Set up the object with initial hex tile
   */
  findAndSetInitialHex(x, y) {
    try {
      console.log("Finding initial hex at", x, y);
      const startHex = this.findClosestHex(x, y);
      if (startHex) {
        this.currentHex = startHex;
        this.destinationPoint = {
          x: startHex.x,
          y: startHex.y,
        };
        console.log("Initial hex found at", startHex.x, startHex.y);
      } else {
        console.error("Could not find a valid hex at", x, y);
      }
    } catch (error) {
      console.error("Error finding initial hex:", error);
    }
  }

  /**
   * Find the closest hex to a given point
   */
  findClosestHex(x, y) {
    try {
      console.log("Finding closest hex to", x, y);

      const hexes = this.scene.hexTiles || [];
      console.log(`Searching among ${hexes.length} hex tiles`);

      if (hexes.length === 0) {
        console.error("No hex tiles found in scene");
        return null;
      }

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

      if (closestHex) {
        console.log(
          `Found closest hex at (${closestHex.x}, ${closestHex.y}), distance: ${closestDistance}`
        );
      } else {
        console.error("No valid movement tiles found");
      }

      return closestHex;
    } catch (error) {
      console.error("Error in findClosestHex:", error);
      return null;
    }
  }

  /**
   * Find the hex at a given position
   */
  findHexTileAt(x, y) {
    try {
      console.log(`Finding hex at (${x}, ${y})`);
      const hexes = this.scene.hexTiles || [];
      if (hexes.length === 0) {
        console.error("No hex tiles found in scene");
        return null;
      }

      let closestHex = null;
      let closestDistance = Number.MAX_VALUE;

      for (const hex of hexes) {
        const distance = Math.sqrt(
          Math.pow(hex.x - x, 2) + Math.pow(hex.y - y, 2)
        );

        // Use a larger threshold to make it easier to click on hexes
        // HEX_SIZE * 1.5 gives a more generous click area
        if (distance < closestDistance && distance < CONSTANTS.HEX_SIZE * 1.5) {
          closestDistance = distance;
          closestHex = hex;
        }
      }

      if (closestHex) {
        console.log(
          `Found closest hex at (${closestHex.x}, ${closestHex.y}), distance: ${closestDistance}`
        );
      } else {
        console.log(`No hex found within range of (${x}, ${y})`);
      }

      return closestHex;
    } catch (error) {
      console.error("Error in findHexTileAt:", error);
      return null;
    }
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
      console.log(
        `Map clicked at (${pointer.x}, ${pointer.y}), unit selected: ${this.isSelected}`
      );

      // Only process clicks if this object is selected
      if (!this.isSelected) {
        console.log(`${this.type} is not selected, ignoring map click`);
        return;
      }

      // Convert screen coordinates to world coordinates
      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );
      console.log(`World point: (${worldPoint.x}, ${worldPoint.y})`);

      this.handleMovementToPoint(worldPoint.x, worldPoint.y);
    };

    // Add the map click event listener
    this.scene.input.on("pointerdown", this.mapClickHandler);
  }

  /**
   * Handle movement to a specified point
   */
  handleMovementToPoint(x, y) {
    console.log(`handleMovementToPoint called with (${x}, ${y})`);

    // Find the tile that was clicked
    const clickedHex = this.findHexTileAt(x, y);

    if (clickedHex) {
      console.log(
        `Found clicked hex at (${clickedHex.x}, ${clickedHex.y}), color: ${clickedHex.color}`
      );
    } else {
      console.log(`No hex found at click point (${x}, ${y})`);
    }

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
        console.log(`Found path with ${path.length} points`);

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
    try {
      // Make sure the hex exists and has the expected properties
      if (!hex) {
        console.log("isValidMovementTile: hex is null or undefined");
        return false;
      }

      if (!hex.hasOwnProperty("color")) {
        console.log("isValidMovementTile: hex has no color property");
        return false;
      }

      // Default implementation - check if it's grass
      const isValid = hex.color === CONSTANTS.COLORS.GRASS;
      return isValid;
    } catch (error) {
      console.error("Error in isValidMovementTile:", error);
      return false;
    }
  }

  /**
   * Select this entity
   */
  select() {
    try {
      super.select();
      this.drawSelectionCircle();

      // Initialize currentPath if it's undefined
      if (!this.currentPath) {
        this.currentPath = [];
      }

      // Make the path fully visible if it exists
      if (
        this.pathVisualizer &&
        this.currentPath &&
        this.currentPath.length > 0
      ) {
        this.pathVisualizer.setTransparent(false);
      }

      console.log(this.type + " selected");
    } catch (error) {
      console.error("Error selecting unit:", error);
      // Attempt to recover by resetting selection state
      this.isSelected = false;
    }
  }

  /**
   * Deselect this entity
   */
  deselect() {
    try {
      super.deselect();

      // Only try to manipulate the selection circle if it exists
      if (this.selectionCircle) {
        this.selectionCircle.setVisible(false);
      }

      // Initialize currentPath if it's undefined
      if (!this.currentPath) {
        this.currentPath = [];
      }

      // Make the path more transparent if it exists
      if (
        this.pathVisualizer &&
        this.currentPath &&
        this.currentPath.length > 0
      ) {
        this.pathVisualizer.setTransparent(true);
      }

      console.log(this.type + " deselected");
    } catch (error) {
      console.error("Error deselecting unit:", error);
      // Attempt to recover
      this.isSelected = false;
    }
  }

  /**
   * Draw selection circle around the object
   */
  drawSelectionCircle() {
    try {
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
      if (this.sprite) {
        this.selectionCircle.x = this.sprite.x;
        this.selectionCircle.y = this.sprite.y;
      }

      // Make the selection circle visible
      this.selectionCircle.setVisible(true);
    } catch (error) {
      console.error("Error drawing selection circle:", error);
    }
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

    // Set target position using actual coordinates rather than grid position
    this.destinationPoint = {
      x: nextPoint.x,
      y: nextPoint.y,
    };
    console.log(
      `Moving to (${this.destinationPoint.x}, ${this.destinationPoint.y})`
    );
    this.isMoving = true;

    // Update current hex
    this.currentHex = nextPoint;

    // Update path visualization to show progress
    this.pathVisualizer.updatePathProgress(this.sprite.x, this.sprite.y, [
      nextPoint,
      ...this.currentPath,
    ]);
  }

  /**
   * Called when the path is completely traversed
   */
  onPathComplete() {
    console.log("Path complete");
    // Reset any path-related states
    this.currentPath = [];
    if (this.pathVisualizer) {
      this.pathVisualizer.clear();
    }
  }

  /**
   * Update method called every frame
   * Handles movement and other ongoing behaviors
   */
  update() {
    try {
      // Update position if moving
      if (this.isMoving && this.destinationPoint) {
        // Simple movement toward target
        const dx = this.destinationPoint.x - this.sprite.x;
        const dy = this.destinationPoint.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
          // Arrived at destination
          this.sprite.x = this.destinationPoint.x;
          this.sprite.y = this.destinationPoint.y;
          this.isMoving = false;

          // If we have more points in the path, move to the next one
          if (this.currentPath && this.currentPath.length > 0) {
            this.moveToNextPathPoint();
          } else {
            this.onPathComplete();
          }
        } else {
          // Continue moving toward destination
          const angle = Math.atan2(dy, dx);
          const moveX = Math.cos(angle) * this.speed;
          const moveY = Math.sin(angle) * this.speed;

          this.sprite.x += moveX;
          this.sprite.y += moveY;

          // Update rotation to face movement direction
          this.updateRotation(moveX, moveY);
        }

        // Keep the selection circle with the sprite
        if (this.selectionCircle) {
          this.selectionCircle.x = this.sprite.x;
          this.selectionCircle.y = this.sprite.y;
        }

        // Keep the hit area with the sprite
        if (this.hitArea) {
          this.hitArea.x = this.sprite.x;
          this.hitArea.y = this.sprite.y;
        }

        // Keep any labels with the sprite
        if (this.label) {
          this.label.x = this.sprite.x;
          this.label.y = this.sprite.y + 20;
        }
      }

      // Ensure the entity is visible by forcing redraw if needed
      if (this.sprite && (!this.sprite.visible || this.sprite.alpha < 1)) {
        this.sprite.setVisible(true);
        this.sprite.setAlpha(1);

        // Redraw if needed
        if (this.draw && typeof this.draw === "function") {
          this.draw();
        }
      }
    } catch (error) {
      console.error("Error in Mobile.update:", error);
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

    // Call parent destroy
    super.destroy();
  }

  /**
   * Draw method for rendering the mobile entity
   * This is meant to be overridden by subclasses
   */
  draw() {
    // This is a placeholder - subclasses should implement this
    // to draw their specific appearance
    if (!this.sprite) {
      console.error("Cannot draw mobile entity: sprite is null");
      return;
    }

    try {
      // Clear existing graphics
      this.sprite.clear();

      // Draw a basic circle for the entity
      this.sprite.fillStyle(0xcccccc, 1);
      this.sprite.fillCircle(0, 0, this.bodyRadius || 10);

      // Draw shadow
      this.sprite.fillStyle(0x000000, 0.3);
      this.sprite.fillCircle(2, 2, this.bodyRadius || 10);

      console.log("Base Mobile draw method executed");
    } catch (error) {
      console.error("Error in Mobile draw method:", error);
    }
  }
}

export default Mobile;
