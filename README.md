# Sign Language Meet

Sign Language Meet is a Chrome extension for Google Meet that turns detected sign language gestures into on-screen subtitles and speech. The current codebase uses a hybrid approach:

- Primary path: a local Python ML backend at `http://127.0.0.1:8000`
- Fallback path: in-extension MediaPipe hand landmarks plus a small rule-based classifier

## What The Current Code Does

- Opens a popup camera window from the extension popup
- Captures webcam frames in `sign language meet/camera.js`
- Checks whether the local backend is running
- Sends JPEG frames to `backend/serve_model.py` when the backend is available
- Receives word predictions, confidence scores, and sentence assembly state
- Shows detected text as a subtitle overlay on Google Meet
- Speaks detected text with the browser `speechSynthesis` API
- Falls back to four built-in gestures if the backend is unavailable

## Current Runtime Flow

1. The user clicks `Start Detection` in the extension popup.
2. `background.js` opens `camera.html` in a popup window.
3. `camera.js` starts the webcam and checks `GET /health` on the local backend.
4. If the backend is reachable, frames are sent to `POST /predict`.
5. The backend runs MediaPipe Holistic, builds a temporal sequence, and performs TensorFlow inference.
6. Confirmed words are sent back to the extension.
7. `background.js` forwards the text to the active Google Meet tab.
8. `content.js` shows up to three recent subtitle lines on the page.
9. If the backend is not reachable, `camera.js` switches to the built-in MediaPipe hand-rule fallback.

## Repository Layout

```text
Sign-Language-Detection-Extension/
|- README.md
|- ARCHITECTURE.md
|- PROJECT_DOCUMENTATION.md
|- backend/
|  |- requirements.txt
|  `- serve_model.py
|- embeddings/
|  |- include50_bilstm_best.keras
|  |- include50_scaler.pkl
|  |- include50_config.json
|  `- include50_label_map.json
`- sign language meet/
   |- manifest.json
   |- popup.html
   |- popup.js
   |- background.js
   |- content.js
   |- camera.html
   |- camera.js
   |- offscreen.html
   |- offscreen.js
   `- mediapipe/tasks/
```

## ML Backend Details

The backend lives in [backend/serve_model.py](/d:/Nishit/Sign-Language-Detection-Extension/backend/serve_model.py).

- Host: `127.0.0.1`
- Port: `8000`
- Framework style: standard library `ThreadingHTTPServer`
- Model file: `embeddings/include50_bilstm_best.keras`
- Scaler file: `embeddings/include50_scaler.pkl`
- Label map size: `262` classes
- Sequence length: `60`
- Feature dimension per frame: `201`

The backend exposes:

- `GET /health` for availability checks
- `POST /predict` for frame inference
- `POST /reset` to clear the running sequence and sentence state

## Fallback Mode

If the local backend is not running, the extension still works with a small rule-based classifier built on MediaPipe hand landmarks. The current fallback outputs are:

- `yes`
- `two`
- `stop`
- `hello`

This fallback is useful for demos, but it is much more limited than the ML path.

## Setup

### 1. Install the backend dependencies

Create or activate a Python environment, then install:

```bash
pip install -r backend/requirements.txt
```

### 2. Start the local backend

From the repository root:

```bash
python backend/serve_model.py
```

Expected server URL:

```text
http://127.0.0.1:8000
```

### 3. Load the Chrome extension

1. Open `chrome://extensions/`
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select the `sign language meet` folder

### 4. Use it on Google Meet

1. Open a Google Meet tab
2. Click the extension icon
3. Click `Start Detection`
4. Allow webcam access if prompted

## Permissions

The current `manifest.json` requests:

- `activeTab`
- `offscreen`

Host permissions:

- `https://meet.google.com/*`
- `http://127.0.0.1:8000/*`

The extra localhost permission is required for extension-to-backend requests.

## Notes

- The backend is the main inference path in the current codebase.
- `offscreen.js` is still present, but the active start/stop flow currently uses the popup camera window.
- Existing older docs that described the project as a four-gesture-only heuristic system are no longer accurate.
