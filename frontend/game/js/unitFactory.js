/**
 * UnitFactory class - Handles the creation of game units
 * This factory simplifies the process of creating different types of units
 * and managing their placement on the game grid
 */
class UnitFactory {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Create a unit of the specified type at a valid position
   * @param {Class} UnitClass - The class of the unit to create (Tank, Soldier, etc.)
   * @param {Object} options - Options for unit creation
   * @param {Array} options.validTiles - Array of valid hex tiles for placement
   * @param {Object} options.position - Optional specific position {x, y} or {tileIndex}
   * @param {Object} options.unitProps - Additional properties to pass to the unit constructor
   * @returns {Object} - The created unit instance
   */
  createUnit(UnitClass, options = {}) {
    const { validTiles = [], position = null, unitProps = {} } = options;

    // Check if we have valid tiles for placement
    if (validTiles.length === 0) {
      console.error(`No valid tiles provided for ${UnitClass.name} placement`);
      return null;
    }

    // Determine the position for the unit
    let x, y, tile;

    if (position) {
      // Use specified position if provided
      if (position.hasOwnProperty("x") && position.hasOwnProperty("y")) {
        // Direct x,y coordinates
        x = position.x;
        y = position.y;
        // Find closest tile for reference
        tile = this.findClosestTile(validTiles, x, y);
      } else if (position.hasOwnProperty("tileIndex")) {
        // Specific tile index
        if (position.tileIndex >= 0 && position.tileIndex < validTiles.length) {
          tile = validTiles[position.tileIndex];
          x = tile.x;
          y = tile.y;
        } else {
          console.error(`Invalid tile index: ${position.tileIndex}`);
          return null;
        }
      }
    } else {
      // Random position from valid tiles
      const randomIndex = Math.floor(Math.random() * validTiles.length);
      tile = validTiles[randomIndex];
      x = tile.x;
      y = tile.y;
    }

    // Add slight randomness to avoid direct overlaps
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;

    // Create the unit
    const unit = new UnitClass(this.scene, x + offsetX, y + offsetY, unitProps);

    // Set up event handlers
    if (typeof unit.setupEvents === "function") {
      unit.setupEvents();
    }

    console.log(`Created ${UnitClass.name} at position:`, x, y);

    return unit;
  }

  /**
   * Create multiple units of the specified type
   * @param {Class} UnitClass - The class of units to create
   * @param {Number} count - Number of units to create
   * @param {Object} options - Same options as createUnit method
   * @returns {Array} - Array of created unit instances
   */
  createMultipleUnits(UnitClass, count, options = {}) {
    const units = [];
    const { validTiles = [] } = options;

    // Clone the valid tiles array to avoid modifying the original
    const availableTiles = [...validTiles];

    for (let i = 0; i < count; i++) {
      // For each unit, use the remaining available tiles
      const unitOptions = { ...options, validTiles: availableTiles };

      const unit = this.createUnit(UnitClass, unitOptions);
      if (unit) {
        units.push(unit);

        // Optionally remove the used tile from available tiles to prevent overlap
        if (options.preventOverlap && unit.currentHex) {
          const index = availableTiles.findIndex(
            (tile) =>
              tile.gridPos.row === unit.currentHex.gridPos.row &&
              tile.gridPos.col === unit.currentHex.gridPos.col
          );
          if (index !== -1) {
            availableTiles.splice(index, 1);
          }
        }
      }
    }

    return units;
  }

  /**
   * Find the closest tile to the specified coordinates
   * @param {Array} tiles - Array of tiles to search
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   * @returns {Object} - The closest tile
   */
  findClosestTile(tiles, x, y) {
    let closestTile = null;
    let closestDistance = Number.MAX_VALUE;

    for (const tile of tiles) {
      const distance = Math.sqrt(
        Math.pow(tile.x - x, 2) + Math.pow(tile.y - y, 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestTile = tile;
      }
    }

    return closestTile;
  }

  // Create a builder unit
  createBuilder(options = {}) {
    const validTiles =
      options.validTiles ||
      this.scene.hexTiles.filter((hex) => hex.color === CONSTANTS.COLORS.GRASS);

    if (validTiles.length === 0) {
      console.error("No valid tiles found to place builder!");
      return null;
    }

    let tileIndex = 0;

    // Use provided position if available
    if (options.position) {
      if (options.position.tileIndex !== undefined) {
        tileIndex = options.position.tileIndex;
      }
    } else {
      // Otherwise, pick a random position
      tileIndex = Math.floor(Math.random() * validTiles.length);
    }

    // Get the chosen tile
    const chosenTile = validTiles[tileIndex % validTiles.length];

    // Create the builder at the tile position
    const builder = new Builder(this.scene, chosenTile.x, chosenTile.y);

    // Set up event handlers
    if (typeof builder.setupEvents === "function") {
      builder.setupEvents();
    }

    console.log(`Created Builder at position:`, chosenTile.x, chosenTile.y);

    return builder;
  }
}

// Export the UnitFactory class
if (typeof module !== "undefined") {
  module.exports = { UnitFactory };
}
