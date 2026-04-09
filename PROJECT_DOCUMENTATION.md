# Sign Language Meet Project Documentation

## Overview

This repository contains a Chrome extension and a local Python ML backend for sign-language-to-text output on Google Meet.

The code has moved beyond the original "four static gestures only" prototype. The current implementation:

- Uses a TensorFlow model served locally from `backend/serve_model.py`
- Processes temporal landmark sequences instead of single frames only
- Supports `262` labels from `embeddings/include50_label_map.json`
- Falls back to MediaPipe hand heuristics if the backend is unavailable

## Current Status

### Implemented

- Chrome extension popup with start and stop controls
- Camera popup window for live capture
- Google Meet subtitle overlay
- Browser speech synthesis for detected text
- Local ML backend with health, predict, and reset endpoints
- MediaPipe Holistic feature extraction in the backend
- TensorFlow sequence inference with a BiLSTM model asset
- Word confirmation and sentence assembly logic
- Rule-based fallback classifier in the extension

### Not Yet Implemented End To End

- Fully in-browser TensorFlow inference
- Production-grade transcript history or storage
- Automated tests
- Packaged install flow for starting the backend automatically

## Main Files

Extension:

- [manifest.json](/d:/Nishit/Sign-Language-Detection-Extension/sign%20language%20meet/manifest.json)
- [popup.js](/d:/Nishit/Sign-Language-Detection-Extension/sign%20language%20meet/popup.js)
- [background.js](/d:/Nishit/Sign-Language-Detection-Extension/sign%20language%20meet/background.js)
- [camera.js](/d:/Nishit/Sign-Language-Detection-Extension/sign%20language%20meet/camera.js)
- [content.js](/d:/Nishit/Sign-Language-Detection-Extension/sign%20language%20meet/content.js)

Backend:

- [serve_model.py](/d:/Nishit/Sign-Language-Detection-Extension/backend/serve_model.py)
- [requirements.txt](/d:/Nishit/Sign-Language-Detection-Extension/backend/requirements.txt)

Model assets:

- [include50_config.json](/d:/Nishit/Sign-Language-Detection-Extension/embeddings/include50_config.json)
- [include50_label_map.json](/d:/Nishit/Sign-Language-Detection-Extension/embeddings/include50_label_map.json)

## How The Current System Works

### Extension Startup

1. The user clicks `Start Detection`.
2. The background worker opens `camera.html`.
3. `camera.js` requests webcam access.
4. `camera.js` checks whether the backend is reachable at `http://127.0.0.1:8000/health`.

### If The Backend Is Running

1. Frames are captured from the webcam.
2. Every `140 ms` at most, the extension sends a JPEG frame to `POST /predict`.
3. The backend extracts left hand, right hand, and upper-body pose landmarks.
4. A rolling sequence of `60` frames is fed to the model.
5. The backend returns prediction data, including confidence and any confirmed word.
6. Confirmed text is pushed to Google Meet subtitles and spoken aloud.

### If The Backend Is Not Running

1. The extension initializes MediaPipe HandLandmarker locally.
2. It infers simple finger states from one detected hand.
3. It maps those states to one of four outputs:
   - `yes`
   - `two`
   - `stop`
   - `hello`

## Backend API

### `GET /health`

Returns server health and key model metadata.

### `POST /predict`

Request body:

```json
{
  "image": "data:image/jpeg;base64,..."
}
```

Response fields include:

```json
{
  "hand_present": true,
  "pose_present": true,
  "sequence_length": 60,
  "word": "hello",
  "confidence": 0.73,
  "top_k": [],
  "confirmed_word": "hello",
  "current_sentence": "hello",
  "completed_sentence": null,
  "state": "CONFIRMED"
}
```

### `POST /reset`

Clears the running inference sequence and sentence assembly state. The extension calls this on camera-window unload.

## Model And Landmark Configuration

Current config from `embeddings/include50_config.json`:

- `SEQ_LEN`: `60`
- `LANDMARK_DIM`: `201`
- `HAND_DIM`: `126`
- `POSE_DIM`: `75`
- `NUM_CLASSES`: `262`

Landmarks used:

- Left hand: 21 points x 3
- Right hand: 21 points x 3
- Upper body pose: 25 selected points x 3

## Dependencies

Backend Python dependencies:

- `numpy==1.26.4`
- `opencv-python==4.10.0.84`
- `mediapipe==0.10.21`
- `tensorflow==2.19.0`
- `scikit-learn==1.5.2`

Browser-side technologies:

- Chrome Extension Manifest V3
- MediaPipe Tasks Vision
- Web Speech API
- Google Meet content script injection

## Local Setup

### Backend

```bash
pip install -r backend/requirements.txt
python backend/serve_model.py
```

### Extension

1. Open `chrome://extensions/`
2. Turn on Developer Mode
3. Click `Load unpacked`
4. Select the `sign language meet` folder

## Current Limitations

- The main ML flow requires the local backend to be started separately.
- The extension only injects subtitles into Google Meet.
- The fallback mode is intentionally small and only covers four gestures.
- Subtitle history is capped at three visible lines.
- There is no automated validation pipeline in the repo yet.

## Practical Notes For Future Updates

When the code changes, these docs should be updated together:

- `README.md` for setup and high-level behavior
- `ARCHITECTURE.md` for message flow and backend design
- `PROJECT_DOCUMENTATION.md` for operational details

## Transition Clarification

Older docs in this repository described the system as a static four-gesture prototype and described the ML path as future work. That is no longer true for the current code.

The current implementation already includes:

- A Chrome extension for Google Meet integration
- A local Python inference server
- Bundled model assets in `embeddings/`
- Webcam frame submission to a localhost backend
- TensorFlow-based sign prediction
- Confirmed words and short sentence assembly
- Google Meet subtitle output
- Browser speech output

Current ML configuration reflected by the codebase:

- Sequence length: `60`
- Feature dimension: `201`
- Label count: `262`
- Backend URL: `http://127.0.0.1:8000`

So the ML backend is now part of the implemented flow, while the four-gesture classifier remains the fallback path.
