import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Model path (match your folder name: "model" OR "models")
MODEL_PATH = os.path.join(BASE_DIR, "model", "deepfake_detection_model.h5")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(BASE_DIR, "models", "deepfake_detection_model.h5")

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}
MAX_UPLOAD_MB = 50
