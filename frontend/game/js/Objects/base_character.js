class Base_Character extends Mobile_Object {
  constructor(scene, charProps, x, y) {
    // Call parent constructor
    super(scene, charProps, x, y);

    // Set up sprite for drawing
    this.sprite = scene.add.graphics();
    this.sprite.setPosition(x, y);
    this.sprite.setDepth(10); // Set a higher depth to appear above path lines

    // Create a hit area for the character - crucial for selection
    this.hitArea = scene.add.circle(x, y, this.bodyRadius * 1.5);
    this.hitArea.setStrokeStyle(1, 0xffff00, 0.0); // Invisible stroke
    this.hitArea.setInteractive();

    // Draw the character's appearance
    this.draw();

    // Setup the events
    this.setupEvents();
  }
}
