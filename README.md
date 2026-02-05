# Sign Language to Speech & Subtitles for Google Meet

A Chrome Extension that enables real-time sign language communication on Google Meet by converting hand gestures into live subtitles and synthesized speech. This project aims to improve accessibility for hearing- and speech-impaired users during online meetings.

## 🚀 Features

- ✋ Real-time hand gesture recognition using MediaPipe
- 💬 Live subtitles overlay on Google Meet
- 🔊 Text-to-speech voice output for detected gestures
- ⚡ No page reloads required – fully dynamic
- 🧠 Modular architecture using Chrome’s Offscreen API
- 🧩 Easily extensible for ML-based gesture recognition (ISL/ASL)

## 🏗️ Architecture Overview

User Hand Gesture
        ↓
Offscreen Document (Camera + MediaPipe)
        ↓
Gesture Classification Logic
        ↓
Background Service Worker
        ↓
Google Meet Content Script
        ↓
Live Subtitles + Speech Output

## Components

| Component | Responsibility |
| --- | --- |
| offscreen.js | Camera access, MediaPipe hand tracking, gesture detection |
| background.js | Message routing between offscreen & Meet tab |
| content.js | Injects subtitle overlay into Google Meet |
| popup.html/js | Start detection UI |
| MediaPipe Tasks | Hand landmark detection |

## 🛠️ Technologies Used

- JavaScript (ES6)
- Chrome Extension Manifest V3
- MediaPipe Tasks (HandLandmarker)
- Web Speech API (SpeechSynthesis)
- Google Meet DOM Injection
- Offscreen Documents API

## ✋ Supported Gestures (Prototype)

| Gesture | Output |
| --- | --- |
| ☝️ Index finger | YES |
| ✌️ Index + Middle | TWO |
| ✊ Fist | STOP |
| 🖐️ Open palm | HELLO |

⚠️ Gesture recognition is heuristic-based and sensitive to lighting and camera angles.

## 🎯 How It Works

1. User clicks Start Detection from the extension popup.
2. Offscreen document accesses the webcam.
3. MediaPipe detects 21 hand landmarks per frame.
4. Finger states are derived using landmark geometry.
5. Gestures are classified and sent to the background worker.
6. Background forwards text to the Meet tab.
7. Content script updates subtitles and plays speech.

## ▶️ How to Run Locally

1. Clone this repository.
2. Open Chrome → chrome://extensions.
3. Enable Developer Mode.
4. Click Load Unpacked.
5. Select the project folder.
6. Open Google Meet.
7. Click the extension → Start Detection.
8. Show hand gestures in front of the camera.

## ⚠️ Limitations

- Gesture detection uses rule-based heuristics, not ML.
- Thumb detection is unreliable due to camera orientation.
- No sentence-level sign recognition yet.
- Currently supports only a small gesture set.

## 🔮 Future Improvements

- 🤖 Train an ML model (LSTM / Transformer) using WLASL or ISL datasets.
- 📊 Temporal smoothing with sliding window inference.
- 🧠 Sentence-level sign language translation.
- 🌐 Multi-language subtitle support.
- 🎥 Improved hand pose normalization.
