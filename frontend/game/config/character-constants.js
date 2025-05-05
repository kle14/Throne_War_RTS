/**
 * Constants for character appearance and properties
 * This is the ES module version of the original CHARACTER_PROPERTIES
 */

export const CHARACTER_CONSTANTS = {
  SKIN_TONE: [0xffcc99], // for arms
  SHADOW: {
    COLOR: 0x000000, // Black
    OPACITY: 0.2, // 20% opacity
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
};

export default CHARACTER_CONSTANTS;
