/**
 * Island Map
 * A map with multiple islands separated by water
 */

export const islandMap = {
  id: "islands",
  name: "Grand Archipelago",
  description: "A vast ocean with numerous large islands and island chains",
  author: "Throne Wars Team",
  version: "2.0.0",

  // Map dimensions
  width: 70,
  height: 70,

  // Land map - 1 for land, 0 for ocean
  // This function generates a 70x70 map with islands (1) surrounded by water (0)
  terrain: (function generateLargeIslandMap() {
    // Create an empty 70x70 map filled with water
    const map = Array(70)
      .fill()
      .map(() => Array(70).fill(0));

    // Function to create a circular island
    const createIsland = (centerX, centerY, radius, noise = 0) => {
      for (let y = 0; y < 70; y++) {
        for (let x = 0; x < 70; x++) {
          // Calculate distance from center
          const distance = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );

          // Add some noise to make the coastline less perfect
          const noiseValue = noise * (Math.random() - 0.5);

          // Create land if within radius
          if (distance < radius + noiseValue) {
            map[y][x] = 1;
          }
        }
      }
    };

    // Function to create an archipelago of islands
    const createArchipelago = (
      centerX,
      centerY,
      count,
      minRadius,
      maxRadius
    ) => {
      for (let i = 0; i < count; i++) {
        // Random position within the area
        const offsetX = Math.floor((Math.random() - 0.5) * 15);
        const offsetY = Math.floor((Math.random() - 0.5) * 15);
        const x = centerX + offsetX;
        const y = centerY + offsetY;

        // Random radius within the specified range
        const radius = Math.floor(
          minRadius + Math.random() * (maxRadius - minRadius)
        );

        // Create the island
        createIsland(x, y, radius, 2);
      }
    };

    // Create main islands in the four quadrants
    // Player 1's starting island (top-left)
    createIsland(15, 15, 7, 2);

    // Player 2's starting island (bottom-right)
    createIsland(55, 55, 7, 2);

    // Create archipelagos in different regions
    createArchipelago(35, 15, 5, 2, 4); // Northern archipelago
    createArchipelago(15, 40, 5, 2, 4); // Western archipelago
    createArchipelago(55, 40, 5, 2, 4); // Eastern archipelago
    createArchipelago(35, 55, 5, 2, 4); // Southern archipelago

    // Create a large central island
    createIsland(35, 35, 8, 3);

    // Create some small scattered islands
    for (let i = 0; i < 15; i++) {
      const x = 10 + Math.floor(Math.random() * 50);
      const y = 10 + Math.floor(Math.random() * 50);
      createIsland(x, y, 1 + Math.random() * 2, 1);
    }

    return map;
  })(),

  // Starting positions for players (q, r coordinates)
  startPositions: [
    { q: 15, r: 15 }, // Player 1 start (top-left island)
    { q: 55, r: 55 }, // Player 2 start (bottom-right island)
  ],

  // Resource positions (like gold mines)
  resources: [
    // Central island resources
    { type: "gold", q: 35, r: 35 },
    { type: "gold", q: 33, r: 37 },
    { type: "gold", q: 37, r: 33 },

    // Player 1's island resources
    { type: "gold", q: 15, r: 12 },
    { type: "gold", q: 18, r: 15 },

    // Player 2's island resources
    { type: "gold", q: 55, r: 52 },
    { type: "gold", q: 52, r: 55 },

    // Northern archipelago
    { type: "gold", q: 35, r: 15 },

    // Western archipelago
    { type: "gold", q: 15, r: 40 },

    // Eastern archipelago
    { type: "gold", q: 55, r: 40 },

    // Southern archipelago
    { type: "gold", q: 35, r: 55 },

    // Oil resources (in water areas)
    // Between islands
    { type: "oil", q: 35, r: 15 },
    { type: "oil", q: 15, r: 35 },
    { type: "oil", q: 55, r: 35 },
    { type: "oil", q: 35, r: 55 },

    // Corners (deep water)
    { type: "oil", q: 5, r: 5 },
    { type: "oil", q: 65, r: 5 },
    { type: "oil", q: 5, r: 65 },
    { type: "oil", q: 65, r: 65 },

    // Near islands (coastal waters)
    { type: "oil", q: 20, r: 10 },
    { type: "oil", q: 10, r: 20 },
    { type: "oil", q: 50, r: 10 },
    { type: "oil", q: 60, r: 20 },
    { type: "oil", q: 10, r: 50 },
    { type: "oil", q: 20, r: 60 },
    { type: "oil", q: 60, r: 50 },
    { type: "oil", q: 50, r: 60 },

    // Random ocean spots
    { type: "oil", q: 30, r: 25 },
    { type: "oil", q: 25, r: 30 },
    { type: "oil", q: 45, r: 40 },
    { type: "oil", q: 40, r: 45 },
  ],

  // Special configurations for this map
  config: {
    fogOfWar: true,
    weatherEffects: "storm", // Special weather that affects naval movement
    victoryCondition: "domination", // Control all islands to win
  },
};
