import { Character } from "../character.js";
import { CONSTANTS } from "../../../config/constants.js";

/**
 * Engineer - Class for builder units that can construct buildings
 * This class extends Character and adds building functionality
 */
export class Engineer extends Character {
  /**
   * Constructor for the Engineer class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    console.log("Engineer constructor called with:", x, y);
    try {
      // Merge default engineer props with provided props
      const engineerProps = {
        moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED * 0.9, // Slightly slower than soldier
        bodyRadius: 10,
        type: "builder", // Using "builder" for consistency
        cost: 100, // Cost to create additional engineers/builders
        ...props,
      };
      console.log("Engineer props:", JSON.stringify(engineerProps));

      super(scene, engineerProps, x, y);
      console.log("Super constructor completed");

      // Builder-specific properties
      this.isBuilding = false;
      this.targetBlueprint = null;
      this.buildingProgress = 0;
      this.buildRate = 0.03; // 3% progress per second to make multiple builders valuable

      // Ensure the hit area is interactive
      if (this.hitArea) {
        this.hitArea.setInteractive();
      }

      // Set up builder-specific events
      this.setupBuilderEvents();
      console.log("Engineer constructor completed successfully");
    } catch (error) {
      console.error("Error in Engineer constructor:", error);
      throw error; // Re-throw to see where it's failing
    }
  }

  /**
   * Draw the engineer character
   * Override parent draw method
   */
  draw() {
    this.sprite.clear();

    // Shadow
    this.sprite.fillStyle(
      CONSTANTS.CHARACTER.SHADOW.COLOR,
      CONSTANTS.CHARACTER.SHADOW.OPACITY
    );
    this.sprite.fillCircle(1, 1, this.bodyRadius + 2);

    // Body (worker uniform - bright blue)
    this.sprite.fillStyle(0x1f75fe, 1); // Bright blue for overalls
    this.sprite.fillCircle(0, 0, this.bodyRadius);

    // Helmet (safety yellow)
    this.sprite.fillStyle(0xffcc00, 1);
    this.sprite.fillCircle(0, 0, this.bodyRadius * 0.65);

    // Helmet Glare
    this.sprite.fillStyle(0xffffff, 0.2);
    this.sprite.fillCircle(0, -2.5, 2);

    // === Tool: Wrench ===
    // Held in right hand, wrench pointing forward
    const wrenchX = 6;
    const wrenchY = -3;

    // Wrench handle
    this.sprite.fillStyle(0x555555, 1); // Dark gray metal
    this.sprite.fillRect(wrenchX - 1, wrenchY - 12, 2, 12); // Handle pointing forward

    // Wrench head (C-shape or crescent)
    this.sprite.beginPath();
    this.sprite.moveTo(wrenchX - 3, wrenchY - 12);
    this.sprite.lineTo(wrenchX - 1, wrenchY - 14);
    this.sprite.lineTo(wrenchX + 1, wrenchY - 14);
    this.sprite.lineTo(wrenchX + 3, wrenchY - 12);
    this.sprite.lineTo(wrenchX + 2, wrenchY - 10);
    this.sprite.lineTo(wrenchX - 2, wrenchY - 10);
    this.sprite.closePath();
    this.sprite.fillPath();

    // === Arms ===
    this.sprite.lineStyle(3, CONSTANTS.CHARACTER.SKIN_TONE[0], 1);

    // Left arm down (relaxed)
    this.sprite.beginPath();
    this.sprite.moveTo(-7, -2.5);
    this.sprite.lineTo(-4, -8);
    this.sprite.strokePath();

    // Right arm (holding wrench)
    this.sprite.beginPath();
    this.sprite.moveTo(6, -2.5);
    this.sprite.lineTo(wrenchX, wrenchY - 4); // connects to wrench handle
    this.sprite.strokePath();
  }

  /**
   * Set up builder-specific events
   */
  setupBuilderEvents() {
    // Make sure the hit area is properly interactive and has pointer events
    try {
      if (this.hitArea) {
        // Remove any existing listeners first to avoid duplicates
        this.hitArea.off("pointerdown");

        // Ensure hit area is interactive
        this.hitArea.setInteractive();

        // Add pointer down event
        this.hitArea.on("pointerdown", (pointer) => {
          console.log(
            `Engineer clicked at (${this.sprite.x}, ${this.sprite.y})`
          );

          // Select this unit
          this.select();

          // Notify the scene that this unit was selected
          if (this.scene.onUnitSelected) {
            this.scene.onUnitSelected(this);
          }

          // In Phaser, we don't need stopPropagation
          // Just return false instead to prevent event propagation
          return false;
        });

        console.log("Engineer hit area set up successfully");
      } else {
        console.error("Cannot set up engineer events: hit area is null");
      }
    } catch (error) {
      console.error("Error setting up engineer events:", error);
    }

    // Make sure we don't interfere with the Mobile's map click handler
    // The Mobile.setupEvents already handles map clicks for movement

    console.log("Builder events initialized");
  }

  /**
   * Find a blueprint to build
   * @returns {Object|null} Object containing blueprint and distance, or null if none found
   */
  findNearbyBlueprint() {
    if (!this.scene.buildings) return null;

    // Find blueprints owned by this builder's owner that don't have max builders
    const blueprints = this.scene.buildings.filter(
      (building) =>
        building.isBlueprint &&
        building.owner &&
        this.owner &&
        building.owner.id === this.owner.id &&
        building.assignedBuilders.length < building.maxBuilders
    );

    if (blueprints.length === 0) return null;

    // Find the closest blueprint
    let closestBlueprint = null;
    let closestDistance = Number.MAX_VALUE;

    for (const blueprint of blueprints) {
      const distance = Math.sqrt(
        Math.pow(blueprint.x - this.sprite.x, 2) +
          Math.pow(blueprint.y - this.sprite.y, 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestBlueprint = blueprint;
      }
    }

    return { blueprint: closestBlueprint, distance: closestDistance };
  }

  /**
   * Start building a blueprint
   * @param {Building} blueprint - The blueprint to build
   */
  startBuilding(blueprint) {
    // Check if the blueprint can accept another builder
    if (!blueprint.assignBuilder(this)) {
      console.log(
        "Blueprint can't accept more builders or already has this builder"
      );
      return;
    }

    this.isBuilding = true;
    this.targetBlueprint = blueprint;

    // Move to blueprint if not already there
    const distance = Math.sqrt(
      Math.pow(blueprint.x - this.sprite.x, 2) +
        Math.pow(blueprint.y - this.sprite.y, 2)
    );

    if (distance > 50) {
      // Path to the blueprint
      this.handleMovementToPoint(blueprint.x, blueprint.y);
    }
  }

  /**
   * Stop building current blueprint
   */
  stopBuilding() {
    // Remove this builder from the blueprint's assigned builders
    if (this.targetBlueprint) {
      this.targetBlueprint.removeBuilder(this);
    }

    this.isBuilding = false;
    this.targetBlueprint = null;
  }

  /**
   * External command to build a specific blueprint
   * @param {Building} blueprint - The blueprint to build
   */
  assignToBlueprint(blueprint) {
    this.stopBuilding();
    this.startBuilding(blueprint);
  }

  /**
   * Check if near enough to build
   * @returns {boolean} True if near blueprint, false otherwise
   */
  isNearBlueprint() {
    if (!this.targetBlueprint) return false;

    const distance = Math.sqrt(
      Math.pow(this.targetBlueprint.x - this.sprite.x, 2) +
        Math.pow(this.targetBlueprint.y - this.sprite.y, 2)
    );

    return distance < 50; // Building distance threshold
  }

  /**
   * Update method called every frame
   * Override parent update method
   */
  update() {
    super.update();

    // Handle building logic
    if (this.isBuilding && this.targetBlueprint) {
      // If we're near the blueprint, build it
      if (this.isNearBlueprint()) {
        // If we're moving, stop
        if (this.isMoving) {
          this.isMoving = false;
          this.currentPath = [];
          if (this.pathVisualizer) {
            this.pathVisualizer.clear();
          }
        }

        // Update building progress on the blueprint (with this builder as contributor)
        this.targetBlueprint.updateBuildProgress(null, this);
      } else if (!this.isMoving) {
        // If we're not near the blueprint and not moving, move to it
        this.handleMovementToPoint(
          this.targetBlueprint.x,
          this.targetBlueprint.y
        );
      }
    } else if (!this.isBuilding && !this.isSelected) {
      // If we're not building and not selected, look for blueprints to build automatically
      const nearbyResult = this.findNearbyBlueprint();
      if (nearbyResult && nearbyResult.blueprint) {
        this.startBuilding(nearbyResult.blueprint);
      }
    }
  }

  /**
   * Clean up resources
   * Override parent destroy method
   */
  destroy() {
    // Make sure we're removed from any blueprint we were working on
    this.stopBuilding();

    super.destroy();
  }
}

// Export a Builder class that extends Engineer for backward compatibility
export class Builder extends Engineer {
  constructor(scene, props = {}, x = 0, y = 0) {
    super(scene, props, x, y);
    console.log("Builder created (Engineer alias)");
  }
}

export default Engineer;
 