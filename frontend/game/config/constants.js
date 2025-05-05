/**
 * Game constants
 * Centralized location for all game-related constants
 */
export const CONSTANTS = {
  // Grid and hex tile configuration
  GRID_SIZE: 30,
  HEX_SIZE: 30,
  HEX_WIDTH: 52,
  HEX_HEIGHT: 60,

  // Colors
  COLORS: {
    GRASS: 0x50c878, // Emerald green
    OCEAN: 0x1e90ff, // Dodger blue
    SELECTION: 0xffffff, // White
    PLAYER_COLORS: [0xff0000, 0x0000ff, 0x00ff00, 0xffff00], // Red, Blue, Green, Yellow
    PATH: 0xffffff, // White for path visualization
  },

  // Movement settings
  MOVEMENT: {
    DEFAULT_SPEED: 2,
    SOLDIER_SPEED: 2.5,
    TANK_SPEED: 1.8,
    SCOUT_SPEED: 3.5,
    SNIPER_SPEED: 2.2,
    CAMERA_SPEED: 10,
  },

  // Mobile entity settings
  MOBILE: {
    DEFAULT_SPEED: 2,
    DEFAULT_ATTACK_RANGE: 100,
  },

  // Path visualization settings
  PATH: {
    DASH_LENGTH: 12,
    GAP_LENGTH: 5,
    LINE_WIDTH: 2,
    OPACITY: 0.9,
  },

  // Unit properties
  CHARACTER: {
    DEFAULT_BODY_RADIUS: 12,
    SKIN_TONE: [0xffe0bd, 0xc68642, 0x8d5524], // Light, medium, dark skin tones
    SHADOW: {
      COLOR: 0x000000,
      OPACITY: 0.3,
    },
    TYPE: {
      CIVILIAN: ["builder", "scout"],
      SOLDIER: ["infantry", "sniper", "rocketeer"],
    },
    CHARACTER_COLORS: {
      BODY: {
        SOLDIER: 0x3a5f0b, // Olive green
      },
      HELMET: {
        SOLDIER: 0x2e3d19, // Darker green
      },
      GLARE_ON_HELMET: {
        SOLDIER: 0x556b2f, // Olive drab
      },
    },
  },

  // Selection properties
  SELECTION: {
    LINE_WIDTH: 2,
    OPACITY: 0.8,
    CIRCLE_SIZE: 1.5, // Multiplier for body radius
  },

  // Economy settings
  ECONOMY: {
    INITIAL_GOLD: 500,
    BASE_PRODUCTION_RATE: 500, // Gold per minute
    INFANTRY_COST: 100,
    TANK_COST: 250,
    BUILDER_COST: 150,
    BARRACKS_COST: 300,
    FACTORY_COST: 600,
    GOLD_MINE_COST: 400,
    TURRET_COST: 250,
  },

  // Combat settings
  COMBAT: {
    BASE_DAMAGE: 10,
    CRITICAL_CHANCE: 0.1,
    CRITICAL_MULTIPLIER: 2,
    ATTACK_COOLDOWN: 1000, // ms
  },
};

export default CONSTANTS;
