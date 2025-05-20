/**
 * Map Registry
 * Central registry of all available maps in the game
 */

// Import all maps
import { defaultMap } from "./base/default_map.js";
import { islandMap } from "./base/island_map.js";

// Add more map imports here as they are created

// Export a registry of all available maps
export const mapRegistry = {
  // Base maps
  default: defaultMap,
  islands: islandMap,

  // Add more maps here with their IDs as keys
};

/**
 * Get a list of all available maps with basic metadata
 * @returns {Array} Array of map metadata objects
 */
export function getAvailableMaps() {
  const maps = [];

  Object.values(mapRegistry).forEach((map) => {
    maps.push({
      id: map.id,
      name: map.name,
      description: map.description,
      author: map.author,
      version: map.version,
    });
  });

  return maps;
}

/**
 * Get a map by its ID
 * @param {string} id - The map ID
 * @returns {Object|null} The map data or null if not found
 */
export function getMapById(id) {
  return mapRegistry[id] || null;
}

// Export default maps for convenience
export default mapRegistry;
