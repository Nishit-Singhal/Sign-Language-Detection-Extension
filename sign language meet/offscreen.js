import {
  HandLandmarker,
  FilesetResolver
} from "./mediapipe/tasks/vision_bundle.mjs";

const video = document.getElementById("video");

// ---------------- STATE ----------------
let detectionEnabled = false;
let lastGesture = "";
let lastSeen = 0;
let stream = null;
let handLandmarker = null;
let vision = null;

const CLEAR_DELAY = 800;

// ---------------- ENABLE/DISABLE DETECTION ----------------
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "ENABLE_DETECTION") {
    detectionEnabled = true;
    console.log("Detection ENABLED");
    
    // Start camera if not already started
    if (!stream) {
      await startCamera();
    }
    
    // Initialize MediaPipe if not already initialized
    if (!handLandmarker) {
      await initMediaPipe();
    }
  }
  
  if (msg.type === "DISABLE_DETECTION") {
    detectionEnabled = false;
    console.log("Detection DISABLED");
    
    // Stop speech
    speechSynthesis.cancel();
    
    // Clear last gesture
    lastGesture = "";
    
    // Stop camera
    stopCamera();
    
    // Clear subtitles
    chrome.runtime.sendMessage({
      type: "SIGN_DETECTED",
      text: ""
    });
  }
});

// ---------------- CAMERA ----------------
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    console.log("Video stream started");
  } catch (err) {
    console.error("Camera access failed:", err);
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

// ---------------- MEDIAPIPE ----------------
async function initMediaPipe() {
  try {
    vision = await FilesetResolver.forVisionTasks(
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

    console.log("MediaPipe ready");
  } catch (err) {
    console.error("MediaPipe initialization failed:", err);
  }
}

// ---------------- SPEECH ----------------
function speak(text) {
  if (!text) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(
    new SpeechSynthesisUtterance(text)
  );
}

// ---------------- FINGER STATES ----------------
function getFingerStates(lm) {
  return {
    thumb:  Math.abs(lm[4].x - lm[2].x) > 0.04,
    index:  lm[8].y  < lm[6].y,
    middle: lm[12].y < lm[10].y,
    ring:   lm[16].y < lm[14].y,
    pinky:  lm[20].y < lm[18].y
  };
}

// ---------------- CLASSIFIER ----------------
function classifyGesture(f) {
  if (f.index && !f.middle && !f.ring && !f.pinky)
    return "YES ☝️";

  if (f.index && f.middle && !f.ring && !f.pinky)
    return "TWO ✌️";

  if (!f.index && !f.middle && !f.ring && !f.pinky)
    return "STOP ✋";

  if (f.index && f.middle && f.ring)
    return "HELLO 👋";

  return "";
}

// ---------------- LOOP ----------------
function loop() {
  const now = performance.now();

  if (!detectionEnabled || !handLandmarker) {
    requestAnimationFrame(loop);
    return;
  }

  const res = handLandmarker.detectForVideo(video, now);

  if (res.landmarks && res.landmarks.length > 0) {
    lastSeen = now;

    const fingers = getFingerStates(res.landmarks[0]);
    console.table(fingers);

    const gesture = classifyGesture(fingers);

    // 🔥 DIRECT CHANGE DETECTION
    if (gesture && gesture !== lastGesture) {
      lastGesture = gesture;
      console.log("Gesture detected:", gesture);

      chrome.runtime.sendMessage({
        type: "SIGN_DETECTED",
        text: gesture
      });

      speak(gesture.replace(/[^a-zA-Z ]/g, ""));
    }
  }

  // CLEAR WHEN HAND REMOVED
  if (lastGesture && now - lastSeen > CLEAR_DELAY) {
    lastGesture = "";
    chrome.runtime.sendMessage({
      type: "SIGN_DETECTED",
      text: ""
    });
    speechSynthesis.cancel();
  }

  requestAnimationFrame(loop);
}

loop();
