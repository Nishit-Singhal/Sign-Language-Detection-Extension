# Sign Language Detection Extension - Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Message Protocol](#message-protocol)
7. [Security Considerations](#security-considerations)
8. [Performance Considerations](#performance-considerations)

---

## System Overview

The Sign Language Detection Extension is a Chrome Extension (Manifest V3) that enables real-time sign language communication on Google Meet. It captures hand gestures via webcam, processes them using MediaPipe's HandLandmarker model, classifies gestures using heuristic algorithms, and displays the results as live subtitles with text-to-speech output on Google Meet.

### Key Capabilities
- Real-time hand tracking with 21 landmark points per hand
- Gesture classification based on finger states
- Live subtitle overlay on Google Meet pages
- Text-to-speech output for detected gestures
- Modular architecture using Chrome Extension APIs
- Non-blocking camera access via popup window

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ Opens Extension Popup
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    POPUP UI (popup.html/js)                         │
│  • Start Detection Button                                           │
│  • Stop Detection Button                                            │
└───────────────────────────┬────────────────┬────────────────────────┘
                            │                 │
              START_DETECTION│                 │STOP_DETECTION
                            ↓                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│              BACKGROUND SERVICE WORKER (background.js)              │
│  • Message Router                                                    │
│  • Tab Management (stores meetTabId)                                │
│  • Window Management (manages cameraWindowId)                       │
│  • Event Listeners (tab updates, window close)                      │
└──────┬──────────────────────────────────────┬───────────────────────┘
       │                                       │
       │ Creates Camera Window                 │ Forwards SIGN_DETECTED
       ↓                                       ↓
┌────────────────────────────┐     ┌─────────────────────────────────┐
│  CAMERA WINDOW             │     │  GOOGLE MEET TAB                │
│  (camera.html/js)          │     │  (content.js injected)          │
│                            │     │                                 │
│  ┌──────────────────────┐ │     │  • Subtitle Overlay Element     │
│  │   VIDEO ELEMENT      │ │     │  • Message Listener             │
│  │   (webcam feed)      │ │     │  • Queue Management (3 lines)   │
│  └──────────────────────┘ │     │  • Text-to-Speech Display       │
│                            │     └─────────────────────────────────┘
│  • Camera Access           │
│  • MediaPipe Init          │
│  • Detection Loop          │
│  • Gesture Classification  │
│  • Speech Synthesis        │
└────────┬───────────────────┘
         │
         │ SIGN_DETECTED messages
         ↓
  [Back to Background Worker]


┌─────────────────────────────────────────────────────────────────────┐
│                    MEDIAPIPE HAND LANDMARKER                        │
│  • Detects 21 hand landmarks per frame                              │
│  • Provides 3D coordinates (x, y, z)                                │
│  • Running Mode: VIDEO                                              │
│  • Model: hand_landmarker.task (7.8MB)                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. **popup.html / popup.js**
**Purpose**: User interface for controlling gesture detection

**Responsibilities**:
- Provide Start/Stop detection buttons
- Send control messages to background worker
- Simple, lightweight UI (200px width)

**Files**:
- `popup.html` - HTML structure with inline styles
- `popup.js` - Button event handlers

**Key Functions**:
```javascript
// Send start message
chrome.runtime.sendMessage({ type: "START_DETECTION" })

// Send stop message
chrome.runtime.sendMessage({ type: "STOP_DETECTION" })
```

---

### 2. **background.js**
**Purpose**: Central message router and state manager

**Responsibilities**:
- Route messages between popup, camera window, and Meet tab
- Manage Google Meet tab ID tracking
- Create/destroy camera window
- Handle tab/window lifecycle events

**State Management**:
```javascript
let meetTabId = null;        // Tracks active Google Meet tab
let cameraWindowId = null;   // Tracks camera popup window
```

**Message Types Handled**:
- `START_DETECTION` → Creates camera window
- `STOP_DETECTION` → Closes camera window
- `SIGN_DETECTED` → Forwards gesture text to Meet tab

**Event Listeners**:
- `chrome.tabs.onUpdated` - Detects and stores Meet tab ID
- `chrome.tabs.onRemoved` - Clears Meet tab ID on close
- `chrome.windows.onRemoved` - Clears camera window ID on close

---

### 3. **camera.html / camera.js**
**Purpose**: Camera access and gesture detection window

**Responsibilities**:
- Initialize and display webcam feed
- Load and configure MediaPipe HandLandmarker
- Run real-time detection loop
- Classify gestures from hand landmarks
- Trigger speech synthesis
- Send detected gestures to background worker

**Core Workflow**:
```javascript
init() → startCamera() → initMediaPipe() → loop()
```

**Detection Loop**:
1. Capture video frame
2. Run MediaPipe detection (`detectForVideo()`)
3. Extract finger states from landmarks
4. Classify gesture using heuristics
5. Send to background if changed
6. Clear after timeout (800ms)
7. Schedule next frame

**Gesture Classification Logic**:
```javascript
classifyGesture(fingers) {
  if (index && !middle && !ring && !pinky) → "YES ☝️"
  if (index && middle && !ring && !pinky) → "TWO ✌️"
  if (!index && !middle && !ring && !pinky) → "STOP ✋"
  if (index && middle && ring) → "HELLO 👋"
  return ""
}
```

---

### 4. **content.js**
**Purpose**: Google Meet page integration

**Responsibilities**:
- Inject subtitle overlay into Meet DOM
- Listen for gesture messages from background
- Display subtitles with queue management (max 3 lines)
- Auto-hide when no gestures detected

**Subtitle Styling**:
```javascript
{
  position: "fixed",
  bottom: "120px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(0,0,0,0.85)",
  color: "white",
  fontSize: "20px",
  borderRadius: "10px",
  zIndex: "999999"
}
```

**Queue Management**:
- Maintains last 3 gestures
- Auto-scrolls with new entries
- Clears on empty message

---

### 5. **offscreen.html / offscreen.js**
**Purpose**: Alternative implementation using Chrome's Offscreen API

**Note**: This component appears to be an alternative/experimental implementation that provides similar functionality to `camera.js` but uses Chrome's Offscreen Documents API. The current active implementation uses the camera window approach.

**Key Differences**:
- Supports `ENABLE_DETECTION` and `DISABLE_DETECTION` messages
- More robust initialization with duplicate prevention
- Proper cleanup on disable

---

### 6. **MediaPipe Bundle**
**Purpose**: Hand landmark detection ML model

**Components**:
- `vision_bundle.mjs` - JavaScript API wrapper
- `hand_landmarker.task` - TensorFlow Lite model (7.8MB)
- `vision_wasm_internal.wasm` - WebAssembly runtime (11.4MB)
- `vision_wasm_nosimd_internal.wasm` - Fallback runtime (10.6MB)

**Configuration**:
```javascript
HandLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "mediapipe/tasks/hand_landmarker.task"
  },
  runningMode: "VIDEO",  // Optimized for video streams
  numHands: 1            // Single hand detection
})
```

**Output Format**:
```javascript
{
  landmarks: [
    [
      { x: 0.5, y: 0.3, z: -0.02 },  // Point 0: Wrist
      { x: 0.52, y: 0.28, z: -0.03 }, // Point 1: Thumb CMC
      // ... 19 more points
    ]
  ]
}
```

---

## Data Flow

### Startup Flow
```
User clicks "Start Detection" in popup
  ↓
popup.js sends START_DETECTION message
  ↓
background.js receives message
  ↓
background.js creates camera popup window
  ↓
camera.html loads → camera.js executes
  ↓
camera.js requests webcam access
  ↓
camera.js loads MediaPipe model
  ↓
camera.js starts detection loop
```

### Detection Flow
```
Video frame captured at ~30-60 FPS
  ↓
MediaPipe processes frame → returns landmarks
  ↓
camera.js extracts finger states from landmarks
  ↓
camera.js classifies gesture using heuristics
  ↓
If gesture changed:
  ├─→ Send SIGN_DETECTED to background.js
  ├─→ Trigger speechSynthesis
  └─→ Update status display
  ↓
background.js forwards to content.js in Meet tab
  ↓
content.js updates subtitle overlay
  ↓
If no hand detected for 800ms:
  └─→ Clear subtitle and speech
```

### Shutdown Flow
```
User clicks "Stop Detection" in popup
  ↓
popup.js sends STOP_DETECTION message
  ↓
background.js receives message
  ↓
background.js closes camera window
  ↓
camera.js beforeunload event fires
  ↓
Stop camera stream
  ↓
Close MediaPipe resources
  ↓
Clear subtitles in Meet tab
```

---

## Technology Stack

### Core Technologies
- **JavaScript ES6+**: Modern JavaScript with modules
- **Chrome Extension Manifest V3**: Latest extension platform
- **MediaPipe Tasks Vision**: Google's ML hand tracking
- **WebAssembly**: High-performance ML inference
- **WebRTC**: Camera access via getUserMedia

### Browser APIs Used
| API | Purpose |
|-----|---------|
| `chrome.runtime` | Message passing, extension URLs |
| `chrome.tabs` | Tab management and content script injection |
| `chrome.windows` | Camera popup window management |
| `chrome.action` | Popup UI trigger |
| `navigator.mediaDevices.getUserMedia` | Webcam access |
| `speechSynthesis` | Text-to-speech output |
| `requestAnimationFrame` | Optimized detection loop |

### Dependencies
- **MediaPipe HandLandmarker**: v0.10.x (bundled)
  - No npm dependencies
  - Self-contained WASM/JS bundle

---

## Message Protocol

### Message Types

#### 1. START_DETECTION
**Direction**: popup.js → background.js

**Purpose**: Initiate gesture detection

**Payload**:
```javascript
{ type: "START_DETECTION" }
```

**Handler**: Creates camera popup window

---

#### 2. STOP_DETECTION
**Direction**: popup.js → background.js

**Purpose**: Stop gesture detection

**Payload**:
```javascript
{ type: "STOP_DETECTION" }
```

**Handler**: Closes camera window, cleanup resources

---

#### 3. SIGN_DETECTED
**Direction**: camera.js → background.js → content.js

**Purpose**: Communicate detected gesture

**Payload**:
```javascript
{
  type: "SIGN_DETECTED",
  text: "YES ☝️" | "TWO ✌️" | "STOP ✋" | "HELLO 👋" | ""
}
```

**Handlers**:
- **background.js**: Forwards to Meet tab
- **content.js**: Updates subtitle display

**Special Cases**:
- Empty string (`""`) triggers subtitle clearing

---

#### 4. ENABLE_DETECTION / DISABLE_DETECTION
**Direction**: (Used in offscreen.js alternative implementation)

**Purpose**: Control detection without window management

**Payload**:
```javascript
{ type: "ENABLE_DETECTION" }
{ type: "DISABLE_DETECTION" }
```

---

## Security Considerations

### 1. **Content Security Policy**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```
- `wasm-unsafe-eval` required for MediaPipe WASM execution
- Scripts limited to extension bundle only
- No inline scripts allowed

### 2. **Permissions**
```json
{
  "permissions": ["activeTab", "offscreen"],
  "host_permissions": ["https://meet.google.com/*"]
}
```
- **activeTab**: Minimal permission for current tab access
- **offscreen**: Allows offscreen document creation
- **host_permissions**: Restricted to Google Meet only

### 3. **Camera Access**
- Requires explicit user permission via browser prompt
- Camera stream isolated to extension windows
- No recording or external transmission
- Stream cleaned up on window close

### 4. **Data Privacy**
- All processing happens locally in browser
- No data sent to external servers
- No analytics or tracking
- MediaPipe model runs entirely client-side

### 5. **DOM Injection Safety**
- Content script uses fixed IDs to prevent conflicts
- Subtitle overlay uses high z-index (999999)
- No script injection into Meet page
- Read-only access to Meet DOM

---

## Performance Considerations

### 1. **Detection Loop Optimization**
- Uses `requestAnimationFrame` for optimal frame timing
- Runs at native video framerate (~30-60 FPS)
- Non-blocking gesture classification
- Debounced gesture changes prevent spam

### 2. **Memory Management**
- Single hand detection mode (lower overhead)
- Video element reuses same stream
- MediaPipe resources cleaned up on close
- Speech synthesis queue managed automatically

### 3. **Model Performance**
- **hand_landmarker.task**: 7.8MB (cached after first load)
- **WASM runtime**: ~11MB (cached)
- Inference time: ~10-30ms per frame on modern hardware
- SIMD-optimized WASM for faster processing

### 4. **Message Passing Overhead**
- Minimal payload (< 100 bytes per message)
- Only sends on gesture change (not every frame)
- Background worker acts as lightweight router
- No serialization of complex objects

### 5. **Subtitle Rendering**
- Fixed position overlay (no reflows)
- Queue limited to 3 lines (bounded memory)
- CSS transitions for smooth updates
- Display toggle instead of recreation

---

## Extension Manifest Analysis

```json
{
  "manifest_version": 3,              // Latest Manifest V3
  "name": "Sign Language Meet",
  "version": "1.0",
  
  "permissions": [
    "activeTab",                       // Current tab access
    "offscreen"                        // Offscreen document API
  ],
  
  "host_permissions": [
    "https://meet.google.com/*"        // Restricted to Meet
  ],
  
  "background": {
    "service_worker": "background.js"  // Persistent-like worker
  },
  
  "action": {
    "default_popup": "popup.html"      // Extension icon popup
  },
  
  "content_scripts": [{
    "matches": ["https://meet.google.com/*"],
    "js": ["content.js"]               // Auto-inject on Meet
  }]
}
```

---

## File Structure Summary

```
sign language meet/
├── manifest.json           # Extension configuration
├── popup.html              # Extension popup UI
├── popup.js                # Popup control logic
├── background.js           # Service worker / message router
├── content.js              # Meet page injection
├── camera.html             # Camera window UI
├── camera.js               # Active gesture detection
├── offscreen.html          # Alternative implementation UI
├── offscreen.js            # Alternative implementation logic
└── mediapipe/
    └── tasks/
        ├── vision_bundle.mjs              # MediaPipe API (137KB)
        ├── hand_landmarker.task           # ML model (7.8MB)
        ├── vision_wasm_internal.wasm      # WASM runtime (11.4MB)
        ├── vision_wasm_internal.js        # WASM loader (205KB)
        ├── vision_wasm_nosimd_internal.wasm   # Fallback (10.6MB)
        └── vision_wasm_nosimd_internal.js     # Fallback loader (205KB)
```

**Total Size**: ~30MB (mostly MediaPipe model and WASM)

---

## Architecture Patterns

### 1. **Event-Driven Architecture**
- All components communicate via Chrome message passing
- Loose coupling between modules
- Easy to extend with new message types

### 2. **Single Responsibility Principle**
- Each component has one clear purpose
- Background worker is purely a router
- Camera window handles only detection
- Content script handles only display

### 3. **State Management**
- Minimal global state (tab/window IDs)
- Detection state isolated to camera window
- Subtitle queue isolated to content script

### 4. **Resource Lifecycle Management**
- Clear initialization and cleanup paths
- Event listeners for tab/window close
- Proper MediaPipe resource disposal

---

## Future Architecture Considerations

### 1. **ML Model Integration**
- Replace heuristics with trained LSTM/Transformer
- Add model training pipeline
- Support for ISL/ASL datasets (WLASL)

### 2. **Scalability**
- Multi-hand support (increase `numHands`)
- Sentence-level recognition (temporal modeling)
- Custom gesture training interface

### 3. **Performance**
- WebGL acceleration for preprocessing
- Worker thread for classification
- Model quantization for smaller size

### 4. **Reliability**
- Gesture confidence scores
- Temporal smoothing (sliding window)
- Better lighting/orientation handling

---

## Conclusion

This architecture provides a solid foundation for real-time sign language detection using modern web technologies. The modular design allows for easy extension, and the use of MediaPipe ensures accurate hand tracking without custom ML infrastructure. The Chrome Extension platform enables seamless integration with Google Meet while maintaining user privacy and security.
