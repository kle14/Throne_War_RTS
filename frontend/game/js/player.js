class Player {
  constructor(scene, id, name, color = 0xff0000) {
    this.scene = scene;
    this.id = id;
    this.name = name;
    this.color = color;
    this.units = [];
    this.builders = []; // Separate array for builder units

    // Initialize player economy
    try {
      this.economy = new PlayerEconomy(
        scene,
        id,
        CONSTANTS.ECONOMY.INITIAL_GOLD,
        CONSTANTS.ECONOMY.BASE_PRODUCTION_RATE
      );
      console.log(
        `Player ${id} economy initialized with ${CONSTANTS.ECONOMY.INITIAL_GOLD} gold`
      );
    } catch (err) {
      console.error(`Error initializing economy for player ${id}:`, err);
    }
  }

  addUnit(unit) {
    if (!unit) return;

    this.units.push(unit);
    try {
      unit.setOwner(this);
    } catch (err) {
      console.error(`Error setting owner for unit:`, err);
    }
  }

  addBuilder(builder) {
    if (!builder) return;

    this.builders.push(builder);
    try {
      builder.setOwner(this);
    } catch (err) {
      console.error(`Error setting owner for builder:`, err);
    }
  }

  removeUnit(unit) {
    if (!unit) return;

    const index = this.units.indexOf(unit);
    if (index !== -1) {
      this.units.splice(index, 1);
    }
  }

  removeBuilder(builder) {
    if (!builder) return;

    const index = this.builders.indexOf(builder);
    if (index !== -1) {
      this.builders.splice(index, 1);
    }
  }

  getEconomy() {
    return this.economy;
  }

  getGold() {
    return this.economy ? this.economy.getGold() : 0;
  }

  canAfford(amount) {
    return this.economy ? this.economy.canAfford(amount) : false;
  }

  spendGold(amount) {
    return this.economy ? this.economy.spendGold(amount) : false;
  }

  addGold(amount) {
    if (this.economy) {
      this.economy.addGold(amount);
    }
  }

  getUnits() {
    return this.units;
  }

  getBuilders() {
    return this.builders;
  }

  // Get all units including builders
  getAllUnits() {
    return [...this.units, ...this.builders];
  }

  update() {
    // Update builders
    if (this.builders && this.builders.length > 0) {
      this.builders.forEach((builder) => {
        if (builder) builder.update();
      });
    }
  }

  destroy() {
    // Clean up resources
    if (this.economy) {
      this.economy.destroy();
    }

    // Clean up units
    if (this.units && this.units.length > 0) {
      this.units.forEach((unit) => {
        if (unit && unit.destroy) unit.destroy();
      });
    }

    // Clean up builders
    if (this.builders && this.builders.length > 0) {
      this.builders.forEach((builder) => {
        if (builder && builder.destroy) builder.destroy();
      });
    }
  }
}
