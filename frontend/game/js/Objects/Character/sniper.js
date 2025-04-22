// sniper.js
class Sniper extends Base_Character {
  constructor(scene, x, y) {
    const sniperProps = {
      moveSpeed: CONSTANTS.MOVEMENT.SOLDIER_SPEED * 0.95,
      bodyRadius: 9,
      type: "sniper",
    };
    super(scene, sniperProps, x, y);
    // strands are lazily created in draw()
  }

  draw() {
    /* ---------- one‑time ghillie (3 tiny top strands) ---------- */
    if (!this.ghillie) {
      // Fixed positions on the top half of the helmet at -135°, -90°, and -45°
      this.ghillie = [
        { angle: Phaser.Math.DegToRad(-130), len: 4 },
        { angle: Phaser.Math.DegToRad(-80), len: 4 },
        { angle: Phaser.Math.DegToRad(-40), len: 4 },
      ];
    }

    /* ---------- sprite drawing ---------- */
    const r = this.bodyRadius;
    this.sprite.clear();

    // Shadow
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.SHADOW.COLOR,
      CHARACTER_PROPERTIES.SHADOW.OPACITY
    );
    this.sprite.fillCircle(1, 1, r + 2);

    // Body with outline - changed to match infantry's body color
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.CHARACTER_COLORS.BODY.SOLDIER,
      1
    ); // Using the same olive green as infantry
    this.sprite.beginPath();
    this.sprite.arc(0, 0, r, 0, Math.PI * 2);
    this.sprite.closePath();
    this.sprite.fill();
    this.sprite.strokePath();

    // Helmet
    this.sprite.fillStyle(0x38431e, 1);
    this.sprite.fillCircle(0, 0, r * 0.65);

    // Calculate helmet radius for later use with ghillie strands
    const helmetRadius = r * 0.65;

    // Arms
    this.sprite.lineStyle(3, CHARACTER_PROPERTIES.SKIN_TONE[0], 1);
    this.sprite.beginPath(); // left
    this.sprite.moveTo(-6, -1);
    this.sprite.lineTo(1, -15);
    this.sprite.strokePath();
    this.sprite.beginPath(); // right
    this.sprite.moveTo(6, -3);
    this.sprite.lineTo(1, -8);
    this.sprite.strokePath();

    // Sniper rifle
    this.sprite.lineStyle(3, 0x2c2c2c, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(1, -28);
    this.sprite.lineTo(1, -6);
    this.sprite.strokePath();

    // Muzzle brake
    this.sprite.lineStyle(2, 0x3a3a3a, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(1, -33);
    this.sprite.lineTo(1, -28);
    this.sprite.strokePath();

    // Scope
    this.sprite.fillStyle(0x555555, 1);
    this.sprite.fillRoundedRect(-2, -19, 6, 3, 1);

    // Folded bipod
    this.sprite.lineStyle(2, 0x444444, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(1, -24);
    this.sprite.lineTo(-3, -27);
    this.sprite.moveTo(1, -24);
    this.sprite.lineTo(5, -27);
    this.sprite.strokePath();

    // Ghillie strands (3 small random lines) - moved to after helmet is drawn but before rifle
    this.sprite.lineStyle(1.5, 0x0000, 1);
    for (const { angle, len } of this.ghillie) {
      // Start exactly from the helmet edge
      const x1 = Math.cos(angle) * helmetRadius;
      const y1 = Math.sin(angle) * helmetRadius;
      // Extend outward from the helmet
      const x2 = Math.cos(angle) * (helmetRadius + len);
      const y2 = Math.sin(angle) * (helmetRadius + len);

      this.sprite.beginPath();
      this.sprite.moveTo(x1, y1 + 7);
      this.sprite.lineTo(x2, y2 + 7);
      this.sprite.strokePath();
    }
  }
}

if (typeof module !== "undefined") {
  module.exports = { Sniper };
}
