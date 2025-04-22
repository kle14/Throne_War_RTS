/**
   * Select this unit and show selection indicator
   */
  select() {
    // Don't select if it's already selected
    if (this.isSelected) return;
    
    this.isSelected = true;
    
    // Create or update selection indicator
    if (!this.selectionIndicator) {
      this.selectionIndicator = this.scene.add.graphics();
      this.selectionIndicator.setDepth(5); // Set depth higher than unit but lower than UI
    }
    
    // Draw selection circle around the unit with the player's color
    const color = this.owner ? this.owner.color : 0x00ff00;
    this.selectionIndicator.clear();
    this.selectionIndicator.lineStyle(2, color, 1);
    this.selectionIndicator.strokeCircle(0, 0, this.sprite.width / 1.8);
    
    // Position indicator at the unit's position
    this.selectionIndicator.x = this.sprite.x;
    this.selectionIndicator.y = this.sprite.y;
    
    // Emit an event that this unit was selected (for multi-selection)
    this.scene.events.emit("unitSelected", this);
  }

  /**
   * Deselect this unit and hide selection indicator
   */
  deselect() {
    // Skip if not selected
    if (!this.isSelected) return;
    
    this.isSelected = false;
    
    // Hide selection indicator if it exists
    if (this.selectionIndicator) {
      this.selectionIndicator.clear();
    }
    
    // Emit an event that this unit was deselected
    this.scene.events.emit("unitDeselected", this);
  } 