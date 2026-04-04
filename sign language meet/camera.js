import { HandLandmarker, FilesetResolver } from "./mediapipe/tasks/vision_bundle.mjs";

const video = document.getElementById("video");
const status = document.getElementById("status");

// ---------------- STATE ----------------
let detectionEnabled = false;
let lastGesture = "";
let lastSeen = 0;
let stream = null;
let handLandmarker = null;
let animationFrameId = null;

const CLEAR_DELAY = 800;

// ---------------- STATUS UPDATE ----------------
function setStatus(text, isError = false) {
  status.textContent = text;
  status.className = isError ? "error" : "success";
}

// ---------------- CAMERA ----------------
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

// ---------------- MEDIAPIPE ----------------
async function initMediaPipe() {
  try {
    setStatus("Loading MediaPipe...");

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

    setStatus("MediaPipe ready - detecting gestures");
    console.log("MediaPipe ready");
    return true;
  } catch (err) {
    console.error("MediaPipe initialization failed:", err);
    setStatus("MediaPipe failed: " + err.message, true);
    return false;
  }
}

// ---------------- SPEECH ----------------
function speak(text) {
  if (!text) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

// ---------------- FINGER STATES ----------------
function getFingerStates(lm) {
  return {
    thumb: Math.abs(lm[4].x - lm[2].x) > 0.04,
    index: lm[8].y < lm[6].y,
    middle: lm[12].y < lm[10].y,
    ring: lm[16].y < lm[14].y,
    pinky: lm[20].y < lm[18].y
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
  if (!detectionEnabled || !handLandmarker) {
    animationFrameId = null;
    return;
  }

  const now = performance.now();
  const res = handLandmarker.detectForVideo(video, now);

  if (res.landmarks && res.landmarks.length > 0) {
    lastSeen = now;

    const fingers = getFingerStates(res.landmarks[0]);
    const gesture = classifyGesture(fingers);

    if (gesture && gesture !== lastGesture) {
      lastGesture = gesture;
      console.log("Gesture detected:", gesture);
      setStatus("Detected: " + gesture);

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
    setStatus("Detecting gestures...");
    chrome.runtime.sendMessage({
      type: "SIGN_DETECTED",
      text: ""
    });
    speechSynthesis.cancel();
  }

  animationFrameId = requestAnimationFrame(loop);
}

// ---------------- INIT ----------------
async function init() {
  setStatus("Requesting camera access...");

  const cameraOk = await startCamera();
  if (!cameraOk) return;

  const mpOk = await initMediaPipe();
  if (!mpOk) return;

  detectionEnabled = true;
  loop();
}

// Start immediately when window opens
init();

// Handle window close
window.addEventListener("beforeunload", () => {
  stopCamera();
  if (handLandmarker) {
    try {
      handLandmarker.close();
    } catch (e) {}
  }
  chrome.runtime.sendMessage({
    type: "SIGN_DETECTED",
    text: ""
  });
});
// import {
//   HandLandmarker,
//   FilesetResolver
// } from "./mediapipe/tasks/vision_bundle.mjs";

// const video = document.getElementById("video");
// const status = document.getElementById("status");

// // ---------------- STATE ----------------
// let detectionEnabled = false;
// let lastGesture = "";
// let lastSeen = 0;
// let stream = null;
// let handLandmarker = null;
// let animationFrameId = null;

// const CLEAR_DELAY = 800;
// const CONFIDENCE_THRESHOLD = 0.75;

// // ---------------- STATUS UPDATE ----------------
// function setStatus(text, isError = false) {
//   status.textContent = text;
//   status.className = isError ? "error" : "success";
// }

// // ---------------- CAMERA ----------------
// async function startCamera() {
//   try {
//     stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     video.srcObject = stream;
//     await video.play();
//     setStatus("Camera started");
//     console.log("Video stream started");
//     return true;
//   } catch (err) {
//     console.error("Camera access failed:", err);
//     setStatus("Camera access failed: " + err.message, true);
//     return false;
//   }
// }

// function stopCamera() {
//   if (stream) {
//     stream.getTracks().forEach(track => track.stop());
//     stream = null;
//     video.srcObject = null;
//   }
// }

// // ---------------- MEDIAPIPE ----------------
// async function initMediaPipe() {
//   try {
//     setStatus("Loading MediaPipe...");

//     const vision = await FilesetResolver.forVisionTasks(
//       chrome.runtime.getURL("mediapipe/tasks")
//     );

//     handLandmarker = await HandLandmarker.createFromOptions(vision, {
//       baseOptions: {
//         modelAssetPath: chrome.runtime.getURL(
//           "mediapipe/tasks/hand_landmarker.task"
//         )
//       },
//       runningMode: "VIDEO",
//       numHands: 1
//     });

//     setStatus("MediaPipe ready - detecting gestures");
//     console.log("MediaPipe ready");
//     return true;
//   } catch (err) {
//     console.error("MediaPipe initialization failed:", err);
//     setStatus("MediaPipe failed: " + err.message, true);
//     return false;
//   }
// }

// // ---------------- SPEECH ----------------
// function speak(text) {
//   if (!text) return;
//   speechSynthesis.cancel();
//   speechSynthesis.speak(new SpeechSynthesisUtterance(text));
// }

// // ---------------- ML BACKEND ----------------
// async function sendToBackend(landmarks) {

//   // Normalize landmarks (subtract wrist)
//   const wrist = landmarks[0];
//   let flat = [];

//   for (let lm of landmarks) {
//     flat.push(lm.x - wrist.x);
//     flat.push(lm.y - wrist.y);
//     flat.push(lm.z - wrist.z);
//   }

//   try {
//     const response = await fetch("http://127.0.0.1:8000/predict", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ landmarks: flat })
//     });

//     const data = await response.json();

//     if (
//       data.confidence > CONFIDENCE_THRESHOLD &&
//       data.word !== lastGesture
//     ) {
//       lastGesture = data.word;
//       lastSeen = performance.now();

//       console.log("ML Prediction:", data.word, data.confidence);

//       setStatus(
//         `Detected: ${data.word} (${(data.confidence * 100).toFixed(1)}%)`
//       );

//       chrome.runtime.sendMessage({
//         type: "SIGN_DETECTED",
//         text: data.word
//       });

//       speak(data.word);
//     }

//   } catch (error) {
//     console.error("Backend error:", error);
//   }
// }

// // ---------------- LOOP ----------------
// function loop() {
//   if (!detectionEnabled || !handLandmarker) {
//     animationFrameId = null;
//     return;
//   }

//   const now = performance.now();
//   const res = handLandmarker.detectForVideo(video, now);

//   if (res.landmarks && res.landmarks.length > 0) {
//     lastSeen = now;
//     sendToBackend(res.landmarks[0]);
//   }

//   // Clear when hand removed
//   if (lastGesture && now - lastSeen > CLEAR_DELAY) {
//     lastGesture = "";
//     setStatus("Detecting gestures...");
//     chrome.runtime.sendMessage({
//       type: "SIGN_DETECTED",
//       text: ""
//     });
//     speechSynthesis.cancel();
//   }

//   animationFrameId = requestAnimationFrame(loop);
// }

// // ---------------- INIT ----------------
// async function init() {
//   setStatus("Requesting camera access...");

//   const cameraOk = await startCamera();
//   if (!cameraOk) return;

//   const mpOk = await initMediaPipe();
//   if (!mpOk) return;

//   detectionEnabled = true;
//   loop();
// }

// init();

// // Cleanup
// window.addEventListener("beforeunload", () => {
//   stopCamera();
//   if (handLandmarker) {
//     try {
//       handLandmarker.close();
//     } catch (e) {}
//   }
//   chrome.runtime.sendMessage({
//     type: "SIGN_DETECTED",
//     text: ""
//   });
// });