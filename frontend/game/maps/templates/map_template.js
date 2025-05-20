/**
 * Map Template
 * Use this as a starting point to create new maps
 */

// Export the map configuration
export const mapTemplate = {
  id: "unique_map_id", // Unique identifier for the map
  name: "Map Name", // Display name
  description: "Description of the map",
  author: "Your Name",
  version: "1.0.0",

  // Map dimensions - recommended to keep width/height reasonable
  width: 12,
  height: 10,

  // Terrain layout - 1 for land, 0 for water/ocean
  // You can also use other numbers for different terrain types
  // if you implement rendering for them
  terrain: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],

  // Starting positions for players (axial coordinates)
  // These are the recommended spawn points for players
  startPositions: [
    { q: 1, r: 1 }, // Player 1 start
    { q: 10, r: 8 }, // Player 2 start
  ],

  // Resource positions (gold mines, etc.)
  resources: [
    { type: "gold", q: 6, r: 5 }, // Center
    { type: "gold", q: 3, r: 3 }, // Top left quadrant
    { type: "gold", q: 8, r: 7 }, // Bottom right quadrant
  ],

  // Optional: Add special terrain features or objectives
  objectives: [
    {
      type: "capture",
      name: "Central Command",
      q: 6,
      r: 5,
      points: 10,
    },
  ],

  // Optional: Map-specific metadata or configuration
  config: {
    fogOfWar: true,
    timeLimit: 20, // in minutes
    victoryCondition: "elimination", // elimination, points, etc.
  },
};
