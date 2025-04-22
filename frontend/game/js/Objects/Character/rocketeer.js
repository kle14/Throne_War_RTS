class Rocketeer extends Base_Character {
  constructor(scene, x, y) {
    const rocketeerProps = {
      moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED,
      bodyRadius: 10,
      type: "rocketeer",
    };
    super(scene, rocketeerProps, x, y);
  }

  draw_left_arm() {
    // left arm
    const start = { x: -7.5, y: -2.5 };
    const control1 = { x: -10, y: -12 }; // control point near shoulder
    const control2 = { x: 6, y: -12 }; // control point near wrist
    const end = { x: 7, y: -14 };

    // Resolution of the curve (more segments = smoother)
    const steps = 20;

    this.sprite.beginPath();
    for (let t = 0; t <= 1; t += 1 / steps) {
      const x =
        Math.pow(1 - t, 3) * start.x +
        3 * Math.pow(1 - t, 2) * t * control1.x +
        3 * (1 - t) * Math.pow(t, 2) * control2.x +
        Math.pow(t, 3) * end.x;

      const y =
        Math.pow(1 - t, 3) * start.y +
        3 * Math.pow(1 - t, 2) * t * control1.y +
        3 * (1 - t) * Math.pow(t, 2) * control2.y +
        Math.pow(t, 3) * end.y;

      if (t === 0) this.sprite.moveTo(x, y);
      else this.sprite.lineTo(x, y);
    }
    this.sprite.strokePath();
  }

  draw() {
    // Clear previous graphics
    this.sprite.clear();

    // Re-add shadow beneath the character
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.SHADOW.COLOR,
      CHARACTER_PROPERTIES.SHADOW.OPACITY
    );
    this.sprite.fillCircle(1, 1, this.bodyRadius + 2);

    // Draw the infantry's body (main circle)
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.CHARACTER_COLORS.BODY.SOLDIER,
      1
    ); // Olive green
    this.sprite.fillCircle(0, 0, this.bodyRadius);

    // Draw the helmet (smaller inner circle)
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.CHARACTER_COLORS.HELMET.SOLDIER,
      1
    ); // Darker green
    this.sprite.fillCircle(0, 0, this.bodyRadius * 0.65);

    // Draw arms as lines
    this.sprite.lineStyle(3, CHARACTER_PROPERTIES.SKIN_TONE[0], 1); // Width 3, skin tone, full opacity

    this.draw_left_arm(); // Draw left arm using cubic bezier curve

    // Draw helmet detail
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.CHARACTER_COLORS.GLARE_ON_HELMET.SOLDIER,
      1
    ); // Olive drab
    this.sprite.fillCircle(0, -2.5, 2);

    // === Rocket Launcher ===
    // Positioned on the right shoulder, pointing forward (upward on canvas)
    const launcherX = 10; // slightly right from center
    const launcherY = 11; // base near shoulder

    const launcherLength = 30;
    const launcherWidth = 7;

    // Main launcher tube (vertical)
    this.sprite.fillStyle(0x006400, 1); // Dark green
    this.sprite.fillRect(
      launcherX - launcherWidth / 2,
      launcherY - launcherLength,
      launcherWidth,
      launcherLength
    );

    // Rear shoulder pad
    this.sprite.fillStyle(0x2e8b57, 1); // Sea green
    this.sprite.fillRect(
      launcherX - launcherWidth / 2 - 1,
      launcherY - 4,
      launcherWidth + 2,
      6
    );

    // Grip under barrel
    this.sprite.fillStyle(0x556b2f, 1); // Olive drab
    this.sprite.fillRect(launcherX - 2, launcherY - 15, 4, 3);

    // Scope
    this.sprite.fillStyle(0x444444, 1); // Dark gray
    this.sprite.fillCircle(launcherX, launcherY - 20, 2);
  }
}

if (typeof module !== "undefined") {
  module.exports = { Rocketeer };
}
