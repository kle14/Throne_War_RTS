import eventBus from "./event-bus.js";

/**
 * AssetManager - Handles the loading, caching and management of game assets
 * Supports images, audio, JSON data and other asset types
 */
class AssetManager {
  constructor() {
    // Stores all loaded assets by type and id
    this.assets = {
      images: {},
      audio: {},
      json: {},
      data: {},
    };

    // Track loading progress
    this.totalAssets = 0;
    this.loadedAssets = 0;

    // Store asset metadata (size, dimensions, etc.)
    this.metadata = {};

    // Loading states
    this.isLoading = false;
    this.hasErrored = false;
    this.isReady = false;
  }

  /**
   * Load a single image
   * @param {string} id - Unique identifier for the image
   * @param {string} url - URL of the image to load
   * @returns {Promise} Promise that resolves when the image is loaded
   */
  loadImage(id, url) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.assets.images[id] = img;
        this.metadata[id] = {
          type: "image",
          width: img.width,
          height: img.height,
          url,
        };

        this.updateLoadProgress();
        resolve(img);
      };

      img.onerror = (err) => {
        console.error(`Failed to load image: ${url}`, err);
        this.hasErrored = true;
        eventBus.emit("assetLoadError", { id, url, error: err });
        reject(err);
      };

      img.src = url;
      this.totalAssets++;
    });
  }

  /**
   * Load a single audio file
   * @param {string} id - Unique identifier for the audio
   * @param {string} url - URL of the audio to load
   * @returns {Promise} Promise that resolves when the audio is loaded
   */
  loadAudio(id, url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.oncanplaythrough = () => {
        this.assets.audio[id] = audio;
        this.metadata[id] = {
          type: "audio",
          duration: audio.duration,
          url,
        };

        this.updateLoadProgress();
        resolve(audio);
      };

      audio.onerror = (err) => {
        console.error(`Failed to load audio: ${url}`, err);
        this.hasErrored = true;
        eventBus.emit("assetLoadError", { id, url, error: err });
        reject(err);
      };

      audio.src = url;
      this.totalAssets++;
    });
  }

  /**
   * Load JSON data
   * @param {string} id - Unique identifier for the data
   * @param {string} url - URL of the JSON data to load
   * @returns {Promise} Promise that resolves when the data is loaded
   */
  loadJSON(id, url) {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          this.assets.json[id] = data;
          this.metadata[id] = {
            type: "json",
            url,
          };

          this.updateLoadProgress();
          resolve(data);
        })
        .catch((err) => {
          console.error(`Failed to load JSON: ${url}`, err);
          this.hasErrored = true;
          eventBus.emit("assetLoadError", { id, url, error: err });
          reject(err);
        });

      this.totalAssets++;
    });
  }

  /**
   * Load multiple assets at once
   * @param {Object} assets - Object mapping asset IDs to details
   * @returns {Promise} Promise that resolves when all assets are loaded
   */
  loadAssets(assets) {
    this.isLoading = true;
    eventBus.emit("assetLoadStart", { count: Object.keys(assets).length });

    const promises = [];

    for (const [id, details] of Object.entries(assets)) {
      const { type, url } = details;

      switch (type) {
        case "image":
          promises.push(this.loadImage(id, url));
          break;
        case "audio":
          promises.push(this.loadAudio(id, url));
          break;
        case "json":
          promises.push(this.loadJSON(id, url));
          break;
        default:
          console.warn(`Unknown asset type: ${type} for asset: ${id}`);
      }
    }

    return Promise.all(promises)
      .then((results) => {
        this.isLoading = false;
        this.isReady = true;
        eventBus.emit("assetsLoaded", { count: results.length });
        return results;
      })
      .catch((err) => {
        this.isLoading = false;
        this.hasErrored = true;
        eventBus.emit("assetLoadFailed", { error: err });
        throw err;
      });
  }

  /**
   * Update the loading progress and emit an event
   * @private
   */
  updateLoadProgress() {
    this.loadedAssets++;
    const progress = this.totalAssets
      ? this.loadedAssets / this.totalAssets
      : 0;

    eventBus.emit("assetLoadProgress", {
      loaded: this.loadedAssets,
      total: this.totalAssets,
      progress: progress,
    });
  }

  /**
   * Get an asset by ID
   * @param {string} id - ID of the asset to retrieve
   * @param {string} [type] - Type of asset (image, audio, json)
   * @returns {*} The requested asset or null if not found
   */
  getAsset(id, type) {
    if (type) {
      return this.assets[type][id] || null;
    }

    // Search all asset types if type not specified
    for (const assetType in this.assets) {
      if (this.assets[assetType][id]) {
        return this.assets[assetType][id];
      }
    }

    return null;
  }

  /**
   * Get an image asset
   * @param {string} id - ID of the image to retrieve
   * @returns {HTMLImageElement} The image element or null if not found
   */
  getImage(id) {
    return this.assets.images[id] || null;
  }

  /**
   * Get an audio asset
   * @param {string} id - ID of the audio to retrieve
   * @returns {HTMLAudioElement} The audio element or null if not found
   */
  getAudio(id) {
    return this.assets.audio[id] || null;
  }

  /**
   * Get JSON data
   * @param {string} id - ID of the JSON data to retrieve
   * @returns {Object} The JSON data or null if not found
   */
  getJSON(id) {
    return this.assets.json[id] || null;
  }

  /**
   * Get metadata for an asset
   * @param {string} id - ID of the asset
   * @returns {Object} Metadata for the asset or null if not found
   */
  getMetadata(id) {
    return this.metadata[id] || null;
  }

  /**
   * Check if an asset is loaded
   * @param {string} id - ID of the asset
   * @param {string} [type] - Type of asset (image, audio, json)
   * @returns {boolean} True if the asset is loaded
   */
  isAssetLoaded(id, type) {
    if (type) {
      return !!this.assets[type][id];
    }

    // Check all asset types
    return Object.values(this.assets).some((typeMap) => !!typeMap[id]);
  }

  /**
   * Get loading status
   * @returns {Object} Status object with loading state information
   */
  getStatus() {
    return {
      isLoading: this.isLoading,
      hasErrored: this.hasErrored,
      isReady: this.isReady,
      progress: this.totalAssets ? this.loadedAssets / this.totalAssets : 0,
      loaded: this.loadedAssets,
      total: this.totalAssets,
    };
  }

  /**
   * Clear all loaded assets of a specific type
   * @param {string} [type] - Type of assets to clear (image, audio, json)
   */
  clearAssets(type) {
    if (type) {
      this.assets[type] = {};
      return;
    }

    // Clear all assets if no type specified
    for (const assetType in this.assets) {
      this.assets[assetType] = {};
    }

    this.metadata = {};
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.isReady = false;
  }
}

// Create a singleton instance
const assetManager = new AssetManager();

export default assetManager;
