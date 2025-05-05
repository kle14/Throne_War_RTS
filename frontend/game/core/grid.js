import { CONSTANTS } from "../config/constants.js";
import eventBus from "./event-bus.js";

/**
 * Grid - Manages the hexagonal grid for the game
 * Handles grid creation, coordinates, pathfinding, and hex operations
 */
class Grid {
  constructor() {
    this.hexSize = CONSTANTS.GRID.HEX_SIZE;
    this.gridWidth = CONSTANTS.GRID.WIDTH;
    this.gridHeight = CONSTANTS.GRID.HEIGHT;
    this.hexes = [];
    this.scene = null;

    // Offset for axial to pixel conversion
    this.offsetX = 0;
    this.offsetY = 0;

    // Grid graphics
    this.gridGraphics = null;

    // Pathfinding properties
    this.blockedHexes = new Set();
  }

  /**
   * Initialize the grid with a game scene
   * @param {Phaser.Scene} scene - The game scene
   * @param {number} offsetX - X offset for the grid placement
   * @param {number} offsetY - Y offset for the grid placement
   */
  init(scene, offsetX = 0, offsetY = 0) {
    this.scene = scene;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // Create grid graphics container
    this.gridGraphics = scene.add.graphics();

    // Store grid in scene for easy access
    scene.grid = this;

    return this;
  }

  /**
   * Create the grid based on configuration
   * @param {Object} config - Grid configuration
   */
  createGrid(config = {}) {
    // Clear any existing hexes
    this.hexes = [];
    this.blockedHexes.clear();

    const width = config.width || this.gridWidth;
    const height = config.height || this.gridHeight;

    // Create the grid of hexes
    for (let q = 0; q < width; q++) {
      for (let r = 0; r < height; r++) {
        // Using axial coordinates (q, r)
        // The third coordinate s can be derived: s = -q - r
        const hex = {
          q: q,
          r: r,
          s: -q - r,
          type: "grass", // Default type
          blocked: false,
          entities: [],
        };

        // Add pixel coordinates
        const pixelCoords = this.hexToPixel(hex);
        hex.x = pixelCoords.x;
        hex.y = pixelCoords.y;

        this.hexes.push(hex);
      }
    }

    // Draw the grid
    this.drawGrid();

    // Emit event that grid is created
    eventBus.emit("gridCreated", { grid: this });

    return this;
  }

  /**
   * Draw the hexagonal grid
   */
  drawGrid() {
    if (!this.gridGraphics) return;

    this.gridGraphics.clear();

    // Draw each hex
    this.hexes.forEach((hex) => {
      // Set line style
      this.gridGraphics.lineStyle(1, 0xcccccc, 0.3);

      // Draw the hexagon
      const corners = this.getHexCorners(hex);
      this.gridGraphics.beginPath();

      // Move to first corner
      this.gridGraphics.moveTo(corners[5].x, corners[5].y);

      // Draw lines to each corner
      for (let i = 0; i < 6; i++) {
        this.gridGraphics.lineTo(corners[i].x, corners[i].y);
      }

      this.gridGraphics.closePath();
      this.gridGraphics.strokePath();
    });
  }

  /**
   * Get the corners of a hexagon for drawing
   * @param {Object} hex - The hex to get corners for
   * @returns {Array} Array of corner points
   */
  getHexCorners(hex) {
    const corners = [];
    const center = { x: hex.x, y: hex.y };

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      corners.push({
        x: center.x + this.hexSize * Math.cos(angle),
        y: center.y + this.hexSize * Math.sin(angle),
      });
    }

    return corners;
  }

  /**
   * Get all neighboring hexes for a given hex
   * @param {Object} hex - The hex to find neighbors for
   * @returns {Array} Array of neighboring hexes
   */
  getNeighbors(hex) {
    // The 6 directions in axial coordinates
    const directions = [
      { q: 1, r: 0 }, // East
      { q: 1, r: -1 }, // Northeast
      { q: 0, r: -1 }, // Northwest
      { q: -1, r: 0 }, // West
      { q: -1, r: 1 }, // Southwest
      { q: 0, r: 1 }, // Southeast
    ];

    const neighbors = [];

    for (const dir of directions) {
      const neighborCoord = { q: hex.q + dir.q, r: hex.r + dir.r };
      const neighbor = this.getHexAt(neighborCoord.q, neighborCoord.r);

      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * Convert hex coordinates to pixel coordinates
   * @param {Object} hex - The hex with q, r coordinates
   * @returns {Object} Pixel coordinates { x, y }
   */
  hexToPixel(hex) {
    // Using pointy-top orientation
    const x =
      this.hexSize * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r) +
      this.offsetX;
    const y = this.hexSize * ((3 / 2) * hex.r) + this.offsetY;

    return { x, y };
  }

  /**
   * Convert pixel coordinates to the nearest hex
   * @param {number} x - X pixel coordinate
   * @param {number} y - Y pixel coordinate
   * @returns {Object} Nearest hex or null if outside grid
   */
  pixelToHex(x, y) {
    // Adjust for offset
    x = x - this.offsetX;
    y = y - this.offsetY;

    // Using pointy-top orientation
    const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / this.hexSize;
    const r = ((2 / 3) * y) / this.hexSize;

    return this.roundToHex(q, r);
  }

  /**
   * Round floating point coordinates to the nearest hex
   * @param {number} q - Floating point q coordinate
   * @param {number} r - Floating point r coordinate
   * @returns {Object} Nearest hex or null if outside grid
   */
  roundToHex(q, r) {
    let s = -q - r;

    // Round coordinates
    let roundQ = Math.round(q);
    let roundR = Math.round(r);
    let roundS = Math.round(s);

    // Calculate differences
    const qDiff = Math.abs(roundQ - q);
    const rDiff = Math.abs(roundR - r);
    const sDiff = Math.abs(roundS - s);

    // Adjust to ensure q + r + s = 0
    if (qDiff > rDiff && qDiff > sDiff) {
      roundQ = -roundR - roundS;
    } else if (rDiff > sDiff) {
      roundR = -roundQ - roundS;
    } else {
      roundS = -roundQ - roundR;
    }

    // Find the hex with these coordinates
    return this.getHexAt(roundQ, roundR);
  }

  /**
   * Get a hex at specific q, r coordinates
   * @param {number} q - Q coordinate
   * @param {number} r - R coordinate
   * @returns {Object} The hex or null if not found
   */
  getHexAt(q, r) {
    return this.hexes.find((hex) => hex.q === q && hex.r === r) || null;
  }

  /**
   * Get a hex at specific pixel coordinates
   * @param {number} x - X pixel coordinate
   * @param {number} y - Y pixel coordinate
   * @returns {Object} The hex or null if not found
   */
  getHexAtPixel(x, y) {
    return this.pixelToHex(x, y);
  }

  /**
   * Calculate the distance between two hexes
   * @param {Object} hexA - First hex
   * @param {Object} hexB - Second hex
   * @returns {number} Distance in hex units
   */
  getDistance(hexA, hexB) {
    return Math.max(
      Math.abs(hexA.q - hexB.q),
      Math.abs(hexA.r - hexB.r),
      Math.abs(hexA.s - hexB.s)
    );
  }

  /**
   * Mark a hex as blocked for pathfinding
   * @param {Object} hex - The hex to mark
   * @param {boolean} blocked - Whether it's blocked or not
   */
  setBlocked(hex, blocked = true) {
    if (!hex) return;

    hex.blocked = blocked;

    if (blocked) {
      this.blockedHexes.add(`${hex.q},${hex.r}`);
    } else {
      this.blockedHexes.delete(`${hex.q},${hex.r}`);
    }
  }

  /**
   * Check if a hex is blocked
   * @param {Object} hex - The hex to check
   * @returns {boolean} True if blocked
   */
  isBlocked(hex) {
    if (!hex) return true;
    return hex.blocked || this.blockedHexes.has(`${hex.q},${hex.r}`);
  }

  /**
   * Find a path between two hexes (A* pathfinding)
   * @param {Object} startHex - Starting hex
   * @param {Object} endHex - Destination hex
   * @returns {Array} Array of hexes forming the path, or empty if no path
   */
  findPath(startHex, endHex) {
    if (!startHex || !endHex || this.isBlocked(endHex)) {
      return [];
    }

    if (startHex === endHex) {
      return [startHex];
    }

    // A* pathfinding
    const openSet = new Set();
    const closedSet = new Set();
    const cameFrom = new Map();

    // Cost maps
    const gScore = new Map();
    const fScore = new Map();

    // Helper for creating hex keys
    const hexKey = (hex) => `${hex.q},${hex.r}`;

    // Initialize
    openSet.add(startHex);
    gScore.set(hexKey(startHex), 0);
    fScore.set(hexKey(startHex), this.getDistance(startHex, endHex));

    while (openSet.size > 0) {
      // Find hex with lowest fScore
      let current = null;
      let lowestFScore = Infinity;

      for (const hex of openSet) {
        const score = fScore.get(hexKey(hex));
        if (score < lowestFScore) {
          lowestFScore = score;
          current = hex;
        }
      }

      // If we've reached the end, reconstruct and return the path
      if (current === endHex) {
        const path = [current];
        while (cameFrom.has(hexKey(current))) {
          current = cameFrom.get(hexKey(current));
          path.unshift(current);
        }
        return path;
      }

      // Move current hex from open to closed set
      openSet.delete(current);
      closedSet.add(current);

      // Check all neighbors
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        // Skip if closed or blocked
        if (closedSet.has(neighbor) || this.isBlocked(neighbor)) {
          continue;
        }

        // Calculate tentative gScore
        const tentativeGScore = gScore.get(hexKey(current)) + 1;

        // If neighbor is not in open set, add it
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
        // If this path to neighbor is not better, skip
        else if (
          tentativeGScore >= (gScore.get(hexKey(neighbor)) || Infinity)
        ) {
          continue;
        }

        // This path is best so far, record it
        cameFrom.set(hexKey(neighbor), current);
        gScore.set(hexKey(neighbor), tentativeGScore);
        fScore.set(
          hexKey(neighbor),
          tentativeGScore + this.getDistance(neighbor, endHex)
        );
      }
    }

    // No path found
    return [];
  }

  /**
   * Add an entity to a hex
   * @param {Object} entity - The entity to add
   * @param {Object} hex - The hex to add to
   */
  addEntityToHex(entity, hex) {
    if (!hex || !entity) return;

    // Remove from current hex if any
    this.removeEntityFromCurrentHex(entity);

    // Add to new hex
    hex.entities.push(entity);
    entity.currentHex = hex;

    // Check if we need to block this hex
    if (entity.blocksHex) {
      this.setBlocked(hex, true);
    }
  }

  /**
   * Remove an entity from its current hex
   * @param {Object} entity - The entity to remove
   */
  removeEntityFromCurrentHex(entity) {
    if (!entity || !entity.currentHex) return;

    const hex = entity.currentHex;

    // Remove entity from hex's entity list
    const index = hex.entities.indexOf(entity);
    if (index !== -1) {
      hex.entities.splice(index, 1);
    }

    // Unblock hex if it was blocked by this entity
    if (entity.blocksHex && hex.entities.every((e) => !e.blocksHex)) {
      this.setBlocked(hex, false);
    }

    // Clear reference
    entity.currentHex = null;
  }

  /**
   * Clean up resources when shutting down
   */
  destroy() {
    if (this.gridGraphics) {
      this.gridGraphics.destroy();
      this.gridGraphics = null;
    }

    this.hexes = [];
    this.blockedHexes.clear();
    this.scene = null;
  }
}

// Create a singleton instance
const grid = new Grid();

export default grid;
