/**
 * Browser compatibility shim
 *
 * This module provides compatibility for:
 * 1. The browser object (as a reference to window if it doesn't exist)
 * 2. Stub implementations for onpage-dialog.preload.js
 * 3. Other browser compatibility issues
 */

(function () {
  console.log("Browser compatibility shim initializing...");

  if (typeof window !== "undefined") {
    // Define browser global if it doesn't exist (fixes "browser is not defined" errors)
    if (typeof browser === "undefined") {
      window.browser = window;
      console.log("Browser shim: Defined browser global variable");
    }

    // Handle onpage-dialog.preload.js errors by creating stub functions
    // This prevents errors with external scripts that might expect these objects
    window.onpageDialogLoaded = true;

    // Create stubs for any onpage-dialog functions that might be called
    if (!window.onpageDialog) {
      window.onpageDialog = {
        preload: {
          init: function () {
            console.log("Stub onpageDialog.preload.init called");
            return true;
          },
          start: function () {
            console.log("Stub onpageDialog.preload.start called");
            return true;
          },
        },
      };
      console.log("Browser shim: Created onpageDialog stubs");
    }

    console.log("Browser compatibility shim initialized successfully");
  } else {
    console.warn("Window object not defined, browser shim not applied");
  }
})();

// Export an empty object to support ES module imports if needed
export default {};
