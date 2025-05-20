/**
 * Default Base Map
 * The original map layout for the Throne Wars RTS game
 */

// Export the default map configuration
export const defaultMap = {
  id: "default",
  name: "Large Continent",
  description: "A large continent with vast areas of land",
  author: "Throne Wars Team",
  version: "2.0.0",

  // Map dimensions
  width: 70,
  height: 70,

  // Land map - 1 for land, 0 for ocean
  // This function generates a 70x70 map with primarily land (1) and some water features (0)
  terrain: (function generateLargeMap() {
    // Create an empty 70x70 map filled with land
    const map = Array(70)
      .fill()
      .map(() => Array(70).fill(1));

    // Create some water features - a large lake in the middle
    const centerX = 35;
    const centerY = 35;
    const lakeRadius = 8;

    // Create a lake in the middle
    for (let y = 0; y < 70; y++) {
      for (let x = 0; x < 70; x++) {
        // Calculate distance from center
        const distance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );

        // Make the middle a lake
        if (distance < lakeRadius) {
          map[y][x] = 0;
        }
      }
    }

    // Create some rivers
    // River 1 - horizontal river
    for (let x = 5; x < 65; x++) {
      const riverY1 = 15;
      const riverY2 = 16;

      // Add some meandering to the river
      const offset = Math.sin(x * 0.3) * 2;
      const y1 = Math.floor(riverY1 + offset);
      const y2 = Math.floor(riverY2 + offset);

      if (y1 >= 0 && y1 < 70) map[y1][x] = 0;
      if (y2 >= 0 && y2 < 70) map[y2][x] = 0;
    }

    // River 2 - vertical river
    for (let y = 5; y < 65; y++) {
      const riverX1 = 55;
      const riverX2 = 56;

      // Add some meandering
      const offset = Math.sin(y * 0.3) * 2;
      const x1 = Math.floor(riverX1 + offset);
      const x2 = Math.floor(riverX2 + offset);

      if (x1 >= 0 && x1 < 70) map[y][x1] = 0;
      if (x2 >= 0 && x2 < 70) map[y][x2] = 0;
    }

    // Create coastal areas with beaches (these are still land tiles)
    // We'll keep a 10-tile border of water around the entire map
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 70; x++) {
        map[y][x] = 0; // Top edge
        map[69 - y][x] = 0; // Bottom edge
      }
    }

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 70; y++) {
        map[y][x] = 0; // Left edge
        map[y][69 - x] = 0; // Right edge
      }
    }

    return map;
  })(),

  // Starting positions for players (q, r coordinates)
  startPositions: [
    { q: 20, r: 20 }, // Player 1 start (top-left quadrant)
    { q: 50, r: 50 }, // Player 2 start (bottom-right quadrant)
  ],

  // Resource positions (like gold mines)
  resources: [
    // Quadrant 1 (top-left) resources
    { type: "gold", q: 22, r: 18 },
    { type: "gold", q: 15, r: 25 },
    { type: "gold", q: 25, r: 28 },

    // Quadrant 2 (top-right) resources
    { type: "gold", q: 50, r: 20 },
    { type: "gold", q: 58, r: 25 },

    // Quadrant 3 (bottom-left) resources
    { type: "gold", q: 18, r: 50 },
    { type: "gold", q: 25, r: 45 },

    // Quadrant 4 (bottom-right) resources
    { type: "gold", q: 48, r: 52 },
    { type: "gold", q: 55, r: 45 },

    // Center area resources
    { type: "gold", q: 35, r: 25 },
    { type: "gold", q: 45, r: 35 },
    { type: "gold", q: 25, r: 35 },
    { type: "gold", q: 35, r: 45 },

    // Oil resources (in water areas)
    // Center lake
    { type: "oil", q: 35, r: 35 },
    { type: "oil", q: 32, r: 38 },
    { type: "oil", q: 38, r: 32 },

    // Rivers
    { type: "oil", q: 25, r: 16 },
    { type: "oil", q: 45, r: 15 },
    { type: "oil", q: 56, r: 25 },
    { type: "oil", q: 56, r: 45 },

    // Coastal waters
    { type: "oil", q: 5, r: 5 },
    { type: "oil", q: 65, r: 5 },
    { type: "oil", q: 5, r: 65 },
    { type: "oil", q: 65, r: 65 },
    { type: "oil", q: 35, r: 5 },
    { type: "oil", q: 5, r: 35 },
    { type: "oil", q: 65, r: 35 },
    { type: "oil", q: 35, r: 65 },
  ],
};
