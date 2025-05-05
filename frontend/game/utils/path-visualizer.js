import { CONSTANTS } from "../config/constants.js";

/**
 * PathVisualizer - Visualizes movement paths for units
 */
export class PathVisualizer {
  constructor(scene) {
    this.scene = scene;

    // Main path graphics for complete path visualization
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1); // Lower depth to ensure path is drawn underneath troops

    // Progress graphics for showing the current active segment
    this.progressGraphics = scene.add.graphics();
    this.progressGraphics.setDepth(1); // Lower depth to match

    // Store the full path for reference
    this.currentPath = [];
    this.completedPath = []; // Track completed path segments
    this.startPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 }; // Current position along the path

    // Path visibility state
    this.isTransparent = false;
    this.normalOpacity = 0.9; // Slightly reduced
    this.transparentOpacity = 0.4; // Slightly reduced

    // Dash properties
    this.dashLength = CONSTANTS.PATH.DASH_LENGTH || 15;
    this.gapLength = CONSTANTS.PATH.GAP_LENGTH || 5;

    // Flag to track if the path has been drawn
    this.pathDrawn = false;
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

    // Reset the pathDrawn flag
    this.pathDrawn = false;

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

    // Set line style with white color and thinner lines
    this.graphics.lineStyle(
      CONSTANTS.PATH.LINE_WIDTH * 1.2, // Thinner lines
      0xffffff, // White for better contrast and classic look
      this.isTransparent ? this.transparentOpacity : this.normalOpacity
    );

    // Draw the smooth dashed path
    this.drawSmoothDashedPath(startX, startY, points);

    // Mark that we've drawn the path
    this.pathDrawn = true;
  }

  /**
   * Draw a smooth path using dashed lines by approximating a Catmull-Rom spline.
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {Array} points - Array of destination points
   */
  drawSmoothDashedPath(startX, startY, points) {
    if (!points || points.length === 0) return;

    // Create a list of control points for the spline
    const controlPoints = [
      { x: startX, y: startY }, // Start point
      ...points, // Waypoints
    ];

    // Generate spline points
    const splinePoints = [];
    const resolution = 10; // Number of points to generate between each control point

    // Generate points along the spline curve
    if (controlPoints.length >= 2) {
      // For a simple path with just start and end, draw a straight dashed line
      if (controlPoints.length === 2) {
        this.drawDashedLine(
          controlPoints[0].x,
          controlPoints[0].y,
          controlPoints[1].x,
          controlPoints[1].y,
          this.graphics,
          this.dashLength,
          this.gapLength
        );
        return;
      }

      // For longer paths, approximate a smooth curve
      for (let i = 0; i < controlPoints.length - 1; i++) {
        const p0 = controlPoints[Math.max(0, i - 1)];
        const p1 = controlPoints[i];
        const p2 = controlPoints[i + 1];
        const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)];

        // Generate points along the curve segment
        for (let t = 0; t <= resolution; t++) {
          const t1 = t / resolution;
          // Catmull-Rom spline calculation
          const point = this.catmullRomPoint(p0, p1, p2, p3, t1);
          splinePoints.push(point);
        }
      }
    }

    // Draw dashed lines between the spline points
    let drawing = true;
    let dashRemaining = this.dashLength;
    let gapRemaining = this.gapLength;

    // Set the line style with white color
    this.graphics.lineStyle(
      CONSTANTS.PATH.LINE_WIDTH * 1.2, // Consistent thinner line width
      0xffffff, // White color
      this.isTransparent ? this.transparentOpacity : this.normalOpacity
    );

    this.graphics.beginPath();

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

    // If there's no remaining path or it's empty, clear everything
    if (!remainingPath || remainingPath.length === 0) {
      this.graphics.clear();
      this.progressGraphics.clear();
      this.pathDrawn = false;
      this.currentPath = [];
      return;
    }

    // We need to redraw the path to only show what's ahead of the troop
    this.graphics.clear();
    this.progressGraphics.clear();

    // Get the next waypoint
    const nextPoint = remainingPath[0];

    // Calculate distance to next point
    const distanceToNext = Phaser.Math.Distance.Between(
      currentX,
      currentY,
      nextPoint.x,
      nextPoint.y
    );

    // Increased buffer radius to prevent path appearing behind troops
    const bufferRadius = 20;

    // If we're very close to the next point, don't draw a path to it at all
    if (distanceToNext <= bufferRadius * 1.5) {
      // If there are more points after this one, draw from the next point
      if (remainingPath.length > 1) {
        // Draw path starting from the second point
        this.graphics.lineStyle(
          CONSTANTS.PATH.LINE_WIDTH * 1.2,
          0xffffff, // White color
          this.isTransparent ? this.transparentOpacity : this.normalOpacity
        );
        this.drawSmoothDashedPath(
          remainingPath[1].x,
          remainingPath[1].y,
          remainingPath.slice(2)
        );
      }
    } else {
      // Set line style
      this.graphics.lineStyle(
        CONSTANTS.PATH.LINE_WIDTH * 1.2,
        0xffffff, // White color
        this.isTransparent ? this.transparentOpacity : this.normalOpacity
      );

      // Calculate direction to next point
      const angle = Math.atan2(nextPoint.y - currentY, nextPoint.x - currentX);

      // Calculate starting point with buffer
      const startX = currentX + Math.cos(angle) * bufferRadius;
      const startY = currentY + Math.sin(angle) * bufferRadius;

      // Draw the path from current position to all remaining points
      this.drawSmoothDashedPath(startX, startY, remainingPath);
    }

    // Update the current path reference
    this.currentPath = [...remainingPath];
  }

  /**
   * Draw a dashed line between two points
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw on
   * @param {number} dashLength - Length of each dash
   * @param {number} gapLength - Length of gaps between dashes
   */
  drawDashedLine(x1, y1, x2, y2, graphics, dashLength, gapLength) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDX = dx / distance;
    const normalizedDY = dy / distance;

    let drawing = true;
    let dashRemaining = dashLength;
    let gapRemaining = gapLength;

    let currentX = x1;
    let currentY = y1;
    let remainingDistance = distance;

    graphics.beginPath();

    while (remainingDistance > 0) {
      if (drawing) {
        // Calculate dash endpoint
        const dashDistance = Math.min(dashRemaining, remainingDistance);
        const dashEndX = currentX + normalizedDX * dashDistance;
        const dashEndY = currentY + normalizedDY * dashDistance;

        // Draw the dash
        graphics.moveTo(currentX, currentY);
        graphics.lineTo(dashEndX, dashEndY);

        // Update position
        currentX = dashEndX;
        currentY = dashEndY;
        remainingDistance -= dashDistance;
        dashRemaining -= dashDistance;

        // Switch to gap if dash is complete
        if (dashRemaining <= 0) {
          drawing = false;
          gapRemaining = gapLength;
        }
      } else {
        // Skip the gap
        const gapDistance = Math.min(gapRemaining, remainingDistance);
        currentX += normalizedDX * gapDistance;
        currentY += normalizedDY * gapDistance;
        remainingDistance -= gapDistance;
        gapRemaining -= gapDistance;

        // Switch back to dash if gap is complete
        if (gapRemaining <= 0) {
          drawing = true;
          dashRemaining = dashLength;
        }
      }
    }

    graphics.strokePath();
  }

  /**
   * Set path transparency
   * @param {boolean} transparent - Whether the path should be transparent
   */
  setTransparent(transparent) {
    this.isTransparent = transparent;

    // Redraw with new opacity if there's a current path
    if (this.currentPath.length > 0) {
      // Redraw with new opacity
      this.graphics.clear();
      this.graphics.lineStyle(
        0xffffff, // White color
        transparent ? this.transparentOpacity : this.normalOpacity
      );
      this.drawSmoothDashedPath(
        this.currentPosition.x,
        this.currentPosition.y,
        this.currentPath
      );
    }
  }

  /**
   * Clear all path graphics
   */
  clear() {
    this.graphics.clear();
    this.progressGraphics.clear();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clear();
    this.graphics.destroy();
    this.progressGraphics.destroy();
  }

  /**
   * Calculate a point on a Catmull-Rom spline
   * @param {Object} p0 - First control point
   * @param {Object} p1 - Second control point
   * @param {Object} p2 - Third control point
   * @param {Object} p3 - Fourth control point
   * @param {number} t - Parameter value [0,1]
   * @returns {Object} Point on the spline
   */
  catmullRomPoint(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;

    // Catmull-Rom matrix coefficients
    const a = -0.5 * t3 + t2 - 0.5 * t;
    const b = 1.5 * t3 - 2.5 * t2 + 1.0;
    const c = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
    const d = 0.5 * t3 - 0.5 * t2;

    // Calculate the point
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    };
  }
}

export default PathVisualizer;
