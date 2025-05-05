import { Character } from "../character.js";
import { CONSTANTS } from "../../../config/constants.js";

/**
 * Scout - Fast reconnaissance unit with binoculars
 * This class extends Character and implements scout-specific functionality
 */
export class Scout extends Character {
  /**
   * Constructor for the Scout class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    // Merge default scout props with provided props
    const scoutProps = {
      moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED * 1.2, // Faster than others
      bodyRadius: 10,
      type: "scout",
      ...props,
    };

    super(scene, scoutProps, x, y);
  }

  /**
   * Draw the scout character
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

    // Body (scout uniform - light olive or camo green)
    this.sprite.fillStyle(0x6b8e23, 1); // Olive drab
    this.sprite.fillCircle(0, 0, this.bodyRadius);

    // Helmet (lighter tan or khaki scout cap)
    this.sprite.fillStyle(0xcdc5b4, 1); // Khaki/beige
    this.sprite.fillCircle(0, 0, this.bodyRadius * 0.65);

    // Helmet Glare
    this.sprite.fillStyle(0xffffff, 0.2);
    this.sprite.fillCircle(0, -2.5, 2);

    // === Arms FIRST (under binoculars) ===
    this.sprite.lineStyle(3, CONSTANTS.CHARACTER.SKIN_TONE[0], 1);

    // Left arm (holding left binocular)
    this.sprite.beginPath();
    this.sprite.moveTo(-6.5, -2.5); // Shoulder
    this.sprite.lineTo(-4, -6); // Elbow
    this.sprite.lineTo(-3, -10); // Hand
    this.sprite.strokePath();

    // Right arm (holding right binocular)
    this.sprite.beginPath();
    this.sprite.moveTo(6.5, -2.5); // Shoulder
    this.sprite.lineTo(4, -6); // Elbow
    this.sprite.lineTo(3, -10); // Hand
    this.sprite.strokePath();

    // === Binoculars (drawn LAST to appear on top) ===
    const binoX = 0;
    const binoY = -14;

    // Left lens
    this.sprite.fillStyle(0x333333, 1);
    this.sprite.fillRect(binoX - 5, binoY, 4, 6);

    // Right lens
    this.sprite.fillRect(binoX + 1, binoY, 4, 6);

    // Connecting bar
    this.sprite.fillStyle(0x222222, 1);
    this.sprite.fillRect(binoX - 1, binoY + 1.5, 2, 3);
  }
}

export default Scout;
