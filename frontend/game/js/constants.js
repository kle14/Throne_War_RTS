// Game constants
const CONSTANTS = {
  // Grid settings
  HEX_SIZE: 40,
  get HEX_HEIGHT() {
    return this.HEX_SIZE * 2;
  },
  get HEX_WIDTH() {
    return Math.sqrt(3) * this.HEX_SIZE;
  },
  GRID_SIZE: 100,

  // Colors
  COLORS: {
    GRASS: 0x3da63d, // Green
    OCEAN: 0x1a75ff, // Blue
    TANK: 0x8b4513, // Brown
    TANK_TURRET: 0x654321, // Dark Brown
    SOLDIER: 0x228b22, // Forest Green
    SOLDIER_HELMET: 0x006400, // Dark Green
    PATH: 0xffffff, // White
    SELECTION: 0xffffff, // White selection circle
  },

  // Movement settings
  MOVEMENT: {
    DEFAULT_SPEED: 2,
    CAMERA_SPEED: 40,
    TANK_SPEED: 0.5,
    SOLDIER_SPEED: 3.5, // Soldiers are faster than tanks
  },

  // Path visualization
  PATH: {
    DASH_LENGTH: 10,
    GAP_LENGTH: 5,
    LINE_WIDTH: 3,
    OPACITY: 0.8,
  },

  // Selection properties
  SELECTION: {
    CIRCLE_SIZE: 1.5, // How much bigger the selection circle is than the unit
    LINE_WIDTH: 2,
    OPACITY: 0.8,
  },

  // Economy settings
  ECONOMY: {
    INITIAL_GOLD: 500,
    BASE_PRODUCTION_RATE: 500, // Gold per minute
    TANK_COST: 150,
    INFANTRY_COST: 50,
  },
};

// Make constants available globally
if (typeof window !== "undefined") {
  window.CONSTANTS = CONSTANTS;
}

// Export for module systems
if (typeof module !== "undefined") {
  module.exports = CONSTANTS;
}
