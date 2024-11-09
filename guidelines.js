// guidelines.js

// Get References to Input Elements
const baseFrequencyInput = document.getElementById('baseFrequency');
const toggleGuidelinesCheckbox = document.getElementById('toggleGuidelines');
const edoInput = document.getElementById('edoInput'); // EDO Entry Textbox
const toggleEdoGuidelinesCheckbox = document.getElementById('toggleEdoGuidelines'); // EDO Toggle

// Set Default Base Frequency and EDO
let baseFrequency = parseFloat(baseFrequencyInput.value) || 440;
let edoDivisions = parseInt(edoInput.value) || 12;

// Event Listener for Base Frequency Change
baseFrequencyInput.addEventListener('change', (event) => {
  const value = parseFloat(event.target.value);
  if (isNaN(value) || value < 20 || value > 20000) {
    alert('Please enter a valid frequency between 20 Hz and 20000 Hz.');
    event.target.value = baseFrequency;
    return;
  }
  baseFrequency = value;
  window.drawingData.maxX = Math.max(window.drawingData.maxX, window.drawingData.canvas.width); // Ensure maxX covers the canvas
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
    const y = yToFrequencyY(freq);
    if (y < 0 || y > window.drawingData.canvas.height) return; // Skip frequencies outside the canvas

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
    // Calculate frequencies for EDO steps within the octave
    const edoFrequencies = calculateEdoFrequencies(freq, edoSteps);

    edoFrequencies.forEach(stepFreq => {
      // Skip if the frequency is exactly the octave frequency to avoid duplication
      if (stepFreq === freq) return;

      const y = yToFrequencyY(stepFreq);
      if (y < 0 || y > window.drawingData.canvas.height) return; // Skip frequencies outside the canvas

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(window.drawingData.canvas.width, y);
      ctx.stroke();
    });
  });
}

// Function to Calculate Octave Frequencies Based on Base Frequency
function calculateOctaveFrequencies(baseFreq) {
  const frequencies = [];

  // Calculate higher octaves until exceeding the canvas height
  let currentFreq = baseFreq;
  while (currentFreq <= 20000) { // Upper limit for human hearing
    frequencies.push(currentFreq);
    currentFreq *= 2;
  }

  // Calculate lower octaves until below the minimum frequency
  currentFreq = baseFreq / 2;
  while (currentFreq >= 20) { // Lower limit for human hearing
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
  const minFreq = 20;    // 20 Hz
  const maxFreq = 20000; // 20 kHz

  // Calculate the logarithmic scale
  const minLog = Math.log10(minFreq);
  const maxLog = Math.log10(maxFreq);
  const scale = (maxLog - minLog) / canvasHeight;

  // Calculate Y position (inverted, 0 at top)
  return (maxLog - Math.log10(freq)) / scale;
}

// Function to Initialize Guidelines on Canvas Load
window.addEventListener('load', () => {
  drawCanvas();
});
