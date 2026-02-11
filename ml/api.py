from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import numpy as np
import tensorflow as tf
import uvicorn

# -------- Load model & classes --------
model = tf.keras.models.load_model("model.keras")
classes = np.load("classes.npy", allow_pickle=True)

# -------- Create FastAPI app --------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Request Schema --------
class LandmarkInput(BaseModel):
    landmarks: list[float]

# -------- Prediction Endpoint --------
@app.post("/predict")
def predict(input_data: LandmarkInput):
    landmarks = np.array(input_data.landmarks).reshape(1, 63)

    prediction = model.predict(landmarks)

    class_index = int(np.argmax(prediction))
    confidence = float(np.max(prediction))
    word = str(classes[class_index])

    return {
        "word": word,
        "confidence": confidence
    }

# -------- Run Server --------
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
