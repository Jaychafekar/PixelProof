import numpy as np
import cv2
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from config import MODEL_PATH
from typing import Any, Dict

# Load model once (IMPORTANT: do not reload each request)
model = load_model(MODEL_PATH)

def preprocess_image_bgr(image_bgr: Any) -> Any:
    """
    image_bgr = OpenCV image array (BGR)
    """
    image = cv2.resize(image_bgr, (96, 96))
    image = img_to_array(image)
    image = np.expand_dims(image, axis=0)
    image = image / 255.0
    return image

def predict_from_bytes(file_bytes: bytes) -> Dict[str, Any]:
    """
    Takes uploaded image bytes from React request.
    Returns dict (label + confidence).
    """
    np_arr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        return {"error": "Invalid image file"}

    processed = preprocess_image_bgr(image)
    preds = model.predict(processed, verbose=0)[0]     # e.g. [0.93, 0.07]
    class_label = int(np.argmax(preds))

    label = "Fake" if class_label == 0 else "Real"
    confidence = float(np.max(preds))

    return {"label": label, "confidence": round(confidence, 4)}
