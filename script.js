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

// Event Listener for Clear Button
const clearButton = document.getElementById('clearButton');
clearButton.addEventListener('click', clearCanvas);

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

  // Redraw Canvas to include new guidelines if necessary
  drawCanvas();
}

// Function to Clear Canvas and Reset Drawing Data
function clearCanvas() {
  // Confirm with the user to prevent accidental clearing
  const confirmClear = confirm("Are you sure you want to clear all drawn lines?");
  if (!confirmClear) return;

  // Clear drawing paths and reset maxX
  window.drawingData.drawingPaths = [];
  window.drawingData.maxX = 0;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw Canvas to include guidelines if enabled
  drawCanvas();
}

// Utility Function to Get Canvas Coordinates
function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

// Function to Draw the Entire Canvas
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (typeof drawGuidelines === 'function' && document.getElementById('toggleGuidelines').checked) {
    drawGuidelines();
  }
  redrawPaths();
}

// Function to Redraw All Stored Paths
function redrawPaths() {
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2; // Thicker lines for better visibility
  window.drawingData.drawingPaths.forEach(path => {
    if (path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
  });
}

// Initial Draw
drawCanvas();

// Redraw canvas when window is resized
window.addEventListener('resize', drawCanvas);
