from __future__ import annotations

import os
from pathlib import Path


def _parse_bool_env(name: str, default: bool = False) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_csv_env(name: str) -> list[str]:
    raw_value = os.getenv(name, "")
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _parse_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        return int(raw_value.strip())
    except ValueError:
        return default


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
LEGACY_MODEL_DIR = BASE_DIR / "models"
APP_ENV = os.getenv("PIXELPROOF_ENV", "development").strip().lower() or "development"


def _resolve_model_profile_dir(name: str, default_path: Path) -> Path:
    candidate = Path(os.getenv(name, str(default_path))).expanduser()
    return candidate if candidate.exists() else MODEL_DIR

# Preferred production-friendly artifact: architecture in code + weights file on disk.
MODEL_WEIGHTS_PATH = MODEL_DIR / "deepfake_detection_model.weights.h5"
if not MODEL_WEIGHTS_PATH.exists():
    MODEL_WEIGHTS_PATH = LEGACY_MODEL_DIR / "deepfake_detection_model.weights.h5"

MODEL_META_PATH = MODEL_DIR / "deepfake_detection_model.meta.json"
if not MODEL_META_PATH.exists():
    MODEL_META_PATH = LEGACY_MODEL_DIR / "deepfake_detection_model.meta.json"

# Backward-compatible fallback for older single-file model exports.
MODEL_PATH = MODEL_DIR / "deepfake_detection_model.h5"
if not MODEL_PATH.exists():
    MODEL_PATH = LEGACY_MODEL_DIR / "deepfake_detection_model.h5"

MODEL_PROFILES_DIR = MODEL_DIR / "profiles"
IMAGE_MODEL_DIR = _resolve_model_profile_dir(
    "PIXELPROOF_IMAGE_MODEL_DIR",
    MODEL_PROFILES_DIR / "image_best",
)
VIDEO_MODEL_DIR = _resolve_model_profile_dir(
    "PIXELPROOF_VIDEO_MODEL_DIR",
    MODEL_PROFILES_DIR / "video_best",
)

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

DATABASE_PATH = Path(os.getenv("PIXELPROOF_DATABASE_PATH", str(BASE_DIR / "pixelproof.db"))).expanduser()
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
ANALYSIS_HISTORY_LIMIT = max(1, _parse_int_env("PIXELPROOF_HISTORY_LIMIT", 100))

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi", ".mkv"}

ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_VIDEO_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
    "video/x-matroska",
}

MAX_UPLOAD_MB = max(1, _parse_int_env("PIXELPROOF_MAX_UPLOAD_MB", 50))
MODEL_IMAGE_SIZE = (96, 96)
MODEL_LABELS = ("Fake", "Real")
DEFAULT_FAKE_THRESHOLD = 0.5
VIDEO_SAMPLE_FRAMES = 12
VIDEO_MIN_SAMPLE_FRAMES = 6
MAX_VIDEO_DURATION_SECONDS = max(1, _parse_int_env("PIXELPROOF_MAX_VIDEO_DURATION_SECONDS", 20))
API_NAME = "PixelProof API"
MODEL_NAME = "MobileNetV2 Forensics Classifier"
WARMUP_ON_STARTUP = _parse_bool_env("PIXELPROOF_WARMUP_ON_STARTUP", default=True)
ANALYZE_RATE_LIMIT_COUNT = max(
    0,
    _parse_int_env("PIXELPROOF_ANALYZE_RATE_LIMIT_COUNT", 20 if APP_ENV == "production" else 0),
)
ANALYZE_RATE_LIMIT_WINDOW_SECONDS = max(
    1,
    _parse_int_env("PIXELPROOF_ANALYZE_RATE_LIMIT_WINDOW_SECONDS", 60),
)
DEFAULT_CORS_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]
ALLOW_ALL_CORS = _parse_bool_env("PIXELPROOF_ALLOW_ALL_CORS", default=False)
CORS_ORIGINS = ["*"] if ALLOW_ALL_CORS else (_parse_csv_env("PIXELPROOF_CORS_ORIGINS") or DEFAULT_CORS_ORIGINS)
CORS_ALLOW_CREDENTIALS = _parse_bool_env("PIXELPROOF_CORS_ALLOW_CREDENTIALS", default=False)
TRUSTED_HOSTS = _parse_csv_env("PIXELPROOF_TRUSTED_HOSTS")
ENABLE_GZIP = _parse_bool_env("PIXELPROOF_ENABLE_GZIP", default=True)
ENABLE_CSP = _parse_bool_env("PIXELPROOF_ENABLE_CSP", default=True)
CSP_CONNECT_SRC = _parse_csv_env("PIXELPROOF_CSP_CONNECT_SRC") or ["'self'"]
ENABLE_HSTS = _parse_bool_env("PIXELPROOF_ENABLE_HSTS", default=APP_ENV == "production")
REPORT_SIGNING_ALGORITHM = "HMAC-SHA256"
REPORT_VERIFY_ENDPOINT = "/verify-report"
DEFAULT_REPORT_SIGNING_SECRET = "pixelproof-dev-signing-secret-change-me"
REPORT_SIGNING_SECRET = os.getenv(
    "PIXELPROOF_REPORT_SIGNING_SECRET",
    DEFAULT_REPORT_SIGNING_SECRET,
)
REPORT_SIGNING_SECRET_IS_DEFAULT = REPORT_SIGNING_SECRET == DEFAULT_REPORT_SIGNING_SECRET
