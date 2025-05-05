import { Entity } from "./entity.js";
import { CONSTANTS } from "../../config/constants.js";

/**
 * StaticEntity - Base class for all non-movable game entities like buildings
 */
export class StaticEntity extends Entity {
  /**
   * Constructor for the StaticEntity class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    super(scene, props, x, y);

    this.type = props.type || "static";
    this.size = props.size || 30;
    this.healthPoints = props.healthPoints || 100;
    this.maxHealthPoints = props.healthPoints || 100;
    this.tooltip = null;
  }

  /**
   * Set the owner of this entity
   * @param {Player} player - The player who owns this entity
   */
  setOwner(player) {
    super.setOwner(player);
  }

  /**
   * Update the entity's color based on the owner
   * Should be implemented in subclasses
   */
  updateEntityColor() {
    // Base implementation - override in subclasses
    // No tinting implementation
  }

  /**
   * Select this entity
   */
  select() {
    super.select();
    this.drawSelectionIndicator();

    // Update tooltip text if it exists
    if (this.tooltip) {
      this.tooltip.setText("Click to deselect");
    }
  }

  /**
   * Deselect this entity
   */
  deselect() {
    super.deselect();
    if (this.selectionIndicator) {
      this.selectionIndicator.setVisible(false);
    }

    // Update tooltip text if it exists
    if (this.tooltip) {
      this.tooltip.setText(`${this.props.name || this.type}\nClick to select`);
    }
  }

  /**
   * Draw selection indicator around the entity
   */
  drawSelectionIndicator() {
    // Clear previous indicator if exists
    if (this.selectionIndicator) {
      this.selectionIndicator.clear();
    } else {
      this.selectionIndicator = this.scene.add.graphics();
    }

    // Draw the selection indicator
    const size = this.size * 1.1;
    this.selectionIndicator.x = this.x;
    this.selectionIndicator.y = this.y;
    this.selectionIndicator.lineStyle(2, 0xffffff, 0.8);
    this.selectionIndicator.strokeCircle(0, 0, size);
    this.selectionIndicator.setVisible(true);
  }

  /**
   * Setup event handlers for this entity
   */
  setupEvents() {
    // Object selection handler
    if (this.hitArea) {
      this.hitArea.on("pointerdown", (pointer) => {
        console.log(this.type + " clicked");
        // If already selected, deselect, otherwise select
        if (this.isSelected) {
          this.deselect();
        } else {
          this.select();
        }

        // Tell the scene this entity was selected
        if (this.scene.onEntitySelected) {
          this.scene.onEntitySelected(this);
        }

        // Prevent event propagation
        pointer.stopPropagation();
      });

      // Add hover tooltip
      this.hitArea.on("pointerover", () => {
        // Create tooltip if it doesn't exist
        if (!this.tooltip) {
          const tooltipText = this.isSelected
            ? "Click to deselect"
            : `${this.props.name || this.type}\nClick to select`;

          this.tooltip = this.scene.add.text(
            this.x,
            this.y - this.size,
            tooltipText,
            {
              fontSize: "10px",
              fill: "#FFFFFF",
              backgroundColor: "#000000",
              padding: { x: 4, y: 2 },
              align: "center",
            }
          );
          this.tooltip.setOrigin(0.5);
          this.tooltip.setDepth(150);
        }
      });

      // Remove tooltip on pointer out
      this.hitArea.on("pointerout", () => {
        if (this.tooltip) {
          this.tooltip.destroy();
          this.tooltip = null;
        }
      });
    }
  }

  /**
   * Get information about this entity
   * @returns {Object} Information object about this entity
   */
  getInfo() {
    return {
      type: this.type,
      name: this.props.name || this.type,
      description: this.props.description || "",
      healthPoints: this.healthPoints,
      maxHealthPoints: this.maxHealthPoints,
      owner: this.owner ? this.owner.name : "None",
    };
  }

  /**
   * Update method called every frame
   */
  update() {
    // Base update - to be overridden
  }

  /**
   * Remove all event listeners
   */
  removeEvents() {
    // Remove hit area pointer events if it exists
    if (this.hitArea) {
      this.hitArea.off("pointerdown");
      this.hitArea.off("pointerover");
      this.hitArea.off("pointerout");
      this.hitArea.disableInteractive();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    super.destroy();
    this.removeEvents();
    if (this.sprite) this.sprite.destroy();
    if (this.hitArea) this.hitArea.destroy();
    if (this.selectionIndicator) this.selectionIndicator.destroy();
    if (this.tooltip) this.tooltip.destroy();
  }
}

export default StaticEntity;
 