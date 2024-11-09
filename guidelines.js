// guidelines.js

// Get References to Input Elements
const baseFrequencyInput = document.getElementById('baseFrequency');
const toggleGuidelinesCheckbox = document.getElementById('toggleGuidelines');

// Set Default Base Frequency
let baseFrequency = parseFloat(baseFrequencyInput.value) || 440;

// Event Listener for Base Frequency Change
baseFrequencyInput.addEventListener('change', (event) => {
  const value = parseFloat(event.target.value);
  if (isNaN(value) || value < 20 || value > 20000) {
    alert('Please enter a valid frequency between 20 Hz and 20000 Hz.');
    event.target.value = baseFrequency;
    return;
  }
  baseFrequency = value;
  window.drawingData.maxX = Math.max(window.drawingData.maxX, canvas.width); // Ensure maxX covers the canvas
  drawCanvas(); // Redraw canvas to update guidelines
});

// Event Listener for Toggling Guidelines
toggleGuidelinesCheckbox.addEventListener('change', (event) => {
  drawCanvas(); // Redraw canvas to show/hide guidelines
});

// Function to Draw Octave Guidelines
function drawGuidelines() {
  if (!toggleGuidelinesCheckbox.checked) return;

  ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)'; // Semi-transparent blue lines
  ctx.lineWidth = 1;

  const octaveFrequencies = calculateOctaveFrequencies(baseFrequency);

  octaveFrequencies.forEach(freq => {
    const y = yToFrequencyY(freq);
    if (y < 0 || y > canvas.height) return; // Skip frequencies outside the canvas

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    // Optional: Label the frequency
    ctx.fillStyle = 'blue';
    ctx.font = '12px Arial';
    ctx.fillText(`${freq.toFixed(1)} Hz`, 5, y - 5);
  });
}

// Function to Calculate Octave Frequencies Based on Base Frequency
function calculateOctaveFrequencies(baseFreq) {
  const frequencies = [];

  // Calculate higher octaves
  let freq = baseFreq;
  while (freq <= 20000) { // Max Frequency
    frequencies.push(freq);
    freq *= 2;
  }

  // Calculate lower octaves
  freq = baseFreq / 2;
  while (freq >= 20) { // Min Frequency
    frequencies.push(freq);
    freq /= 2;
  }

  // Remove duplicates and sort
  const uniqueFrequencies = [...new Set(frequencies)].sort((a, b) => a - b);

  return uniqueFrequencies;
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

  // Invert y to have 0 at the top
  return Math.pow(10, maxLog - (freq / maxFreq) * (maxLog - minLog)) >= freq ? 0 : Math.log10(maxFreq / freq) / scale;
}

// Note: The above `yToFrequencyY` function needs to align with `yToFrequency` in playbackControls.js

// Override or Define yToFrequencyY to match yToFrequency in playbackControls.js
function yToFrequencyY(freq) {
  const canvasHeight = window.drawingData.canvas.height;
  const minFreq = 20;    // 20 Hz
  const maxFreq = 20000; // 20 kHz

  // Logarithmic Mapping
  const minLog = Math.log10(minFreq);
  const maxLog = Math.log10(maxFreq);
  const scale = (maxLog - minLog) / canvasHeight;

  return (maxLog - Math.log10(freq)) / scale;
}

// Function to Initialize Guidelines on Canvas Load
window.addEventListener('load', () => {
  drawCanvas();
});
