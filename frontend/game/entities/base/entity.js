/**
 * Entity - Base class for all game entities
 * This is the foundation for all objects in the game world
 */
export class Entity {
  /**
   * Constructor for the Entity class
   * @param {Phaser.Scene} scene - The scene this entity belongs to
   * @param {Object} props - Properties for this entity
   * @param {Number} x - Initial x position
   * @param {Number} y - Initial y position
   */
  constructor(scene, props = {}, x = 0, y = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.props = props;
    this.type = props.type || "entity";
    this.owner = null;
    this.isSelected = false;
    this.selectionIndicator = null;
  }

  /**
   * Set the owner of this entity
   * @param {Player} player - The player who owns this entity
   */
  setOwner(player) {
    if (!player) return;
    this.owner = player;
  }

  /**
   * Get the owner of this entity
   * @returns {Player} The player who owns this entity
   */
  getOwner() {
    return this.owner;
  }

  /**
   * Check if this entity is owned by the specified player
   * @param {Player} player - The player to check
   * @returns {boolean} True if the entity is owned by the player
   */
  isOwnedBy(player) {
    return this.owner && this.owner.id === player.id;
  }

  /**
   * Update method called every frame
   * Override in subclasses
   */
  update() {
    // Base update - to be overridden
  }

  /**
   * Select this entity
   * Override in subclasses
   */
  select() {
    this.isSelected = true;
  }

  /**
   * Deselect this entity
   * Override in subclasses
   */
  deselect() {
    this.isSelected = false;
  }

  /**
   * Clean up resources
   * Override in subclasses, but call super.destroy()
   */
  destroy() {
    // Base cleanup - to be extended in subclasses
    if (this.selectionIndicator) {
      this.selectionIndicator.destroy();
      this.selectionIndicator = null;
    }
  }

  /**
   * Make this entity clickable
   * Sets up interactivity
   */
  makeClickable() {
    try {
      // Base implementation - most entities will override this
      // or implement it in their specific way
      console.log(`Making ${this.type} clickable`);
    } catch (error) {
      console.error("Error in makeClickable:", error);
    }
  }
}

export default Entity;
 