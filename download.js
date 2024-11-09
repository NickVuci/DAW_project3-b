// download.js

// Get Reference to the Download Button
const downloadButton = document.getElementById('downloadButton');
downloadButton.addEventListener('click', downloadAudio);

// Function to Map Y-Coordinate to Frequency (Logarithmic)
function yToFrequency(y) {
  const canvasHeight = window.drawingData.canvas.height;
  const minFreq = 20;    // 20 Hz
  const maxFreq = 20000; // 20 kHz

  // Calculate the logarithmic scale
  const minLog = Math.log10(minFreq);
  const maxLog = Math.log10(maxFreq);
  const scale = (maxLog - minLog) / canvasHeight;

  // Invert y to have 0 at the top
  return Math.pow(10, maxLog - (y * scale));
}

// Function to Encode AudioBuffer to WAV
function encodeWAV(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result;
  if (numChannels === 2) {
    result = interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
  } else {
    result = audioBuffer.getChannelData(0);
  }

  const buffer = new ArrayBuffer(44 + result.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + result.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, result.length * 2, true);

  // Write the PCM samples
  floatTo16BitPCM(view, 44, result);

  return view;
}

// Helper function to write strings to DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Helper function to interleave channels
function interleave(leftChannel, rightChannel) {
  const length = leftChannel.length + rightChannel.length;
  const result = new Float32Array(length);

  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    result[index++] = leftChannel[inputIndex];
    result[index++] = rightChannel[inputIndex];
    inputIndex++;
  }
  return result;
}

// Helper function to convert float samples to 16-bit PCM
function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    output.setInt16(offset, s, true);
  }
}

// Function to Download the Audio as WAV
async function downloadAudio() {
  // Create an OfflineAudioContext for rendering
  const drawingData = window.drawingData;
  const sampleRate = 44100; // Standard sample rate
  const channels = 2; // Stereo
  const duration = getTotalDuration(); // Duration in seconds

  const offlineCtx = new OfflineAudioContext(channels, sampleRate * duration, sampleRate);

  const maxX = drawingData.maxX;
  const drawingPaths = drawingData.drawingPaths;

  // Get the selected waveform
  const waveformSelect = document.getElementById('waveformSelect');
  const selectedWaveform = waveformSelect.value;

  // Create oscillators for each path
  drawingPaths.forEach(path => {
    if (path.length < 2) return;

    const oscillator = offlineCtx.createOscillator();
    const gainNode = offlineCtx.createGain();

    oscillator.type = selectedWaveform;
    gainNode.gain.value = 0.1; // Volume Control

    oscillator.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    // Schedule frequency changes
    path.forEach((point, index) => {
      const timeOffset = (point.x / maxX) * duration;
      const frequency = yToFrequency(point.y);
      if (index === 0) {
        oscillator.frequency.setValueAtTime(frequency, timeOffset);
      } else {
        oscillator.frequency.linearRampToValueAtTime(frequency, timeOffset);
      }
    });

    // Calculate duration of the path
    const pathStartTime = (path[0].x / maxX) * duration;
    const pathEndX = path[path.length - 1].x;
    const pathDuration = (pathEndX - path[0].x) / maxX * duration;

    oscillator.start(pathStartTime);
    oscillator.stop(pathStartTime + pathDuration);
  });

  // Render the audio
  const renderedBuffer = await offlineCtx.startRendering();

  // Encode the buffer to WAV
  const wavData = encodeWAV(renderedBuffer);
  const blob = new Blob([wavData], { type: 'audio/wav' });

  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'composition.wav';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
