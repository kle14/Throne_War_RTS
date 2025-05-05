import { Vehicle } from "../vehicle.js";
import { CONSTANTS } from "../../../config/constants.js";

/**
 * Tank - Armored land vehicle with heavy firepower
 * This class extends Vehicle and implements tank-specific functionality
 */
export class Tank extends Vehicle {
  /**
   * Constructor for the Tank class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    // Merge default tank props with provided props
    const tankProps = {
      moveSpeed: CONSTANTS.MOVEMENT.TANK_SPEED,
      bodyRadius: 25,
      type: "tank",
      ...props,
    };

    super(scene, tankProps, x, y);

    // Create tank sprite
    this.sprite = scene.add.graphics();
    this.sprite.setPosition(x, y);
    this.sprite.setDepth(10); // Set a higher depth to appear above path lines

    // Create a hit area for the tank
    this.hitArea = scene.add.circle(x, y, 25);
    this.hitArea.setStrokeStyle(1, 0xffff00, 0.0); // Invisible stroke
    this.hitArea.setInteractive();

    // Draw the tank's appearance
    this.draw();

    console.log("Tank created at position", x, y);
  }

  /**
   * Draw the tank
   * Override parent draw method
   */
  draw() {
    // Clear previous graphics
    this.sprite.clear();

    // Tank body
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
  }

  /**
   * Check if a hex is a valid movement target
   * Override parent method for tank-specific validation
   * @param {Object} hex - The hex tile to check
   * @returns {boolean} True if valid, false otherwise
   */
  isValidMovementTarget(hex) {
    return hex && hex.color === CONSTANTS.COLORS.GRASS;
  }

  /**
   * Check if a hex is a valid tile for pathfinding
   * Override parent method for tank-specific validation
   * @param {Object} hex - The hex tile to check
   * @returns {boolean} True if valid, false otherwise
   */
  isValidMovementTile(hex) {
    return hex && hex.color === CONSTANTS.COLORS.GRASS;
  }

  /**
   * Update rotation based on movement direction
   * Override parent method for tank-specific rotation
   * @param {number} dx - X movement delta
   * @param {number} dy - Y movement delta
   */
  updateRotation(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      const angle = Math.atan2(dy, dx) + Math.PI / 2; // Add 90 degrees for proper orientation
      this.sprite.rotation = angle;
    }
  }
}

export default Tank;
