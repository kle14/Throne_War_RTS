/**
 * ResourceLoader - Manages loading and caching game assets
 * Supports images, audio, JSON data, and other file types
 */
class ResourceLoader {
  constructor() {
    // Resource storage
    this.resources = {
      images: new Map(),
      audio: new Map(),
      json: new Map(),
      other: new Map(),
    };

    // Resource status tracking
    this.loading = new Map();
    this.failed = new Set();

    // Statistics
    this.stats = {
      totalLoaded: 0,
      totalFailed: 0,
      totalRequested: 0,
      loadTime: 0,
    };

    // Event callbacks
    this.callbacks = {
      progress: [],
      complete: [],
      error: [],
    };

    // Default base path for assets
    this.basePath = "assets/";

    // Cache settings
    this.cacheEnabled = true;
  }

  /**
   * Set base path for all resource URLs
   * @param {string} path - Base path for assets
   */
  setBasePath(path) {
    this.basePath = path.endsWith("/") ? path : path + "/";
  }

  /**
   * Enable or disable caching
   * @param {boolean} enabled - Whether caching is enabled
   */
  setCaching(enabled) {
    this.cacheEnabled = enabled;
  }

  /**
   * Resolve path with base path
   * @param {string} path - Resource path
   * @returns {string} Full resource path
   * @private
   */
  _resolvePath(path) {
    // If path is absolute or starts with data: or blob:, return as is
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:") ||
      path.startsWith("blob:") ||
      path.startsWith("/")
    ) {
      return path;
    }

    return this.basePath + path;
  }

  /**
   * Get resource type based on extension
   * @param {string} path - Resource path
   * @returns {string} Resource type (images, audio, json, other)
   * @private
   */
  _getResourceType(path) {
    const extension = path.split(".").pop().toLowerCase();

    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) {
      return "images";
    }

    if (["mp3", "ogg", "wav", "flac"].includes(extension)) {
      return "audio";
    }

    if (extension === "json") {
      return "json";
    }

    return "other";
  }

  /**
   * Register event callback
   * @param {string} event - Event type (progress, complete, error)
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  /**
   * Remove event callback
   * @param {string} event - Event type
   * @param {Function} callback - Callback to remove
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Trigger event callbacks
   * @param {string} event - Event type
   * @param {*} data - Event data
   * @private
   */
  _triggerEvent(event, data) {
    if (this.callbacks[event]) {
      for (const callback of this.callbacks[event]) {
        callback(data);
      }
    }
  }

  /**
   * Load a single image resource
   * @param {string} path - Image path
   * @returns {Promise<HTMLImageElement>} Promise resolving to loaded image
   * @private
   */
  _loadImage(path) {
    return new Promise((resolve, reject) => {
      const fullPath = this._resolvePath(path);

      // Check if already cached
      if (this.cacheEnabled && this.resources.images.has(path)) {
        resolve(this.resources.images.get(path));
        return;
      }

      // Track loading state
      this.loading.set(path, "loading");

      const image = new Image();

      image.onload = () => {
        this.resources.images.set(path, image);
        this.loading.delete(path);
        this.stats.totalLoaded++;
        resolve(image);
      };

      image.onerror = (error) => {
        this.loading.delete(path);
        this.failed.add(path);
        this.stats.totalFailed++;
        reject(new Error(`Failed to load image: ${path}`));
      };

      // Add cache busting if caching disabled
      image.src = this.cacheEnabled ? fullPath : `${fullPath}?t=${Date.now()}`;
    });
  }

  /**
   * Load a single audio resource
   * @param {string} path - Audio path
   * @returns {Promise<HTMLAudioElement>} Promise resolving to loaded audio
   * @private
   */
  _loadAudio(path) {
    return new Promise((resolve, reject) => {
      const fullPath = this._resolvePath(path);

      // Check if already cached
      if (this.cacheEnabled && this.resources.audio.has(path)) {
        resolve(this.resources.audio.get(path));
        return;
      }

      // Track loading state
      this.loading.set(path, "loading");

      const audio = new Audio();

      audio.oncanplaythrough = () => {
        this.resources.audio.set(path, audio);
        this.loading.delete(path);
        this.stats.totalLoaded++;
        resolve(audio);
      };

      audio.onerror = (error) => {
        this.loading.delete(path);
        this.failed.add(path);
        this.stats.totalFailed++;
        reject(new Error(`Failed to load audio: ${path}`));
      };

      // Add cache busting if caching disabled
      audio.src = this.cacheEnabled ? fullPath : `${fullPath}?t=${Date.now()}`;
      audio.load();
    });
  }

  /**
   * Load a single JSON resource
   * @param {string} path - JSON path
   * @returns {Promise<Object>} Promise resolving to parsed JSON
   * @private
   */
  _loadJSON(path) {
    return new Promise((resolve, reject) => {
      const fullPath = this._resolvePath(path);

      // Check if already cached
      if (this.cacheEnabled && this.resources.json.has(path)) {
        resolve(this.resources.json.get(path));
        return;
      }

      // Track loading state
      this.loading.set(path, "loading");

      fetch(this.cacheEnabled ? fullPath : `${fullPath}?t=${Date.now()}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          this.resources.json.set(path, data);
          this.loading.delete(path);
          this.stats.totalLoaded++;
          resolve(data);
        })
        .catch((error) => {
          this.loading.delete(path);
          this.failed.add(path);
          this.stats.totalFailed++;
          reject(new Error(`Failed to load JSON: ${path}`));
        });
    });
  }

  /**
   * Load other file types
   * @param {string} path - File path
   * @returns {Promise<ArrayBuffer|string>} Promise resolving to file data
   * @private
   */
  _loadOther(path, options = {}) {
    return new Promise((resolve, reject) => {
      const fullPath = this._resolvePath(path);

      // Check if already cached
      if (this.cacheEnabled && this.resources.other.has(path)) {
        resolve(this.resources.other.get(path));
        return;
      }

      // Track loading state
      this.loading.set(path, "loading");

      const responseType = options.responseType || "text";

      fetch(this.cacheEnabled ? fullPath : `${fullPath}?t=${Date.now()}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }

          if (responseType === "arrayBuffer") {
            return response.arrayBuffer();
          } else {
            return response.text();
          }
        })
        .then((data) => {
          this.resources.other.set(path, data);
          this.loading.delete(path);
          this.stats.totalLoaded++;
          resolve(data);
        })
        .catch((error) => {
          this.loading.delete(path);
          this.failed.add(path);
          this.stats.totalFailed++;
          reject(new Error(`Failed to load file: ${path}`));
        });
    });
  }

  /**
   * Load a single resource
   * @param {string} path - Resource path
   * @param {Object} options - Loading options
   * @returns {Promise<any>} Promise resolving to loaded resource
   */
  load(path, options = {}) {
    this.stats.totalRequested++;

    const resourceType = options.type || this._getResourceType(path);

    switch (resourceType) {
      case "images":
        return this._loadImage(path);
      case "audio":
        return this._loadAudio(path);
      case "json":
        return this._loadJSON(path);
      default:
        return this._loadOther(path, options);
    }
  }

  /**
   * Load multiple resources
   * @param {string[]} paths - Array of resource paths
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Promise resolving to loaded resources
   */
  loadMany(paths, options = {}) {
    const startTime = performance.now();
    const total = paths.length;
    let loaded = 0;

    // Create a map of results
    const results = {};

    // Process each resource and report progress
    const promises = paths.map((path) => {
      return this.load(path, options)
        .then((resource) => {
          loaded++;

          // Calculate progress percentage
          const progress = (loaded / total) * 100;

          // Trigger progress event
          this._triggerEvent("progress", {
            path,
            loaded,
            total,
            progress,
            resource,
          });

          // Add to results
          results[path] = resource;

          return resource;
        })
        .catch((error) => {
          this._triggerEvent("error", {
            path,
            error,
          });

          // Add null to results
          results[path] = null;

          // If not required, continue without failing
          if (options.required !== false) {
            throw error;
          }
        });
    });

    // Wait for all resources to load
    return Promise.all(promises)
      .then(() => {
        // Update stats
        this.stats.loadTime += performance.now() - startTime;

        // Trigger complete event
        this._triggerEvent("complete", {
          resources: results,
          stats: this.getStats(),
        });

        return results;
      })
      .catch((error) => {
        console.error("Resource loading failed:", error);
        throw error;
      });
  }

  /**
   * Preload resources in batches
   * @param {Object} manifest - Resource manifest
   * @param {number} batchSize - Number of resources to load simultaneously
   * @returns {Promise<Object>} Promise resolving to all loaded resources
   */
  preload(manifest, batchSize = 5) {
    const allPaths = [];
    const results = {};

    // Process manifest
    for (const [key, value] of Object.entries(manifest)) {
      if (typeof value === "string") {
        // Simple path
        allPaths.push(value);
      } else if (Array.isArray(value)) {
        // Array of paths
        allPaths.push(...value);
      } else if (typeof value === "object") {
        // Object with paths
        for (const path of Object.values(value)) {
          if (typeof path === "string") {
            allPaths.push(path);
          }
        }
      }
    }

    // Start with first batch
    const processBatch = (index) => {
      // Get slice of resources for this batch
      const batch = allPaths.slice(index, index + batchSize);

      // If batch is empty, we're done
      if (batch.length === 0) {
        return Promise.resolve(results);
      }

      // Load the batch
      return this.loadMany(batch).then((batchResults) => {
        // Merge results
        Object.assign(results, batchResults);

        // Process next batch
        return processBatch(index + batchSize);
      });
    };

    // Start processing
    return processBatch(0);
  }

  /**
   * Get a loaded resource
   * @param {string} path - Resource path
   * @returns {any} Loaded resource or null if not found
   */
  get(path) {
    const resourceType = this._getResourceType(path);

    return this.resources[resourceType].get(path) || null;
  }

  /**
   * Check if resource is loaded
   * @param {string} path - Resource path
   * @returns {boolean} Whether resource is loaded
   */
  isLoaded(path) {
    const resourceType = this._getResourceType(path);

    return this.resources[resourceType].has(path);
  }

  /**
   * Check if resource is loading
   * @param {string} path - Resource path
   * @returns {boolean} Whether resource is currently loading
   */
  isLoading(path) {
    return this.loading.has(path);
  }

  /**
   * Check if resource loading failed
   * @param {string} path - Resource path
   * @returns {boolean} Whether resource loading failed
   */
  hasFailed(path) {
    return this.failed.has(path);
  }

  /**
   * Get loading statistics
   * @returns {Object} Loading statistics
   */
  getStats() {
    return {
      ...this.stats,
      loadProgress:
        (this.stats.totalLoaded / (this.stats.totalRequested || 1)) * 100,
      totalCached: this.getCachedCount(),
      totalResources: this.getTotalCount(),
    };
  }

  /**
   * Get total number of cached resources
   * @returns {number} Total cached resources
   */
  getCachedCount() {
    return (
      this.resources.images.size +
      this.resources.audio.size +
      this.resources.json.size +
      this.resources.other.size
    );
  }

  /**
   * Get total number of resources (loaded, loading, failed)
   * @returns {number} Total resources
   */
  getTotalCount() {
    return this.getCachedCount() + this.loading.size + this.failed.size;
  }

  /**
   * Clear cached resources
   * @param {string} [type] - Resource type to clear (all if not specified)
   */
  clearCache(type) {
    if (type) {
      this.resources[type].clear();
    } else {
      for (const cache of Object.values(this.resources)) {
        cache.clear();
      }
    }
  }

  /**
   * Create a resource manifest from a directory listing
   * @param {Object} listing - Directory listing
   * @param {string} [baseDir] - Base directory path
   * @returns {Object} Resource manifest
   */
  createManifestFromListing(listing, baseDir = "") {
    const manifest = {};

    for (const [key, value] of Object.entries(listing)) {
      if (typeof value === "string") {
        // File
        const path = baseDir ? `${baseDir}/${value}` : value;
        manifest[key] = path;
      } else if (Array.isArray(value)) {
        // Array of files
        manifest[key] = value.map((file) => {
          return baseDir ? `${baseDir}/${file}` : file;
        });
      } else if (typeof value === "object") {
        // Subdirectory
        const subDir = baseDir ? `${baseDir}/${key}` : key;
        manifest[key] = this.createManifestFromListing(value, subDir);
      }
    }

    return manifest;
  }
}

// Create a singleton instance
const resourceLoader = new ResourceLoader();

export default resourceLoader;
