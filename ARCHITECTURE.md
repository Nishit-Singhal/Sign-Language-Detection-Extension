# Sign Language Meet Architecture

## System Summary

The current system is a two-layer architecture:

- A Chrome extension that handles Google Meet integration, camera capture, UI, subtitles, and speech
- A local Python inference server that performs temporal ML prediction when available

The extension prefers the backend path and only falls back to built-in MediaPipe gesture rules if the backend cannot be reached.

## High-Level Architecture

```text
User
  |
  v
Chrome Extension Popup
  |
  v
background.js
  |
  v
camera.html + camera.js
  |
  +--> GET /health on 127.0.0.1:8000
  |      |
  |      +--> backend available
  |             |
  |             v
  |        POST /predict
  |             |
  |             v
  |        serve_model.py
  |             |
  |             v
  |        confirmed_word/current_sentence
  |
  +--> backend unavailable
         |
         v
    MediaPipe HandLandmarker fallback
         |
         v
    heuristic gesture output
  |
  v
background.js
  |
  v
content.js on meet.google.com
  |
  v
subtitle overlay + speech
```

## Extension Components

### `popup.html` and `popup.js`

Responsibilities:

- Show `Start Detection` and `Stop Detection`
- Send `START_DETECTION` and `STOP_DETECTION` messages

### `background.js`

Responsibilities:

- Track the active Google Meet tab
- Open and close the camera popup window
- Forward `SIGN_DETECTED` messages to the Meet content script

State currently tracked:

- `meetTabId`
- `cameraWindowId`

### `camera.html` and `camera.js`

Responsibilities:

- Request webcam access
- Check the local backend health
- Capture frames from the video stream
- Send frames to the backend for prediction
- Handle backend responses and emit confirmed words
- Switch to local MediaPipe fallback when backend requests fail
- Speak detected text
- Clear gestures after inactivity

Important current constants in `camera.js`:

- `BACKEND_URL = http://127.0.0.1:8000`
- `BACKEND_FRAME_INTERVAL = 140`
- `BACKEND_JPEG_QUALITY = 0.72`
- `BACKEND_CONFIDENCE_THRESHOLD = 0.25`
- `CLEAR_DELAY = 1200`

### `content.js`

Responsibilities:

- Inject a fixed subtitle container into Google Meet
- Keep the last three subtitle lines
- Hide the overlay when an empty message is received

### `offscreen.js`

This file still exists as an alternative implementation using the Offscreen API, but the active user flow currently opens `camera.html` from `background.js`. It should be treated as experimental or legacy unless the startup flow is changed.

## Backend Components

### `backend/serve_model.py`

Responsibilities:

- Load the TensorFlow model, scaler, config, and label map from `embeddings/`
- Decode base64 JPEG frames received from the extension
- Run MediaPipe Holistic on each frame
- Extract left hand, right hand, and upper-body pose landmarks
- Build a rolling temporal sequence
- Run sequence classification with TensorFlow
- Smooth predictions and assemble sentence fragments
- Return inference state as JSON

## ML Data Path

The backend currently uses:

- Model: `include50_bilstm_best.keras`
- Scaler: `include50_scaler.pkl`
- Config: `include50_config.json`
- Labels: `include50_label_map.json`

Current configuration loaded from the repo:

- `SEQ_LEN = 60`
- `LANDMARK_DIM = 201`
- `HAND_DIM = 126`
- `POSE_DIM = 75`
- `NUM_CLASSES = 262`

Feature composition per frame:

- 21 left-hand landmarks x 3
- 21 right-hand landmarks x 3
- 25 upper-body pose landmarks x 3

## Backend Response Model

`POST /predict` returns fields such as:

- `hand_present`
- `pose_present`
- `sequence_length`
- `word`
- `confidence`
- `top_k`
- `confirmed_word`
- `current_sentence`
- `completed_sentence`
- `state`

Observed runtime states include:

- `WARMING_UP`
- `READY`
- `IDLE`
- `DETECTING`
- `CONFIRMED`
- `PAUSED`

## Sentence Assembly

The backend includes a `SentenceAssembler` that adds lightweight temporal stability on top of raw predictions.

Current behavior:

- Uses a short prediction buffer for smoothing
- Requires confidence above `0.25`
- Applies a cooldown after confirmation
- Flushes completed text after pauses
- Resets the session after long inactivity

Current assembler defaults:

- `MIN_CONFIRM_FRAMES = 1`
- `COOLDOWN_FRAMES = 2`
- `PAUSE_FRAMES = 8`
- `MAX_SENTENCE_WORDS = 10`
- `SESSION_TIMEOUT_SEC = 30`

## Active Data Flow

### Startup

1. The user opens the extension popup.
2. `popup.js` sends `START_DETECTION`.
3. `background.js` opens `camera.html` in a popup window.
4. `camera.js` starts the webcam.
5. `camera.js` checks `GET /health` on the local backend.
6. Detection begins in backend mode or fallback mode.

### Backend Inference Path

1. `camera.js` captures a frame to an in-memory canvas.
2. The frame is encoded as JPEG data URL.
3. The extension sends the image to `POST /predict`.
4. The backend decodes the image and runs MediaPipe Holistic.
5. A 60-frame sequence is accumulated.
6. The TensorFlow model predicts the most likely label.
7. The assembler decides whether a word is confirmed.
8. A confirmed word is sent to the background worker.
9. The background worker forwards it to the Google Meet content script.
10. `content.js` updates the subtitle overlay.

### Fallback Path

1. `camera.js` initializes MediaPipe HandLandmarker in the extension.
2. Finger states are derived from 21 hand landmarks.
3. The built-in classifier maps those states to one of four words.
4. The result is sent through the same subtitle path.

## Security And Permissions

Current extension permissions in `manifest.json`:

- `activeTab`
- `offscreen`

Host permissions:

- `https://meet.google.com/*`
- `http://127.0.0.1:8000/*`

Implications:

- Google Meet access is restricted to the intended host
- Backend access is restricted to localhost
- No remote cloud inference endpoint is configured in the current code

## Current Limitations

- The extension depends on a separately started local backend for the main ML path
- Subtitle rendering is simple and queue-based rather than transcript-based
- The fallback mode only supports four heuristic outputs
- `manifest.json` still carries `offscreen` permission even though the main flow uses a popup camera window
- There is no automated test suite in the repository yet

## Prototype Transition Notes

The repository previously described the architecture as if the ML path were still future work. That is no longer accurate for the current implementation.

Key changes from the old prototype:

- The main detection path is now a local Python ML server, not only heuristic gesture rules
- The backend performs temporal inference over `60` frames
- The backend uses MediaPipe Holistic instead of only a single-hand landmark detector
- The model label map currently contains `262` classes
- The extension still keeps a four-word MediaPipe fallback for `yes`, `two`, `stop`, and `hello`
