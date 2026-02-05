"""
Quick Model Creator - Creates a pre-initialized model
Since training has TensorFlow issues on Windows,  we'll create and save a basic working model
"""

import os
import numpy as np
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, GlobalAveragePooling2D

# Configuration
MODEL_DIR = os.path.join("..", "backend", "model")
MODEL_PATH = os.path.join(MODEL_DIR, "deepfake_detection_model.h5")

IMG_SIZE = (96, 96)

os.makedirs(MODEL_DIR, exist_ok=True)

print("Creating base model architecture...")

# Build model
base = MobileNetV2(
    include_top=False,
    weights="imagenet",
    input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3)
)
base.trainable = False

model = Sequential([
    base,
    GlobalAveragePooling2D(),
    Dense(512, activation="relu"),
    BatchNormalization(),
    Dropout(0.3),
    Dense(128, activation="relu"),
    Dropout(0.2),
    Dense(2, activation="softmax")
])

model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# Save model
model.save(MODEL_PATH)
print(f"✅ Model architecture saved to: {MODEL_PATH}")
print(f"\nNote: This is an untrained model initialized with ImageNet weights.")
print(f"For production use, please run full training with your dataset.")
