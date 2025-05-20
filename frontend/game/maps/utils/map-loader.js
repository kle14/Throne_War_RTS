/**
 * Map Loader Utility
 * Responsible for loading map data and preparing it for use in the game
 */

import { mapRegistry, getMapById } from "../map-registry.js";
import { CONSTANTS } from "../../config/constants.js";
import eventBus from "../../core/event-bus.js";

class MapLoader {
  constructor() {
    // Track the currently active map
    this.activeMapId = null;
  }

  /**
   * Get a list of all available maps
   * @returns {Array} Array of map metadata objects
   */
  getAvailableMaps() {
    const mapList = [];
    Object.values(mapRegistry).forEach((map) => {
      mapList.push({
        id: map.id,
        name: map.name,
        description: map.description,
        author: map.author,
        version: map.version,
      });
    });
    return mapList;
  }

  /**
   * Load a map by its ID and create the game grid
   * @param {String} mapId - ID of the map to load
   * @param {Phaser.Scene} scene - Game scene to create the grid in
   * @returns {Object} Map data if successful, null if failed
   */
  loadMap(mapId, scene) {
    // Default to the default map if no ID specified
    const id = mapId || "default";

    const mapData = getMapById(id);
    if (!mapData) {
      console.error(`Map not found: ${id}`);
      return null;
    }

    this.activeMapId = id;

    // Create the grid based on map data
    if (scene) {
      this.createMapGrid(scene, mapData);

      // Let the rest of the game know a new map was loaded
      eventBus.emit("mapLoaded", {
        mapId: id,
        mapData: mapData,
      });
    }

    console.log(`Map loaded: ${mapData.name} (${mapData.id})`);
    return mapData;
  }

  /**
   * Create the hexagonal grid for the loaded map
   * @param {Phaser.Scene} scene - Game scene to create the grid in
   * @param {Object} mapData - The map data to use
   */
  createMapGrid(scene, mapData) {
    // Store hex tiles information
    scene.hexTiles = [];

    // Center of the grid in world coordinates
    const centerX = 0;
    const centerY = 0;

    // Get terrain data
    const terrain = mapData.terrain;
    const mapHeight = terrain.length;
    const mapWidth = terrain[0].length;

    // Calculate the offset to center the map
    const mapOffsetRow =
      Math.floor(CONSTANTS.GRID_SIZE / 2) - Math.floor(mapHeight / 2);
    const mapOffsetCol =
      Math.floor(CONSTANTS.GRID_SIZE / 2) - Math.floor(mapWidth / 2);

    // Create the grid
    for (let row = 0; row < CONSTANTS.GRID_SIZE; row++) {
      for (let col = 0; col < CONSTANTS.GRID_SIZE; col++) {
        // Calculate hex position (using odd-q offset coordinates)
        let x =
          centerX +
          col * CONSTANTS.HEX_WIDTH -
          (CONSTANTS.GRID_SIZE * CONSTANTS.HEX_WIDTH) / 2;
        let y =
          centerY +
          row * CONSTANTS.HEX_HEIGHT * 0.75 -
          (CONSTANTS.GRID_SIZE * CONSTANTS.HEX_HEIGHT * 0.75) / 2;

        // Offset for odd rows
        if (row % 2 !== 0) {
          x += CONSTANTS.HEX_WIDTH / 2;
        }

        // Determine if this is a grass or ocean tile
        let hexColor = CONSTANTS.COLORS.OCEAN; // Default to ocean
        let hexType = "water"; // Default type is water

        // Check if this position falls within our terrain map
        const mapRow = row - mapOffsetRow;
        const mapCol = col - mapOffsetCol;

        // Check if this tile is within the defined map area and is land
        const isInMapBounds =
          mapRow >= 0 && mapRow < mapHeight && mapCol >= 0 && mapCol < mapWidth;

        const isLandTile = isInMapBounds && terrain[mapRow][mapCol] === 1;

        if (isLandTile) {
          hexColor = CONSTANTS.COLORS.GRASS; // This is a land tile
          hexType = "land";
        }

        const hexGraphics = this.drawHexagon(
          scene,
          x,
          y,
          CONSTANTS.HEX_SIZE,
          hexColor
        );

        // Store hex info with additional info
        const hexTile = {
          x: x,
          y: y,
          color: hexColor,
          gridPos: { row, col },
          // Add axial coordinates for easier reference
          q: col - Math.floor(row / 2), // Convert from offset to axial
          r: row,
          // Identify type of hex (land or water)
          type: hexType,
          // Whether units can travel on this hex (depends on unit type)
          passable: true,
          // All tiles are now considered in bounds, regardless of where they are in the grid
          inBounds: true,
          // Store entities that might be placed here
          entities: [],
          // Store map coordinates for hexes within the terrain definition
          mapPos: isInMapBounds ? { row: mapRow, col: mapCol } : null,
          // Store the original terrain value - default to 0 (water) if outside map bounds
          terrainValue: isInMapBounds ? terrain[mapRow][mapCol] : 0,
        };

        // Mark special positions like resources
        if (mapData.resources) {
          const resource = mapData.resources.find(
            (r) => r.q === hexTile.q && r.r === hexTile.r
          );
          if (resource) {
            // Validate resource placement - Oil can only be on water
            if (resource.type === "oil" && hexTile.type !== "water") {
              console.warn(
                `Oil resource at q=${resource.q}, r=${resource.r} was placed on land, but must be on water. Resource will be ignored.`
              );
            } else {
              hexTile.resource = resource.type;

              // Add visual indicator for resources
              if (resource.type === "gold") {
                this.addGoldResourceIndicator(scene, x, y);
              } else if (resource.type === "oil") {
                this.addOilResourceIndicator(scene, x, y);
              }
            }
          }
        }

        scene.hexTiles.push(hexTile);
      }
    }

    // Set camera bounds based on grid size
    const totalWidth = CONSTANTS.GRID_SIZE * CONSTANTS.HEX_WIDTH;
    const totalHeight = CONSTANTS.GRID_SIZE * CONSTANTS.HEX_HEIGHT * 0.75;
    scene.cameras.main.setBounds(
      -totalWidth / 2,
      -totalHeight / 2,
      totalWidth,
      totalHeight
    );

    // Set a smaller initial zoom level to show more of the map
    scene.cameras.main.setZoom(0.5);
  }

  /**
   * Draw a single hexagon
   * @param {Phaser.Scene} scene - Game scene to draw in
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} size - Hex size
   * @param {number} fillColor - Color to fill with
   * @returns {Phaser.GameObjects.Graphics} The created graphics object
   */
  drawHexagon(scene, x, y, size, fillColor) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(fillColor, 1);

    const corners = 6;

    graphics.beginPath();

    for (let i = 0; i < corners; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const pointX = x + size * Math.cos(angle);
      const pointY = y + size * Math.sin(angle);

      if (i === 0) {
        graphics.moveTo(pointX, pointY);
      } else {
        graphics.lineTo(pointX, pointY);
      }
    }

    graphics.closePath();
    graphics.fillPath();

    // Add a subtle stroke to make hexagons more distinct
    graphics.lineStyle(1, 0x000000, 0.3);
    graphics.strokePath();

    return graphics;
  }

  /**
   * Add a visual indicator for a gold resource
   * @param {Phaser.Scene} scene - Game scene to draw in
   * @param {number} x - X coordinate of the hex
   * @param {number} y - Y coordinate of the hex
   */
  addGoldResourceIndicator(scene, x, y) {
    // Create a gold circle to represent a gold mine
    const graphics = scene.add.graphics();
    graphics.fillStyle(CONSTANTS.COLORS.RESOURCES.GOLD, 1); // Use gold color from constants

    // Draw a circle
    graphics.fillCircle(x, y, CONSTANTS.HEX_SIZE / 3);

    // Add a stroke
    graphics.lineStyle(1, 0x000000, 0.8);
    graphics.strokeCircle(x, y, CONSTANTS.HEX_SIZE / 3);
  }

  /**
   * Add a visual indicator for an oil resource
   * @param {Phaser.Scene} scene - Game scene to draw in
   * @param {number} x - X coordinate of the hex
   * @param {number} y - Y coordinate of the hex
   */
  addOilResourceIndicator(scene, x, y) {
    // Create a drilling rig symbol that suggests resources
    const graphics = scene.add.graphics();

    // Use oil color from constants for the rig
    graphics.fillStyle(CONSTANTS.COLORS.RESOURCES.OIL, 1);
    graphics.lineStyle(2, 0x000000, 0.9);

    // Draw rig platform
    const rigSize = CONSTANTS.HEX_SIZE / 3;
    const platformHeight = rigSize / 4;

    // Base platform
    graphics.fillRect(
      x - rigSize,
      y + rigSize / 2,
      rigSize * 2,
      platformHeight
    );
    graphics.strokeRect(
      x - rigSize,
      y + rigSize / 2,
      rigSize * 2,
      platformHeight
    );

    // Derrick tower
    graphics.fillRect(x - rigSize / 4, y - rigSize, rigSize / 2, rigSize * 1.5);
    graphics.strokeRect(
      x - rigSize / 4,
      y - rigSize,
      rigSize / 2,
      rigSize * 1.5
    );

    // Cross-beam
    graphics.fillRect(x - rigSize / 2, y - rigSize / 2, rigSize, rigSize / 6);
    graphics.strokeRect(x - rigSize / 2, y - rigSize / 2, rigSize, rigSize / 6);

    // Add a hint of gold (to show these are valuable spots)
    graphics.fillStyle(0xffd700, 0.3);
    graphics.fillCircle(x, y + rigSize / 1.5, rigSize / 1.2);
  }

  /**
   * Get the currently active map
   * @returns {Object} The active map data or null if none active
   */
  getActiveMap() {
    if (!this.activeMapId) return null;
    return getMapById(this.activeMapId);
  }

  /**
   * Convert hex grid coordinates to pixel position
   * @param {number} q - Q coordinate (axial)
   * @param {number} r - R coordinate (axial)
   * @returns {Object} Pixel coordinates {x, y}
   */
  hexToPixel(q, r) {
    // Using pointy-top orientation
    const x = CONSTANTS.HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = CONSTANTS.HEX_SIZE * ((3 / 2) * r);
    return { x, y };
  }
}

// Create and export a singleton instance
const mapLoader = new MapLoader();
export default mapLoader;
