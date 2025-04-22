class Builder extends Base_Character {
  constructor(scene, x, y) {
    super(
      scene,
      {
        type: "builder",
        bodyRadius: 12,
        moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED * 0.8, // Builders are slightly slower than soldiers
        color: 0xf4a460, // SandyBrown color for builders
        cost: 100, // Cost to create additional builders
      },
      x,
      y
    );

    // Builder-specific properties
    this.isBuilding = false;
    this.targetBlueprint = null;
    this.buildingProgress = 0;
    this.buildRate = 0.03; // Reduced to 3% progress per second to make multiple builders valuable

    // Create builder visuals
    this.createBuilderVisuals();

    // Setup builder-specific events
    this.setupBuilderEvents();
  }

  createBuilderVisuals() {
    // Add a hardhat or tool visuals to differentiate from regular units
    this.hardhat = this.scene.add.graphics();
    this.hardhat.fillStyle(0xffff00, 1); // Yellow hardhat
    this.hardhat.fillCircle(0, -5, 7);
    this.hardhat.x = this.sprite.x;
    this.hardhat.y = this.sprite.y;
  }

  setupBuilderEvents() {
    // Add any builder-specific event handlers here
  }

  // Find a blueprint to build
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

  // Start building a blueprint
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

  // Stop building current blueprint
  stopBuilding() {
    // Remove this builder from the blueprint's assigned builders
    if (this.targetBlueprint) {
      this.targetBlueprint.removeBuilder(this);
    }

    this.isBuilding = false;
    this.targetBlueprint = null;
  }

  // External command to build a specific blueprint
  assignToBlueprint(blueprint) {
    this.stopBuilding();
    this.startBuilding(blueprint);
  }

  // Check if near enough to build
  isNearBlueprint() {
    if (!this.targetBlueprint) return false;

    const distance = Math.sqrt(
      Math.pow(this.targetBlueprint.x - this.sprite.x, 2) +
        Math.pow(this.targetBlueprint.y - this.sprite.y, 2)
    );

    return distance < 50; // Building distance threshold
  }

  // Update function override to include building logic
  update() {
    super.update();

    // Update hat position
    if (this.hardhat) {
      this.hardhat.x = this.sprite.x;
      this.hardhat.y = this.sprite.y;
    }

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

  // Clean up resources
  destroy() {
    // Make sure we're removed from any blueprint we were working on
    this.stopBuilding();

    super.destroy();
    if (this.hardhat) {
      this.hardhat.destroy();
    }
  }
}
