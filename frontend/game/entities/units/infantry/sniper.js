import { Character } from "../character.js";
import { CONSTANTS } from "../../../config/constants.js";

/**
 * Sniper - Long-range specialized infantry unit
 * This class extends Character and implements sniper-specific functionality
 */
export class Sniper extends Character {
  /**
   * Constructor for the Sniper class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    // Merge default sniper props with provided props
    const sniperProps = {
      moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED * 0.95,
      bodyRadius: 9,
      type: "sniper",
      ...props,
    };

    super(scene, sniperProps, x, y);
    // ghillie strands are lazily created in draw()
    this.ghillie = null;
  }

  /**
   * Draw the sniper character
   * Override parent draw method
   */
  draw() {
    /* ---------- one‑time ghillie (3 tiny top strands) ---------- */
    if (!this.ghillie) {
      // Fixed positions on the top half of the helmet at -135°, -90°, and -45°
      this.ghillie = [
        { angle: Phaser.Math.DegToRad(-130), len: 4 },
        { angle: Phaser.Math.DegToRad(-80), len: 4 },
        { angle: Phaser.Math.DegToRad(-40), len: 4 },
      ];
    }

    /* ---------- sprite drawing ---------- */
    const r = this.bodyRadius;
    this.sprite.clear();

    // Shadow
    this.sprite.fillStyle(
      CONSTANTS.CHARACTER.SHADOW.COLOR,
      CONSTANTS.CHARACTER.SHADOW.OPACITY
    );
    this.sprite.fillCircle(1, 1, r + 2);

    // Body with outline - olive green like infantry
    this.sprite.fillStyle(0x556b2f, 1); // Olive green
    this.sprite.beginPath();
    this.sprite.arc(0, 0, r, 0, Math.PI * 2);
    this.sprite.closePath();
    this.sprite.fill();
    this.sprite.strokePath();

    // Helmet
    this.sprite.fillStyle(0x38431e, 1); // Dark olive green
    this.sprite.fillCircle(0, 0, r * 0.65);

    // Calculate helmet radius for later use with ghillie strands
    const helmetRadius = r * 0.65;

    // Arms
    this.sprite.lineStyle(3, CONSTANTS.CHARACTER.SKIN_TONE[0], 1);
    this.sprite.beginPath(); // left
    this.sprite.moveTo(-6, -1);
    this.sprite.lineTo(1, -15);
    this.sprite.strokePath();
    this.sprite.beginPath(); // right
    this.sprite.moveTo(6, -3);
    this.sprite.lineTo(1, -8);
    this.sprite.strokePath();

    // Sniper rifle
    this.sprite.lineStyle(3, 0x2c2c2c, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(1, -28);
    this.sprite.lineTo(1, -6);
    this.sprite.strokePath();

    // Muzzle brake
    this.sprite.lineStyle(2, 0x3a3a3a, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(1, -33);
    this.sprite.lineTo(1, -28);
    this.sprite.strokePath();

    // Scope
    this.sprite.fillStyle(0x555555, 1);
    this.sprite.fillRoundedRect(-2, -19, 6, 3, 1);

    // Folded bipod
    this.sprite.lineStyle(2, 0x444444, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(1, -24);
    this.sprite.lineTo(-3, -27);
    this.sprite.moveTo(1, -24);
    this.sprite.lineTo(5, -27);
    this.sprite.strokePath();

    // Ghillie strands (3 small random lines) - moved to after helmet is drawn but before rifle
    this.sprite.lineStyle(1.5, 0x0000, 1);
    for (const { angle, len } of this.ghillie) {
      // Start exactly from the helmet edge
      const x1 = Math.cos(angle) * helmetRadius;
      const y1 = Math.sin(angle) * helmetRadius;
      // Extend outward from the helmet
      const x2 = Math.cos(angle) * (helmetRadius + len);
      const y2 = Math.sin(angle) * (helmetRadius + len);

      this.sprite.beginPath();
      this.sprite.moveTo(x1, y1 + 7);
      this.sprite.lineTo(x2, y2 + 7);
      this.sprite.strokePath();
    }
  }
}

export default Sniper;
