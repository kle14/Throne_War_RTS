# Throne Wars RTS Codebase Structure

## Overview

This document outlines the structure and organization of the Throne Wars RTS codebase. The game is built using JavaScript with Phaser as the rendering engine and follows a modular, component-based architecture. It is designed to support both single-player gameplay and online multiplayer with matchmaking and ranking systems.

## Directory Structure

### Frontend Game Core

```
frontend/game/
├── config/                               # Game configuration
│   ├── constants.js                      # Game constants
│   ├── building-types.js                 # Building types configuration
│   └── unit-types.js                     # Unit types configuration
├── core/                                 # Core game systems
│   ├── game.js                           # Main game initialization
│   ├── input.js                          # Input handling
│   ├── event-bus.js                      # Event system
│   ├── state-manager.js                  # Game state management
│   ├── game-loop.js                      # Game loop
│   ├── grid.js                           # Hex grid system
│   ├── asset-manager.js                  # Asset loading and management
│   ├── debug-manager.js                  # Debugging utilities
│   ├── resource-loader.js                # Resource loading
│   └── config-manager.js                 # Configuration management
├── entities/                             # Game entities
│   ├── base/                             # Base classes
│   │   ├── entity.js                     # Base entity class
│   │   ├── mobile.js                     # Base for mobile entities
│   │   └── static.js                     # Base for static entities
│   ├── units/                            # Unit types
│   │   ├── character.js                  # Base character class
│   │   ├── vehicle.js                    # Base vehicle class
│   │   ├── infantry/                     # Infantry unit types
│   │   │   ├── infantry.js
│   │   │   ├── engineer.js
│   │   │   ├── scout.js
│   │   │   ├── sniper.js
│   │   │   └── rocketeer.js
│   │   └── vehicles/                     # Vehicle unit types
│   │       └── tank.js
│   └── buildings/                        # Building types
│       ├── building.js                   # Base building class
│       ├── shop.js                       # Shop UI/functionality
│       ├── production/                   # Production buildings
│       ├── resource/                     # Resource buildings
│       └── defensive/                    # Defensive buildings
├── systems/                              # Game systems
│   ├── combat/                           # Combat system
│   ├── economy/                          # Economy system
│   │   ├── player-economy.js
│   │   └── economy-ui.js
│   ├── pathfinding/                      # Pathfinding system
│   ├── ai/                               # AI system
│   ├── players/                          # Player management
│   │   └── player.js
│   └── factories/                        # Factory classes
│       └── unitFactory.js
├── utils/                                # Utility functions
│   ├── pathfinding.js                    # Pathfinding utilities
│   ├── path-visualizer.js                # Path visualization
│   ├── browser-shim.js                   # Browser compatibility
│   └── compat.js                         # Backward compatibility
├── assets/                               # Game assets
│   ├── images/
│   └── audio/
├── network/                              # Network components (See detailed section below)
└── index.html                            # Main entry point
```

### Frontend Network Components

```
frontend/game/network/
├── connection/                           # Connection management
│   ├── socket-manager.js                 # WebSocket management
│   ├── connection-state.js               # Connection state tracking
│   └── session-handler.js                # Client session handling
├── synchronization/                      # State synchronization
│   ├── entity-syncer.js                  # Entity sync management
│   ├── state-reconciliation.js           # State reconciliation
│   └── snapshot-manager.js               # Game state snapshots
├── prediction/                           # Client-side prediction
│   ├── input-buffer.js                   # Input command buffer
│   ├── movement-prediction.js            # Movement prediction
│   └── command-predictor.js              # Command prediction
├── serialization/                        # Data serialization
│   ├── serializer.js                     # Main serialization
│   ├── entity-serialization.js           # Entity serialization
│   └── message-packer.js                 # Message compression
├── messages/                             # Message definitions
│   ├── message-types.js                  # Message type constants
│   ├── command-messages.js               # Player command messages
│   ├── state-messages.js                 # Game state messages
│   └── auth-messages.js                  # Authentication messages
└── protocol/                             # Network protocol
    ├── protocol-definitions.js           # Protocol specs
    └── message-handlers.js               # Message handling
```

### Backend (Server) Components

```
backend/
├── game/
│   ├── server.js                         # Main server entry point
│   ├── config/                           # Server configuration
│   │   ├── config.js                     # Environment-specific config
│   │   └── constants.js                  # Server-side constants
│   ├── simulation/                       # Game simulation on server
│   │   ├── simulation.js                 # Main simulation controller
│   │   ├── game-loop.js                  # Server-side game loop
│   │   ├── entities/                     # Server-side entity implementations
│   │   ├── systems/                      # Server-side game systems
│   │   ├── core/                         # Core simulation logic
│   │   └── events/                       # Server-side event handling
│   ├── auth/                             # Authentication system
│   │   ├── auth-controller.js            # Authentication endpoints
│   │   ├── auth-service.js               # Authentication business logic
│   │   ├── user-model.js                 # User data model
│   │   └── session-manager.js            # Session management
│   ├── matchmaking/                      # Matchmaking system
│   │   ├── matchmaking-service.js        # Matchmaking service
│   │   ├── match-controller.js           # Match management
│   │   ├── queue-manager.js              # Player queue management
│   │   └── match-maker.js                # Player matching algorithms
│   ├── rankings/                         # Ranking and leaderboard
│   │   ├── ranking-service.js            # Ranking service
│   │   ├── elo-calculator.js             # ELO calculation
│   │   └── leaderboard-manager.js        # Leaderboard management
│   ├── api/                              # RESTful API
│   │   ├── routes.js                     # API routes
│   │   ├── controllers.js                # API controllers
│   │   └── middleware.js                 # API middleware
│   ├── middleware/                       # Server middleware
│   ├── database/                         # Database interactions
│   └── utils/                            # Server utilities
└── package.json                          # Backend dependencies
```

### Shared Code (Used by Both Client & Server)

```
shared/
├── entities/                             # Shared entity definitions
│   ├── entity-schemas.js                 # Entity data schemas
│   └── entity-types.js                   # Entity type constants
├── systems/                              # Shared game rules
│   ├── combat-rules.js                   # Combat calculations
│   ├── movement-rules.js                 # Movement rules
│   └── economy-rules.js                  # Economy rules
├── utils/                                # Shared utilities
│   ├── math.js                           # Math utilities
│   ├── serialization.js                  # Serialization helpers
│   ├── validation.js                     # Input validation
│   └── constants.js                      # Shared constants
└── config/                               # Shared configuration
    ├── network-config.js                 # Network parameters
    └── game-rules.js                     # Game rules constants
```

## Class Hierarchy

### Core Game Entities

```
Entity (base/entity.js)
├── Static (base/static.js) - Buildings, resources, etc.
│   └── Building (buildings/building.js)
│       ├── ProductionBuilding
│       ├── ResourceBuilding
│       └── DefensiveBuilding
└── Mobile (base/mobile.js) - Moving objects
    ├── Character (units/character.js) - Infantry units
    │   ├── Infantry
    │   ├── Engineer/Builder
    │   ├── Scout
    │   ├── Sniper
    │   └── Rocketeer
    └── Vehicle (units/vehicle.js) - Vehicles
        └── Tank
```

### Multiplayer Component Relationships

```
Client Side                               Server Side
---------------                          ---------------
SocketManager <-----------------------> GameServer
     |                                      |
EntitySyncer <------------------------> EntityManager
     |                                      |
StateReconciliation <-----------------> SimulationManager
     |                                      |
CommandPredictor <--------------------> CommandProcessor
     |                                      |
NetworkEntityWrapper <----------------> AuthoritativeEntity
```

## Core Game Systems

### Game Initialization

The game is initialized in `core/game.js`, which sets up:

- Phaser game instance
- Game configuration
- Scene creation
- Input handling
- UI initialization

In multiplayer mode, it also initializes:

- Network connections
- Session management
- Multiplayer UI elements

### Player System

The player system in `systems/players/player.js` manages:

- Player resources
- Owned units and buildings
- Economy tracking
- Unit production

For multiplayer, it interfaces with:

- Network synchronization
- Authority validation
- Remote player representation

### Economy System

The economy system in `systems/economy/` handles:

- Resource tracking and management
- Income and expenses
- UI for displaying economic data

### Unit Factory

The unit factory in `systems/factories/unitFactory.js` provides:

- Centralized unit creation
- Unit placement logic
- Unit property initialization

## Multiplayer Architecture

### Network Layer

The network layer handles all communication between client and server:

1. **Connection Management**

   - WebSocket connections are managed by `socket-manager.js`
   - Connection state tracking in `connection-state.js`
   - Reconnection handling and session recovery

2. **Message Protocol**

   - Binary serialization for efficiency
   - Message types defined in `messages/message-types.js`
   - Message validation before processing

3. **State Synchronization**
   - Server is the authority on game state
   - Delta compression reduces bandwidth usage
   - Snapshots for periodic full state sync

### Client-Side Prediction

To provide responsive gameplay despite network latency:

1. **Input Prediction**

   - Local commands are applied immediately
   - Commands are simultaneously sent to server
   - Input sequence numbering for reconciliation

2. **Movement Prediction**

   - Client predicts entity movement
   - Server validates and corrects if needed
   - Client reconciles differences with server state

3. **Reconciliation Process**
   - Server sends authoritative state updates
   - Client reapplies unprocessed input commands
   - Visual smoothing for player experience

### Server Authority Model

The server maintains authority over the game state:

1. **Simulation Loop**

   - Fixed time step for consistent simulation
   - Command validation and execution
   - State broadcast to connected clients

2. **Anti-Cheat Measures**

   - Server validates all player actions
   - Movement and action rate limiting
   - Abnormal behavior detection

3. **State Broadcast**
   - Prioritized updates for important entities
   - Area-of-interest filtering
   - Latency compensation

### Matchmaking System

The matchmaking system pairs players for multiplayer games:

1. **Queue Management**

   - Players enter matchmaking queue
   - Optional filters for game modes/maps
   - Timeout handling for unpaired players

2. **Skill-Based Matching**

   - ELO or skill rating used for balanced matches
   - Gradually expanding skill range over time
   - Optional team balancing for team games

3. **Match Creation**
   - Server allocation for new matches
   - Player notification of match found
   - Session setup and initialization

### Ranking System

The ranking system tracks player performance:

1. **ELO Calculation**

   - Win/loss rating adjustments
   - Rating certainty model
   - Rating protection for new players

2. **Seasons and Leaderboards**

   - Regular season resets
   - Global and regional leaderboards
   - Rank tiers and visual indicators

3. **Stats Tracking**
   - Win/loss record
   - Performance metrics
   - Historical data for progression

## Shared Code

The shared code is used by both client and server to ensure consistent behavior:

1. **Entity Schemas**

   - Defines data structure for all entities
   - Validation rules for entity properties
   - Common entity behavior

2. **Game Rules**

   - Combat calculations must be identical on client/server
   - Movement rules for path validation
   - Economy rules for resource calculations

3. **Utilities**
   - Math functions for deterministic calculations
   - Serialization helpers for consistent data format
   - Validation functions for input sanitization

## Working With The Codebase

### Creating New Units

To create a new unit type:

1. Decide whether the unit is a Character or Vehicle
2. Create a new class extending the appropriate base class
3. Implement required methods (draw, update, etc.)
4. Add the unit to the UnitFactory
5. For multiplayer, add appropriate serialization logic

Example:

```javascript
// in entities/units/infantry/medic.js
import { Character } from "../character.js";

export class Medic extends Character {
  constructor(scene, props = {}, x = 0, y = 0) {
    super(scene, props, x, y);
    this.type = "medic";
    this.healAmount = props.healAmount || 20;
    this.healRadius = props.healRadius || 100;

    // Initialize specific properties
    this.draw();
  }

  // Add custom methods
  heal(unit) {
    // Healing logic
  }

  // Override parent methods as needed
  update() {
    super.update();
    // Custom update logic
  }

  // For multiplayer, implement serializeState and deserializeState
  serializeState() {
    const baseState = super.serializeState();
    return {
      ...baseState,
      healAmount: this.healAmount,
      healRadius: this.healRadius,
    };
  }

  deserializeState(state) {
    super.deserializeState(state);
    this.healAmount = state.healAmount;
    this.healRadius = state.healRadius;
  }
}

export default Medic;
```

### Creating New Buildings

To create a new building:

1. Decide which type of building (Production, Resource, Defensive)
2. Create a new class extending Building
3. Implement required methods
4. Add to building types configuration
5. Implement network serialization for multiplayer

### Implementing Network Logic

To add network functionality to a component:

1. Identify state that needs synchronization
2. Implement serialization methods
3. Register with EntitySyncer
4. Add authority validation on server side
5. Test with simulated latency

Example:

```javascript
// Client-side serialization
class Tank extends Vehicle {
  // ... other methods

  serializeCommand(command) {
    return {
      id: this.id,
      type: command.type,
      targetX: command.targetX,
      targetY: command.targetY,
      timestamp: Date.now(),
      sequenceNumber: this.nextSequenceNumber++,
    };
  }

  applyServerCorrection(serverState) {
    // Apply position from server
    this.x = serverState.x;
    this.y = serverState.y;

    // Re-apply pending inputs
    this.pendingInputs.forEach((input) => {
      this.processInput(input);
    });
  }
}
```

## Multiplayer Development Guidelines

### 1. Authority Division

Always follow the authority division principle:

- **Server**: Authority over game state, validation, random numbers
- **Client**: Visual presentation, user input, prediction

Never trust client data without validation on the server side.

### 2. Deterministic Behavior

For proper prediction and reconciliation:

- Ensure identical behavior between client and server
- Use shared code for game logic
- Avoid local random number generation for gameplay elements
- Use fixed time steps for simulation

### 3. Bandwidth Optimization

Optimize network traffic:

- Send only changed data (delta encoding)
- Prioritize important entities
- Use binary serialization
- Compress repeated data patterns
- Implement interest management (send only what each player needs)

### 4. Latency Handling

Implement proper latency compensation:

- Always show responsive feedback to player actions
- Use client prediction for all player-controlled entities
- Apply visual smoothing for remote entity updates
- Implement interpolation or extrapolation as appropriate

### 5. Testing & Debugging

For effective multiplayer testing:

- Test with simulated latency and packet loss
- Create visualization tools for network events
- Log sequence numbers and timestamps for troubleshooting
- Implement detailed server logs for authority decisions

## Performance Considerations

1. **Object Pooling**: Reuse objects for frequently created entities
2. **Batch Updates**: Group similar operations
3. **Minimize DOM Updates**: Keep UI changes efficient
4. **Use Sprite Sheets**: For better rendering performance
5. **Optimize Pathfinding**: Limit path recalculations
6. **Network Payload Size**: Monitor and optimize message size
7. **Binary Serialization**: Use binary formats for network data
8. **Update Frequency**: Balance responsiveness against bandwidth

## Error Handling and Resilience

For a robust multiplayer experience:

1. **Disconnection Handling**

   - Graceful connection loss handling
   - Reconnection with state recovery
   - Player absent mechanics (AI takeover or pause)

2. **Desynchonization Recovery**

   - Detection of client-server state mismatch
   - Forced state resets when necessary
   - Analytics for desync causes

3. **Server Resilience**
   - Match state persistence
   - Server failover mechanisms
   - Game state recovery

## Debugging Tools

The game includes debugging tools accessible through:

1. **Debug Mode**

   - Toggle with F9 in game
   - Visual indicators for prediction/correction
   - Network status display
   - Bandwidth usage metrics

2. **Logging**

   - Command sequence logging
   - State reconciliation events
   - Authority decisions
   - Performance metrics

3. **Visual Debugging**
   - Entity sync visualization
   - Latency simulation
   - Hitbox and collision displays
   - Pathfinding visualization

## Implementation Roadmap

For implementing multiplayer functionality:

1. **Phase 1: Infrastructure**

   - Set up WebSocket server
   - Implement basic connection management
   - Create serialization framework
   - Build authentication system

2. **Phase 2: Core Synchronization**

   - Entity synchronization
   - Input prediction framework
   - State reconciliation
   - Basic two-player matches

3. **Phase 3: Game Systems**

   - Combat reconciliation
   - Building placement
   - Resource management sync
   - Full gameplay feature parity

4. **Phase 4: Matchmaking & Rankings**

   - Player profile system
   - Matchmaking queue
   - Rating calculations
   - Leaderboards

5. **Phase 5: Optimization & Polish**
   - Bandwidth optimization
   - Latency compensation improvements
   - Anti-cheat measures
   - Connection quality handling
