# Throne Wars RTS Game

A real-time strategy game with hexagonal grid-based movement.

## Project Structure

The codebase is being migrated to a new, more organized structure:

- `config/`: Configuration files, constants, and settings
- `entities/`: Game entities
  - `base/`: Base entity classes (Entity, Mobile, Static)
  - `units/`: Unit classes (Character, Vehicle, etc.)
  - `buildings/`: Building classes
- `utils/`: Utility functions and classes (PathFinding, etc.)
- `core/`: Core game systems (event bus, state management, etc.)
- `ui/`: User interface components
- `scenes/`: Game scenes
- `assets/`: Game assets (images, audio, etc.)

> **Note:** The project is currently in a transition period migrating from the old structure (`js/` directory) to the new structure. See [MIGRATION.md](./MIGRATION.md) for details.

## Getting Started

1. Clone the repository
2. Open `index.html` in a web browser
3. For development, use a local server to avoid CORS issues:
   ```
   npx http-server -c-1
   ```

## Development

### Using the New Structure

All new code should use the ES modules format:

```javascript
// Import dependencies
import { Mobile } from "../entities/base/mobile.js";
import { CONSTANTS } from "../config/constants.js";

// Export your class
export class MyNewUnit extends Mobile {
  constructor(scene, props = {}, x = 0, y = 0) {
    super(scene, props, x, y);
    // Your code here
  }
}

export default MyNewUnit;
```

## Key Features

- Hexagonal grid-based movement
- Pathfinding and path visualization
- Unit selection and commands
- Various unit types with different abilities
- Building placement
- Resource management

## Architecture

The game uses a component-based architecture with a central event system. Key systems include:

- `EventBus`: Central communication system
- `StateManager`: Game state management
- `InputManager`: Player input handling
- `Grid`: Hexagonal grid management
- `PathFinder`: A\* pathfinding for units

## License

All rights reserved.
