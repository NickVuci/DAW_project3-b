// playbackControls.js

// Audio Context Initialization
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Playback State
let isPlaying = false;
let startTime = 0;
let pauseTime = 0;
let oscillators = []; // Array to hold multiple oscillators

// Get Playback Buttons
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');

// Event Listeners for Playback Buttons
playButton.addEventListener('click', playAudio);
pauseButton.addEventListener('click', pauseAudio);
stopButton.addEventListener('click', stopAudio);

// Function to Map Y-Coordinate to Frequency (Logarithmic)
function yToFrequency(y) {
  const canvasHeight = window.drawingData.canvas.height;
  const minFreq = 20;    // 20 Hz
  const maxFreq = 20000; // 20 kHz

  // Calculate the logarithmic scale
  const minLog = Math.log10(minFreq);
  const maxLog = Math.log10(maxFreq);
  const scale = (maxLog - minLog) / canvasHeight;

  // Invert y to have 0 at the bottom
  return Math.pow(10, maxLog - (y * scale));
}

// Play Audio Function
function playAudio() {
  if (isPlaying) return;

  isPlaying = true;

  // Resume Audio Context if Suspended
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  startTime = audioCtx.currentTime - pauseTime;

  // Schedule Notes for Playback
  scheduleNotes();
}

// Pause Audio Function
function pauseAudio() {
  if (!isPlaying) return;

  isPlaying = false;
  pauseTime = audioCtx.currentTime - startTime;

  // Stop All Oscillators
  oscillators.forEach(osc => osc.oscillator.stop());
  oscillators = [];
}

// Stop Audio Function
function stopAudio() {
  if (!isPlaying && pauseTime === 0) return;

  isPlaying = false;
  pauseTime = 0;

  // Stop All Oscillators
  oscillators.forEach(osc => osc.oscillator.stop());
  oscillators = [];
}

// Function to Schedule Notes for Playback
function scheduleNotes() {
  const drawingData = window.drawingData;
  const maxX = drawingData.maxX;
  const drawingPaths = drawingData.drawingPaths;

  if (maxX === 0) {
    // No drawing to play
    return;
  }

  const totalDuration = getTotalDuration();

  // For Each Path, Create an Oscillator and Schedule Its Playback
  drawingPaths.forEach(path => {
    if (path.length < 2) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    gainNode.gain.value = 0.1; // Volume Control

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    let startTimeOffset = ((path[0].x / maxX) * totalDuration) - pauseTime;

    if (startTimeOffset < 0) startTimeOffset = 0;

    let currentTime = audioCtx.currentTime;

    // Schedule Frequency Changes for This Oscillator
    scheduleFrequencyChanges(oscillator, path, totalDuration, maxX, currentTime, pauseTime);

    // Calculate Path Duration
    const pathDuration = ((path[path.length - 1].x - path[0].x) / maxX) * totalDuration;

    // Start and Stop the Oscillator
    oscillator.start(currentTime + startTimeOffset);
    oscillator.stop(currentTime + startTimeOffset + pathDuration);

    // Keep Track of the Oscillator
    oscillators.push({ oscillator, gainNode });
  });
}

// Function to Schedule Frequency Changes for an Oscillator
function scheduleFrequencyChanges(oscillator, path, totalDuration, maxX, currentTime, pauseTime) {
  // Clear Previous Frequency Automation
  oscillator.frequency.cancelScheduledValues(currentTime);

  path.forEach((point, index) => {
    let timeOffset = ((point.x / maxX) * totalDuration) - pauseTime;

    if (timeOffset < 0) return; // Skip Points Before Current Time

    let frequency = yToFrequency(point.y);
    let time = currentTime + timeOffset;

    if (index === 0) {
      oscillator.frequency.setValueAtTime(frequency, time);
    } else {
      oscillator.frequency.linearRampToValueAtTime(frequency, time);
    }
  });
}

// Function to Calculate Total Playback Duration
function getTotalDuration() {
  const maxX = window.drawingData.maxX;
  const canvasWidth = window.drawingData.canvas.width;
  const baseDuration = 5; // Base Duration in Seconds
  return (maxX / canvasWidth) * baseDuration;
}
