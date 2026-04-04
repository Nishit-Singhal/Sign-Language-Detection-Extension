# Sign Language Meet – Project Documentation
## Project Status

Current Version: v1.0 – Static Gesture Detection
Next Phase: v2.0 – Continuous Sentence Recognition

## Project Overview

Sign Language Meet is a Chrome Extension that enables real-time translation of Indian Sign Language gestures into subtitles and speech during Google Meet sessions.

The project is evolving from rule-based gesture detection toward deep learning-based continuous sentence recognition.

## Current Capabilities (v1)

Real-time webcam gesture detection

MediaPipe hand landmark extraction

Heuristic-based classification

Google Meet subtitle injection

Text-to-speech output

30–60 FPS processing

## Current Limitations

Only static gestures supported

No sentence-level understanding

No temporal modeling

Limited scalability

## Continuous Sentence Recognition Plan

To enable CSLR, the following steps will be implemented:

### Step 1 – Frame Collection

Capture video frames continuously

Resize frames to 224x224

Store in rolling buffer of 60 frames

### Step 2 – Sliding Window Inference

When buffer reaches 60 frames:

Send batch to trained CNN + BiLSTM model

Receive predicted sentence

Slide window by 10 frames

Continue processing

### Step 3 – Temporal Smoothing

To avoid flickering:

Apply confidence threshold (≥ 0.80)

Maintain rolling prediction history

Apply majority voting

Debounce repeated outputs

### Step 4 – Deployment Strategy
Backend API (Initial Deployment)

Extension sends frames to FastAPI backend which loads TensorFlow model.

TensorFlow.js (Future Upgrade)

Convert model to TFJS and run fully client-side.

## ML Training Plan (Kaggle)

Dataset: ISL-CSLTR

Pipeline:

Load Frames_Sentence_Level dataset

Normalize each sample to 60 frames

Resize to 224x224

CNN feature extraction (MobileNetV2)

BiLSTM temporal modeling

Dense classification (97 sentences)

Save trained model

## Updated Detection Flow (Future)
User Signs Continuously
      ↓
Frame Buffering
      ↓
Sliding Window Inference
      ↓
Temporal Smoothing
      ↓
Final Sentence Prediction
      ↓
Subtitle Overlay + Speech
## Expected Challenges

Variable sentence length

Speed variation in signing

Lighting variation

Motion blur

Real-time inference constraints

## Future Research Direction

Transformer-based CSLR

Attention mechanisms

CTC decoding

Language model integration

Multi-modal fusion (hands + face + pose)

## Repository Structure (Current)
sign-language-meet/
    popup.js
    background.js
    content.js
    camera.js
    mediapipe/

ML training handled separately in Kaggle environment.

## Conclusion

The project has evolved from a simple rule-based static gesture recognizer into a scalable AI-powered continuous sign language recognition platform.

The architecture now supports:

Modular ML integration

Continuous detection via sliding windows

Temporal smoothing

Deployment flexibility

Long-term AI research scalability

