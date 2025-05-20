# Map System for Throne Wars RTS

This directory contains the map system for Throne Wars RTS. The system is designed to allow for easy creation and loading of different maps for the game.

## Directory Structure

```
maps/
├── base/                  # Base maps included with the game
│   ├── default_map.js     # The original default map
│   └── island_map.js      # An island-based map
│
├── templates/             # Templates to use as starting points for new maps
│   └── map_template.js    # Basic template with comments
│
├── utils/                 # Utility functions for maps
│   └── map-loader.js      # Map loading functionality
│
├── map-registry.js        # Central registry of all available maps
└── README.md              # This documentation file
```

## How Maps Work

Maps in Throne Wars are hex-based grids with various terrain types (currently land and water). Maps contain the following information:

- Basic metadata (id, name, description, author, version)
- Terrain layout (a 2D array where 1 = land, 0 = water)
- Starting positions for players
- Resource locations (gold mines, etc.)
- Optional: Special objectives, victory conditions, etc.

The game uses a hex grid with axial coordinate system (q,r) for precise positioning.

## How to Create a New Map

1. Start by copying the `templates/map_template.js` file to the `base/` directory with a descriptive name (e.g., `my_new_map.js`).

2. Modify the map data:

   - Assign a unique `id` for your map
   - Update the metadata (name, description, etc.)
   - Design your terrain layout in the `terrain` 2D array
   - Set player starting positions
   - Add resource locations

3. Register your map in `map-registry.js`:

   - Import your map: `import { myNewMap } from './base/my_new_map.js';`
   - Add it to the `mapRegistry` object: `myMapId: myNewMap`

4. Use the map in game by loading it with `mapLoader.loadMap('myMapId', scene)`

## Terrain Types

Currently, the map system supports two terrain types:

- `1` = Land/Grass (units can move here)
- `0` = Water/Ocean (units cannot move here)

Future development may add additional terrain types.

## Testing Your Map

To test your map, load it using the map loader:

```javascript
import mapLoader from "./maps/utils/map-loader.js";

// In your game's create function:
mapLoader.loadMap("myMapId", this);
```

## Best Practices

1. Keep map sizes reasonable (the default is 12x10)
2. Make sure your map has balanced starting positions
3. Include resources in fair distributions
4. Test your map for gameplay balance
5. Document any special features in comments

## Future Enhancements

Planned enhancements for the map system:

- Support for additional terrain types (forests, mountains, etc.)
- Dynamic map generation
- Editor for creating maps in-game
- Map sharing functionality
