class PathVisualizer {
  constructor(scene) {
    this.scene = scene;

    // Main path graphics for complete path visualization
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(5);

    // Progress graphics for showing the current progress along the path
    this.progressGraphics = scene.add.graphics();
    this.progressGraphics.setDepth(6);

    // Store the full path for reference
    this.currentPath = [];
    this.startPosition = { x: 0, y: 0 };

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
      return;
    }

    // Store path information
    this.startPosition = { x: startX, y: startY };
    this.currentPath = [...points];

    // Set line style
    this.graphics.lineStyle(
      CONSTANTS.PATH.LINE_WIDTH,
      CONSTANTS.COLORS.PATH,
      CONSTANTS.PATH.OPACITY
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
    // Clear the progress indicator
    this.progressGraphics.clear();

    if (!remainingPath || remainingPath.length === 0) {
      return;
    }

    // Draw the progress indicator with a different color/style
    this.progressGraphics.lineStyle(
      CONSTANTS.PATH.LINE_WIDTH + 1,
      CONSTANTS.COLORS.PATH,
      CONSTANTS.PATH.OPACITY + 0.3
    );

    // Get the next point
    const nextPoint = remainingPath[0];

    // Draw a highlighted segment for the current active path segment
    this.progressGraphics.beginPath();
    this.progressGraphics.moveTo(currentX, currentY);
    this.progressGraphics.lineTo(nextPoint.x, nextPoint.y);
    this.progressGraphics.strokePath();
  }

  // Clear the path visualization
  clear() {
    this.graphics.clear();
    this.progressGraphics.clear();
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
