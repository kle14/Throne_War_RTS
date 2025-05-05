/**
 * Prepare Migration Script
 *
 * This script creates all necessary directories for the new file structure
 * and can be used to help with migration from the old structure.
 */
const fs = require("fs");
const path = require("path");

// Base directory
const basePath = path.join(__dirname, "..");

// Directories to ensure exist
const directories = [
  "config",
  "entities",
  "entities/base",
  "entities/units",
  "entities/buildings",
  "utils",
  "core",
  "ui",
  "scenes",
  "assets",
  "assets/images",
  "assets/audio",
];

// Create directories if they don't exist
directories.forEach((dir) => {
  const dirPath = path.join(basePath, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

console.log("Directory structure prepared for migration.");

// Create a README.md file with migration instructions
const readmePath = path.join(basePath, "MIGRATION.md");
const readmeContent = `# Migration Guide

## New File Structure

The codebase is being migrated from the old structure to a new, more organized structure:

- \`config/\`: Configuration files, constants, and settings
- \`entities/\`: Game entities
  - \`base/\`: Base entity classes (Entity, Mobile, Static)
  - \`units/\`: Unit classes (Character, Vehicle, etc.)
  - \`buildings/\`: Building classes
- \`utils/\`: Utility functions and classes (PathFinding, etc.)
- \`core/\`: Core game systems (event bus, state management, etc.)
- \`ui/\`: User interface components
- \`scenes/\`: Game scenes
- \`assets/\`: Game assets (images, audio, etc.)

## Migration Steps

1. The compatibility layer in \`js/compat.js\` provides backwards compatibility
2. New code should use the new structure and imports
3. Gradually migrate existing classes to the new structure

## Import Examples

Old way:
\`\`\`javascript
// Global variables were used
const tank = new Tank(scene, props, x, y);
\`\`\`

New way:
\`\`\`javascript
import { Tank } from '../entities/units/tank.js';
const tank = new Tank(scene, props, x, y);
\`\`\`

## Class Hierarchy

- Entity (base/entity.js)
  - Static (base/static.js) - For buildings and non-moving objects
  - Mobile (base/mobile.js) - For moving objects
    - Character (units/character.js) - For units like infantry
    - Vehicle (units/vehicle.js) - For vehicles like tanks
`;

fs.writeFileSync(readmePath, readmeContent);
console.log("Migration guide created at MIGRATION.md");

// Log a summary of what was done
console.log("\nMigration preparation complete!");
console.log("Next steps:");
console.log("1. Gradually move classes from js/ to their new locations");
console.log("2. Update imports in files that use the moved classes");
console.log(
  "3. Test thoroughly after each move to ensure everything still works"
);
console.log("4. Once complete, remove the compatibility layer (js/compat.js)");
