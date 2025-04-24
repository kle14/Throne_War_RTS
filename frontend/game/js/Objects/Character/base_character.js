class Base_Character extends Mobile_Object {
  constructor(scene, charProps, x, y) {
    // Call parent constructor
    super(scene, charProps, x, y);

    // Set up sprite for drawing
    this.sprite = scene.add.graphics();
    this.sprite.setPosition(x, y);

    // Create a hit area for the character - crucial for selection
    this.hitArea = scene.add.circle(x, y, this.bodyRadius * 1.5);
    this.hitArea.setStrokeStyle(1, 0xffff00, 0.0); // Invisible stroke
    this.hitArea.setInteractive();

    // Draw the character's appearance
    this.draw();

    // Setup both movement and selection events
    this.setupEvents();
    this.setupSelectionEvents();
  }

  // Draw the character - to be implemented by subclasses
  draw() {
    // Basic implementation, subclasses should override this
    // Clear previous graphics
    this.sprite.clear();

    // Add shadow beneath the character
    this.sprite.fillStyle(
      CHARACTER_PROPERTIES.SHADOW.COLOR,
      CHARACTER_PROPERTIES.SHADOW.OPACITY
    );
    this.sprite.fillCircle(1, 1, this.bodyRadius + 2);

    // Default appearance
    this.sprite.fillStyle(0x888888, 1); // Default gray color
    this.sprite.fillCircle(0, 0, this.bodyRadius);
  }

  // Set up selection events specifically
  setupSelectionEvents() {
    // Object selection handler
    this.hitArea.on("pointerdown", (pointer) => {
      console.log(this.type + " clicked");
      this.select();

      // Tell the scene this object was selected
      if (this.scene.onUnitSelected) {
        this.scene.onUnitSelected(this);
      }

      // Prevent event propagation
      pointer.stopPropagation();
    });
  }
}
