from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

import cv2
import numpy as np


@dataclass(frozen=True)
class FaceCropResult:
    image_bgr: np.ndarray
    face_detected: bool
    face_box: tuple[int, int, int, int] | None
    used_full_frame: bool


_FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

SUPPORTED_PREPROCESS_MODES = {"legacy_0_1", "mobilenet_v2"}


def detect_largest_face_bgr(image_bgr: np.ndarray) -> tuple[int, int, int, int] | None:
    if image_bgr is None or image_bgr.size == 0:
        return None

    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = _FACE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(32, 32),
    )
    if len(faces) == 0:
        return None

    x, y, w, h = max(faces, key=lambda box: int(box[2]) * int(box[3]))
    return int(x), int(y), int(w), int(h)


def crop_largest_face_bgr(
    image_bgr: np.ndarray,
    *,
    padding_ratio: float = 0.18,
) -> FaceCropResult:
    face_box = detect_largest_face_bgr(image_bgr)
    if face_box is None:
        return FaceCropResult(
            image_bgr=image_bgr,
            face_detected=False,
            face_box=None,
            used_full_frame=True,
        )

    x, y, w, h = face_box
    image_h, image_w = image_bgr.shape[:2]
    pad_x = int(w * padding_ratio)
    pad_y = int(h * padding_ratio)

    x0 = max(x - pad_x, 0)
    y0 = max(y - pad_y, 0)
    x1 = min(x + w + pad_x, image_w)
    y1 = min(y + h + pad_y, image_h)
    cropped = image_bgr[y0:y1, x0:x1]

    if cropped.size == 0:
        return FaceCropResult(
            image_bgr=image_bgr,
            face_detected=False,
            face_box=None,
            used_full_frame=True,
        )

    return FaceCropResult(
        image_bgr=cropped,
        face_detected=True,
        face_box=(x0, y0, x1 - x0, y1 - y0),
        used_full_frame=False,
    )


def extract_resized_rgb_image(
    image_bgr: np.ndarray,
    *,
    image_size: tuple[int, int],
    prefer_face: bool = True,
) -> tuple[np.ndarray, Dict[str, Any]]:
    if image_bgr is None or image_bgr.size == 0:
        raise ValueError("Input image is empty")

    crop_result = crop_largest_face_bgr(image_bgr) if prefer_face else FaceCropResult(
        image_bgr=image_bgr,
        face_detected=False,
        face_box=None,
        used_full_frame=True,
    )

    resized = cv2.resize(crop_result.image_bgr, image_size)
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

    metadata = {
        "face_detected": crop_result.face_detected,
        "face_box": list(crop_result.face_box) if crop_result.face_box is not None else None,
        "used_full_frame": crop_result.used_full_frame,
        "image_size": [int(image_size[0]), int(image_size[1])],
    }
    return rgb.astype("float32"), metadata


def apply_model_preprocessing(
    image_rgb: np.ndarray,
    *,
    preprocess_mode: str = "legacy_0_1",
) -> np.ndarray:
    if preprocess_mode not in SUPPORTED_PREPROCESS_MODES:
        raise ValueError(
            f"Unsupported preprocess_mode {preprocess_mode!r}. "
            f"Expected one of {sorted(SUPPORTED_PREPROCESS_MODES)}."
        )

    image_rgb = image_rgb.astype("float32")
    if preprocess_mode == "mobilenet_v2":
        return (image_rgb / 127.5) - 1.0
    return image_rgb / 255.0


def prepare_image_for_model(
    image_bgr: np.ndarray,
    *,
    image_size: tuple[int, int],
    prefer_face: bool = True,
    preprocess_mode: str = "legacy_0_1",
) -> tuple[np.ndarray, Dict[str, Any]]:
    rgb, metadata = extract_resized_rgb_image(
        image_bgr,
        image_size=image_size,
        prefer_face=prefer_face,
    )
    normalized = apply_model_preprocessing(rgb, preprocess_mode=preprocess_mode)
    metadata["preprocess_mode"] = preprocess_mode
    return normalized, metadata
