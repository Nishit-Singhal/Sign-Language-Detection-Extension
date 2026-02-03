Sign Language to Speech & Subtitles for Google Meet
A Chrome Extension that enables real-time sign language communication on Google Meet by converting hand gestures into live subtitles and synthesized speech.
This project aims to improve accessibility for hearing- and speech-impaired users during online meetings.
🚀 Features
✋ Real-time hand gesture recognition using MediaPipe
💬 Live subtitles overlay on Google Meet
🔊 Text-to-speech voice output for detected gestures
⚡ No page reloads required – fully dynamic
🧠 Modular architecture using Chrome’s Offscreen API
🧩 Easily extensible for ML-based gesture recognition (ISL/ASL)
🏗️ Architecture Overview
Copy code

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
Components
Component
Responsibility
offscreen.js
Camera access, MediaPipe hand tracking, gesture detection
background.js
Message routing between offscreen & Meet tab
content.js
Injects subtitle overlay into Google Meet
popup.html/js
Start detection UI
MediaPipe Tasks
Hand landmark detection
🛠️ Technologies Used
JavaScript (ES6)
Chrome Extension Manifest V3
MediaPipe Tasks (HandLandmarker)
Web Speech API (SpeechSynthesis)
Google Meet DOM Injection
Offscreen Documents API
✋ Supported Gestures (Prototype)
Gesture
Output
☝️ Index finger
YES
✌️ Index + Middle
TWO
✊ Fist
STOP
🖐️ Open palm
HELLO
⚠️ Gesture recognition is heuristic-based and sensitive to lighting and camera angles.
🎯 How It Works
User clicks Start Detection from the extension popup
Offscreen document accesses the webcam
MediaPipe detects 21 hand landmarks per frame
Finger states are derived using landmark geometry
Gestures are classified and sent to the background worker
Background forwards text to the Meet tab
Content script updates subtitles + plays speech
▶️ How to Run Locally
Clone this repository
Open Chrome → chrome://extensions
Enable Developer Mode
Click Load Unpacked
Select the project folder
Open Google Meet
Click the extension → Start Detection
Show hand gestures in front of the camera
⚠️ Limitations
Gesture detection uses rule-based heuristics, not ML
Thumb detection is unreliable due to camera orientation
No sentence-level sign recognition yet
Currently supports only a small gesture set
🔮 Future Improvements
🤖 Train an ML model (LSTM / Transformer) using WLASL or ISL datasets
📊 Temporal smoothing with sliding window inference
🧠 Sentence-level sign language translation
🌐 Multi-language subtitle support
🎥 Improved hand pose normalization
