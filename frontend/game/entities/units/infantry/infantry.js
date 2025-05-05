import { Character } from "../character.js";
import { CONSTANTS } from "../../../config/constants.js";

/**
 * Infantry - Standard infantry unit
 * This class extends Character and implements infantry-specific functionality
 */
export class Infantry extends Character {
  /**
   * Constructor for the Infantry class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    // Merge default infantry props with provided props
    const infantryProps = {
      moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED,
      bodyRadius: 10,
      type: "infantry",
      ...props,
    };

    super(scene, infantryProps, x, y);

    // Ensure the hit area is interactive
    if (this.hitArea) {
      this.hitArea.setInteractive();
    }
  }

  /**
   * Draw the infantry character
   * Override parent draw method
   */
  draw() {
    // Clear previous graphics
    this.sprite.clear();

    // Re-add shadow beneath the character
    this.sprite.fillStyle(
      CONSTANTS.CHARACTER.SHADOW.COLOR,
      CONSTANTS.CHARACTER.SHADOW.OPACITY
    );
    this.sprite.fillCircle(1, 1, this.bodyRadius + 2);

    // Draw the infantry's body (main circle)
    this.sprite.fillStyle(0x556b2f, 1); // Olive green
    this.sprite.fillCircle(0, 0, this.bodyRadius);

    // Draw the helmet (smaller inner circle)
    this.sprite.fillStyle(0x3a5f0b, 1); // Darker green
    this.sprite.fillCircle(0, 0, this.bodyRadius * 0.65);

    // Draw arms as lines
    this.sprite.lineStyle(3, CONSTANTS.CHARACTER.SKIN_TONE[0], 1); // Width 3, skin tone, full opacity
    this.sprite.beginPath();
    this.sprite.moveTo(-7.5, -2.5);
    this.sprite.lineTo(2.5, -17.5);
    this.sprite.strokePath();

    this.sprite.beginPath();
    this.sprite.moveTo(7.5, -5);
    this.sprite.lineTo(2.5, -10);
    this.sprite.strokePath();

    // Draw helmet detail
    this.sprite.fillStyle(0x6b8e23, 1); // Olive drab highlight
    this.sprite.fillCircle(0, -2.5, 2);

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
  }
}

export default Infantry;
