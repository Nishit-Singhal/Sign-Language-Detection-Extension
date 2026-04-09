import base64
import json
import os
import pickle
import time
from collections import Counter, deque
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Optional

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf


ROOT_DIR = Path(__file__).resolve().parents[1]
EMBEDDINGS_DIR = ROOT_DIR / "embeddings"
MODEL_PATH = EMBEDDINGS_DIR / "include50_bilstm_best.keras"
SCALER_PATH = EMBEDDINGS_DIR / "include50_scaler.pkl"
LABEL_MAP_PATH = EMBEDDINGS_DIR / "include50_label_map.json"
CONFIG_PATH = EMBEDDINGS_DIR / "include50_config.json"

HOST = "127.0.0.1"
PORT = 8000
MIN_CONFIDENCE = 0.25
SEQUENCE_IDLE_RESET_SEC = 1.25
TOP_K = 3


with CONFIG_PATH.open("r", encoding="utf-8") as config_file:
    CONFIG = json.load(config_file)

with LABEL_MAP_PATH.open("r", encoding="utf-8") as label_map_file:
    LABEL_MAP = {int(key): value for key, value in json.load(label_map_file).items()}

with SCALER_PATH.open("rb") as scaler_file:
    SCALER = pickle.load(scaler_file)

MODEL = tf.keras.models.load_model(MODEL_PATH)

SEQ_LEN = int(CONFIG["SEQ_LEN"])
LANDMARK_DIM = int(CONFIG["LANDMARK_DIM"])
UPPER_BODY = list(CONFIG["UPPER_BODY"])

mp_holistic = mp.solutions.holistic


ASSEMBLER_CONFIG = {
    "MIN_CONFIRM_FRAMES": 1,
    "COOLDOWN_FRAMES": 2,
    "PAUSE_FRAMES": 8,
    "MIN_CONFIDENCE": MIN_CONFIDENCE,
    "MAX_SENTENCE_WORDS": 10,
    "SESSION_TIMEOUT_SEC": 30,
}


@dataclass
class AssemblerState:
    sentence_words: list = field(default_factory=list)
    pred_buffer: deque = field(default_factory=lambda: deque(maxlen=5))
    current_word: Optional[str] = None
    current_word_count: int = 0
    cooldown: int = 0
    pause_counter: int = 0
    last_activity: float = field(default_factory=time.time)
    completed: list = field(default_factory=list)


class SentenceAssembler:
    def __init__(self, cfg=None):
        self.cfg = {**ASSEMBLER_CONFIG, **(cfg or {})}
        self.s = AssemblerState()

    def reset(self):
        self.s = AssemblerState()

    def flush(self):
        if not self.s.sentence_words:
            return None

        sentence = " ".join(self.s.sentence_words)
        self.s.completed.append(sentence)
        self.s.sentence_words = []
        self.s.current_word = None
        self.s.current_word_count = 0
        self.s.pause_counter = 0
        return sentence

    def push(self, word, confidence):
        cfg = self.cfg
        state = self.s

        if time.time() - state.last_activity > cfg["SESSION_TIMEOUT_SEC"]:
            self.reset()
            state = self.s

        state.last_activity = time.time()
        result = {
            "confirmed_word": None,
            "current_sentence": " ".join(state.sentence_words),
            "completed": None,
            "state": "IDLE",
        }

        if state.cooldown > 0:
            state.cooldown -= 1
            result["state"] = "CONFIRMED"
            return result

        if confidence < cfg["MIN_CONFIDENCE"]:
            state.pause_counter += 1
            state.current_word_count = 0
            state.current_word = None
            if state.pause_counter >= cfg["PAUSE_FRAMES"] and state.sentence_words:
                result["completed"] = self.flush()
                result["current_sentence"] = ""
                result["state"] = "PAUSED"
            return result

        state.pause_counter = 0
        state.pred_buffer.append(word)
        smoothed = Counter(state.pred_buffer).most_common(1)[0][0]

        if smoothed == state.current_word:
            state.current_word_count += 1
        else:
            state.current_word = smoothed
            state.current_word_count = 1

        result["state"] = "DETECTING"

        if state.current_word_count >= cfg["MIN_CONFIRM_FRAMES"]:
            if not state.sentence_words or state.sentence_words[-1] != smoothed:
                state.sentence_words.append(smoothed)
                result["confirmed_word"] = smoothed

            state.current_word_count = 0
            state.cooldown = cfg["COOLDOWN_FRAMES"]
            result["state"] = "CONFIRMED"

            if len(state.sentence_words) >= cfg["MAX_SENTENCE_WORDS"]:
                result["completed"] = self.flush()
                result["current_sentence"] = ""
            else:
                result["current_sentence"] = " ".join(state.sentence_words)

        return result


class InferenceEngine:
    def __init__(self):
        self.holistic = mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            refine_face_landmarks=False,
        )
        self.sequence = deque(maxlen=SEQ_LEN)
        self.assembler = SentenceAssembler()
        self.last_hand_seen_at = 0.0

    def reset(self):
        self.sequence.clear()
        self.assembler.reset()
        self.last_hand_seen_at = 0.0

    @staticmethod
    def _flatten_landmarks(landmarks, expected_points):
        if landmarks is None:
            return [0.0] * (expected_points * 3)

        flattened = []
        for landmark in landmarks.landmark[:expected_points]:
            flattened.extend([landmark.x, landmark.y, landmark.z])
        return flattened

    def _extract_vector(self, results):
        left_hand = self._flatten_landmarks(results.left_hand_landmarks, 21)
        right_hand = self._flatten_landmarks(results.right_hand_landmarks, 21)

        if results.pose_landmarks is None:
            pose = [0.0] * (len(UPPER_BODY) * 3)
        else:
            pose = []
            for index in UPPER_BODY:
                landmark = results.pose_landmarks.landmark[index]
                pose.extend([landmark.x, landmark.y, landmark.z])

        vector = np.asarray(left_hand + right_hand + pose, dtype=np.float32)
        if vector.shape[0] != LANDMARK_DIM:
            raise ValueError(
                f"Expected feature vector of size {LANDMARK_DIM}, got {vector.shape[0]}"
            )
        return vector

    def _predict_sequence(self):
        arr = np.asarray(self.sequence, dtype=np.float32)
        flat = SCALER.transform(arr.reshape(1, SEQ_LEN * LANDMARK_DIM))
        x_in = flat.reshape(1, SEQ_LEN, LANDMARK_DIM).astype(np.float32)
        probs = MODEL.predict(x_in, verbose=0)[0]
        top_indices = np.argsort(probs)[::-1][:TOP_K]
        return {
            "word": LABEL_MAP[int(top_indices[0])],
            "confidence": float(probs[top_indices[0]]),
            "top_k": [
                {
                    "word": LABEL_MAP[int(index)],
                    "confidence": float(probs[index]),
                }
                for index in top_indices
            ],
        }

    def predict_from_bgr(self, image_bgr):
        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        results = self.holistic.process(rgb)

        hand_present = bool(results.left_hand_landmarks or results.right_hand_landmarks)
        pose_present = bool(results.pose_landmarks)
        now = time.time()

        if hand_present:
            self.last_hand_seen_at = now

        if hand_present or pose_present:
            self.sequence.append(self._extract_vector(results))
        elif self.last_hand_seen_at and now - self.last_hand_seen_at > SEQUENCE_IDLE_RESET_SEC:
            self.reset()

        response = {
            "hand_present": hand_present,
            "pose_present": pose_present,
            "sequence_length": len(self.sequence),
            "word": None,
            "confidence": 0.0,
            "top_k": [],
            "confirmed_word": None,
            "current_sentence": "",
            "completed_sentence": None,
            "state": "WARMING_UP" if len(self.sequence) < SEQ_LEN else "READY",
        }

        if len(self.sequence) < SEQ_LEN:
            return response

        prediction = self._predict_sequence()
        assembled = self.assembler.push(prediction["word"], prediction["confidence"])

        response.update(
            {
                "word": prediction["word"],
                "confidence": prediction["confidence"],
                "top_k": prediction["top_k"],
                "confirmed_word": assembled["confirmed_word"],
                "current_sentence": assembled["current_sentence"],
                "completed_sentence": assembled["completed"],
                "state": assembled["state"],
            }
        )
        return response


ENGINE = InferenceEngine()


def decode_base64_image(encoded_image):
    payload = encoded_image.split(",", 1)[-1]
    image_bytes = base64.b64decode(payload)
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image_bgr = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError("Unable to decode image payload")
    return image_bgr


class RequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def _send_json(self, payload, status_code=200):
        response = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(response)

    def do_OPTIONS(self):
        self._send_json({}, 204)

    def do_GET(self):
        if self.path == "/health":
            self._send_json(
                {
                    "ok": True,
                    "model_path": str(MODEL_PATH),
                    "seq_len": SEQ_LEN,
                    "landmark_dim": LANDMARK_DIM,
                }
            )
            return

        self._send_json({"error": "Not found"}, 404)

    def do_POST(self):
        if self.path == "/reset":
            ENGINE.reset()
            self._send_json({"ok": True})
            return

        if self.path != "/predict":
            self._send_json({"error": "Not found"}, 404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(content_length)
            payload = json.loads(body.decode("utf-8"))
            image_bgr = decode_base64_image(payload["image"])
            prediction = ENGINE.predict_from_bgr(image_bgr)
            self._send_json(prediction)
        except Exception as exc:
            self._send_json({"error": str(exc)}, 500)


def main():
    print(f"Loading Sign Language ML server on http://{HOST}:{PORT}")
    print(f"Model: {MODEL_PATH}")
    print(f"Scaler: {SCALER_PATH}")
    print(f"Label map: {LABEL_MAP_PATH}")

    server = ThreadingHTTPServer((HOST, PORT), RequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        server.server_close()
        ENGINE.holistic.close()


if __name__ == "__main__":
    main()
