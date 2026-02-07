# Sign Language Detection Extension - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Usage Guide](#usage-guide)
5. [File Structure](#file-structure)
6. [Component Details](#component-details)
7. [API Reference](#api-reference)
8. [Development Guide](#development-guide)
9. [Testing & Debugging](#testing--debugging)
10. [Gesture Recognition Logic](#gesture-recognition-logic)
11. [Troubleshooting](#troubleshooting)
12. [Future Enhancements](#future-enhancements)
13. [Contributing](#contributing)
14. [License & Credits](#license--credits)

---

## Project Overview

### Purpose
The Sign Language Detection Extension is a Chrome browser extension that enables real-time sign language communication during Google Meet video calls. It bridges the communication gap for hearing- and speech-impaired users by converting hand gestures into live subtitles and synthesized speech.

### Problem Statement
Traditional video conferencing platforms lack accessibility features for sign language users. Manual interpretation or typing can be slow and disruptive. This extension provides automated, real-time gesture recognition to facilitate seamless communication.

### Solution
By leveraging MediaPipe's hand tracking AI and Chrome's extension APIs, the system:
- Detects hand gestures in real-time via webcam
- Classifies gestures into meaningful words/phrases
- Displays live subtitles overlaid on Google Meet
- Provides text-to-speech audio output
- Operates entirely client-side (privacy-preserving)

### Target Users
- Deaf or hard-of-hearing individuals
- Speech-impaired users
- Sign language practitioners
- Accessibility advocates
- Developers building assistive technologies

---

## Features

### ✅ Core Features
1. **Real-Time Gesture Detection**
   - 30-60 FPS hand tracking
   - 21 landmark points per hand
   - Sub-50ms processing latency

2. **Live Subtitle Overlay**
   - Fixed position on Google Meet
   - Queue-based display (3 lines max)
   - Auto-hide when no gestures detected
   - High z-index for visibility

3. **Text-to-Speech Output**
   - Automatic voice synthesis
   - Gesture-triggered playback
   - Browser-native speech engine

4. **Non-Intrusive Design**
   - Separate camera window
   - No page reloads required
   - Minimal permissions required
   - One-click start/stop

5. **Privacy-First**
   - All processing happens locally
   - No cloud API calls
   - No data storage or transmission
   - Camera access only when active

### 📊 Current Gesture Support
| Gesture | Finger Pattern | Output | Emoji |
|---------|---------------|--------|-------|
| Index Finger | Index up, others down | YES | ☝️ |
| Peace Sign | Index + Middle up | TWO | ✌️ |
| Fist | All fingers down | STOP | ✋ |
| Open Hand | Index + Middle + Ring up | HELLO | 👋 |

### ⚙️ Technical Features
- **Chrome Manifest V3** compliant
- **MediaPipe Tasks Vision** integration
- **WebAssembly** acceleration
- **Service Worker** architecture
- **Content Script** injection
- **Camera API** access

---

## Installation & Setup

### Prerequisites
- **Google Chrome** v88+ (Manifest V3 support)
- **Webcam** (built-in or external)
- **Operating System**: Windows, macOS, or Linux
- **Internet**: Required only for initial Chrome Web Store download (if published)

### Option 1: Install from Source (Developer Mode)

#### Step 1: Clone Repository
```bash
git clone https://github.com/Anas255-exe/Sign-Language-Detection-Extension.git
cd Sign-Language-Detection-Extension
```

#### Step 2: Open Chrome Extensions Page
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)

#### Step 3: Load Extension
1. Click **Load unpacked** button
2. Navigate to the `sign language meet` folder
3. Click **Select Folder**

#### Step 4: Verify Installation
- Extension icon should appear in Chrome toolbar
- Check for "Sign Language Meet" in extensions list
- No errors should be displayed

### Option 2: Install from Chrome Web Store
*(Available when published)*

1. Visit Chrome Web Store listing
2. Click "Add to Chrome"
3. Confirm permissions
4. Icon appears in toolbar

### Granting Camera Permissions

When first using the extension:
1. Browser will prompt for camera access
2. Click **Allow** to grant permission
3. Permission is remembered for future use
4. To revoke: `chrome://settings/content/camera`

---

## Usage Guide

### Quick Start (5 Steps)

#### Step 1: Open Google Meet
1. Navigate to `https://meet.google.com/`
2. Join or start a meeting
3. Ensure you're in the meeting room

#### Step 2: Launch Extension
1. Click the extension icon in Chrome toolbar
2. Popup window appears with controls

#### Step 3: Start Detection
1. Click **Start Detection** button
2. Camera window opens (360x320px)
3. Grant camera permission if prompted
4. "Camera started" message appears

#### Step 4: Perform Gestures
1. Position hand in front of camera
2. Make supported gestures (see table above)
3. Watch subtitles appear on Meet screen
4. Listen for speech output

#### Step 5: Stop Detection
1. Click **Stop Detection** in popup, or
2. Close camera window directly
3. Subtitles clear automatically

### Detailed Workflow

#### Starting Detection
```
User Action → Popup → Background → Camera Window
   ↓            ↓          ↓             ↓
 Click      Send msg   Create     Init camera
 button     to BG      window     Load model
                                 Start loop
```

**Expected Behavior**:
- Camera window opens in 320x360 popup
- Video feed displays immediately
- Status shows "Loading MediaPipe..."
- Status changes to "MediaPipe ready - detecting gestures"
- Detection starts automatically

#### During Detection
```
Hand in View → MediaPipe → Classify → Send → Display
     ↓            ↓           ↓        ↓       ↓
  Captured    Landmarks   Gesture  Background Content
   frame     extracted   identified  routes   shows
                                              subtitle
```

**Expected Behavior**:
- Gestures detected within ~100ms
- Subtitles appear at bottom-center of Meet
- Speech plays simultaneously
- Status updates in camera window
- Subtitle queue shows last 3 gestures

#### Stopping Detection
```
User Action → Popup → Background → Camera Window
   ↓            ↓          ↓             ↓
 Click      Send msg   Close      Cleanup
 button     to BG      window     resources
```

**Expected Behavior**:
- Camera window closes immediately
- Video stream stops
- MediaPipe resources freed
- Subtitles disappear from Meet
- Speech stops playing

### Best Practices

#### 1. **Hand Positioning**
- **Distance**: 1-2 feet from camera
- **Lighting**: Well-lit environment (front/side lighting)
- **Background**: Contrasting, non-cluttered
- **Orientation**: Palm facing camera

#### 2. **Gesture Performance**
- **Speed**: Moderate pace (not too fast)
- **Clarity**: Exaggerate finger positions
- **Hold**: Pause briefly on each gesture (~0.5s)
- **Transitions**: Clear separation between gestures

#### 3. **Technical Tips**
- **Resolution**: Higher webcam resolution = better accuracy
- **Framerate**: 30 FPS minimum recommended
- **CPU**: Close unnecessary apps for performance
- **Browser**: Keep Chrome updated

---

## File Structure

```
Sign-Language-Detection-Extension/
│
├── README.md                    # Project overview and basic docs
├── ARCHITECTURE.md              # System architecture documentation
├── PROJECT_DOCUMENTATION.md     # This file
│
└── sign language meet/          # Extension root directory
    │
    ├── manifest.json            # Extension configuration
    │
    ├── popup.html               # Extension popup UI (200x~)
    ├── popup.js                 # Popup control logic (~10 lines)
    │
    ├── background.js            # Service worker / router (~86 lines)
    │
    ├── content.js               # Google Meet injection (~49 lines)
    │
    ├── camera.html              # Camera window UI
    ├── camera.js                # Active detection logic (~192 lines)
    │
    ├── offscreen.html           # Alternative implementation UI
    ├── offscreen.js             # Alternative detection (~230 lines)
    │
    └── mediapipe/
        └── tasks/
            ├── vision_bundle.mjs              # MediaPipe JS API (137KB)
            ├── hand_landmarker.task           # TFLite model (7.8MB)
            ├── vision_wasm_internal.wasm      # WASM runtime (11.4MB)
            ├── vision_wasm_internal.js        # WASM loader (205KB)
            ├── vision_wasm_nosimd_internal.wasm  # Fallback runtime (10.6MB)
            └── vision_wasm_nosimd_internal.js    # Fallback loader (205KB)
```

### File Purpose Summary

| File | Type | Size | Purpose |
|------|------|------|---------|
| `manifest.json` | Config | ~1KB | Extension metadata & permissions |
| `popup.html/js` | UI | ~1KB | User control interface |
| `background.js` | Worker | ~3KB | Message routing & state |
| `content.js` | Script | ~2KB | Meet page subtitle injection |
| `camera.html/js` | UI+Logic | ~7KB | Active detection implementation |
| `offscreen.html/js` | UI+Logic | ~8KB | Alternative implementation |
| `mediapipe/*` | ML Model | ~30MB | Hand landmark detection |

---

## Component Details

### 1. Popup (popup.html/js)

**Purpose**: Extension control panel

**UI Elements**:
- Title: "✋ Sign Detection"
- Start Detection button
- Stop Detection button

**Code Structure**:
```javascript
// popup.js
document.getElementById("start").onclick = () => {
  chrome.runtime.sendMessage({ type: "START_DETECTION" });
};

document.getElementById("stop").onclick = () => {
  chrome.runtime.sendMessage({ type: "STOP_DETECTION" });
};
```

**Styling**:
- 200px width
- Arial font
- Centered text
- Full-width buttons
- 6px margin between buttons

---

### 2. Background Service Worker (background.js)

**Purpose**: Central message hub and state manager

**State Variables**:
```javascript
let meetTabId = null;        // Google Meet tab ID
let cameraWindowId = null;   // Camera popup window ID
```

**Event Handlers**:

#### Tab Update Listener
```javascript
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("meet.google.com")) {
    meetTabId = tabId;
    console.log("Meet tab stored:", meetTabId);
  }
});
```
**Purpose**: Automatically detect and store Meet tab ID

#### Tab Removed Listener
```javascript
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === meetTabId) {
    console.log("Meet tab closed, clearing meetTabId");
    meetTabId = null;
  }
});
```
**Purpose**: Cleanup when Meet tab closes

#### Window Removed Listener
```javascript
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === cameraWindowId) {
    console.log("Camera window closed");
    cameraWindowId = null;
  }
});
```
**Purpose**: Cleanup when camera window closes

#### Message Handler
```javascript
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "START_DETECTION") { /* ... */ }
  if (msg.type === "STOP_DETECTION") { /* ... */ }
  if (msg.type === "SIGN_DETECTED") { /* ... */ }
});
```
**Purpose**: Route messages between components

---

### 3. Content Script (content.js)

**Purpose**: Google Meet page modification

**Subtitle Box Creation**:
```javascript
subtitleBox = document.createElement("div");
subtitleBox.id = "sign-language-subtitle";
subtitleBox.innerText = "👋 Waiting for sign input...";

Object.assign(subtitleBox.style, {
  position: "fixed",
  bottom: "120px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "12px 24px",
  background: "rgba(0,0,0,0.85)",
  color: "white",
  fontSize: "20px",
  borderRadius: "10px",
  zIndex: "999999",
  maxWidth: "80%",
  textAlign: "center",
  whiteSpace: "pre-line",
  display: "none"
});
```

**Queue Management**:
```javascript
const subtitleQueue = [];
const MAX_SUBTITLE_LINES = 3;

// On new gesture
subtitleQueue.push(msg.text.trim());
while (subtitleQueue.length > MAX_SUBTITLE_LINES) {
  subtitleQueue.shift();
}
subtitleBox.innerText = subtitleQueue.join("\n");
```

**Message Handling**:
```javascript
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SIGN_DETECTED") {
    if (msg.text && msg.text.trim() !== "") {
      // Add to queue and display
    } else {
      // Clear display
      subtitleQueue.length = 0;
      subtitleBox.style.display = "none";
    }
  }
});
```

---

### 4. Camera Window (camera.html/js)

**Purpose**: Webcam capture and gesture detection

#### Initialization Flow
```javascript
async function init() {
  setStatus("Requesting camera access...");
  
  const cameraOk = await startCamera();
  if (!cameraOk) return;
  
  const mpOk = await initMediaPipe();
  if (!mpOk) return;
  
  detectionEnabled = true;
  loop();
}
```

#### Camera Setup
```javascript
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    setStatus("Camera started");
    return true;
  } catch (err) {
    setStatus("Camera access failed: " + err.message, true);
    return false;
  }
}
```

#### MediaPipe Initialization
```javascript
async function initMediaPipe() {
  try {
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
    return true;
  } catch (err) {
    setStatus("MediaPipe failed: " + err.message, true);
    return false;
  }
}
```

#### Detection Loop
```javascript
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
      chrome.runtime.sendMessage({
        type: "SIGN_DETECTED",
        text: gesture
      });
      speak(gesture.replace(/[^a-zA-Z ]/g, ""));
    }
  }

  // Clear when hand removed
  if (lastGesture && now - lastSeen > CLEAR_DELAY) {
    lastGesture = "";
    chrome.runtime.sendMessage({
      type: "SIGN_DETECTED",
      text: ""
    });
    speechSynthesis.cancel();
  }

  animationFrameId = requestAnimationFrame(loop);
}
```

#### Cleanup
```javascript
window.addEventListener('beforeunload', () => {
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
```

---

### 5. Offscreen Document (offscreen.html/js)

**Purpose**: Alternative implementation using Offscreen API

**Key Differences from camera.js**:
1. **Message-based control**: Uses `ENABLE_DETECTION` / `DISABLE_DETECTION`
2. **No auto-start**: Waits for explicit enable message
3. **More robust**: Includes duplicate initialization prevention
4. **Better cleanup**: More thorough resource disposal

**Initialization Guard**:
```javascript
let isInitializing = false;

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "ENABLE_DETECTION") {
    if (isInitializing) {
      console.log("Initialization already in progress");
      return;
    }
    isInitializing = true;
    try {
      // Initialize...
    } finally {
      isInitializing = false;
    }
  }
});
```

**Cleanup on Disable**:
```javascript
if (msg.type === "DISABLE_DETECTION") {
  detectionEnabled = false;
  speechSynthesis.cancel();
  lastGesture = "";
  stopCamera();
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  if (handLandmarker) {
    if (typeof handLandmarker.close === 'function') {
      handLandmarker.close();
    }
    handLandmarker = null;
  }
  vision = null;
  
  chrome.runtime.sendMessage({
    type: "SIGN_DETECTED",
    text: ""
  });
}
```

---

## API Reference

### Message API

#### Message: START_DETECTION
**Sender**: popup.js  
**Receiver**: background.js  
**Purpose**: Initiate gesture detection

**Format**:
```javascript
{
  type: "START_DETECTION"
}
```

**Response**: None (async)

**Side Effects**:
- Creates camera window
- Initializes webcam and MediaPipe
- Starts detection loop

---

#### Message: STOP_DETECTION
**Sender**: popup.js  
**Receiver**: background.js  
**Purpose**: Stop gesture detection

**Format**:
```javascript
{
  type: "STOP_DETECTION"
}
```

**Response**: None (async)

**Side Effects**:
- Closes camera window
- Stops webcam stream
- Clears MediaPipe resources
- Clears subtitles

---

#### Message: SIGN_DETECTED
**Sender**: camera.js / offscreen.js  
**Receiver**: background.js → content.js  
**Purpose**: Communicate detected gesture

**Format**:
```javascript
{
  type: "SIGN_DETECTED",
  text: string  // "YES ☝️", "TWO ✌️", "STOP ✋", "HELLO 👋", or ""
}
```

**Response**: None (fire-and-forget)

**Side Effects**:
- Updates subtitle in Meet tab
- Empty string clears subtitle

---

### Chrome Extension APIs Used

#### chrome.runtime.sendMessage()
```javascript
// Send message to background
chrome.runtime.sendMessage({
  type: "MESSAGE_TYPE",
  data: { /* ... */ }
});
```

#### chrome.runtime.onMessage.addListener()
```javascript
// Receive messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "MESSAGE_TYPE") {
    // Handle message
  }
});
```

#### chrome.tabs.sendMessage()
```javascript
// Send message to specific tab
chrome.tabs.sendMessage(tabId, {
  type: "MESSAGE_TYPE",
  data: { /* ... */ }
});
```

#### chrome.windows.create()
```javascript
// Create popup window
const win = await chrome.windows.create({
  url: chrome.runtime.getURL("camera.html"),
  type: "popup",
  width: 360,
  height: 320,
  focused: true
});
```

#### chrome.runtime.getURL()
```javascript
// Get extension resource URL
const url = chrome.runtime.getURL("path/to/resource");
```

---

### MediaPipe API

#### FilesetResolver.forVisionTasks()
```javascript
const vision = await FilesetResolver.forVisionTasks(
  chrome.runtime.getURL("mediapipe/tasks")
);
```
**Purpose**: Initialize MediaPipe vision tasks

---

#### HandLandmarker.createFromOptions()
```javascript
handLandmarker = await HandLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "path/to/hand_landmarker.task"
  },
  runningMode: "VIDEO",  // or "IMAGE"
  numHands: 1            // 1-2
});
```
**Purpose**: Create hand landmark detector

---

#### handLandmarker.detectForVideo()
```javascript
const result = handLandmarker.detectForVideo(videoElement, timestamp);
```

**Returns**:
```javascript
{
  landmarks: [
    [
      { x: 0.5, y: 0.3, z: -0.02 },  // Point 0: Wrist
      { x: 0.52, y: 0.28, z: -0.03 }, // Point 1: Thumb CMC
      // ... 19 more points
    ]
  ],
  worldLandmarks: [ /* 3D coordinates */ ],
  handedness: [ /* left/right classification */ ]
}
```

**Landmark Indices**:
```
0: Wrist
1-4: Thumb (CMC, MCP, IP, Tip)
5-8: Index (MCP, PIP, DIP, Tip)
9-12: Middle (MCP, PIP, DIP, Tip)
13-16: Ring (MCP, PIP, DIP, Tip)
17-20: Pinky (MCP, PIP, DIP, Tip)
```

---

#### handLandmarker.close()
```javascript
handLandmarker.close();
```
**Purpose**: Free MediaPipe resources

---

### Web Speech API

#### speechSynthesis.speak()
```javascript
const utterance = new SpeechSynthesisUtterance(text);
speechSynthesis.speak(utterance);
```
**Purpose**: Convert text to speech

---

#### speechSynthesis.cancel()
```javascript
speechSynthesis.cancel();
```
**Purpose**: Stop current speech

---

## Development Guide

### Development Setup

#### 1. Clone and Load
```bash
git clone https://github.com/Anas255-exe/Sign-Language-Detection-Extension.git
cd Sign-Language-Detection-Extension
# Load "sign language meet" folder as unpacked extension
```

#### 2. Enable Console Logging
All components log to console:
- **Popup**: Right-click popup → Inspect → Console
- **Background**: chrome://extensions → Details → Inspect views: service worker
- **Content**: F12 in Google Meet tab → Console
- **Camera**: Right-click camera window → Inspect → Console

#### 3. Hot Reload
After code changes:
1. Go to `chrome://extensions/`
2. Click **Reload** icon on extension card
3. Refresh Google Meet tab
4. Restart detection

---

### Modifying Gestures

#### Step 1: Update Classifier
**File**: `camera.js` (or `offscreen.js`)

```javascript
function classifyGesture(f) {
  // Add new gesture
  if (f.thumb && f.pinky && !f.index && !f.middle && !f.ring) {
    return "I LOVE YOU 🤟";
  }
  
  // Existing gestures...
}
```

#### Step 2: Test Gesture
1. Reload extension
2. Start detection
3. Make gesture in front of camera
4. Check console for finger states:
```javascript
console.table(fingers);
```

#### Step 3: Adjust Thresholds
If detection is unreliable, tune finger state logic:
```javascript
function getFingerStates(lm) {
  return {
    thumb: Math.abs(lm[4].x - lm[2].x) > 0.05,  // Increase for stricter
    index: lm[8].y < lm[6].y - 0.02,            // Add offset for tolerance
    // ...
  };
}
```

---

### Adding New Features

#### Example: Add Confidence Score Display

**Step 1**: Modify MediaPipe detection
```javascript
// camera.js
if (res.landmarks && res.landmarks.length > 0) {
  const confidence = res.handedness[0][0].score;  // Get confidence
  console.log("Confidence:", confidence);
}
```

**Step 2**: Add to message
```javascript
chrome.runtime.sendMessage({
  type: "SIGN_DETECTED",
  text: gesture,
  confidence: confidence  // Add field
});
```

**Step 3**: Display in subtitle
```javascript
// content.js
if (msg.type === "SIGN_DETECTED") {
  const displayText = msg.confidence 
    ? `${msg.text} (${(msg.confidence * 100).toFixed(0)}%)`
    : msg.text;
  subtitleBox.innerText = displayText;
}
```

---

### Code Style Guidelines

#### JavaScript
- Use ES6+ syntax (arrow functions, const/let, async/await)
- Descriptive variable names (e.g., `handLandmarker`, not `hl`)
- Comment sections with `// -------- SECTION --------`
- Keep functions small and focused
- Error handling with try/catch

#### Formatting
```javascript
// ✅ Good
async function initMediaPipe() {
  try {
    const vision = await FilesetResolver.forVisionTasks(url);
    return true;
  } catch (err) {
    console.error("Init failed:", err);
    return false;
  }
}

// ❌ Bad
async function init(){try{const v=await resolve(u);return 1}catch(e){return 0}}
```

#### Console Logging
```javascript
// Informative messages
console.log("MediaPipe ready");

// Include context
console.log("Meet tab stored:", meetTabId);

// Error details
console.error("Camera access failed:", err);
```

---

## Testing & Debugging

### Manual Testing Checklist

#### ✅ Installation
- [ ] Extension loads without errors
- [ ] Icon appears in toolbar
- [ ] No console errors on load

#### ✅ Popup UI
- [ ] Popup opens on icon click
- [ ] Both buttons visible and styled
- [ ] Buttons respond to clicks

#### ✅ Camera Window
- [ ] Opens on "Start Detection"
- [ ] Displays video feed within 2 seconds
- [ ] Status shows "MediaPipe ready..."
- [ ] Window closable by user

#### ✅ Gesture Detection
- [ ] "YES" gesture detected (index up)
- [ ] "TWO" gesture detected (peace sign)
- [ ] "STOP" gesture detected (fist)
- [ ] "HELLO" gesture detected (open hand)
- [ ] Detection happens within 0.5 seconds
- [ ] Status updates in camera window

#### ✅ Subtitles
- [ ] Appear on Google Meet page
- [ ] Centered at bottom (120px from bottom)
- [ ] Readable (white on black background)
- [ ] Show last 3 gestures
- [ ] Clear when hand removed (0.8s delay)

#### ✅ Speech
- [ ] Plays on gesture detection
- [ ] Emojis removed from spoken text
- [ ] Cancels previous speech on new gesture

#### ✅ Stop Detection
- [ ] "Stop Detection" button works
- [ ] Closing camera window stops detection
- [ ] Resources cleaned up (no memory leaks)
- [ ] Subtitles cleared on Meet

#### ✅ Edge Cases
- [ ] Works with multiple Meet tabs
- [ ] Handles Meet tab closing during detection
- [ ] Handles camera permission denial
- [ ] Handles poor lighting conditions
- [ ] No crashes on rapid start/stop

---

### Debugging Tools

#### 1. Console Inspection

**Background Worker**:
```
chrome://extensions/ → Details → Inspect views: service worker
```
See: Message routing, tab/window management

**Content Script**:
```
F12 in Google Meet tab → Console
```
See: Subtitle updates, message reception

**Camera Window**:
```
Right-click camera window → Inspect
```
See: MediaPipe logs, finger states, gesture detection

**Popup**:
```
Right-click popup → Inspect
```
See: Button clicks, message sending

---

#### 2. Network Tab

Check MediaPipe resource loading:
```
Camera window → F12 → Network tab
Filter: "hand_landmarker.task", "vision_wasm"
```

**Expected**:
- `hand_landmarker.task` (7.8MB) - Status 200
- `vision_wasm_internal.wasm` (11.4MB) - Status 200

---

#### 3. Performance Profiling

```
Camera window → F12 → Performance tab
Click Record → Perform gestures → Stop
```

**Look for**:
- Frame rate (should be ~30-60 FPS)
- `detectForVideo` call duration (should be < 50ms)
- Memory usage (should stabilize, not grow)

---

#### 4. Common Errors

**Error**: "Camera access failed: NotAllowedError"
```
Solution: Grant camera permission in browser settings
chrome://settings/content/camera
```

**Error**: "MediaPipe failed: Failed to fetch"
```
Solution: Ensure mediapipe folder is present and complete
Check: ls -la "sign language meet/mediapipe/tasks/"
```

**Error**: "Uncaught TypeError: handLandmarker is null"
```
Solution: MediaPipe didn't initialize. Check console for init errors.
```

**Error**: Subtitles don't appear
```
Check: 
1. meetTabId is set (background console)
2. Content script loaded (Meet tab console)
3. Message received (content script console)
```

**Error**: Detection too slow or laggy
```
Solutions:
1. Close other tabs/apps
2. Lower video resolution
3. Check CPU usage (should be < 50%)
```

---

### Unit Testing (Future)

Currently, the extension has no automated tests. Recommended framework:

#### Jest + jsdom
```javascript
// example.test.js
const { classifyGesture } = require('./camera.js');

test('detects YES gesture', () => {
  const fingers = { index: true, middle: false, ring: false, pinky: false };
  expect(classifyGesture(fingers)).toBe("YES ☝️");
});
```

#### Chrome Extension Testing
Use `@types/chrome` with Jest for API mocking:
```javascript
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() }
  }
};
```

---

## Gesture Recognition Logic

### Hand Landmark Extraction

MediaPipe provides 21 landmark points per hand:

```
      (8)  (12) (16) (20)  ← Fingertips
       |    |    |    |
      (7)  (11) (15) (19)  ← Distal
       |    |    |    |
      (6)  (10) (14) (18)  ← Middle
       |    |    |    |
      (5)  (9)  (13) (17)  ← Proximal
       └────┴────┴────┘
            |
           (0) ← Wrist
          /   \
        (1)   (5)
         |     |
        (2)   (9)
         |     |
        (3)  (13)
         |     |
        (4)  (17)
      Thumb  Fingers
```

### Finger State Calculation

```javascript
function getFingerStates(lm) {
  return {
    // Thumb: horizontal spread (x-axis distance)
    thumb: Math.abs(lm[4].x - lm[2].x) > 0.04,
    
    // Other fingers: vertical extension (tip above joint)
    index:  lm[8].y  < lm[6].y,   // Tip(8) above PIP(6)
    middle: lm[12].y < lm[10].y,  // Tip(12) above PIP(10)
    ring:   lm[16].y < lm[14].y,  // Tip(16) above PIP(14)
    pinky:  lm[20].y < lm[18].y   // Tip(20) above PIP(18)
  };
}
```

**Coordinate System**:
- `x`: Horizontal (0 = left, 1 = right)
- `y`: Vertical (0 = top, 1 = bottom) ← Note: inverted!
- `z`: Depth (negative = closer to camera)

### Gesture Classification

```javascript
function classifyGesture(f) {
  // Priority order (check specific gestures first)
  
  // 1. Index finger only
  if (f.index && !f.middle && !f.ring && !f.pinky)
    return "YES ☝️";
  
  // 2. Peace sign (index + middle)
  if (f.index && f.middle && !f.ring && !f.pinky)
    return "TWO ✌️";
  
  // 3. Fist (all down)
  if (!f.index && !f.middle && !f.ring && !f.pinky)
    return "STOP ✋";
  
  // 4. Open hand (three or more fingers)
  if (f.index && f.middle && f.ring)
    return "HELLO 👋";
  
  // 5. No match
  return "";
}
```

### Detection Algorithm

```
┌─────────────────────────────────────┐
│  Video Frame (30-60 FPS)            │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  MediaPipe HandLandmarker           │
│  • 21 landmarks per hand            │
│  • x, y, z coordinates              │
│  • Confidence score                 │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  getFingerStates(landmarks)         │
│  • Calculate finger extensions      │
│  • Returns boolean state object     │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  classifyGesture(fingerStates)      │
│  • Apply heuristic rules            │
│  • Return gesture string or ""      │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Compare with lastGesture           │
│  • If changed → send message        │
│  • If same → skip (no spam)         │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Check timeout (800ms)              │
│  • If no hand detected → clear      │
└─────────────────────────────────────┘
```

### Limitations

#### 1. **Thumb Detection**
- **Issue**: Unreliable due to 2D projection
- **Cause**: Depth ambiguity in camera view
- **Workaround**: Don't rely on thumb for primary gestures

#### 2. **Lighting Sensitivity**
- **Issue**: Poor detection in dim/harsh lighting
- **Cause**: MediaPipe landmark confidence decreases
- **Solution**: Recommend well-lit environment

#### 3. **Orientation Dependency**
- **Issue**: Palm must face camera
- **Cause**: Heuristics based on frontal view
- **Solution**: Train rotation-invariant ML model

#### 4. **Single Gesture Only**
- **Issue**: No sentence-level understanding
- **Cause**: Heuristic classification (not temporal)
- **Solution**: Add LSTM for sequence modeling

---

## Troubleshooting

### Problem: Extension won't load

**Symptoms**:
- Error on chrome://extensions page
- Icon doesn't appear in toolbar

**Solutions**:
1. Check manifest.json syntax (valid JSON)
2. Ensure all files present (especially mediapipe folder)
3. Verify Chrome version (v88+)
4. Try disabling/re-enabling extension
5. Check developer console for errors

---

### Problem: Camera window opens but shows black screen

**Symptoms**:
- Window opens successfully
- Video element stays black
- Status shows "Camera access failed"

**Solutions**:
1. Grant camera permission:
   - chrome://settings/content/camera
   - Allow for chrome-extension://[extension-id]
2. Check if camera is in use by another app
3. Test camera in https://webcamtests.com
4. Restart Chrome
5. Check console for detailed error message

---

### Problem: MediaPipe fails to load

**Symptoms**:
- Status shows "MediaPipe failed: Failed to fetch"
- Console shows 404 errors for .wasm files

**Solutions**:
1. Verify mediapipe folder structure:
   ```bash
   ls -la "sign language meet/mediapipe/tasks/"
   ```
   Should contain: hand_landmarker.task, vision_bundle.mjs, .wasm files
2. Check Content Security Policy in manifest.json
3. Reload extension (chrome://extensions → Reload)
4. Re-clone repository (files may be corrupted)

---

### Problem: Gestures not detected

**Symptoms**:
- Camera works
- MediaPipe loaded
- Hand visible in camera
- No subtitles appear

**Solutions**:
1. Check console in camera window for:
   ```
   console.table(fingers);
   ```
   Are finger states correct?
2. Improve hand positioning:
   - Move closer/farther from camera
   - Ensure good lighting
   - Make exaggerated gestures
3. Check if meetTabId is set (background console)
4. Verify content script loaded in Meet tab
5. Try different gestures (some are more reliable)

---

### Problem: Subtitles don't appear on Meet

**Symptoms**:
- Gestures detected in camera window
- Console shows "Gesture detected: ..."
- No subtitles on Meet page

**Solutions**:
1. Check if you're on a Google Meet page:
   - URL must be https://meet.google.com/*
2. Verify content script loaded:
   - F12 in Meet tab → Console
   - Look for "Content script loaded"
3. Check background routing:
   - Background console → Look for "Forwarding to Meet: ..."
4. Inspect subtitle element:
   - F12 in Meet → Elements tab
   - Search for id="sign-language-subtitle"
5. Try closing and reopening Meet tab

---

### Problem: Speech doesn't play

**Symptoms**:
- Subtitles work
- Console shows "Gesture detected"
- No audio output

**Solutions**:
1. Check browser audio:
   - System volume not muted
   - Chrome volume not muted
2. Test speechSynthesis:
   - Camera console:
   ```javascript
   speechSynthesis.speak(new SpeechSynthesisUtterance("test"));
   ```
3. Check browser permissions:
   - chrome://settings/content/sound
4. Try different browser (Firefox, Edge)

---

### Problem: Detection is slow or laggy

**Symptoms**:
- High CPU usage (> 80%)
- Frame rate drops (< 20 FPS)
- Gestures delayed (> 1 second)

**Solutions**:
1. Close unnecessary tabs/apps
2. Check CPU usage in Task Manager
3. Lower video resolution:
   ```javascript
   // camera.js - modify getUserMedia
   { video: { width: 320, height: 240 } }
   ```
4. Reduce detection rate:
   ```javascript
   // camera.js - add frame skip
   if (frameCount++ % 2 === 0) {
     // detect only every other frame
   }
   ```
5. Update Chrome to latest version
6. Restart computer

---

## Future Enhancements

### Short-Term (v1.1 - v1.3)

#### 1. **More Gestures** (Priority: High)
- Add 20+ common sign language gestures
- Include alphabet (A-Z)
- Numbers (0-9)
- Common phrases ("thank you", "sorry", etc.)

**Implementation**:
- Expand `classifyGesture()` function
- Add gesture documentation with images
- Create user training mode

---

#### 2. **Gesture Confidence Scores** (Priority: Medium)
- Display confidence percentage
- Adjust subtitle opacity based on confidence
- Filter low-confidence detections

**Implementation**:
```javascript
if (res.handedness && res.handedness.length > 0) {
  const confidence = res.handedness[0][0].score;
  if (confidence > 0.7) {  // Threshold
    // Proceed with classification
  }
}
```

---

#### 3. **User Settings Panel** (Priority: Medium)
- Customize subtitle position/size/color
- Adjust detection sensitivity
- Choose voice/speed for speech
- Gesture filter (enable/disable specific ones)

**Implementation**:
- Add options.html page
- Use chrome.storage.sync API
- Pass settings via messages

---

#### 4. **Gesture History Log** (Priority: Low)
- Show last 10 detected gestures
- Export to text file
- Useful for debugging and review

**Implementation**:
- Add history panel in camera window
- Store in chrome.storage.local
- Implement export button

---

### Mid-Term (v2.0 - v2.5)

#### 1. **Machine Learning Model** (Priority: High)
- Train custom model on ISL/ASL datasets
- Use LSTM or Transformer for temporal patterns
- Support sentence-level recognition

**Datasets**:
- WLASL (World Level American Sign Language)
- Indian Sign Language dataset
- Custom collected data

**Architecture**:
```
Landmarks → Normalize → LSTM → Softmax → Gesture
  (21x3)      (21x3)    (128)    (N)      (Label)
```

---

#### 2. **Two-Hand Support** (Priority: Medium)
- Detect both hands simultaneously
- Recognize two-handed gestures
- More expressive communication

**Challenges**:
- Increased computational cost
- More complex classification logic
- Handedness detection (left/right)

---

#### 3. **Temporal Smoothing** (Priority: Medium)
- Sliding window of last N frames
- Reduce jitter and false positives
- More stable gesture recognition

**Implementation**:
```javascript
const gestureQueue = [];
const WINDOW_SIZE = 10;

gestureQueue.push(currentGesture);
if (gestureQueue.length > WINDOW_SIZE) {
  gestureQueue.shift();
}

// Use majority vote
const finalGesture = mostFrequent(gestureQueue);
```

---

#### 4. **Multi-Platform Support** (Priority: Low)
- Zoom integration
- Microsoft Teams support
- Generic video call compatibility

**Implementation**:
- Detect meeting platform automatically
- Inject content script accordingly
- Adapt subtitle positioning per platform

---

### Long-Term (v3.0+)

#### 1. **Real-Time Translation** (Priority: High)
- ISL/ASL to English sentence translation
- Context-aware interpretation
- Grammar correction

**Approach**:
- Sequence-to-sequence model
- Attention mechanism
- Pre-trained language models (BERT, GPT)

---

#### 2. **Custom Gesture Training** (Priority: Medium)
- Users can create personal gestures
- Record gesture examples
- Train personalized model

**Implementation**:
- Gesture recording UI
- Local model fine-tuning
- Save to chrome.storage

---

#### 3. **Collaborative Features** (Priority: Low)
- Share gesture sets with others
- Community gesture library
- Real-time collaboration on gesture creation

---

#### 4. **Mobile App** (Priority: Low)
- iOS/Android native apps
- Same functionality on mobile browsers
- Tighter OS integration

---

## Contributing

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Sign-Language-Detection-Extension.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-gesture-support
   ```

3. **Make Changes**
   - Follow code style guidelines
   - Add console logging for debugging
   - Test thoroughly

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add: Support for 'Thank You' gesture"
   git push origin feature/new-gesture-support
   ```

5. **Open Pull Request**
   - Describe changes clearly
   - Include screenshots/videos if UI changes
   - Reference any related issues

### Contribution Guidelines

- **Code Quality**: Follow existing style and conventions
- **Testing**: Test all changes manually before submitting
- **Documentation**: Update docs if you change functionality
- **Commit Messages**: Use clear, descriptive messages
- **Issues**: Open an issue before major changes

### Areas Needing Help

- 🎯 **More Gestures**: Expand gesture library
- 🧠 **ML Model**: Train better recognition model
- 🌍 **Accessibility**: Improve for diverse users
- 📚 **Documentation**: Enhance guides and tutorials
- 🐛 **Bug Fixes**: Resolve open issues

---

## License & Credits

### License
This project is open-source. *(Add specific license: MIT, Apache, GPL, etc.)*

### Credits

**Developer**: [Anas255-exe](https://github.com/Anas255-exe)

**Technologies**:
- **MediaPipe** by Google - Hand tracking AI
- **Chrome Extension Platform** by Google
- **TensorFlow Lite** - ML model runtime

**Inspiration**:
This project aims to improve accessibility for the deaf and hard-of-hearing community in digital communication.

---

## Appendix

### A. Chrome Extension Manifest V3 Resources
- [Official Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Migration Guide (V2 → V3)](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### B. MediaPipe Documentation
- [Hand Landmarker Guide](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- [JavaScript API](https://developers.google.com/mediapipe/api/solutions/js/tasks-vision.handlandmarker)
- [Model Card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Landmark.pdf)

### C. Sign Language Resources
- [WLASL Dataset](https://dxli94.github.io/WLASL/)
- [Indian Sign Language](https://en.wikipedia.org/wiki/Indian_Sign_Language)
- [ASL University](https://www.lifeprint.com/)

### D. Accessibility Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chrome Accessibility](https://developer.chrome.com/docs/extensions/mv3/a11y/)

---

## Version History

### v1.0 (Current)
- Initial release
- 4 basic gestures (YES, TWO, STOP, HELLO)
- Real-time detection with MediaPipe
- Google Meet integration
- Camera window UI
- Text-to-speech output

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-07  
**Maintainer**: GitHub Copilot Agent  

For questions or issues, please open an issue on the [GitHub repository](https://github.com/Anas255-exe/Sign-Language-Detection-Extension).
