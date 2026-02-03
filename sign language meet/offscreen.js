import {
  HandLandmarker,
  FilesetResolver
} from "./mediapipe/tasks/vision_bundle.mjs";

const video = document.getElementById("video");

// ---------------- STATE ----------------
let detectionEnabled = false;
let lastGesture = "";
let lastSeen = 0;

const CLEAR_DELAY = 800;

// ---------------- ENABLE DETECTION ----------------
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "ENABLE_DETECTION") {
    detectionEnabled = true;
    console.log("Detection ENABLED");
  }
});

// ---------------- CAMERA ----------------
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;
await video.play();
console.log("Video stream started");

// ---------------- MEDIAPIPE ----------------
const vision = await FilesetResolver.forVisionTasks(
  chrome.runtime.getURL("mediapipe/tasks")
);

const handLandmarker = await HandLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: chrome.runtime.getURL(
      "mediapipe/tasks/hand_landmarker.task"
    )
  },
  runningMode: "VIDEO",
  numHands: 1
});

console.log("MediaPipe ready");

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

  if (!detectionEnabled) {
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
