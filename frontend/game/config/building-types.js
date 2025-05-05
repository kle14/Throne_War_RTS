/**
 * Building types configuration
 * This contains all available building types and their properties
 */

export const BUILDING_TYPES = {
  barracks: {
    name: "Barracks",
    description: "Allows production of infantry units",
    cost: 300,
    color: 0x8b4513, // Brown
    buildTime: 30, // seconds (increased for slower building)
    healthPoints: 500,
  },
  goldMine: {
    name: "Gold Mine",
    description: "Produces additional gold over time",
    cost: 400,
    color: 0xffd700, // Gold
    buildTime: 45, // seconds (increased for slower building)
    healthPoints: 400,
    productionRate: 100, // Gold per minute
  },
  factory: {
    name: "Factory",
    description: "Allows production of vehicles",
    cost: 600,
    color: 0x708090, // Slate gray
    buildTime: 60, // seconds (increased for slower building)
    healthPoints: 600,
  },
  turret: {
    name: "Turret",
    description: "Defensive structure that attacks nearby enemies",
    cost: 250,
    color: 0x696969, // Dim gray
    buildTime: 25, // seconds (increased for slower building)
    healthPoints: 300,
    damage: 50,
    range: 200,
  },
};

export default BUILDING_TYPES;
