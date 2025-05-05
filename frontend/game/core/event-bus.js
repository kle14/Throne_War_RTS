/**
 * EventBus - Central event management system for game-wide communication
 * Provides pub/sub mechanism for components to communicate without direct dependencies
 */
class EventBus {
  constructor() {
    // Map of event names to arrays of handler functions
    this.events = new Map();

    // Debug mode - when true, logs all events
    this.debug = false;

    // Stats for monitoring
    this.stats = {
      totalEvents: 0,
      eventCounts: {},
    };
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event to subscribe to
   * @param {Function} handler - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  on(eventName, handler) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    this.events.get(eventName).push(handler);

    // Return unsubscribe function
    return () => this.off(eventName, handler);
  }

  /**
   * Subscribe to an event, but only trigger once
   * @param {string} eventName - Name of the event to subscribe to
   * @param {Function} handler - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  once(eventName, handler) {
    const onceHandler = (...args) => {
      this.off(eventName, onceHandler);
      handler(...args);
    };

    return this.on(eventName, onceHandler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event to unsubscribe from
   * @param {Function} handler - Handler function to remove
   */
  off(eventName, handler) {
    if (!this.events.has(eventName)) {
      return;
    }

    const handlers = this.events.get(eventName);
    const index = handlers.indexOf(handler);

    if (index !== -1) {
      handlers.splice(index, 1);

      // Remove empty handler arrays
      if (handlers.length === 0) {
        this.events.delete(eventName);
      }
    }
  }

  /**
   * Unsubscribe from all instances of an event
   * @param {string} eventName - Name of the event to unsubscribe from
   */
  offAll(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }

  /**
   * Emit an event with data
   * @param {string} eventName - Name of the event to emit
   * @param {*} data - Data to pass to handlers
   */
  emit(eventName, data) {
    // Update stats
    this.stats.totalEvents++;
    this.stats.eventCounts[eventName] =
      (this.stats.eventCounts[eventName] || 0) + 1;

    // Debug logging
    if (this.debug) {
      console.log(`[EventBus] ${eventName}`, data);
    }

    // If no handlers, just return
    if (!this.events.has(eventName)) {
      return;
    }

    // Get a copy of current handlers (in case handlers are removed during emission)
    const handlers = [...this.events.get(eventName)];

    // Call each handler with the data
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[EventBus] Error in handler for '${eventName}':`, error);
      }
    });
  }

  /**
   * Check if an event has subscribers
   * @param {string} eventName - Name of the event to check
   * @returns {boolean} True if the event has subscribers
   */
  hasListeners(eventName) {
    return this.events.has(eventName) && this.events.get(eventName).length > 0;
  }

  /**
   * Get the number of subscribers for an event
   * @param {string} eventName - Name of the event to check
   * @returns {number} Number of subscribers
   */
  listenerCount(eventName) {
    if (!this.events.has(eventName)) {
      return 0;
    }

    return this.events.get(eventName).length;
  }

  /**
   * Get all registered event names
   * @returns {Array<string>} Array of event names
   */
  getEventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether debug mode is enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * Get event statistics
   * @returns {Object} Event statistics
   */
  getStats() {
    return {
      ...this.stats,
      registeredEvents: this.getEventNames(),
      totalRegisteredHandlers: Array.from(this.events.values()).reduce(
        (total, handlers) => total + handlers.length,
        0
      ),
    };
  }

  /**
   * Reset event statistics
   */
  resetStats() {
    this.stats = {
      totalEvents: 0,
      eventCounts: {},
    };
  }
}

// Create a singleton instance
const eventBus = new EventBus();

export default eventBus;
