import eventBus from "./event-bus.js";
import stateManager from "./state-manager.js";
import { CONSTANTS } from "../config/constants.js";

/**
 * InputManager - Handles user input for the game
 * Manages keyboard, mouse, and touch input with configurable bindings
 */
class InputManager {
  constructor() {
    this.scene = null;
    this.keys = null;
    this.enabled = true;

    // Input bindings - can be customized
    this.keyBindings = {
      cameraUp: "W",
      cameraDown: "S",
      cameraLeft: "A",
      cameraRight: "D",
      deselect: "E",
      multiSelect: "SHIFT", // Hold for box selection or adding to selection
      delete: "DELETE",
      pause: "P",
    };

    // Mouse state
    this.mouseState = {
      isDown: false,
      startX: 0,
      startY: 0,
      worldStartX: 0,
      worldStartY: 0,
      currentX: 0,
      currentY: 0,
      worldX: 0,
      worldY: 0,
      isDragging: false,
    };

    // Selection box graphics
    this.selectionBox = null;
  }

  /**
   * Initialize the input manager with the game scene
   * @param {Phaser.Scene} scene - The game scene
   */
  init(scene) {
    this.scene = scene;

    // Set up keyboard inputs
    this.setupKeyboard();

    // Set up mouse/touch input
    this.setupPointerInput();

    // Store in the scene for easy access
    scene.inputManager = this;

    return this;
  }

  /**
   * Set up keyboard input
   */
  setupKeyboard() {
    // Set up keyboard for camera and control
    this.keys = this.scene.input.keyboard.addKeys({
      cameraUp: Phaser.Input.Keyboard.KeyCodes[this.keyBindings.cameraUp],
      cameraDown: Phaser.Input.Keyboard.KeyCodes[this.keyBindings.cameraDown],
      cameraLeft: Phaser.Input.Keyboard.KeyCodes[this.keyBindings.cameraLeft],
      cameraRight: Phaser.Input.Keyboard.KeyCodes[this.keyBindings.cameraRight],
      deselect: Phaser.Input.Keyboard.KeyCodes[this.keyBindings.deselect],
      multiSelect: Phaser.Input.Keyboard.KeyCodes[this.keyBindings.multiSelect],
      delete: Phaser.Input.Keyboard.KeyCodes[this.keyBindings.delete],
      pause: Phaser.Input.Keyboard.KeyCodes[this.keyBindings.pause],
    });

    // Set up key event handlers
    this.scene.input.keyboard.on("keydown-" + this.keyBindings.deselect, () => {
      this.handleDeselect();
    });

    this.scene.input.keyboard.on("keydown-" + this.keyBindings.delete, () => {
      this.handleDelete();
    });

    this.scene.input.keyboard.on("keydown-" + this.keyBindings.pause, () => {
      eventBus.emit("pauseKeyPressed");
    });
  }

  /**
   * Set up pointer input (mouse/touch)
   */
  setupPointerInput() {
    // Pointer down - start potential selection or drag
    this.scene.input.on("pointerdown", (pointer) => {
      if (!this.enabled || pointer.button !== 0) return; // Only left click

      // Store start position
      this.mouseState.isDown = true;
      this.mouseState.startX = pointer.x;
      this.mouseState.startY = pointer.y;
      this.mouseState.currentX = pointer.x;
      this.mouseState.currentY = pointer.y;

      // Convert to world coordinates
      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );
      this.mouseState.worldStartX = worldPoint.x;
      this.mouseState.worldStartY = worldPoint.y;
      this.mouseState.worldX = worldPoint.x;
      this.mouseState.worldY = worldPoint.y;

      // Start with no dragging
      this.mouseState.isDragging = false;

      // If shift key is down, prepare for box selection
      if (this.keys.multiSelect.isDown) {
        this.createSelectionBox();
      }

      eventBus.emit("pointerDown", { pointer, worldPoint });
    });

    // Pointer move - update selection box or handle drag
    this.scene.input.on("pointermove", (pointer) => {
      // Update current position
      this.mouseState.currentX = pointer.x;
      this.mouseState.currentY = pointer.y;

      // Convert to world coordinates
      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );
      this.mouseState.worldX = worldPoint.x;
      this.mouseState.worldY = worldPoint.y;

      // Check if we're dragging (moved more than threshold)
      if (this.mouseState.isDown && !this.mouseState.isDragging) {
        const dragThreshold = 5;
        const dx = Math.abs(pointer.x - this.mouseState.startX);
        const dy = Math.abs(pointer.y - this.mouseState.startY);

        if (dx > dragThreshold || dy > dragThreshold) {
          this.mouseState.isDragging = true;
        }
      }

      // Update selection box if dragging and shift is down
      if (
        this.mouseState.isDown &&
        this.mouseState.isDragging &&
        this.keys.multiSelect.isDown
      ) {
        this.updateSelectionBox();
      }

      eventBus.emit("pointerMove", {
        pointer,
        worldPoint,
        isDragging: this.mouseState.isDragging,
      });
    });

    // Pointer up - finalize selection or click
    this.scene.input.on("pointerup", (pointer) => {
      if (!this.enabled || pointer.button !== 0 || !this.mouseState.isDown)
        return;

      const worldPoint = this.scene.cameras.main.getWorldPoint(
        pointer.x,
        pointer.y
      );

      // If we were dragging with shift, finish box selection
      if (this.mouseState.isDragging && this.keys.multiSelect.isDown) {
        this.finalizeBoxSelection();
      }
      // If not dragging, it's a click
      else if (!this.mouseState.isDragging) {
        this.handleClick(pointer, worldPoint);
      }

      // Reset state
      this.mouseState.isDown = false;
      this.mouseState.isDragging = false;

      // Clean up selection box
      if (this.selectionBox) {
        this.selectionBox.destroy();
        this.selectionBox = null;
      }

      eventBus.emit("pointerUp", { pointer, worldPoint });
    });

    // Mouse wheel for zoom
    this.scene.input.on(
      "wheel",
      (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        const zoomAmount = deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Phaser.Math.Clamp(
          this.scene.cameras.main.zoom * zoomAmount,
          0.5,
          2
        );
        this.scene.cameras.main.zoom = newZoom;
      }
    );
  }

  /**
   * Handle keyboard camera movement
   */
  updateCamera() {
    if (!this.keys || !this.scene) return;

    const speed = CONSTANTS.MOVEMENT.CAMERA_SPEED;

    if (this.keys.cameraUp.isDown) {
      this.scene.cameras.main.scrollY -= speed;
    }
    if (this.keys.cameraDown.isDown) {
      this.scene.cameras.main.scrollY += speed;
    }
    if (this.keys.cameraLeft.isDown) {
      this.scene.cameras.main.scrollX -= speed;
    }
    if (this.keys.cameraRight.isDown) {
      this.scene.cameras.main.scrollX += speed;
    }
  }

  /**
   * Create the selection box graphics
   */
  createSelectionBox() {
    if (this.selectionBox) {
      this.selectionBox.destroy();
    }

    this.selectionBox = this.scene.add.graphics();
    this.selectionBox.lineStyle(2, 0xffffff, 0.8);
    this.selectionBox.setDepth(1000);
  }

  /**
   * Update the selection box while dragging
   */
  updateSelectionBox() {
    if (!this.selectionBox) return;

    this.selectionBox.clear();
    const width = this.mouseState.currentX - this.mouseState.startX;
    const height = this.mouseState.currentY - this.mouseState.startY;
    this.selectionBox.strokeRect(
      this.mouseState.startX,
      this.mouseState.startY,
      width,
      height
    );
  }

  /**
   * Complete the box selection and select entities within the box
   */
  finalizeBoxSelection() {
    // Get selection box bounds in world coordinates
    const x1 = Math.min(this.mouseState.worldStartX, this.mouseState.worldX);
    const x2 = Math.max(this.mouseState.worldStartX, this.mouseState.worldX);
    const y1 = Math.min(this.mouseState.worldStartY, this.mouseState.worldY);
    const y2 = Math.max(this.mouseState.worldStartY, this.mouseState.worldY);

    // If box is too small, treat as a click (already handled elsewhere)
    if (Math.abs(x2 - x1) < 5 || Math.abs(y2 - y1) < 5) {
      return;
    }

    // Find all entities within the selection box
    const currentPlayer = stateManager.get("currentPlayer");
    const allEntities = currentPlayer ? currentPlayer.getAllUnits() : [];
    const selectedEntities = [];

    allEntities.forEach((entity) => {
      if (entity && entity.sprite) {
        const entityX = entity.sprite.x;
        const entityY = entity.sprite.y;

        // Check if entity is within selection box
        if (entityX >= x1 && entityX <= x2 && entityY >= y1 && entityY <= y2) {
          // Select the entity
          entity.select();
          selectedEntities.push(entity);
          stateManager.selectEntity(entity);
        }
      }
    });

    // Emit selection event
    if (selectedEntities.length > 0) {
      eventBus.emit("entitiesSelected", selectedEntities);
    }
  }

  /**
   * Handle a single click (not a drag)
   */
  handleClick(pointer, worldPoint) {
    // Check if we clicked on a UI element
    const clickedUIElement = this.checkUIElementClick(pointer);
    if (clickedUIElement) return;

    // Background click, potentially deselect everything
    if (!this.keys.multiSelect.isDown) {
      stateManager.clearSelection();
      eventBus.emit("backgroundClicked", worldPoint);
    }
  }

  /**
   * Check if a UI element was clicked
   * @returns {boolean} True if a UI element was clicked
   */
  checkUIElementClick(pointer) {
    // This would check if any UI elements were clicked
    // Requires knowledge of UI structure
    return false;
  }

  /**
   * Handle the deselect key press
   */
  handleDeselect() {
    console.log("Deselect key pressed ('E')");

    try {
      // Call the scene's deselectAll function if available
      if (
        this.scene &&
        this.scene.deselectAll &&
        typeof this.scene.deselectAll === "function"
      ) {
        console.log("Calling scene.deselectAll()");
        this.scene.deselectAll();
      } else {
        console.log(
          "Scene deselectAll method not available, using state manager only"
        );
      }

      // Confirm the scene still exists before proceeding
      if (!this.scene) {
        console.log("Scene no longer exists, cannot complete deselection");
        return;
      }

      // Also use the state manager (belt and suspenders approach)
      if (stateManager) {
        stateManager.clearSelection();
      }

      // Emit the event if eventBus exists
      if (eventBus) {
        eventBus.emit("deselectKeyPressed");
      }

      console.log("Deselection complete");
    } catch (error) {
      console.error("Error in handleDeselect:", error);
    }
  }

  /**
   * Handle the delete key press
   */
  handleDelete() {
    const selectedEntities = stateManager.get("selectedEntities");
    if (selectedEntities.length > 0) {
      eventBus.emit("deleteKeyPressed", selectedEntities);
    }
  }

  /**
   * Enable or disable input
   * @param {boolean} value - Whether input should be enabled
   */
  setEnabled(value) {
    this.enabled = value;
  }

  /**
   * Update method called each frame
   */
  update() {
    if (!this.enabled) return;

    // Update camera position based on keyboard
    this.updateCamera();
  }

  /**
   * Clean up resources when shutting down
   */
  destroy() {
    if (this.selectionBox) {
      this.selectionBox.destroy();
      this.selectionBox = null;
    }

    if (this.scene && this.scene.input) {
      this.scene.input.keyboard.off("keydown-" + this.keyBindings.deselect);
      this.scene.input.keyboard.off("keydown-" + this.keyBindings.delete);
      this.scene.input.keyboard.off("keydown-" + this.keyBindings.pause);
    }

    this.scene = null;
    this.keys = null;
  }
}

// Create a singleton instance
const inputManager = new InputManager();

export default inputManager;
