// guidelines.js

// Get References to Input Elements
const baseFrequencyInput = document.getElementById('baseFrequency');
const toggleGuidelinesCheckbox = document.getElementById('toggleGuidelines');
const edoInput = document.getElementById('edoInput'); // EDO Entry Textbox
const toggleEdoGuidelinesCheckbox = document.getElementById('toggleEdoGuidelines'); // EDO Toggle
const toggleEdoValuesCheckbox = document.getElementById('toggleEdoValues'); // EDO Values Toggle
const edoFormatRadios = document.getElementsByName('edoFormat'); // EDO Format Radio Buttons
const minFrequencyInput = document.getElementById('minFrequency'); // Min Frequency Input
const maxFrequencyInput = document.getElementById('maxFrequency'); // Max Frequency Input

// Set Default Base Frequency and EDO
let baseFrequency = parseFloat(baseFrequencyInput.value) || 440;
let edoDivisions = parseInt(edoInput.value) || 12;
let edoValueFormat = 'hz'; // Default format
let minFreq = parseFloat(minFrequencyInput.value) || 20;
let maxFreq = parseFloat(maxFrequencyInput.value) || 20000;

// Event Listener for Base Frequency Change
baseFrequencyInput.addEventListener('change', (event) => {
  const value = parseFloat(event.target.value);
  if (isNaN(value) || value < 20 || value > 20000) {
    alert('Please enter a valid base frequency between 20 Hz and 20000 Hz.');
    event.target.value = baseFrequency;
    return;
  }
  baseFrequency = value;
  updateMaxX(); // Ensure maxX covers the canvas
  drawCanvas(); // Redraw canvas to update guidelines
});

// Event Listener for Toggling Octave Guidelines
toggleGuidelinesCheckbox.addEventListener('change', (event) => {
  drawCanvas(); // Redraw canvas to show/hide guidelines
});

// Event Listener for EDO Input Change
edoInput.addEventListener('change', (event) => {
  const value = parseInt(event.target.value);
  if (isNaN(value) || value < 2 || value > 100) {
    alert('Please enter a valid number of EDO divisions between 2 and 100.');
    event.target.value = edoDivisions;
    return;
  }
  edoDivisions = value;
  drawCanvas(); // Redraw canvas to update EDO guidelines
});

// Event Listener for Toggling EDO Guidelines
toggleEdoGuidelinesCheckbox.addEventListener('change', (event) => {
  drawCanvas(); // Redraw canvas to show/hide EDO guidelines
});

// Event Listener for Toggling EDO Values
toggleEdoValuesCheckbox.addEventListener('change', (event) => {
  drawCanvas(); // Redraw canvas to show/hide EDO values
});

// Event Listener for EDO Format Selection
edoFormatRadios.forEach(radio => {
  radio.addEventListener('change', (event) => {
    if (event.target.checked) {
      edoValueFormat = event.target.value;
      drawCanvas(); // Redraw canvas to update EDO value formats
    }
  });
});

// Event Listener for Min Frequency Change
minFrequencyInput.addEventListener('change', (event) => {
  const value = parseFloat(event.target.value);
  const currentMax = parseFloat(maxFrequencyInput.value);
  if (isNaN(value) || value < 20 || value >= currentMax) {
    alert('Please enter a valid minimum frequency between 20 Hz and less than the maximum frequency.');
    event.target.value = minFreq;
    return;
  }
  minFreq = value;
  drawCanvas(); // Redraw canvas to update frequency range
});

// Event Listener for Max Frequency Change
maxFrequencyInput.addEventListener('change', (event) => {
  const value = parseFloat(event.target.value);
  const currentMin = parseFloat(minFrequencyInput.value);
  if (isNaN(value) || value > 20000 || value <= currentMin) {
    alert('Please enter a valid maximum frequency between greater than the minimum frequency and up to 20000 Hz.');
    event.target.value = maxFreq;
    return;
  }
  maxFreq = value;
  drawCanvas(); // Redraw canvas to update frequency range
});

// Function to Draw Guidelines
function drawGuidelines() {
  // Draw Octave Guidelines if toggled on
  if (toggleGuidelinesCheckbox.checked) {
    drawOctaveGuidelines();
  }

  // Draw EDO Guidelines if toggled on
  if (toggleEdoGuidelinesCheckbox.checked) {
    drawEdoGuidelines();
  }
}

// Function to Draw Octave Guidelines
function drawOctaveGuidelines() {
  ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)'; // Semi-transparent blue lines
  ctx.lineWidth = 1;

  const octaveFrequencies = calculateOctaveFrequencies(baseFrequency);

  octaveFrequencies.forEach(freq => {
    if (freq < minFreq || freq > maxFreq) return; // Skip frequencies outside the range

    const y = yToFrequencyY(freq);
    if (y < 0 || y > window.drawingData.canvas.height) return; // Skip if out of canvas

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(window.drawingData.canvas.width, y);
    ctx.stroke();

    // Label the frequency
    ctx.fillStyle = 'blue';
    ctx.font = '12px Arial';
    ctx.fillText(`${freq.toFixed(1)} Hz`, 5, y - 5);
  });
}

// Function to Draw EDO Guidelines
function drawEdoGuidelines() {
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red lines
  ctx.lineWidth = 1;

  const octaveFrequencies = calculateOctaveFrequencies(baseFrequency);
  const edoSteps = edoDivisions;

  octaveFrequencies.forEach(freq => {
    if (freq * Math.pow(2, edoSteps / edoSteps) < minFreq || freq > maxFreq) return; // Ensure EDO steps fall within range

    // Calculate frequencies for EDO steps within the octave
    const edoFrequencies = calculateEdoFrequencies(freq, edoSteps);

    edoFrequencies.forEach((stepFreq, index) => {
      // Skip if the frequency is exactly the octave frequency to avoid duplication
      if (stepFreq === freq) return;

      if (stepFreq < minFreq || stepFreq > maxFreq) return; // Skip frequencies outside the range

      const y = yToFrequencyY(stepFreq);
      if (y < 0 || y > window.drawingData.canvas.height) return; // Skip if out of canvas

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(window.drawingData.canvas.width, y);
      ctx.stroke();

      // Conditionally label the EDO lines
      if (toggleEdoValuesCheckbox.checked) {
        ctx.fillStyle = 'red';
        ctx.font = '12px Arial';
        let label = '';

        if (edoValueFormat === 'hz') {
          label = `${stepFreq.toFixed(1)} Hz`;
        } else if (edoValueFormat === 'cents') {
          // Calculate cents relative to the octave base frequency
          const centsPerStep = 1200 / edoSteps;
          const totalCents = centsPerStep * index;
          label = `${totalCents.toFixed(1)} cents`;
        }

        ctx.fillText(label, 5, y - 5);
      }
    });
  });
}

// Function to Calculate Octave Frequencies Based on Base Frequency
function calculateOctaveFrequencies(baseFreq) {
  const frequencies = [];

  // Calculate higher octaves until exceeding maxFreq
  let currentFreq = baseFreq;
  while (currentFreq <= maxFreq) { // Upper limit based on maxFreq
    frequencies.push(currentFreq);
    currentFreq *= 2;
  }

  // Calculate lower octaves until below minFreq
  currentFreq = baseFreq / 2;
  while (currentFreq >= minFreq) { // Lower limit based on minFreq
    frequencies.push(currentFreq);
    currentFreq /= 2;
  }

  // Remove duplicates and sort
  const uniqueFrequencies = [...new Set(frequencies)].sort((a, b) => a - b);

  return uniqueFrequencies;
}

// Function to Calculate EDO Frequencies within an Octave
function calculateEdoFrequencies(baseFreq, divisions) {
  const edoFrequencies = [];
  for (let i = 0; i < divisions; i++) {
    const freq = baseFreq * Math.pow(2, i / divisions);
    edoFrequencies.push(freq);
  }
  // Include the octave frequency at the end
  edoFrequencies.push(baseFreq * 2);
  return edoFrequencies;
}

// Function to Map Frequency to Y-Coordinate Using the Current Frequency Mapping
function yToFrequencyY(freq) {
  const canvasHeight = window.drawingData.canvas.height;

  // Calculate the logarithmic scale based on minFreq and maxFreq
  const minLog = Math.log10(minFreq);
  const maxLog = Math.log10(maxFreq);
  const scale = (maxLog - minLog) / canvasHeight;

  // Calculate Y position (inverted, 0 at top)
  return (maxLog - Math.log10(freq)) / scale;
}

// Function to Draw the Entire Canvas
function drawCanvas() {
  ctx.clearRect(0, 0, window.drawingData.canvas.width, window.drawingData.canvas.height);
  drawGuidelines();
  redrawPaths();
}

// Utility Function to Redraw All Stored Paths
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

// Function to Update maxX Based on Current Canvas Width
function updateMaxX() {
  window.drawingData.maxX = Math.max(window.drawingData.maxX, window.drawingData.canvas.width);
}

// Initial Draw
drawCanvas();

// Redraw canvas when window is resized
window.addEventListener('resize', drawCanvas);
