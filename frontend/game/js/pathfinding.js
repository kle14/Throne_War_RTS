class PathFinder {
  constructor(scene) {
    this.scene = scene;
  }

  // Calculate heuristic (estimated distance between two hexes)
  heuristic(a, b) {
    // Using hex grid distance calculation
    const dx = b.gridPos.col - a.gridPos.col;
    const dy = b.gridPos.row - a.gridPos.row;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Get neighboring hexes (only passable tiles)
  getNeighbors(
    hex,
    passableCheck = (hex) => hex.color === CONSTANTS.COLORS.GRASS
  ) {
    const neighbors = [];
    const hexes = this.scene.hexTiles;
    const { row, col } = hex.gridPos;

    // Possible neighbor offsets depend on whether the current row is odd or even
    let neighborOffsets;
    if (row % 2 === 0) {
      neighborOffsets = [
        { row: -1, col: -1 },
        { row: -1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 },
        { row: 1, col: -1 },
        { row: 1, col: 0 },
      ];
    } else {
      neighborOffsets = [
        { row: -1, col: 0 },
        { row: -1, col: 1 },
        { row: 0, col: -1 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ];
    }

    // Check each potential neighbor
    for (const offset of neighborOffsets) {
      const neighborRow = row + offset.row;
      const neighborCol = col + offset.col;

      // Find the hex at this position
      const neighbor = hexes.find(
        (h) => h.gridPos.row === neighborRow && h.gridPos.col === neighborCol
      );

      // Only add if it passes the custom check (default: is grass)
      if (neighbor && passableCheck(neighbor)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  // Find the shortest path between two hexes using A* algorithm
  findPath(startHex, endHex, passableCheck) {
    if (!startHex || !endHex) return null;

    // A* path finding algorithm
    const openSet = [startHex];
    const closedSet = new Set();
    const cameFrom = new Map();

    // G score is distance from start to current
    const gScore = new Map();
    gScore.set(startHex, 0);

    // F score is estimated total cost (g + heuristic)
    const fScore = new Map();
    fScore.set(startHex, this.heuristic(startHex, endHex));

    while (openSet.length > 0) {
      // Find the node with the lowest fScore
      let current = openSet[0];
      let lowestFScore = fScore.get(current);
      let lowestIndex = 0;

      for (let i = 1; i < openSet.length; i++) {
        const score = fScore.get(openSet[i]);
        if (score < lowestFScore) {
          lowestFScore = score;
          current = openSet[i];
          lowestIndex = i;
        }
      }

      // If reached the end, reconstruct the path
      if (current === endHex) {
        const path = [];
        let curr = current;

        while (cameFrom.has(curr)) {
          path.unshift(curr);
          curr = cameFrom.get(curr);
        }

        return path;
      }

      // Remove current from openSet and add to closedSet
      openSet.splice(lowestIndex, 1);
      closedSet.add(current);

      // Check all neighbors
      const neighbors = this.getNeighbors(current, passableCheck);
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor)) continue;

        // Calculate tentative gScore
        const tentativeGScore = gScore.get(current) + 1;

        // If neighbor is not in openSet, add it
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= gScore.get(neighbor)) {
          // This is not a better path
          continue;
        }

        // This is the best path so far
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(
          neighbor,
          tentativeGScore + this.heuristic(neighbor, endHex)
        );
      }
    }

    // No path found
    return null;
  }
}

// Export the PathFinder class
if (typeof module !== "undefined") {
  module.exports = { PathFinder };
}
