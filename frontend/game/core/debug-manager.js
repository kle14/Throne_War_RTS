import eventBus from "./event-bus.js";
import configManager from "./config-manager.js";

/**
 * DebugManager - Provides debugging and development tools for the game
 * Handles debug rendering, performance tracking, and debugging utilities
 */
class DebugManager {
  constructor() {
    // Debug state
    this.enabled = configManager.get("game.debug", false);
    this.showFps = true;
    this.showStats = true;
    this.showGrid = false;
    this.showColliders = false;
    this.showPaths = false;
    this.showBehaviorTrees = false;

    // Performance metrics
    this.metrics = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      entities: 0,
      memory: {
        total: 0,
        used: 0,
      },
      network: {
        sent: 0,
        received: 0,
      },
    };

    // Timing data
    this.lastTime = 0;
    this.frames = 0;
    this.totalTime = 0;
    this.frameTimeHistory = [];
    this.maxFrameTimeHistory = 100;

    // DOM elements for overlay (created when enabled)
    this.overlay = null;
    this.fpsCounter = null;
    this.statsPanel = null;

    // Console output history
    this.consoleHistory = [];
    this.maxConsoleHistory = 100;

    // Debug layers for rendering
    this.layers = {
      grid: null,
      colliders: null,
      paths: null,
      behaviorTrees: null,
    };

    // Initialize if debug is enabled
    if (this.enabled) {
      this.initialize();
    }

    // Listen for config changes
    eventBus.on("configChanged", (data) => {
      if (data.path === "game.debug") {
        this.setEnabled(data.newValue);
      }
    });
  }

  /**
   * Initialize debug manager
   * @private
   */
  initialize() {
    this.createOverlay();
    this.lastTime = performance.now();

    // Override console methods to track logs
    this.overrideConsole();
  }

  /**
   * Create the debug overlay
   * @private
   */
  createOverlay() {
    // Remove existing overlay if present
    if (this.overlay) {
      document.body.removeChild(this.overlay);
    }

    // Create overlay container
    this.overlay = document.createElement("div");
    this.overlay.id = "debug-overlay";
    this.overlay.style.position = "absolute";
    this.overlay.style.top = "0";
    this.overlay.style.left = "0";
    this.overlay.style.padding = "10px";
    this.overlay.style.color = "#FFF";
    this.overlay.style.fontFamily = "monospace";
    this.overlay.style.fontSize = "12px";
    this.overlay.style.pointerEvents = "none";
    this.overlay.style.zIndex = "9999";
    this.overlay.style.textShadow = "1px 1px 0 #000";

    // Create FPS counter
    this.fpsCounter = document.createElement("div");
    this.fpsCounter.id = "debug-fps";
    this.fpsCounter.style.marginBottom = "5px";
    this.overlay.appendChild(this.fpsCounter);

    // Create stats panel
    this.statsPanel = document.createElement("div");
    this.statsPanel.id = "debug-stats";
    this.overlay.appendChild(this.statsPanel);

    // Add to document
    document.body.appendChild(this.overlay);
  }

  /**
   * Override console methods to track logs
   * @private
   */
  overrideConsole() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    // Helper to add to history
    const addToHistory = (type, args) => {
      this.consoleHistory.push({
        type,
        message: Array.from(args).join(" "),
        time: new Date(),
      });

      // Trim history if needed
      if (this.consoleHistory.length > this.maxConsoleHistory) {
        this.consoleHistory.shift();
      }
    };

    // Override console methods
    console.log = (...args) => {
      addToHistory("log", args);
      originalConsole.log.apply(console, args);
    };

    console.warn = (...args) => {
      addToHistory("warn", args);
      originalConsole.warn.apply(console, args);
    };

    console.error = (...args) => {
      addToHistory("error", args);
      originalConsole.error.apply(console, args);
    };

    console.info = (...args) => {
      addToHistory("info", args);
      originalConsole.info.apply(console, args);
    };

    // Store original methods for restore
    this.originalConsole = originalConsole;
  }

  /**
   * Restore original console methods
   * @private
   */
  restoreConsole() {
    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.info = this.originalConsole.info;
    }
  }

  /**
   * Update debug stats for the current frame
   * @param {number} deltaTime - Time since last frame in ms
   */
  update(deltaTime) {
    if (!this.enabled) return;

    const now = performance.now();
    this.frames++;
    this.totalTime += deltaTime;

    // Update FPS every second
    if (now - this.lastTime >= 1000) {
      this.metrics.fps = Math.round(
        (this.frames * 1000) / (now - this.lastTime)
      );
      this.metrics.frameTime = this.totalTime / this.frames;

      // Add to frame time history
      this.frameTimeHistory.push(this.metrics.frameTime);
      if (this.frameTimeHistory.length > this.maxFrameTimeHistory) {
        this.frameTimeHistory.shift();
      }

      // Reset counters
      this.frames = 0;
      this.totalTime = 0;
      this.lastTime = now;

      // Update overlay if visible
      this.updateOverlay();
    }
  }

  /**
   * Update the debug overlay with current metrics
   * @private
   */
  updateOverlay() {
    if (!this.overlay) return;

    // Update FPS counter
    if (this.showFps) {
      const fpsColor = this.getFpsColor(this.metrics.fps);
      this.fpsCounter.innerHTML = `FPS: <span style="color:${fpsColor}">${
        this.metrics.fps
      }</span> | Frame: ${this.metrics.frameTime.toFixed(2)}ms`;
    }

    // Update stats panel
    if (this.showStats) {
      this.statsPanel.innerHTML = `
        <div>Entities: ${this.metrics.entities}</div>
        <div>Draw Calls: ${this.metrics.drawCalls}</div>
        <div>Memory: ${Math.round(
          this.metrics.memory.used / 1024 / 1024
        )}MB / ${Math.round(this.metrics.memory.total / 1024 / 1024)}MB</div>
        <div>Network: ↑${this.formatBytes(
          this.metrics.network.sent
        )}/s ↓${this.formatBytes(this.metrics.network.received)}/s</div>
      `;
    }
  }

  /**
   * Get color for FPS display based on performance
   * @param {number} fps - Current FPS
   * @returns {string} CSS color value
   * @private
   */
  getFpsColor(fps) {
    if (fps >= 50) return "#00FF00"; // Green
    if (fps >= 30) return "#FFFF00"; // Yellow
    return "#FF0000"; // Red
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   * @private
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)}${sizes[i]}`;
  }

  /**
   * Enable or disable the debug mode
   * @param {boolean} enabled - Whether debug mode is enabled
   */
  setEnabled(enabled) {
    if (this.enabled === enabled) return;

    this.enabled = enabled;

    if (enabled) {
      this.initialize();
      eventBus.emit("debugEnabled");
    } else {
      // Clean up
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
        this.overlay = null;
      }

      this.restoreConsole();
      eventBus.emit("debugDisabled");
    }

    // Update config if changed externally
    if (configManager.get("game.debug") !== enabled) {
      configManager.set("game.debug", enabled);
    }
  }

  /**
   * Toggle debug mode
   * @returns {boolean} The new state
   */
  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Log a message to the debug console (also logs to browser console)
   * @param {string} message - Message to log
   * @param {string} [type='log'] - Log type (log, warn, error, info)
   */
  log(message, type = "log") {
    if (typeof console[type] === "function") {
      console[type](`[DEBUG] ${message}`);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }

  /**
   * Start timing an operation
   * @param {string} label - Label for the timer
   */
  startTimer(label) {
    if (!this.enabled) return;
    console.time(`[DEBUG] ${label}`);
  }

  /**
   * End timing an operation
   * @param {string} label - Label for the timer
   */
  endTimer(label) {
    if (!this.enabled) return;
    console.timeEnd(`[DEBUG] ${label}`);
  }

  /**
   * Set entity count for metrics
   * @param {number} count - Number of entities
   */
  setEntityCount(count) {
    this.metrics.entities = count;
  }

  /**
   * Set draw call count for metrics
   * @param {number} count - Number of draw calls
   */
  setDrawCallCount(count) {
    this.metrics.drawCalls = count;
  }

  /**
   * Set memory usage for metrics
   * @param {number} used - Used memory in bytes
   * @param {number} total - Total available memory in bytes
   */
  setMemoryUsage(used, total) {
    this.metrics.memory.used = used;
    this.metrics.memory.total = total;
  }

  /**
   * Set network usage for metrics
   * @param {number} sent - Bytes sent per second
   * @param {number} received - Bytes received per second
   */
  setNetworkUsage(sent, received) {
    this.metrics.network.sent = sent;
    this.metrics.network.received = received;
  }

  /**
   * Toggle display of grid overlay
   * @returns {boolean} The new state
   */
  toggleGrid() {
    this.showGrid = !this.showGrid;
    eventBus.emit("debugLayerToggled", {
      layer: "grid",
      visible: this.showGrid,
    });
    return this.showGrid;
  }

  /**
   * Toggle display of colliders
   * @returns {boolean} The new state
   */
  toggleColliders() {
    this.showColliders = !this.showColliders;
    eventBus.emit("debugLayerToggled", {
      layer: "colliders",
      visible: this.showColliders,
    });
    return this.showColliders;
  }

  /**
   * Toggle display of pathfinding
   * @returns {boolean} The new state
   */
  togglePaths() {
    this.showPaths = !this.showPaths;
    eventBus.emit("debugLayerToggled", {
      layer: "paths",
      visible: this.showPaths,
    });
    return this.showPaths;
  }

  /**
   * Toggle display of behavior trees
   * @returns {boolean} The new state
   */
  toggleBehaviorTrees() {
    this.showBehaviorTrees = !this.showBehaviorTrees;
    eventBus.emit("debugLayerToggled", {
      layer: "behaviorTrees",
      visible: this.showBehaviorTrees,
    });
    return this.showBehaviorTrees;
  }

  /**
   * Get console history
   * @returns {Array} Array of console entries
   */
  getConsoleHistory() {
    return [...this.consoleHistory];
  }

  /**
   * Clear console history
   */
  clearConsoleHistory() {
    this.consoleHistory = [];
  }

  /**
   * Get performance data for the specified time range
   * @param {number} seconds - Number of seconds to get data for
   * @returns {Object} Performance data
   */
  getPerformanceData(seconds = 5) {
    const history = this.frameTimeHistory.slice(
      -Math.min(seconds * 60, this.frameTimeHistory.length)
    );

    if (history.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        current: this.metrics.frameTime,
      };
    }

    return {
      average: history.reduce((a, b) => a + b, 0) / history.length,
      min: Math.min(...history),
      max: Math.max(...history),
      current: this.metrics.frameTime,
    };
  }
}

// Create a singleton instance
const debugManager = new DebugManager();

export default debugManager;
