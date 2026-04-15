from __future__ import annotations

from collections import defaultdict, deque
import hashlib
from pathlib import Path
from threading import Lock
from time import monotonic
from typing import Any, Dict, List

from fastapi import Body, FastAPI, File, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from config import (
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_IMAGE_MIME_TYPES,
    ALLOWED_VIDEO_EXTENSIONS,
    ALLOWED_VIDEO_MIME_TYPES,
    ANALYSIS_HISTORY_LIMIT,
    ANALYZE_RATE_LIMIT_COUNT,
    ANALYZE_RATE_LIMIT_WINDOW_SECONDS,
    APP_ENV,
    API_NAME,
    CSP_CONNECT_SRC,
    CORS_ALLOW_CREDENTIALS,
    CORS_ORIGINS,
    ENABLE_CSP,
    ENABLE_GZIP,
    ENABLE_HSTS,
    MAX_VIDEO_DURATION_SECONDS,
    MAX_UPLOAD_MB,
    REPORT_SIGNING_SECRET_IS_DEFAULT,
    TRUSTED_HOSTS,
    VIDEO_SAMPLE_FRAMES,
    WARMUP_ON_STARTUP,
)
from predict import get_model_status, predict_from_bytes, verify_signed_report, warm_up_model
from storage import delete_analysis, get_analysis, get_storage_status, init_storage, list_analyses, save_analysis

BACKEND_DIR = Path(__file__).resolve().parent
FRONTEND_DIST_DIR = BACKEND_DIR / "static"
FRONTEND_INDEX_FILE = FRONTEND_DIST_DIR / "index.html"
_ANALYZE_RATE_LIMIT_BUCKETS: Dict[str, deque[float]] = defaultdict(deque)
_ANALYZE_RATE_LIMIT_LOCK = Lock()
_STARTUP_WARMUP_STATUS: Dict[str, Any] = {
    "attempted": False,
    "warmed": False,
    "disabled": not WARMUP_ON_STARTUP,
}
_CONTENT_SECURITY_POLICY = "; ".join(
    [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "media-src 'self' data: blob:",
        "font-src 'self' data:",
        f"connect-src {' '.join(CSP_CONNECT_SRC)}",
    ]
)

app = FastAPI(
    title=API_NAME,
    description="Media authenticity analysis for images and short-form videos.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    # Browsers reject credentialed CORS with a wildcard origin, so only enable
    # credentials when the allowed origin list is explicit.
    allow_credentials=CORS_ALLOW_CREDENTIALS and "*" not in CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

if ENABLE_GZIP:
    app.add_middleware(GZipMiddleware, minimum_size=1024)

if TRUSTED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=TRUSTED_HOSTS)


def _detect_media_type(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    content_type = (file.content_type or "").lower()

    if suffix in ALLOWED_IMAGE_EXTENSIONS or content_type in ALLOWED_IMAGE_MIME_TYPES:
        return "image"

    if suffix in ALLOWED_VIDEO_EXTENSIONS or content_type in ALLOWED_VIDEO_MIME_TYPES:
        return "video"

    if content_type.startswith("image/"):
        return "image"

    if content_type.startswith("video/"):
        return "video"

    raise HTTPException(
        status_code=415,
        detail="Unsupported file type. Upload JPG, PNG, WEBP, MP4, MOV, WEBM, AVI, or MKV.",
    )


def _frontend_is_ready() -> bool:
    return FRONTEND_INDEX_FILE.exists()


def _api_status_payload() -> Dict[str, Any]:
    return {
        "status": "ok",
        "message": "PixelProof backend running",
        "docs": "/docs",
        "verify_report": "/verify-report",
        "analyses": "/analyses",
    }


def _resolve_frontend_asset(full_path: str) -> Path | None:
    candidate = (FRONTEND_DIST_DIR / full_path).resolve()
    if not candidate.is_relative_to(FRONTEND_DIST_DIR.resolve()):
        return None
    if candidate.is_file():
        return candidate
    return None


def _get_client_identifier(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for.strip():
        return forwarded_for.split(",")[0].strip()
    client = request.client
    return client.host if client and client.host else "unknown"


def _consume_analyze_rate_limit(request: Request) -> int | None:
    if ANALYZE_RATE_LIMIT_COUNT <= 0:
        return None

    client_id = _get_client_identifier(request)
    now = monotonic()
    window_start = now - ANALYZE_RATE_LIMIT_WINDOW_SECONDS

    with _ANALYZE_RATE_LIMIT_LOCK:
        attempts = _ANALYZE_RATE_LIMIT_BUCKETS[client_id]
        while attempts and attempts[0] <= window_start:
            attempts.popleft()

        if len(attempts) >= ANALYZE_RATE_LIMIT_COUNT:
            retry_after_seconds = max(
                1,
                int(ANALYZE_RATE_LIMIT_WINDOW_SECONDS - (now - attempts[0])) + 1,
            )
            return retry_after_seconds

        attempts.append(now)

    return None


def _apply_security_headers(request: Request, response: Response) -> Response:
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), "
        "accelerometer=(), gyroscope=(), magnetometer=()"
    )
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

    if ENABLE_CSP:
        response.headers["Content-Security-Policy"] = _CONTENT_SECURITY_POLICY

    forwarded_proto = request.headers.get("x-forwarded-proto", "").strip().lower()
    is_https_request = request.url.scheme == "https" or forwarded_proto == "https"
    if ENABLE_HSTS and is_https_request:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    if request.url.path in {"/analyze", "/verify-report", "/health", "/api"} or request.url.path.startswith("/analyses"):
        response.headers["Cache-Control"] = "no-store"

    return response


@app.get("/api")
def api_root() -> Dict[str, Any]:
    return _api_status_payload()


@app.on_event("startup")
async def preload_model() -> None:
    global _STARTUP_WARMUP_STATUS

    init_storage()
    if APP_ENV == "production" and REPORT_SIGNING_SECRET_IS_DEFAULT:
        raise RuntimeError(
            "Refusing to start in production with the default report signing secret. "
            "Set PIXELPROOF_REPORT_SIGNING_SECRET before deployment."
        )
    get_model_status()
    if WARMUP_ON_STARTUP:
        _STARTUP_WARMUP_STATUS = warm_up_model()
    else:
        _STARTUP_WARMUP_STATUS = {
            "attempted": False,
            "warmed": False,
            "disabled": True,
        }


@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    if request.method == "POST" and request.url.path == "/analyze":
        retry_after_seconds = _consume_analyze_rate_limit(request)
        if retry_after_seconds is not None:
            response = JSONResponse(
                status_code=429,
                content={
                    "detail": (
                        "Too many analysis requests from this client. "
                        "Please wait a moment and try again."
                    )
                },
                headers={"Retry-After": str(retry_after_seconds)},
            )
            return _apply_security_headers(request, response)

    response = await call_next(request)
    return _apply_security_headers(request, response)


@app.get("/")
def root() -> Any:
    if _frontend_is_ready():
        return FileResponse(FRONTEND_INDEX_FILE)
    return _api_status_payload()


@app.get("/health")
def health() -> Dict[str, Any]:
    storage_status = get_storage_status()
    warnings: List[str] = []
    if APP_ENV == "production" and REPORT_SIGNING_SECRET_IS_DEFAULT:
        warnings.append("Default report signing secret is still active.")
    if not storage_status.get("ready", False):
        warnings.append("Persistent storage is unavailable.")
    if _STARTUP_WARMUP_STATUS.get("attempted") and not _STARTUP_WARMUP_STATUS.get("warmed"):
        warnings.append("Startup model warm-up did not complete successfully.")

    return {
        "status": "ok",
        "environment": APP_ENV,
        "model": get_model_status(),
        "warmup": _STARTUP_WARMUP_STATUS,
        "storage": storage_status,
        "frontend_ready": _frontend_is_ready(),
        "supports": {
            "images": sorted(ALLOWED_IMAGE_EXTENSIONS),
            "videos": sorted(ALLOWED_VIDEO_EXTENSIONS),
        },
        "limits": {
            "max_upload_mb": MAX_UPLOAD_MB,
            "max_video_duration_seconds": MAX_VIDEO_DURATION_SECONDS,
            "video_sample_frames": VIDEO_SAMPLE_FRAMES,
        },
        "protection": {
            "analyze_rate_limit": {
                "enabled": ANALYZE_RATE_LIMIT_COUNT > 0,
                "count": ANALYZE_RATE_LIMIT_COUNT,
                "window_seconds": ANALYZE_RATE_LIMIT_WINDOW_SECONDS,
            },
            "browser_security": {
                "content_security_policy": ENABLE_CSP,
                "csp_connect_src": CSP_CONNECT_SRC,
                "permissions_policy": True,
                "hsts_enabled": ENABLE_HSTS,
                "trusted_hosts": TRUSTED_HOSTS,
            },
        },
        "warnings": warnings,
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)) -> Dict[str, Any]:
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    media_type = _detect_media_type(file)
    result = predict_from_bytes(
        contents,
        media_type=media_type,
        filename=file.filename or f"upload.{media_type}",
        content_type=file.content_type,
    )

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=result.get("status_code", 400), detail=result["error"])

    try:
        save_analysis(
            result,
            file_size_bytes=len(contents),
            file_sha256=hashlib.sha256(contents).hexdigest(),
        )
    except Exception:
        warnings = list(result.get("warnings") or [])
        warnings.append(
            "Analysis completed, but the result could not be saved to persistent history."
        )
        result["warnings"] = warnings
    return result


@app.post("/verify-report")
def verify_report(body: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    return verify_signed_report(body)


@app.get("/analyses")
def get_analyses(limit: int = Query(default=50, ge=1, le=ANALYSIS_HISTORY_LIMIT)) -> Dict[str, Any]:
    items = list_analyses(limit=limit)
    return {
        "items": items,
        "count": len(items),
        "limit": limit,
    }


@app.get("/analyses/{analysis_id}")
def get_analysis_by_id(analysis_id: str) -> Dict[str, Any]:
    item = get_analysis(analysis_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return item


@app.delete("/analyses/{analysis_id}")
def delete_analysis_by_id(analysis_id: str) -> Dict[str, Any]:
    deleted = delete_analysis(analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"deleted": True, "analysis_id": analysis_id}


@app.get("/{full_path:path}", include_in_schema=False)
def frontend_fallback(full_path: str) -> Any:
    if not _frontend_is_ready():
        raise HTTPException(status_code=404, detail="Frontend build not found")

    asset = _resolve_frontend_asset(full_path)
    if asset is not None:
        return FileResponse(asset)

    if Path(full_path).suffix:
        raise HTTPException(status_code=404, detail="Asset not found")

    return FileResponse(FRONTEND_INDEX_FILE)
