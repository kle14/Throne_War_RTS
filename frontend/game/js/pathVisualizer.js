class PathVisualizer {
  constructor(scene) {
    this.scene = scene;

    // Main path graphics for complete path visualization
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);

    // Progress graphics for showing the current active segment
    this.progressGraphics = scene.add.graphics();
    this.progressGraphics.setDepth(1);

    // Store the full path for reference
    this.currentPath = [];
    this.completedPath = []; // Track completed path segments
    this.startPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 }; // Current position along the path

    // Path visibility state
    this.isTransparent = false;
    this.normalOpacity = CONSTANTS.PATH.OPACITY || 0.8;
    this.transparentOpacity = 0.3; // Reduced opacity when deselected

    // Dash properties
    this.dashLength = CONSTANTS.PATH.DASH_LENGTH || 10;
    this.gapLength = CONSTANTS.PATH.GAP_LENGTH || 5;
  }

  /**
   * Draw a smooth path from start to destination points
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {Array} points - Array of destination points
   */
  drawPath(startX, startY, points) {
    // Clear any existing path
    this.clear();

    if (!points || points.length === 0) {
      this.currentPath = [];
      this.completedPath = [];
      return;
    }

    // Store path information
    this.startPosition = { x: startX, y: startY };
    this.currentPosition = { x: startX, y: startY };
    this.currentPath = [...points];
    this.completedPath = [];

    // Set line style
    this.graphics.lineStyle(
      CONSTANTS.PATH.LINE_WIDTH,
      CONSTANTS.COLORS.PATH,
      this.isTransparent ? this.transparentOpacity : this.normalOpacity
    );

    // Draw the smooth dashed path
    this.drawSmoothDashedPath(startX, startY, points);
  }

  /**
   * Draw a smooth dashed path using Phaser curve
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {Array} points - Array of destination points
   */
  drawSmoothDashedPath(startX, startY, points) {
    if (!points || points.length === 0) return;

    // Create a path array including the start point
    const pathPoints = [{ x: startX, y: startY }, ...points];

    // Create a smooth curve using Phaser's Path object
    const path = new Phaser.Curves.Path(startX, startY);

    // Add line segments as spline curves to create a smooth path
    for (let i = 1; i < pathPoints.length; i++) {
      path.lineTo(pathPoints[i].x, pathPoints[i].y);
    }

    // Get points along the curve for dashed line rendering
    const splinePoints = path.getPoints(Math.max(50, pathPoints.length * 10));

    // Draw the dashed curved path
    this.graphics.beginPath();

    let drawing = true;
    let dashRemaining = this.dashLength;
    let gapRemaining = this.gapLength;

    for (let i = 0; i < splinePoints.length - 1; i++) {
      const p1 = splinePoints[i];
      const p2 = splinePoints[i + 1];
      const segmentLength = Phaser.Math.Distance.Between(
        p1.x,
        p1.y,
        p2.x,
        p2.y
      );

      let segmentRemaining = segmentLength;
      let px = p1.x;
      let py = p1.y;

      // Calculate direction vector
      const dx = (p2.x - p1.x) / segmentLength;
      const dy = (p2.y - p1.y) / segmentLength;

      while (segmentRemaining > 0) {
        if (drawing) {
          // Draw dash
          const dashDistance = Math.min(dashRemaining, segmentRemaining);
          const dashEndX = px + dx * dashDistance;
          const dashEndY = py + dy * dashDistance;

          this.graphics.moveTo(px, py);
          this.graphics.lineTo(dashEndX, dashEndY);

          px = dashEndX;
          py = dashEndY;

          segmentRemaining -= dashDistance;
          dashRemaining -= dashDistance;

          if (dashRemaining <= 0) {
            drawing = false;
            gapRemaining = this.gapLength;
          }
        } else {
          // Skip gap
          const gapDistance = Math.min(gapRemaining, segmentRemaining);
          px += dx * gapDistance;
          py += dy * gapDistance;

          segmentRemaining -= gapDistance;
          gapRemaining -= gapDistance;

          if (gapRemaining <= 0) {
            drawing = true;
            dashRemaining = this.dashLength;
          }
        }
      }
    }

    this.graphics.strokePath();
  }

  /**
   * Update the path visualization to show progress
   * @param {number} currentX - Current X position of the unit
   * @param {number} currentY - Current Y position of the unit
   * @param {Array} remainingPath - Array of remaining path points
   */
  updatePathProgress(currentX, currentY, remainingPath) {
    // Store current position
    this.currentPosition = { x: currentX, y: currentY };

    // If we've reached a waypoint, add it to the completed path
    if (
      this.currentPath.length > 0 &&
      remainingPath.length < this.currentPath.length
    ) {
      // Find the points that were completed
      const completedPoints = this.currentPath.filter(
        (point) => !remainingPath.includes(point)
      );

      // Add to completed path
      this.completedPath = [...this.completedPath, ...completedPoints];

      // Update current path to be only the remaining points
      this.currentPath = [...remainingPath];
    }

    // Clear all graphics before redrawing
    this.graphics.clear();
    this.progressGraphics.clear();

    if (remainingPath && remainingPath.length > 0) {
      // Define a buffer zone around the unit where no path should be drawn
      const bufferRadius = 35; // Increased buffer size (was 25)

      // Draw only remaining path segments - but create a gap from current position
      if (remainingPath.length > 0) {
        const nextPoint = remainingPath[0];

        // Calculate distance from troop to next point
        const distanceToNext = Phaser.Math.Distance.Between(
          currentX,
          currentY,
          nextPoint.x,
          nextPoint.y
        );

        // Only draw path if the next point is far enough from the unit
        if (distanceToNext > bufferRadius * 2) {
          // Calculate a starting point for the path that's outside the buffer zone
          const angle = Math.atan2(
            nextPoint.y - currentY,
            nextPoint.x - currentX
          );
          const startX = currentX + Math.cos(angle) * bufferRadius;
          const startY = currentY + Math.sin(angle) * bufferRadius;

          // Draw the path starting from the buffer zone boundary, not from the unit itself
          this.graphics.lineStyle(
            CONSTANTS.PATH.LINE_WIDTH,
            CONSTANTS.COLORS.PATH,
            this.isTransparent ? this.transparentOpacity : this.normalOpacity
          );

          // Draw active segment from buffer zone to first waypoint
          this.drawDashedLine(
            startX,
            startY,
            nextPoint.x,
            nextPoint.y,
            this.graphics,
            this.dashLength,
            this.gapLength
          );

          // Draw remaining path if there are more points
          if (remainingPath.length > 1) {
            const remainingPointsExceptFirst = remainingPath.slice(1);
            this.drawSmoothDashedPath(
              nextPoint.x,
              nextPoint.y,
              remainingPointsExceptFirst
            );
          }
        }
        // If next point is very close, only draw the path beyond it
        else if (remainingPath.length > 1) {
          const secondPoint = remainingPath[1];
          const remainingPointsExceptFirstTwo = remainingPath.slice(2);
          this.drawSmoothDashedPath(
            secondPoint.x,
            secondPoint.y,
            remainingPointsExceptFirstTwo
          );
        }
      }
    }
  }

  /**
   * Draw a single dashed line between two points
   * Used for the current active segment
   */
  drawDashedLine(x1, y1, x2, y2, graphics, dashLength, gapLength) {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    let currentDistance = 0;
    let drawing = true;
    let dashRemaining = dashLength;
    let gapRemaining = gapLength;

    while (currentDistance < distance) {
      if (drawing) {
        // Calculate dash segment
        const dashDistance = Math.min(
          dashRemaining,
          distance - currentDistance
        );
        const startX = x1 + Math.cos(angle) * currentDistance;
        const startY = y1 + Math.sin(angle) * currentDistance;
        const endX = x1 + Math.cos(angle) * (currentDistance + dashDistance);
        const endY = y1 + Math.sin(angle) * (currentDistance + dashDistance);

        // Draw the dash
        graphics.beginPath();
        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, endY);
        graphics.strokePath();

        // Update tracking variables
        currentDistance += dashDistance;
        dashRemaining -= dashDistance;

        if (dashRemaining <= 0) {
          drawing = false;
          gapRemaining = gapLength;
        }
      } else {
        // Skip gap
        const gapDistance = Math.min(gapRemaining, distance - currentDistance);
        currentDistance += gapDistance;
        gapRemaining -= gapDistance;

        if (gapRemaining <= 0) {
          drawing = true;
          dashRemaining = dashLength;
        }
      }
    }
  }

  /**
   * Set the path to be transparent (when unit is deselected)
   */
  setTransparent(transparent) {
    this.isTransparent = transparent;

    // If we have an active path, redraw it with the new transparency
    if (this.currentPath && this.currentPath.length > 0) {
      // Clear all graphics before redrawing
      this.graphics.clear();
      this.progressGraphics.clear();

      // Simply call the updatePathProgress method to redraw paths with new transparency
      // This ensures consistent drawing logic between updates and transparency changes
      this.updatePathProgress(
        this.currentPosition.x,
        this.currentPosition.y,
        this.currentPath
      );
    }
  }

  // Clear the path visualization
  clear() {
    this.graphics.clear();
    this.progressGraphics.clear();
    this.currentPath = [];
    this.completedPath = [];
  }

  // Clean up resources
  destroy() {
    this.graphics.destroy();
    this.progressGraphics.destroy();
  }
}

// Export the PathVisualizer class
if (typeof module !== "undefined") {
  module.exports = { PathVisualizer };
}
