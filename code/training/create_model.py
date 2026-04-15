"""
Quick model creator for a shared PixelProof classifier artifact.
"""

from __future__ import annotations

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from modeling import build_classifier

MODEL_DIR = BACKEND_DIR / "model"
MODEL_PATH = MODEL_DIR / "deepfake_detection_model.h5"
IMG_SIZE = (96, 96)


def main() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    print("Creating base model architecture...")
    model, _ = build_classifier(IMG_SIZE, backbone_weights="imagenet")
    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.save(MODEL_PATH)
    print(f"Model architecture saved to: {MODEL_PATH}")
    print("\nNote: This is an untrained model initialized with ImageNet weights.")
    print("For production use, please run full training with your dataset.")


if __name__ == "__main__":
    main()
