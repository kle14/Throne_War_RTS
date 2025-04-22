class Engineer extends Base_Character {
  constructor(scene, x, y) {
    const engineerProps = {
      moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED * 0.9, // Slightly slower than soldier
      bodyRadius: 10,
      type: "engineer",
    };
    super(scene, engineerProps, x, y);
  }

  draw() {
    this.sprite.clear();

    // Shadow
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.SHADOW.COLOR,
      CHARACTER_PROPERTIES.SHADOW.OPACITY
    );
    this.sprite.fillCircle(1, 1, this.bodyRadius + 2);

    // Body (worker uniform - bright blue)
    this.sprite.fillStyle(0x1f75fe, 1); // Bright blue for overalls
    this.sprite.fillCircle(0, 0, this.bodyRadius);

    // Helmet (safety yellow)
    this.sprite.fillStyle(0xffcc00, 1);
    this.sprite.fillCircle(0, 0, this.bodyRadius * 0.65);

    // Helmet Glare
    this.sprite.fillStyle(0xffffff, 0.2);
    this.sprite.fillCircle(0, -2.5, 2);

    // === Tool: Wrench ===
    // Held in right hand, wrench pointing forward
    const wrenchX = 6;
    const wrenchY = -3;

    // Wrench handle
    this.sprite.fillStyle(0x555555, 1); // Dark gray metal
    this.sprite.fillRect(wrenchX - 1, wrenchY - 12, 2, 12); // Handle pointing forward

    // Wrench head (C-shape or crescent)
    this.sprite.beginPath();
    this.sprite.moveTo(wrenchX - 3, wrenchY - 12);
    this.sprite.lineTo(wrenchX - 1, wrenchY - 14);
    this.sprite.lineTo(wrenchX + 1, wrenchY - 14);
    this.sprite.lineTo(wrenchX + 3, wrenchY - 12);
    this.sprite.lineTo(wrenchX + 2, wrenchY - 10);
    this.sprite.lineTo(wrenchX - 2, wrenchY - 10);
    this.sprite.closePath();
    this.sprite.fillPath();

    // === Arms ===
    this.sprite.lineStyle(3, CHARACTER_PROPERTIES.SKIN_TONE[0], 1);

    // Left arm down (relaxed)
    this.sprite.beginPath();
    this.sprite.moveTo(-7, -2.5);
    this.sprite.lineTo(-4, -8);
    this.sprite.strokePath();

    // Right arm (holding wrench)
    this.sprite.beginPath();
    this.sprite.moveTo(6, -2.5);
    this.sprite.lineTo(wrenchX, wrenchY - 4); // connects to wrench handle
    this.sprite.strokePath();
  }
}

if (typeof module !== "undefined") {
  module.exports = { Engineer };
}
