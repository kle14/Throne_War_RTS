/**
 * EventSystem - Manages game-wide events and communication between components
 * Provides a centralized pub/sub system with event bubbling, priorities, and filtering
 */
class EventSystem {
  constructor() {
    // Event listeners storage
    this.listeners = new Map();

    // Keep track of events currently being processed (to prevent infinite loops)
    this.processingEvents = new Set();

    // Event queue for deferred events
    this.eventQueue = [];

    // Statistics
    this.stats = {
      totalEventsEmitted: 0,
      totalEventsProcessed: 0,
      totalListenersCalled: 0,
      totalListenersRegistered: 0,
      totalListenersRemoved: 0,
    };

    // Default options
    this.options = {
      maxListenersPerEvent: 100,
      warnOnMaxListeners: true,
      maxQueueSize: 1000,
      warnOnQueueOverflow: true,
      enableEventBubbling: true,
      defaultPriority: 0,
      enableDebugMode: false,
    };
  }

  /**
   * Configure event system options
   * @param {Object} options - Configuration options
   */
  configure(options) {
    Object.assign(this.options, options);
  }

  /**
   * Register an event listener
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Callback function
   * @param {Object} [options] - Listener options
   * @returns {Object} Listener reference for removal
   */
  on(eventName, callback, options = {}) {
    if (!eventName || typeof callback !== "function") {
      console.error("Invalid event registration", eventName, callback);
      return null;
    }

    // Create listener entry if it doesn't exist
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    const listeners = this.listeners.get(eventName);

    // Check max listeners
    if (listeners.length >= this.options.maxListenersPerEvent) {
      if (this.options.warnOnMaxListeners) {
        console.warn(
          `Max listeners (${this.options.maxListenersPerEvent}) reached for event "${eventName}"`
        );
      }
    }

    // Create listener object
    const listener = {
      callback,
      priority: options.priority ?? this.options.defaultPriority,
      once: !!options.once,
      context: options.context || null,
      filter: options.filter || null,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
    };

    // Add listener and sort by priority (higher priority first)
    listeners.push(listener);
    listeners.sort((a, b) => b.priority - a.priority);

    this.stats.totalListenersRegistered++;

    return {
      id: listener.id,
      eventName,
      remove: () => this.off(eventName, listener.id),
    };
  }

  /**
   * Register a one-time event listener
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Callback function
   * @param {Object} [options] - Listener options
   * @returns {Object} Listener reference for removal
   */
  once(eventName, callback, options = {}) {
    return this.on(eventName, callback, { ...options, once: true });
  }

  /**
   * Remove an event listener
   * @param {string} eventName - Event name
   * @param {Function|string} callbackOrId - Callback function or listener ID
   * @returns {boolean} Whether listener was removed
   */
  off(eventName, callbackOrId) {
    if (!this.listeners.has(eventName)) {
      return false;
    }

    const listeners = this.listeners.get(eventName);
    const initialLength = listeners.length;

    // Filter out the listener
    if (typeof callbackOrId === "function") {
      // Remove by callback reference
      const filtered = listeners.filter(
        (listener) => listener.callback !== callbackOrId
      );
      this.listeners.set(eventName, filtered);
    } else if (typeof callbackOrId === "string") {
      // Remove by ID
      const filtered = listeners.filter(
        (listener) => listener.id !== callbackOrId
      );
      this.listeners.set(eventName, filtered);
    } else if (!callbackOrId) {
      // Remove all listeners for this event
      this.listeners.delete(eventName);
    }

    // Clean up empty listener arrays
    if (
      this.listeners.has(eventName) &&
      this.listeners.get(eventName).length === 0
    ) {
      this.listeners.delete(eventName);
    }

    const removed =
      initialLength -
      (this.listeners.has(eventName)
        ? this.listeners.get(eventName).length
        : 0);
    this.stats.totalListenersRemoved += removed;

    return removed > 0;
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} [eventName] - Event name (if omitted, all events are cleared)
   */
  offAll(eventName) {
    if (eventName) {
      const count = this.listeners.has(eventName)
        ? this.listeners.get(eventName).length
        : 0;
      this.listeners.delete(eventName);
      this.stats.totalListenersRemoved += count;
    } else {
      let totalRemoved = 0;
      this.listeners.forEach((listeners) => {
        totalRemoved += listeners.length;
      });
      this.listeners.clear();
      this.stats.totalListenersRemoved += totalRemoved;
    }
  }

  /**
   * Emit an event synchronously
   * @param {string|Object} eventNameOrObject - Event name or event object
   * @param {*} [data] - Event data
   * @param {Object} [options] - Emit options
   * @returns {boolean} Whether the event had listeners
   */
  emit(eventNameOrObject, data, options = {}) {
    // Handle event object
    let eventName, eventData;

    if (typeof eventNameOrObject === "object" && eventNameOrObject.type) {
      eventName = eventNameOrObject.type;
      eventData = eventNameOrObject;
    } else {
      eventName = eventNameOrObject;
      eventData = data;
    }

    // Prevent infinite loops
    if (this.processingEvents.has(eventName)) {
      if (this.options.enableDebugMode) {
        console.warn(`Potential event loop detected for "${eventName}"`);
      }
      return false;
    }

    // Track total events
    this.stats.totalEventsEmitted++;

    // Create event object
    const event = this._createEventObject(eventName, eventData, options);

    // Add to processing set
    this.processingEvents.add(eventName);

    // Process the event
    const result = this._processEvent(event);

    // Remove from processing set
    this.processingEvents.delete(eventName);

    return result;
  }

  /**
   * Emit an event asynchronously (next tick)
   * @param {string|Object} eventNameOrObject - Event name or event object
   * @param {*} [data] - Event data
   * @param {Object} [options] - Emit options
   */
  emitAsync(eventNameOrObject, data, options = {}) {
    setTimeout(() => {
      this.emit(eventNameOrObject, data, options);
    }, 0);
  }

  /**
   * Emit an event after a delay
   * @param {string|Object} eventNameOrObject - Event name or event object
   * @param {*} [data] - Event data
   * @param {number} delay - Delay in milliseconds
   * @param {Object} [options] - Emit options
   * @returns {Object} Timer reference
   */
  emitDelayed(eventNameOrObject, data, delay, options = {}) {
    const timerId = setTimeout(() => {
      this.emit(eventNameOrObject, data, options);
    }, delay);

    return {
      cancel: () => clearTimeout(timerId),
    };
  }

  /**
   * Queue an event for deferred processing
   * @param {string|Object} eventNameOrObject - Event name or event object
   * @param {*} [data] - Event data
   * @param {Object} [options] - Queue options
   */
  queueEvent(eventNameOrObject, data, options = {}) {
    // Check queue size
    if (this.eventQueue.length >= this.options.maxQueueSize) {
      if (this.options.warnOnQueueOverflow) {
        console.warn(
          `Event queue overflow! (${this.eventQueue.length} events)`
        );
      }

      // Remove oldest event if not prioritized
      if (!options.priority || options.priority <= 0) {
        this.eventQueue.shift();
      }
    }

    // Create event entry
    let eventName, eventData;

    if (typeof eventNameOrObject === "object" && eventNameOrObject.type) {
      eventName = eventNameOrObject.type;
      eventData = eventNameOrObject;
    } else {
      eventName = eventNameOrObject;
      eventData = data;
    }

    // Add to queue
    this.eventQueue.push({
      type: eventName,
      data: eventData,
      options: options,
      timestamp: Date.now(),
      priority: options.priority || 0,
    });

    // Sort by priority
    this.eventQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process all queued events
   * @param {number} [maxEvents] - Maximum number of events to process
   * @returns {number} Number of events processed
   */
  processEventQueue(maxEvents = Infinity) {
    const count = Math.min(this.eventQueue.length, maxEvents);
    let processed = 0;

    for (let i = 0; i < count; i++) {
      const event = this.eventQueue.shift();
      this.emit(event.type, event.data, event.options);
      processed++;
    }

    return processed;
  }

  /**
   * Create an event object
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   * @param {Object} options - Event options
   * @returns {Object} Event object
   * @private
   */
  _createEventObject(eventName, data, options) {
    // Default event object
    const event = {
      type: eventName,
      data: data,
      timestamp: Date.now(),
      target: options.target || null,
      bubbles: options.bubbles ?? this.options.enableEventBubbling,
      cancelable: options.cancelable ?? true,
      propagationStopped: false,
      defaultPrevented: false,
      stopPropagation: function () {
        this.propagationStopped = true;
      },
      preventDefault: function () {
        if (this.cancelable) {
          this.defaultPrevented = true;
        }
      },
    };

    return event;
  }

  /**
   * Process an event
   * @param {Object} event - Event object
   * @returns {boolean} Whether the event had listeners
   * @private
   */
  _processEvent(event) {
    let hasListeners = false;

    // Process direct event
    hasListeners = this._processEventType(event) || hasListeners;

    // Process wildcard listeners
    hasListeners =
      this._processEventType({ ...event, type: "*" }) || hasListeners;

    // Process bubbling
    if (event.bubbles && !event.propagationStopped && event.target) {
      let currentTarget = event.target.parent;

      while (currentTarget) {
        const bubbleEvent = { ...event, target: currentTarget };
        this._processEventType(bubbleEvent);

        if (bubbleEvent.propagationStopped) {
          break;
        }

        currentTarget = currentTarget.parent;
      }
    }

    // Increment counter
    this.stats.totalEventsProcessed++;

    return hasListeners;
  }

  /**
   * Process an event for a specific type
   * @param {Object} event - Event object
   * @returns {boolean} Whether the event had listeners
   * @private
   */
  _processEventType(event) {
    if (!this.listeners.has(event.type)) {
      return false;
    }

    const listeners = this.listeners.get(event.type);
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // Copy the listeners array to handle removal during iteration
    const currentListeners = [...listeners];
    const listenersToRemove = [];

    // Call listeners
    for (const listener of currentListeners) {
      // Skip if event propagation was stopped
      if (event.propagationStopped) {
        break;
      }

      // Apply filter if provided
      if (listener.filter && !listener.filter(event)) {
        continue;
      }

      try {
        // Call with proper context
        listener.callback.call(listener.context, event.data, event);
        this.stats.totalListenersCalled++;

        // Mark for removal if once
        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        console.error(`Error in event listener for "${event.type}":`, error);
      }
    }

    // Remove once listeners
    for (const listener of listenersToRemove) {
      this.off(event.type, listener.id);
    }

    return true;
  }

  /**
   * Get event listener statistics
   * @returns {Object} Event system statistics
   */
  getStats() {
    const activeListeners = Array.from(this.listeners.entries()).reduce(
      (acc, [eventName, listeners]) => {
        acc[eventName] = listeners.length;
        return acc;
      },
      {}
    );

    return {
      ...this.stats,
      activeEventTypes: this.listeners.size,
      totalActiveListeners: Array.from(this.listeners.values()).reduce(
        (total, listeners) => total + listeners.length,
        0
      ),
      queueSize: this.eventQueue.length,
      activeListeners,
    };
  }

  /**
   * Reset event statistics
   */
  resetStats() {
    this.stats = {
      totalEventsEmitted: 0,
      totalEventsProcessed: 0,
      totalListenersCalled: 0,
      totalListenersRegistered: 0,
      totalListenersRemoved: 0,
    };
  }

  /**
   * Create an event emitter with methods bound to this event system
   * @param {Object} target - Target object
   * @returns {Object} Event emitter methods
   */
  createEmitter(target) {
    return {
      emit: (event, data, options) =>
        this.emit(event, data, { ...options, target }),
      on: (event, callback, options) =>
        this.on(event, callback, { ...options, context: target }),
      once: (event, callback, options) =>
        this.once(event, callback, { ...options, context: target }),
      off: (event, callback) => this.off(event, callback),
    };
  }
}

// Create a singleton instance
const eventSystem = new EventSystem();

export default eventSystem;
