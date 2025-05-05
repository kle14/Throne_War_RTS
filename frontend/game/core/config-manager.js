import eventSystem from "./event-system.js";

/**
 * ConfigManager - Manages game configuration and settings
 * Provides a centralized system for accessing and modifying game settings
 * with support for profiles, persistence, and dynamic updates
 */
class ConfigManager {
  constructor() {
    // Default configuration
    this.defaults = {
      // Graphics settings
      graphics: {
        resolution: "auto",
        quality: "high",
        shadows: true,
        particles: true,
        animations: true,
        vsync: true,
        maxFPS: 60,
        antialiasing: true,
      },

      // Audio settings
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.7,
        sfxVolume: 1.0,
        voiceVolume: 1.0,
        ambientVolume: 0.8,
        muted: false,
      },

      // Gameplay settings
      gameplay: {
        difficulty: "normal",
        autoSave: true,
        autoSaveInterval: 5, // minutes
        tutorialEnabled: true,
        cameraSensitivity: 0.5,
        cameraEdgeScrolling: true,
        cameraZoomSpeed: 0.5,
      },

      // UI settings
      ui: {
        language: "en",
        fontSize: "medium",
        showFPS: false,
        showTooltips: true,
        uiScale: 1.0,
        colorblindMode: "off",
        chatEnabled: true,
        minimapSize: "medium",
      },

      // Controls settings
      controls: {
        invertY: false,
        keyBindings: {
          moveUp: "w",
          moveDown: "s",
          moveLeft: "a",
          moveRight: "d",
          select: "mouse1",
          command: "mouse2",
          attack: "a",
          stop: "s",
          hold: "h",
          groupAssign1: "ctrl+1",
          groupAssign2: "ctrl+2",
          groupAssign3: "ctrl+3",
          groupAssign4: "ctrl+4",
          groupSelect1: "1",
          groupSelect2: "2",
          groupSelect3: "3",
          groupSelect4: "4",
          pause: "escape",
          menu: "tab",
        },
      },

      // Network settings
      network: {
        serverRegion: "auto",
        connectionQuality: "auto",
        udpEnabled: true,
        syncRate: "high",
      },

      // Development settings (only used in dev builds)
      development: {
        debugMode: false,
        showColliders: false,
        showPathfinding: false,
        showFPS: true,
        logLevel: "error",
        godMode: false,
        unlockAll: false,
      },
    };

    // Current configuration (initialize with defaults)
    this.config = JSON.parse(JSON.stringify(this.defaults));

    // Active profile name
    this.activeProfile = "default";

    // Profiles storage
    this.profiles = {
      default: JSON.parse(JSON.stringify(this.defaults)),
    };

    // Storage key prefix
    this.storageKeyPrefix = "throne_wars_config_";

    // Set up event emitter
    this.events = eventSystem.createEmitter(this);

    // Validation schemas (simplified)
    this.validationSchemas = {
      // Add schemas as needed
    };
  }

  /**
   * Initialize configuration system
   * @param {Object} options - Initialization options
   */
  initialize(options = {}) {
    // Load from storage if available
    if (options.loadFromStorage !== false) {
      this.loadFromStorage();
    }

    // Override with provided options if any
    if (options.initialConfig) {
      this.setMultiple(options.initialConfig);
    }

    // Switch to specified profile if provided
    if (options.profile) {
      this.switchProfile(options.profile);
    }

    // Emit initialized event
    this.events.emit("initialized", this.config);

    return this;
  }

  /**
   * Get a configuration value
   * @param {string} key - Dot notation path to the config value
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} Configuration value
   */
  get(key, defaultValue) {
    // Handle undefined or empty key
    if (!key) {
      return JSON.parse(JSON.stringify(this.config));
    }

    // Handle top-level sections
    if (!key.includes(".")) {
      return key in this.config
        ? JSON.parse(JSON.stringify(this.config[key]))
        : defaultValue;
    }

    // Navigate through nested properties
    const parts = key.split(".");
    let current = this.config;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (current === undefined || current === null || !(part in current)) {
        return defaultValue;
      }

      current = current[part];
    }

    // Return a copy to prevent accidental modifications
    return typeof current === "object" && current !== null
      ? JSON.parse(JSON.stringify(current))
      : current;
  }

  /**
   * Set a configuration value
   * @param {string} key - Dot notation path to the config value
   * @param {*} value - Value to set
   * @param {boolean} [persist=true] - Whether to persist the change
   * @returns {boolean} Whether the value was successfully set
   */
  set(key, value, persist = true) {
    try {
      if (!key) {
        console.error("Invalid key provided to ConfigManager.set");
        return false;
      }

      // Store old value for event
      const oldValue = this.get(key);

      // Handle top-level object replacement
      if (!key.includes(".")) {
        // Validate if schema exists
        if (
          this.validationSchemas[key] &&
          !this._validateValue(value, this.validationSchemas[key])
        ) {
          console.error(`Invalid value for config key ${key}`);
          return false;
        }

        this.config[key] = JSON.parse(JSON.stringify(value));

        // Update active profile
        this.profiles[this.activeProfile] = JSON.parse(
          JSON.stringify(this.config)
        );

        // Persist change if requested
        if (persist) {
          this.saveToStorage();
        }

        // Emit events
        this._emitChangeEvents(key, oldValue, value);

        return true;
      }

      // Handle nested properties
      const parts = key.split(".");
      let current = this.config;

      // Navigate to the parent of the property we want to set
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];

        if (!(part in current)) {
          current[part] = {};
        }

        current = current[part];

        if (typeof current !== "object" || current === null) {
          console.error(
            `Cannot set ${key} as path contains a non-object value`
          );
          return false;
        }
      }

      // Get the final property name
      const finalProp = parts[parts.length - 1];

      // Validate if schema exists for this path
      const schemaKey = parts.join(".");
      if (
        this.validationSchemas[schemaKey] &&
        !this._validateValue(value, this.validationSchemas[schemaKey])
      ) {
        console.error(`Invalid value for config key ${key}`);
        return false;
      }

      // Set the value (use deep clone for objects)
      current[finalProp] =
        typeof value === "object" && value !== null
          ? JSON.parse(JSON.stringify(value))
          : value;

      // Update active profile
      this.profiles[this.activeProfile] = JSON.parse(
        JSON.stringify(this.config)
      );

      // Persist change if requested
      if (persist) {
        this.saveToStorage();
      }

      // Emit events
      this._emitChangeEvents(key, oldValue, value);

      return true;
    } catch (error) {
      console.error(`Error setting config value for ${key}:`, error);
      return false;
    }
  }

  /**
   * Set multiple configuration values at once
   * @param {Object} configObject - Object with key/value pairs
   * @param {boolean} [persist=true] - Whether to persist changes
   * @returns {boolean} Whether all values were successfully set
   */
  setMultiple(configObject, persist = true) {
    if (!configObject || typeof configObject !== "object") {
      return false;
    }

    let allSuccessful = true;

    // Disable persistence for individual sets to avoid multiple saves
    const persistAfter = persist;

    // Flatten the object into key-value pairs with dot notation
    const flattenedPairs = this._flattenObject(configObject);

    // Set each value
    for (const [key, value] of Object.entries(flattenedPairs)) {
      const success = this.set(key, value, false); // Don't persist individual changes
      allSuccessful = allSuccessful && success;
    }

    // Persist once at the end if requested
    if (persistAfter) {
      this.saveToStorage();
    }

    // Emit a bulk change event
    this.events.emit("bulkChanged", configObject);

    return allSuccessful;
  }

  /**
   * Reset a configuration key to its default value
   * @param {string} key - Dot notation path to reset
   * @param {boolean} [persist=true] - Whether to persist the change
   * @returns {boolean} Whether the value was successfully reset
   */
  reset(key, persist = true) {
    if (!key) {
      // Reset entire config
      this.config = JSON.parse(JSON.stringify(this.defaults));

      // Update active profile
      this.profiles[this.activeProfile] = JSON.parse(
        JSON.stringify(this.config)
      );

      // Persist change if requested
      if (persist) {
        this.saveToStorage();
      }

      // Emit events
      this.events.emit("reset", { scope: "all" });

      return true;
    }

    // Find default value
    const defaultValue = this._getFromObject(this.defaults, key);

    if (defaultValue === undefined) {
      console.error(`No default value found for key ${key}`);
      return false;
    }

    // Set to default
    return this.set(key, defaultValue, persist);
  }

  /**
   * Check if a value equals the default
   * @param {string} key - Dot notation path to check
   * @returns {boolean} Whether current value equals default
   */
  isDefault(key) {
    const currentValue = this.get(key);
    const defaultValue = this._getFromObject(this.defaults, key);

    return JSON.stringify(currentValue) === JSON.stringify(defaultValue);
  }

  /**
   * Save configuration to localStorage
   * @returns {boolean} Whether save was successful
   */
  saveToStorage() {
    try {
      // Save profiles
      localStorage.setItem(
        `${this.storageKeyPrefix}profiles`,
        JSON.stringify(this.profiles)
      );

      // Save active profile name
      localStorage.setItem(
        `${this.storageKeyPrefix}activeProfile`,
        this.activeProfile
      );

      this.events.emit("saved");
      return true;
    } catch (error) {
      console.error("Failed to save config to storage:", error);
      return false;
    }
  }

  /**
   * Load configuration from localStorage
   * @returns {boolean} Whether load was successful
   */
  loadFromStorage() {
    try {
      // Load profiles
      const profilesStr = localStorage.getItem(
        `${this.storageKeyPrefix}profiles`
      );
      if (profilesStr) {
        this.profiles = JSON.parse(profilesStr);
      }

      // Load active profile
      const activeProfile = localStorage.getItem(
        `${this.storageKeyPrefix}activeProfile`
      );
      if (activeProfile && this.profiles[activeProfile]) {
        this.activeProfile = activeProfile;
        this.config = JSON.parse(JSON.stringify(this.profiles[activeProfile]));
      }

      this.events.emit("loaded");
      return true;
    } catch (error) {
      console.error("Failed to load config from storage:", error);
      return false;
    }
  }

  /**
   * Create a new profile
   * @param {string} profileName - Name of the profile
   * @param {Object} [baseConfig] - Initial config (defaults if not specified)
   * @param {boolean} [switchTo=true] - Whether to switch to the new profile
   * @returns {boolean} Whether profile was created successfully
   */
  createProfile(profileName, baseConfig, switchTo = true) {
    if (!profileName || typeof profileName !== "string") {
      console.error("Invalid profile name");
      return false;
    }

    if (this.profiles[profileName]) {
      console.error(`Profile ${profileName} already exists`);
      return false;
    }

    // Create new profile
    this.profiles[profileName] = baseConfig
      ? JSON.parse(JSON.stringify(baseConfig))
      : JSON.parse(JSON.stringify(this.defaults));

    // Switch to the new profile if requested
    if (switchTo) {
      this.switchProfile(profileName);
    }

    // Save to storage
    this.saveToStorage();

    // Emit event
    this.events.emit("profileCreated", { name: profileName });

    return true;
  }

  /**
   * Switch to a different profile
   * @param {string} profileName - Name of the profile to switch to
   * @returns {boolean} Whether switch was successful
   */
  switchProfile(profileName) {
    if (!this.profiles[profileName]) {
      console.error(`Profile ${profileName} does not exist`);
      return false;
    }

    // Save current config to current profile
    this.profiles[this.activeProfile] = JSON.parse(JSON.stringify(this.config));

    // Switch profile
    const oldProfile = this.activeProfile;
    this.activeProfile = profileName;

    // Load config from new profile
    this.config = JSON.parse(JSON.stringify(this.profiles[profileName]));

    // Save to storage
    this.saveToStorage();

    // Emit event
    this.events.emit("profileSwitched", {
      oldProfile,
      newProfile: profileName,
    });

    return true;
  }

  /**
   * Delete a profile
   * @param {string} profileName - Name of the profile to delete
   * @returns {boolean} Whether deletion was successful
   */
  deleteProfile(profileName) {
    if (!this.profiles[profileName]) {
      console.error(`Profile ${profileName} does not exist`);
      return false;
    }

    // Cannot delete active profile
    if (profileName === this.activeProfile) {
      console.error("Cannot delete active profile");
      return false;
    }

    // Cannot delete default profile
    if (profileName === "default") {
      console.error("Cannot delete default profile");
      return false;
    }

    // Delete profile
    delete this.profiles[profileName];

    // Save to storage
    this.saveToStorage();

    // Emit event
    this.events.emit("profileDeleted", { name: profileName });

    return true;
  }

  /**
   * Get a list of all profiles
   * @returns {Array<string>} List of profile names
   */
  getProfiles() {
    return Object.keys(this.profiles);
  }

  /**
   * Get the active profile name
   * @returns {string} Active profile name
   */
  getActiveProfile() {
    return this.activeProfile;
  }

  /**
   * Export configuration to JSON
   * @param {string} [profileName] - Export specific profile (all profiles if omitted)
   * @returns {string} JSON string
   */
  exportToJson(profileName) {
    if (profileName) {
      if (!this.profiles[profileName]) {
        console.error(`Profile ${profileName} does not exist`);
        return null;
      }

      return JSON.stringify(
        {
          profile: profileName,
          config: this.profiles[profileName],
        },
        null,
        2
      );
    }

    // Export all profiles
    return JSON.stringify(
      {
        activeProfile: this.activeProfile,
        profiles: this.profiles,
      },
      null,
      2
    );
  }

  /**
   * Import configuration from JSON
   * @param {string} json - JSON string to import
   * @param {boolean} [merge=false] - Whether to merge with existing config
   * @returns {boolean} Whether import was successful
   */
  importFromJson(json, merge = false) {
    try {
      const data = JSON.parse(json);

      // Import single profile
      if (data.profile && data.config) {
        if (merge && this.profiles[data.profile]) {
          // Merge with existing profile
          this.profiles[data.profile] = this._deepMerge(
            this.profiles[data.profile],
            data.config
          );
        } else {
          // Replace or create profile
          this.profiles[data.profile] = data.config;
        }

        // Update current config if this is the active profile
        if (data.profile === this.activeProfile) {
          this.config = JSON.parse(JSON.stringify(this.profiles[data.profile]));
        }

        this.saveToStorage();
        this.events.emit("imported", { scope: "profile", name: data.profile });
        return true;
      }

      // Import multiple profiles
      if (data.profiles) {
        if (merge) {
          // Merge with existing profiles
          for (const [name, config] of Object.entries(data.profiles)) {
            if (this.profiles[name]) {
              this.profiles[name] = this._deepMerge(
                this.profiles[name],
                config
              );
            } else {
              this.profiles[name] = config;
            }
          }
        } else {
          // Replace all profiles
          this.profiles = data.profiles;
        }

        // Switch to specified active profile if it exists
        if (data.activeProfile && this.profiles[data.activeProfile]) {
          this.activeProfile = data.activeProfile;
          this.config = JSON.parse(
            JSON.stringify(this.profiles[data.activeProfile])
          );
        }

        this.saveToStorage();
        this.events.emit("imported", { scope: "all" });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to import config:", error);
      return false;
    }
  }

  /**
   * Register a configuration change listener
   * @param {string} key - Config key to watch (or * for all changes)
   * @param {Function} callback - Callback function
   * @returns {Object} Listener handle
   */
  watch(key, callback) {
    if (typeof callback !== "function") {
      console.error("Invalid callback provided to ConfigManager.watch");
      return null;
    }

    // Register for specific key change
    const eventName = key === "*" ? "changed" : `changed:${key}`;
    return this.events.on(eventName, callback);
  }

  /**
   * Stop watching a configuration change
   * @param {Object} handle - Listener handle from watch()
   */
  unwatch(handle) {
    if (!handle || !handle.eventName) {
      return;
    }

    this.events.off(handle.eventName, handle.id);
  }

  /**
   * Apply settings to the game
   * @param {string} [section] - Config section to apply (all if omitted)
   */
  applySettings(section) {
    // Emit application events
    if (section) {
      this.events.emit(`apply:${section}`, this.get(section));
    } else {
      // Apply all sections
      Object.keys(this.config).forEach((section) => {
        this.events.emit(`apply:${section}`, this.get(section));
      });

      this.events.emit("apply", this.get());
    }
  }

  // Private methods

  /**
   * Emit change events for a config change
   * @param {string} key - Changed key
   * @param {*} oldValue - Previous value
   * @param {*} newValue - New value
   * @private
   */
  _emitChangeEvents(key, oldValue, newValue) {
    // Global change event
    this.events.emit("changed", {
      key,
      oldValue,
      newValue,
    });

    // Specific key change event
    this.events.emit(`changed:${key}`, {
      oldValue,
      newValue,
    });

    // Section change event (for top-level sections)
    const section = key.split(".")[0];
    this.events.emit(`changed:${section}`, {
      key,
      oldValue,
      newValue,
    });
  }

  /**
   * Get a value from an object using dot notation
   * @param {Object} obj - Object to get value from
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   * @private
   */
  _getFromObject(obj, path) {
    if (!path) return obj;

    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null || !(part in current)) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   * @private
   */
  _deepMerge(target, source) {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (value === null) {
        if (key in result) {
          result[key] = null;
        }
      } else if (typeof value === "object" && !Array.isArray(value)) {
        if (
          typeof result[key] === "object" &&
          !Array.isArray(result[key]) &&
          result[key] !== null
        ) {
          result[key] = this._deepMerge(result[key], value);
        } else {
          result[key] = { ...value };
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Flatten an object into key-value pairs with dot notation
   * @param {Object} obj - Object to flatten
   * @param {string} [prefix=''] - Prefix for keys
   * @returns {Object} Flattened object
   * @private
   */
  _flattenObject(obj, prefix = "") {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Recurse for nested objects
        Object.assign(result, this._flattenObject(value, newKey));
      } else {
        // Store primitive values and arrays directly
        result[newKey] = value;
      }
    }

    return result;
  }

  /**
   * Validate a value against a schema
   * @param {*} value - Value to validate
   * @param {Object} schema - Validation schema
   * @returns {boolean} Whether the value is valid
   * @private
   */
  _validateValue(value, schema) {
    // Simple validation (can be expanded as needed)
    if (schema.type === "number") {
      if (typeof value !== "number") return false;
      if ("min" in schema && value < schema.min) return false;
      if ("max" in schema && value > schema.max) return false;
    } else if (schema.type === "string") {
      if (typeof value !== "string") return false;
      if (schema.enum && !schema.enum.includes(value)) return false;
    } else if (schema.type === "boolean") {
      if (typeof value !== "boolean") return false;
    } else if (schema.type === "array") {
      if (!Array.isArray(value)) return false;
      if ("minItems" in schema && value.length < schema.minItems) return false;
      if ("maxItems" in schema && value.length > schema.maxItems) return false;
    }

    return true;
  }
}

// Create singleton instance
const configManager = new ConfigManager();

export default configManager;
