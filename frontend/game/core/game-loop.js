import { CONSTANTS } from "../config/constants.js";
import eventBus from "./event-bus.js";

/**
 * GameLoop - Manages the main game loop and time
 * Handles frame updates, delta time, game speed, and pause functionality
 */
class GameLoop {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;

    // Time tracking
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.elapsedTime = 0;

    // Game speed (1.0 = normal)
    this.gameSpeed = 1.0;

    // Registered update functions
    this.updateCallbacks = [];

    // Frame ID for cancellation
    this.animFrameId = null;

    // Stats
    this.fps = 0;
    this.fpsUpdateInterval = 500; // ms
    this.lastFpsUpdate = 0;
    this.framesSinceLastFpsUpdate = 0;

    // Bind methods to maintain context
    this.update = this.update.bind(this);
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.update);

    eventBus.emit("gameLoopStarted");

    return this;
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    eventBus.emit("gameLoopStopped");

    return this;
  }

  /**
   * Pause the game loop (time-sensitive updates will be paused)
   */
  pause() {
    if (this.isPaused) return;

    this.isPaused = true;
    eventBus.emit("gameLoopPaused");

    return this;
  }

  /**
   * Resume the game loop from a paused state
   */
  resume() {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.lastFrameTime = performance.now();
    eventBus.emit("gameLoopResumed");

    return this;
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }

    return this;
  }

  /**
   * Set the game speed (time multiplier)
   * @param {number} speed - Speed multiplier (1.0 = normal)
   */
  setGameSpeed(speed) {
    this.gameSpeed = Math.max(0.1, Math.min(5.0, speed));
    eventBus.emit("gameSpeedChanged", { speed: this.gameSpeed });

    return this;
  }

  /**
   * Main update function for the game loop
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  update(timestamp) {
    if (!this.isRunning) return;

    // Calculate time since last frame
    const now = timestamp;
    this.deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    // Update frame stats
    this.frameCount++;
    this.framesSinceLastFpsUpdate++;

    // Update FPS counter every interval
    if (now - this.lastFpsUpdate > this.fpsUpdateInterval) {
      this.fps = Math.round(
        (this.framesSinceLastFpsUpdate * 1000) / (now - this.lastFpsUpdate)
      );
      this.lastFpsUpdate = now;
      this.framesSinceLastFpsUpdate = 0;
      eventBus.emit("fpsUpdated", { fps: this.fps });
    }

    // Only update game state if not paused
    if (!this.isPaused) {
      // Apply game speed to deltaTime
      const scaledDeltaTime = this.deltaTime * this.gameSpeed;
      this.elapsedTime += scaledDeltaTime;

      // Call all registered update functions
      for (const callback of this.updateCallbacks) {
        callback(scaledDeltaTime, this.elapsedTime);
      }

      // Emit update event with timing info
      eventBus.emit("gameUpdate", {
        deltaTime: scaledDeltaTime,
        elapsedTime: this.elapsedTime,
        frameCount: this.frameCount,
      });
    }

    // Request next frame
    this.animFrameId = requestAnimationFrame(this.update);
  }

  /**
   * Register a function to be called every frame
   * @param {Function} callback - Function to call with (deltaTime, elapsedTime)
   */
  addUpdateCallback(callback) {
    if (
      typeof callback === "function" &&
      !this.updateCallbacks.includes(callback)
    ) {
      this.updateCallbacks.push(callback);
    }

    return this;
  }

  /**
   * Remove a previously registered update callback
   * @param {Function} callback - The callback to remove
   */
  removeUpdateCallback(callback) {
    const index = this.updateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.updateCallbacks.splice(index, 1);
    }

    return this;
  }

  /**
   * Get the current FPS
   * @returns {number} Current frames per second
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get the current delta time (time between frames)
   * @returns {number} Delta time in seconds
   */
  getDeltaTime() {
    return this.deltaTime;
  }

  /**
   * Get total elapsed game time
   * @returns {number} Elapsed time in seconds
   */
  getElapsedTime() {
    return this.elapsedTime;
  }

  /**
   * Clean up resources when shutting down
   */
  destroy() {
    this.stop();
    this.updateCallbacks = [];
  }
}

// Create a singleton instance
const gameLoop = new GameLoop();

export default gameLoop;
