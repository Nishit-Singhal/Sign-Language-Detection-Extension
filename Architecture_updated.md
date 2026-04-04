# Sign Language Meet – System Architecture
## System Overview

Sign Language Meet is a Chrome Extension that converts Indian Sign Language gestures into human-readable subtitles and speech during Google Meet sessions.

The system is designed in two architectural phases:

### Phase 1 – Static Gesture Detection (Current)

MediaPipe HandLandmarker

Heuristic finger-based classification

Real-time subtitle overlay

Text-to-speech output

### Phase 2 – Continuous Sentence Recognition (In Progress)

ISL-CSLTR dataset

CNN + BiLSTM temporal model

Sliding window inference

Sentence-level prediction (97 classes)

## Current Architecture (v1 – Static Gesture System)
User → Popup → Background Service Worker → Camera Window
                                              ↓
                                        MediaPipe
                                              ↓
                                   Landmark Extraction
                                              ↓
                                  Heuristic Classifier
                                              ↓
                                 Background Message Router
                                              ↓
                                Google Meet Subtitle Overlay
## Static Detection Flow
Webcam Frame
     ↓
MediaPipe HandLandmarker
     ↓
21 Landmarks (x, y, z)
     ↓
getFingerStates()
     ↓
classifyGesture()
     ↓
Send message to background
     ↓
Subtitle + Speech Output
Characteristics

Frame-by-frame classification

No temporal modeling

Fully client-side

Low latency

Limited to predefined gestures

## Limitation of Current System

The system currently:

Treats each frame independently

Has no memory of previous frames

Cannot detect motion-based signs

Cannot detect full sentences

Continuous sign language requires temporal modeling.

## Continuous Sentence Recognition Architecture (v2)

To support CSLR (Continuous Sign Language Recognition), the architecture will be upgraded as follows:

Webcam Stream
     ↓
Frame Collector
     ↓
Frame Buffer (60 frames)
     ↓
CNN Backbone (MobileNetV2)
     ↓
BiLSTM (Temporal Modeling)
     ↓
Dense + Softmax (97 classes)
     ↓
Sentence Prediction
## Updated CSLR Inference Strategy
### Frame Buffering Mechanism

Instead of classifying single frames:

Maintain buffer of N frames (e.g., 60)

When buffer full → Run inference

Slide window by K frames (e.g., 10)

Continue detection

Sliding Window Example
Frames 1–60 → Predict
Frames 11–70 → Predict
Frames 21–80 → Predict

This allows continuous prediction with overlap.

### Extension-Side Buffer Logic

Future camera.js logic:

frameBuffer.push(currentFrame);

if (frameBuffer.length === 60) {
    predictSentence(frameBuffer);
    frameBuffer = frameBuffer.slice(10);
}
## Temporal Stability Mechanisms

To prevent unstable outputs:

### Confidence Threshold

Only accept predictions if:

confidence ≥ 0.80
### Majority Voting

Maintain last 5 predictions:

[A, A, B, A, A]

Final output:

A
### Debounce

Prevent repeated identical sentence output within 1 second.

## Continuous Detection States
State	Meaning
IDLE	No hand detected
COLLECTING	Filling frame buffer
INFERENCING	Model prediction running
DISPLAYING	Showing predicted sentence
## ML Training Architecture (Kaggle)

Dataset: ISL-CSLTR
Location: Kaggle GPU environment

Training Pipeline:

Frames_Sentence_Level
        ↓
Normalize to 60 frames
        ↓
Resize to 224x224
        ↓
CNN Feature Extraction
        ↓
BiLSTM Temporal Learning
        ↓
Dense Classification
        ↓
Save .keras model
## Deployment Options
### Option A – Backend API (Recommended Initially)
Extension → FastAPI → TensorFlow Model → Sentence Output

Advantages:

No TensorFlow.js conversion issues

Easier debugging

Scalable

### Option B – TensorFlow.js Client-Side
Convert .keras → TFJS
Load inside extension
Run inference in browser

Advantages:

Fully client-side

Privacy-preserving

Lower latency

## Technology Stack
Extension

Chrome Extension (Manifest V3)

JavaScript ES6

MediaPipe Tasks Vision

Web Speech API

ML Training

Kaggle GPU

TensorFlow / Keras

MobileNetV2

BiLSTM

ISL-CSLTR Dataset

## System Evolution
Version	Capability
v1	Static heuristic gestures
v2	Word-level ML classification
v3	Continuous sentence recognition
v4	Transformer-based CSLR (Future)
## Long-Term Vision

Build a scalable, production-grade Continuous Sign Language Recognition system for Indian Sign Language, optimized for real-time video conferencing platforms.