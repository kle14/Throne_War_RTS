/**
 * Compatibility Layer
 *
 * This module provides backward compatibility with the old class names and paths
 * while using the new implementations. It helps in migrating from the old code
 * structure to the new structure without breaking existing code.
 */

// Import new implementations
import { Mobile as NewMobile } from "../entities/base/mobile.js";
import { Character as NewCharacter } from "../entities/units/character.js";
import { Vehicle as NewVehicle } from "../entities/units/vehicle.js";
import { Engineer, Builder } from "../entities/units/infantry/engineer.js";
import { Infantry } from "../entities/units/infantry/infantry.js";
import { Scout } from "../entities/units/infantry/scout.js";
import { Sniper } from "../entities/units/infantry/sniper.js";
import { Rocketeer } from "../entities/units/infantry/rocketeer.js";
import { Tank } from "../entities/units/vehicles/tank.js";
import { Building } from "../entities/buildings/building.js";
import { Shop } from "../entities/buildings/shop.js";
import { Player } from "../systems/players/player.js";
import { EconomyUI } from "../systems/economy/economy-ui.js";
import { PlayerEconomy } from "../systems/economy/player-economy.js";
import PathFinder from "../utils/pathfinding.js";
import PathVisualizer from "../utils/path-visualizer.js";
import { CONSTANTS } from "../config/constants.js";
import { BUILDING_TYPES } from "../config/building-types.js";

// Export with old class names
export class Mobile_Object extends NewMobile {
  constructor(scene, objectProps, x, y) {
    try {
      // Map old property names to new ones as needed
      super(scene, objectProps, x, y);
    } catch (error) {
      console.error("Error creating Mobile_Object:", error);
    }
  }
}

export class Base_Character extends NewCharacter {
  constructor(scene, objectProps, x, y) {
    try {
      super(scene, objectProps, x, y);
    } catch (error) {
      console.error("Error creating Base_Character:", error);
    }
  }
}

// Make classes available in the global namespace
if (typeof window !== "undefined") {
  // Define browser as window if it's undefined to fix that error
  if (typeof browser === "undefined") {
    window.browser = window;
  }

  // Ensure constants are available globally for old code
  if (!window.CONSTANTS) {
    window.CONSTANTS = CONSTANTS;
  }

  // Make building types available globally
  if (!window.BUILDING_TYPES) {
    window.BUILDING_TYPES = BUILDING_TYPES;
  }

  // Make classes available globally for old code
  window.Mobile_Object = Mobile_Object;
  window.Base_Character = Base_Character;
  window.PathFinder = PathFinder;
  window.PathVisualizer = PathVisualizer;

  // Ensure character classes are available globally
  window.Engineer = Engineer;
  window.Builder = Builder;
  window.Infantry = Infantry;
  window.Scout = Scout;
  window.Sniper = Sniper;
  window.Rocketeer = Rocketeer;
  window.Tank = Tank;
  window.Building = Building;
  window.Shop = Shop;
  window.Player = Player;
  window.EconomyUI = EconomyUI;
  window.PlayerEconomy = PlayerEconomy;
}

// CommonJS export for completeness
if (typeof module !== "undefined") {
  module.exports = {
    Mobile_Object,
    Base_Character,
    Engineer,
    Builder,
    Infantry,
    Scout,
    Sniper,
    Rocketeer,
    Tank,
    Building,
    Shop,
    Player,
    EconomyUI,
    PlayerEconomy,
    PathFinder,
    PathVisualizer,
    CONSTANTS,
    BUILDING_TYPES,
  };
}

export default {
  Mobile_Object,
  Base_Character,
  Engineer,
  Builder,
  Infantry,
  Scout,
  Sniper,
  Rocketeer,
  Tank,
  Building,
  Shop,
  Player,
  EconomyUI,
  PlayerEconomy,
};
