import { Mobile } from "../base/mobile.js";
import { CONSTANTS } from "../../config/constants.js";

/**
 * Vehicle - Base class for all vehicle units
 * This class extends Mobile and adds vehicle-specific functionalities
 */
export class Vehicle extends Mobile {
  /**
   * Constructor for the Vehicle class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    super(scene, props, x, y);

    // Vehicle specific properties
    this.type = props.type || "vehicle";
    this.moveSpeed = props.moveSpeed || CONSTANTS.MOVEMENT.TANK_SPEED;
    this.health = props.health || 200;
    this.maxHealth = props.maxHealth || 200;
    this.armor = props.armor || 50;
    this.attackRange = props.attackRange || 4;
    this.attackDamage = props.attackDamage || 25;
    this.attackSpeed = props.attackSpeed || 0.5;

    // Turret properties (for vehicles with separate turrets)
    this.hasTurret = props.hasTurret || false;
    this.turretSprite = null;
    this.turretAngle = 0;
  }

  /**
   * Set up turret sprite if this vehicle has a turret
   * @param {string} spriteKey - Sprite key for the turret
   */
  setupTurret(spriteKey) {
    if (!this.hasTurret) return;

    // Make sure the scene exists before trying to create sprites
    if (!this.scene) return;

    try {
      this.turretSprite = this.scene.add.sprite(0, 0, spriteKey);
      this.turretSprite.setOrigin(0.5);
      this.turretSprite.setDepth(11); // Higher than vehicle body

      // Set initial position to match vehicle
      if (this.sprite) {
        this.turretSprite.x = this.sprite.x;
        this.turretSprite.y = this.sprite.y;
      }
    } catch (error) {
      console.error("Error setting up turret sprite:", error);
    }
  }

  /**
   * Update rotation based on movement direction
   * Vehicles have special rotation logic, including turret rotation
   */
  updateRotation(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      // Body rotation - smooth turning
      const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
      const currentAngle = this.sprite.rotation;

      // Gradually rotate towards target angle
      let angleDiff = targetAngle - currentAngle;

      // Normalize to -PI to PI
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Rotate with limited speed
      const rotationSpeed = 0.05;
      if (Math.abs(angleDiff) > rotationSpeed) {
        this.sprite.rotation += Math.sign(angleDiff) * rotationSpeed;
      } else {
        this.sprite.rotation = targetAngle;
      }
    }

    // Update turret position
    this.updateTurretPosition();
  }

  /**
   * Update turret position to match vehicle position
   */
  updateTurretPosition() {
    if (this.hasTurret && this.turretSprite && this.sprite) {
      this.turretSprite.x = this.sprite.x;
      this.turretSprite.y = this.sprite.y;
    }
  }

  /**
   * Point turret at target
   * @param {number} x - X coordinate to point at
   * @param {number} y - Y coordinate to point at
   */
  aimTurret(x, y) {
    if (!this.hasTurret || !this.turretSprite) return;

    const dx = x - this.turretSprite.x;
    const dy = y - this.turretSprite.y;

    this.turretAngle = Math.atan2(dy, dx);
    this.turretSprite.rotation = this.turretAngle;
  }

  /**
   * Attack a target entity
   * @param {Entity} target - The entity to attack
   */
  attack(target) {
    if (!target) return;

    // Calculate distance to target
    const dx = target.sprite.x - this.sprite.x;
    const dy = target.sprite.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if target is in range
    if (distance <= this.attackRange * CONSTANTS.HEX_SIZE) {
      // For vehicles with turrets, aim at target
      if (this.hasTurret && this.turretSprite) {
        this.aimTurret(target.sprite.x, target.sprite.y);
      } else {
        // For vehicles without turrets, face the target
        this.sprite.rotation = Math.atan2(dy, dx) + Math.PI / 2;
      }

      // Deal damage to target
      if (target.takeDamage) {
        target.takeDamage(this.attackDamage, this);
      }
    }
  }

  /**
   * Take damage from an attack, reduced by armor
   * @param {number} amount - Amount of damage to take
   * @param {Entity} source - Source of the damage
   */
  takeDamage(amount, source) {
    // Reduce damage by armor (armor provides percentage-based damage reduction)
    const damageReduction = this.armor / 100;
    const actualDamage = amount * (1 - damageReduction);

    this.health = Math.max(0, this.health - actualDamage);

    // If health reaches 0, destroy vehicle
    if (this.health <= 0) {
      this.destroy();
    }
  }

  /**
   * Update method called every frame
   */
  update() {
    super.update();

    // Keep turret aligned with vehicle body when moving
    this.updateTurretPosition();
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.turretSprite) {
      this.turretSprite.destroy();
    }

    super.destroy();
  }
}

export default Vehicle;
