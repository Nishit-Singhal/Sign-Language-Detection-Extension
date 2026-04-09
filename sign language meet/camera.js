import { HandLandmarker, FilesetResolver } from "./mediapipe/tasks/vision_bundle.mjs";

const video = document.getElementById("video");
const status = document.getElementById("status");

let detectionEnabled = false;
let lastGesture = "";
let lastSeen = 0;
let stream = null;
let handLandmarker = null;
let animationFrameId = null;
let mlBackendEnabled = false;
let backendRequestInFlight = false;
let lastBackendRequestAt = 0;

const frameCanvas = document.createElement("canvas");
const frameContext = frameCanvas.getContext("2d", { willReadFrequently: true });

const BACKEND_URL = "http://127.0.0.1:8000";
const BACKEND_FRAME_INTERVAL = 140;
const BACKEND_JPEG_QUALITY = 0.72;
const BACKEND_CONFIDENCE_THRESHOLD = 0.25;
const CLEAR_DELAY = 1200;

function setStatus(text, isError = false) {
  status.textContent = text;
  status.className = isError ? "error" : "success";
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    setStatus("Camera started");
    console.log("Video stream started");
    return true;
  } catch (err) {
    console.error("Camera access failed:", err);
    setStatus("Camera access failed: " + err.message, true);
    return false;
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log("Video track stopped");
    });
    stream = null;
    video.srcObject = null;
  }
}

async function checkBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("ML backend health:", data);
    return true;
  } catch (err) {
    console.warn("ML backend health check failed:", err);
    return false;
  }
}

async function initMediaPipe() {
  try {
    setStatus("Loading MediaPipe fallback...");

    const vision = await FilesetResolver.forVisionTasks(
      chrome.runtime.getURL("mediapipe/tasks")
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: chrome.runtime.getURL(
          "mediapipe/tasks/hand_landmarker.task"
        )
      },
      runningMode: "VIDEO",
      numHands: 1
    });

    console.log("MediaPipe fallback ready");
    return true;
  } catch (err) {
    console.error("MediaPipe initialization failed:", err);
    setStatus("MediaPipe failed: " + err.message, true);
    return false;
  }
}

function speak(text) {
  if (!text) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function formatDetectedText(text) {
  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function emitGesture(text, confidence = null) {
  if (!text || text === lastGesture) {
    return;
  }

  const cleanText = formatDetectedText(text);
  lastGesture = text;

  const confidenceSuffix =
    typeof confidence === "number"
      ? ` (${(confidence * 100).toFixed(1)}%)`
      : "";

  console.log("Gesture detected:", cleanText, confidence);
  setStatus(`Detected: ${cleanText}${confidenceSuffix}`);

  chrome.runtime.sendMessage({
    type: "SIGN_DETECTED",
    text: cleanText
  });

  speak(cleanText);
}

function clearGesture() {
  if (!lastGesture) {
    return;
  }

  lastGesture = "";
  setStatus(mlBackendEnabled ? "Waiting for sign input..." : "Detecting gestures...");
  chrome.runtime.sendMessage({
    type: "SIGN_DETECTED",
    text: ""
  });
  speechSynthesis.cancel();
}

async function enableFallbackMode() {
  mlBackendEnabled = false;

  if (!handLandmarker) {
    const mediaPipeOk = await initMediaPipe();
    if (!mediaPipeOk) {
      return false;
    }
  }

  setStatus("ML backend unavailable - using built-in gesture rules");
  return true;
}

function captureFrame() {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  if (
    frameCanvas.width !== video.videoWidth ||
    frameCanvas.height !== video.videoHeight
  ) {
    frameCanvas.width = video.videoWidth;
    frameCanvas.height = video.videoHeight;
  }

  frameContext.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
  return frameCanvas.toDataURL("image/jpeg", BACKEND_JPEG_QUALITY);
}

function handleBackendResult(result, now) {
  if (result.hand_present) {
    lastSeen = now;
  }

  if (result.confirmed_word) {
    emitGesture(result.confirmed_word, result.confidence);
    return;
  }

  if (!result.hand_present) {
    setStatus("No hand detected - keep hand and upper body visible");
    return;
  }

  if (result.state === "WARMING_UP") {
    setStatus(`Warming up model: ${result.sequence_length || 0}/60 frames`);
    return;
  }

  if (result.word && result.confidence >= BACKEND_CONFIDENCE_THRESHOLD) {
    setStatus(
      `Tracking: ${formatDetectedText(result.word)} (${(result.confidence * 100).toFixed(1)}%)`
    );
  } else if (result.word) {
    setStatus(
      `Low confidence: ${formatDetectedText(result.word)} (${(result.confidence * 100).toFixed(1)}%)`
    );
  } else if (result.hand_present) {
    setStatus("Tracking sign...");
  }
}

async function sendFrameToBackend(now) {
  if (
    backendRequestInFlight ||
    now - lastBackendRequestAt < BACKEND_FRAME_INTERVAL
  ) {
    return;
  }

  const image = captureFrame();
  if (!image) {
    return;
  }

  backendRequestInFlight = true;
  lastBackendRequestAt = now;

  try {
    const response = await fetch(`${BACKEND_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    handleBackendResult(result, now);
  } catch (err) {
    console.error("ML backend request failed:", err);
    await enableFallbackMode();
  } finally {
    backendRequestInFlight = false;
  }
}

function getFingerStates(lm) {
  return {
    thumb: Math.abs(lm[4].x - lm[2].x) > 0.04,
    index: lm[8].y < lm[6].y,
    middle: lm[12].y < lm[10].y,
    ring: lm[16].y < lm[14].y,
    pinky: lm[20].y < lm[18].y
  };
}

function classifyGesture(f) {
  if (f.index && !f.middle && !f.ring && !f.pinky) {
    return "yes";
  }

  if (f.index && f.middle && !f.ring && !f.pinky) {
    return "two";
  }

  if (!f.index && !f.middle && !f.ring && !f.pinky) {
    return "stop";
  }

  if (f.index && f.middle && f.ring) {
    return "hello";
  }

  return "";
}

function runFallbackClassifier(now) {
  if (!handLandmarker) {
    return;
  }

  const result = handLandmarker.detectForVideo(video, now);
  if (!result.landmarks || result.landmarks.length === 0) {
    return;
  }

  lastSeen = now;

  const fingers = getFingerStates(result.landmarks[0]);
  const gesture = classifyGesture(fingers);
  if (gesture) {
    emitGesture(gesture);
  }
}

function loop() {
  if (!detectionEnabled) {
    animationFrameId = null;
    return;
  }

  const now = performance.now();

  if (mlBackendEnabled) {
    sendFrameToBackend(now);
  } else {
    runFallbackClassifier(now);
  }

  if (lastGesture && now - lastSeen > CLEAR_DELAY) {
    clearGesture();
  }

  animationFrameId = requestAnimationFrame(loop);
}

async function init() {
  setStatus("Requesting camera access...");

  const cameraOk = await startCamera();
  if (!cameraOk) {
    return;
  }

  mlBackendEnabled = await checkBackend();

  if (mlBackendEnabled) {
    setStatus("ML backend connected - starting model inference");
  } else {
    const fallbackOk = await enableFallbackMode();
    if (!fallbackOk) {
      return;
    }
  }

  detectionEnabled = true;
  loop();
}

init();

window.addEventListener("beforeunload", () => {
  stopCamera();

  if (handLandmarker) {
    try {
      handLandmarker.close();
    } catch (err) {
      console.warn("Failed to close HandLandmarker:", err);
    }
  }

  fetch(`${BACKEND_URL}/reset`, { method: "POST" }).catch(() => {});

  chrome.runtime.sendMessage({
    type: "SIGN_DETECTED",
    text: ""
  });
});
