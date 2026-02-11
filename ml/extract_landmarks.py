import cv2
import mediapipe as mp
import numpy as np
import os
from tqdm import tqdm

# New MediaPipe Tasks API
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Create HandLandmarker
base_options = python.BaseOptions(
    model_asset_path="hand_landmarker.task"
)


options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=1
)

detector = vision.HandLandmarker.create_from_options(options)

DATASET_DIR = "dataset"

X = []
y = []

for label in os.listdir(DATASET_DIR):
    label_path = os.path.join(DATASET_DIR, label)

    for img_name in tqdm(os.listdir(label_path), desc=f"Processing {label}"):

        img_path = os.path.join(label_path, img_name)
        image = cv2.imread(img_path)

        if image is None:
            continue

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=image_rgb
        )

        result = detector.detect(mp_image)

        if result.hand_landmarks:
            hand = result.hand_landmarks[0]
            landmarks = []

            for lm in hand:
                landmarks.extend([lm.x, lm.y, lm.z])

            X.append(landmarks)
            y.append(label)

X = np.array(X)
y = np.array(y)

np.save("X.npy", X)
np.save("y.npy", y)

print("Saved X.npy and y.npy")
