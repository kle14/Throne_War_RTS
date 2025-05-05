import { Mobile } from "../base/mobile.js";
import { CONSTANTS } from "../../config/constants.js";

/**
 * Character - Base class for all character units
 * This class extends Mobile and adds character-specific functionalities
 */
export class Character extends Mobile {
  /**
   * Constructor for the Character class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    console.log("Character constructor called with:", x, y);
    try {
      super(scene, props, x, y);
      console.log("Character: Mobile constructor completed");

      // Character specific properties
      this.type = props.type || "character";
      this.moveSpeed = props.moveSpeed || CONSTANTS.MOVEMENT.SOLDIER_SPEED;
      this.health = props.health || 100;
      this.maxHealth = props.maxHealth || 100;
      this.attackRange = props.attackRange || 1;
      this.attackDamage = props.attackDamage || 10;
      this.attackSpeed = props.attackSpeed || 1;

      // Animation state
      this.currentAnimation = "idle";
      console.log("Character constructor completed successfully");
    } catch (error) {
      console.error("Error in Character constructor:", error);
      throw error; // Re-throw to see the specific error
    }
  }

  /**
   * Update rotation based on movement direction
   * Characters have special rotation logic
   */
  updateRotation(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      // Calculate the proper angle based on movement direction
      // Add PI/2 (90 degrees) to make characters face the direction they're moving
      // This adjustment ensures the "front" of the character points in the movement direction
      const angle = Math.atan2(dy, dx) + Math.PI / 2;

      // Apply rotation to the sprite
      this.sprite.rotation = angle;

      // Update animation based on movement
      this.updateMovementAnimation(angle);
    }
  }

  /**
   * Update animation based on movement direction
   * @param {number} angle - Movement angle in radians
   */
  updateMovementAnimation(angle) {
    // This is a placeholder - subclasses should implement this
    // to set appropriate animations based on direction
    this.currentAnimation = "move";
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
      // Face the target - add PI/2 to properly orient the character toward the target
      this.sprite.rotation = Math.atan2(dy, dx) + Math.PI / 2;

      // Deal damage to target
      if (target.takeDamage) {
        target.takeDamage(this.attackDamage, this);
      }

      // Set animation to attack
      this.currentAnimation = "attack";
    }
  }

  /**
   * Take damage from an attack
   * @param {number} amount - Amount of damage to take
   * @param {Entity} source - Source of the damage
   */
  takeDamage(amount, source) {
    this.health = Math.max(0, this.health - amount);

    // If health reaches 0, die
    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Handle death of the character
   */
  die() {
    // Play death animation
    this.currentAnimation = "die";

    // Remove from game after animation completes
    setTimeout(() => {
      this.destroy();
    }, 1000); // Assuming 1 second death animation
  }
}

export default Character;
