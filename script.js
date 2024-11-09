// script.js

// Initialize Canvas
const canvas = document.getElementById('musicCanvas');
const ctx = canvas.getContext('2d');

// Global Drawing Data
window.drawingData = {
  canvas: canvas,
  maxX: 0,
  drawingPaths: []
};

let isDrawing = false;
let currentPath = [];

// Event Listeners for Drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseout', endDrawing);

// Drawing Functions
function startDrawing(event) {
  isDrawing = true;
  currentPath = [];
  const point = getCanvasCoordinates(event);
  currentPath.push(point);
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
}

function draw(event) {
  if (!isDrawing) return;
  const point = getCanvasCoordinates(event);
  currentPath.push(point);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function endDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  ctx.closePath();

  if (currentPath.length > 0) {
    // Store the path
    window.drawingData.drawingPaths.push(currentPath);

    // Update maxX
    currentPath.forEach(point => {
      if (point.x > window.drawingData.maxX) {
        window.drawingData.maxX = point.x;
      }
    });
  }

  // Optionally, reset currentPath
  currentPath = [];
}

// Utility Function to Get Canvas Coordinates
function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}
