class Infantry extends Base_Character {
  constructor(scene, x, y) {
    // Define infantry properties
    const infantryProps = {
      moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED,
      bodyRadius: 10,
      type: "infantry",
    };

    // Call parent constructor which handles most initialization
    super(scene, infantryProps, x, y);
  }

  // Override the draw method to create infantry-specific appearance
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
    this.sprite.beginPath();
    this.sprite.moveTo(-7.5, -2.5);
    this.sprite.lineTo(2.5, -17.5);
    this.sprite.strokePath();

    this.sprite.beginPath();
    this.sprite.moveTo(7.5, -5);
    this.sprite.lineTo(2.5, -10);
    this.sprite.strokePath();

    // Draw helmet detail
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.CHARACTER_COLORS.GLARE_ON_HELMET.SOLDIER,
      1
    ); // Olive drab
    this.sprite.fillCircle(0, -2.5, 2);

    // Draw rifle as lines
    this.sprite.lineStyle(3, 0x333333, 1); // Width 3, dark gray
    this.sprite.beginPath();
    this.sprite.moveTo(2.5, -20);
    this.sprite.lineTo(2.5, -7.5);
    this.sprite.strokePath();

    this.sprite.lineStyle(2, 0x333333, 1); // Width 2, dark gray
    this.sprite.beginPath();
    this.sprite.moveTo(2.5, -25);
    this.sprite.lineTo(2.5, -20);
    this.sprite.strokePath();
  }
}

// Export the Infantry class
if (typeof module !== "undefined") {
  module.exports = { Infantry };
}
