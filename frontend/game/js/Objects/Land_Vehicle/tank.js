// filepath: c:\Users\Khoi Le\workspace\Throne_Wars_RTS\frontend\game\js\Objects\Land_Vehicle\tank.js
class Tank extends Mobile_Object {
  constructor(scene, x, y) {
    // Define tank properties
    const tankProps = {
      moveSpeed: CONSTANTS.MOVEMENT.TANK_SPEED || 0.5,
      bodyRadius: 25,
      type: "tank",
    };

    // Call parent constructor which handles most initialization
    super(scene, tankProps, x, y);

    // Create tank sprite
    this.sprite = scene.add.graphics();
    this.sprite.setPosition(x, y);
    this.sprite.setDepth(10); // Set a higher depth to appear above path lines

    // Create a hit area for the tank
    this.hitArea = scene.add.circle(x, y, 25);
    this.hitArea.setStrokeStyle(1, 0xffff00, 0.0); // Invisible stroke
    this.hitArea.setInteractive();

    // Draw the tank's appearance
    this.draw();

    // Setup tank-specific events
    this.setupEvents();

    console.log("Tank created at position", x, y);
  }

  // Draw the tank's appearance
  draw() {
    // Clear previous graphics
    this.sprite.clear();

    // Tank body
    this.sprite.fillStyle(0x505050, 1);
    this.sprite.fillRect(-15, -24, 30, 48);

    // Tank turret
    this.sprite.fillStyle(0x404040, 1);
    this.sprite.fillCircle(0, -6, 12);

    // Tank barrel
    this.sprite.fillStyle(0x303030, 1);
    this.sprite.fillRect(-2.4, -36, 4.8, 24);

    // Tank tracks
    this.sprite.fillStyle(0x353535, 1);
    this.sprite.fillRect(-21, -27, 6, 54);
    this.sprite.fillRect(15, -27, 6, 54);

    // Tank turret hatch
    this.sprite.fillStyle(0x282828, 1);
    this.sprite.fillCircle(0, -9, 3.6);

    // Additional details
    this.sprite.fillStyle(0x202020, 1);
    this.sprite.fillRect(-9, 21, 18, 3);
  }

  // Override movement validation if needed
  isValidMovementTarget(hex) {
    return hex && hex.color === CONSTANTS.COLORS.GRASS;
  }

  isValidMovementTile(hex) {
    return hex && hex.color === CONSTANTS.COLORS.GRASS;
  }

  // Override the rotation update method for tank-specific rotation
  updateRotation(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      const angle = Math.atan2(dy, dx) + Math.PI / 2; // Add 90 degrees for proper orientation
      this.sprite.rotation = angle;
    }
  }
}

// Export the Tank class
if (typeof module !== "undefined") {
  module.exports = { Tank };
}
