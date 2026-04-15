from __future__ import annotations

import hashlib
import hmac
import json
import os
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Sequence
from uuid import uuid4

import cv2
import numpy as np
from tensorflow.keras.models import Sequential, load_model

from config import (
    DEFAULT_FAKE_THRESHOLD,
    DEFAULT_REPORT_SIGNING_SECRET,
    IMAGE_MODEL_DIR,
    MAX_VIDEO_DURATION_SECONDS,
    MODEL_IMAGE_SIZE,
    MODEL_LABELS,
    MODEL_NAME,
    REPORT_SIGNING_ALGORITHM,
    REPORT_SIGNING_SECRET,
    REPORT_VERIFY_ENDPOINT,
    VIDEO_MODEL_DIR,
    VIDEO_MIN_SAMPLE_FRAMES,
    VIDEO_SAMPLE_FRAMES,
)
from modeling import build_classifier
from utils.preprocess import prepare_image_for_model

_PROFILE_DIRS = {
    "image": IMAGE_MODEL_DIR,
    "video": VIDEO_MODEL_DIR,
}
_MODEL_CACHE: Dict[str, Sequential | None] = {profile: None for profile in _PROFILE_DIRS}
_MODEL_SOURCES: Dict[str, str] = {profile: "uninitialized" for profile in _PROFILE_DIRS}
_MODEL_LOAD_ERRORS: Dict[str, str | None] = {profile: None for profile in _PROFILE_DIRS}
_MODEL_METADATA: Dict[str, Dict[str, Any]] = {profile: {} for profile in _PROFILE_DIRS}
_REPORT_SIGNING_SECRET_BYTES = REPORT_SIGNING_SECRET.encode("utf-8")


def _canonical_json_bytes(payload: Dict[str, Any]) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def _sign_report_payload(payload: Dict[str, Any]) -> str:
    return hmac.new(
        _REPORT_SIGNING_SECRET_BYTES,
        _canonical_json_bytes(payload),
        hashlib.sha256,
    ).hexdigest()


def _build_signed_report(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "version": 1,
        "algorithm": REPORT_SIGNING_ALGORITHM,
        "signature": _sign_report_payload(payload),
        "verify_endpoint": REPORT_VERIFY_ENDPOINT,
        "payload": payload,
    }


def get_report_signing_status() -> Dict[str, Any]:
    return {
        "enabled": bool(REPORT_SIGNING_SECRET.strip()),
        "algorithm": REPORT_SIGNING_ALGORITHM,
        "verify_endpoint": REPORT_VERIFY_ENDPOINT,
        "mode": (
            "default_secret"
            if REPORT_SIGNING_SECRET == DEFAULT_REPORT_SIGNING_SECRET
            else "configured_secret"
        ),
    }


def verify_signed_report(report: Dict[str, Any]) -> Dict[str, Any]:
    report_bundle = report.get("report") if isinstance(report.get("report"), dict) else report
    if not isinstance(report_bundle, dict):
        return {"valid": False, "reason": "No report bundle was provided."}

    payload = report_bundle.get("payload")
    signature = report_bundle.get("signature")
    algorithm = report_bundle.get("algorithm")

    if not isinstance(payload, dict):
        return {"valid": False, "reason": "Signed report payload is missing or invalid."}
    if not isinstance(signature, str) or not signature.strip():
        return {"valid": False, "reason": "Signed report signature is missing."}
    if algorithm != REPORT_SIGNING_ALGORITHM:
        return {
            "valid": False,
            "reason": f"Unsupported signing algorithm: {algorithm!r}.",
            "expected_algorithm": REPORT_SIGNING_ALGORITHM,
        }

    expected_signature = _sign_report_payload(payload)
    is_valid = hmac.compare_digest(signature, expected_signature)
    return {
        "valid": is_valid,
        "reason": None if is_valid else "Signature mismatch. The report may have been modified.",
        "algorithm": REPORT_SIGNING_ALGORITHM,
        "verify_endpoint": REPORT_VERIFY_ENDPOINT,
        "analysis_id": payload.get("analysis_id"),
        "label": payload.get("label"),
    }


def _build_classifier() -> Sequential:
    model, _ = build_classifier(MODEL_IMAGE_SIZE, backbone_weights=None)
    return model


def _normalize_profile_key(media_type: str) -> str:
    return "video" if media_type == "video" else "image"


def _get_profile_artifacts(media_type: str) -> Dict[str, Path]:
    profile_key = _normalize_profile_key(media_type)
    base_dir = _PROFILE_DIRS[profile_key]
    return {
        "profile": profile_key,
        "dir": base_dir,
        "weights": base_dir / "deepfake_detection_model.weights.h5",
        "meta": base_dir / "deepfake_detection_model.meta.json",
        "full_model": base_dir / "deepfake_detection_model.h5",
    }


def _load_model_with_fallbacks(media_type: str) -> tuple[Sequential, str]:
    artifacts = _get_profile_artifacts(media_type)
    load_errors: list[str] = []

    if artifacts["weights"].exists():
        try:
            model = _build_classifier()
            model.load_weights(str(artifacts["weights"]))
            return model, "weights"
        except Exception as exc:
            load_errors.append(
                f"Weights load failed from {artifacts['weights'].name} in {artifacts['dir']}: {exc}"
            )

    if artifacts["full_model"].exists():
        try:
            return load_model(str(artifacts["full_model"]), compile=False), "full_model"
        except Exception as exc:
            load_errors.append(
                f"Full model load failed from {artifacts['full_model'].name} in {artifacts['dir']}: {exc}"
            )
            # Some older .h5 exports contain only usable weights even when the
            # serialized Keras config can no longer be loaded directly.
            try:
                model = _build_classifier()
                model.load_weights(str(artifacts["full_model"]))
                return model, "compatibility_h5_weights"
            except Exception as compatibility_exc:
                load_errors.append(
                    f"Compatibility .h5 weights load failed from {artifacts['full_model'].name} "
                    f"in {artifacts['dir']}: {compatibility_exc}"
                )

    if load_errors:
        raise RuntimeError(" ; ".join(load_errors))

    raise FileNotFoundError(
        "No compatible model artifact found. Expected a .weights.h5 file or compatible .h5 model "
        f"under {artifacts['dir']}."
    )


def get_model(media_type: str = "image") -> Sequential | None:
    profile_key = _normalize_profile_key(media_type)

    if _MODEL_CACHE[profile_key] is not None:
        return _MODEL_CACHE[profile_key]

    try:
        _MODEL_CACHE[profile_key], _MODEL_SOURCES[profile_key] = _load_model_with_fallbacks(profile_key)
        _MODEL_METADATA[profile_key] = _load_model_metadata(profile_key)
        _MODEL_LOAD_ERRORS[profile_key] = None
    except Exception as exc:
        _MODEL_CACHE[profile_key] = None
        _MODEL_LOAD_ERRORS[profile_key] = str(exc)

    return _MODEL_CACHE[profile_key]


def _build_profile_status(media_type: str) -> Dict[str, Any]:
    profile_key = _normalize_profile_key(media_type)
    artifacts = _get_profile_artifacts(profile_key)
    model = get_model(profile_key)
    return {
        "ready": model is not None,
        "profile": profile_key,
        "source": _MODEL_SOURCES[profile_key],
        "error": _MODEL_LOAD_ERRORS[profile_key],
        "name": MODEL_NAME,
        "input_size": list(MODEL_IMAGE_SIZE),
        "fake_threshold": _get_fake_threshold(profile_key),
        "metadata": _MODEL_METADATA[profile_key],
        "artifact_dir": str(artifacts["dir"]),
    }


def get_model_status() -> Dict[str, Any]:
    profiles = {profile_key: _build_profile_status(profile_key) for profile_key in _PROFILE_DIRS}
    artifact_dirs = {profile_status["artifact_dir"] for profile_status in profiles.values()}
    source = profiles["image"]["source"] if len(artifact_dirs) == 1 else "hybrid"
    return {
        "ready": all(profile_status["ready"] for profile_status in profiles.values()),
        "mode": "hybrid" if len(artifact_dirs) > 1 else "single_profile",
        "source": source,
        "name": MODEL_NAME,
        "input_size": list(MODEL_IMAGE_SIZE),
        "fake_threshold": profiles["image"]["fake_threshold"],
        "metadata": profiles["image"]["metadata"],
        "profiles": profiles,
        "report_signing": get_report_signing_status(),
    }


def warm_up_model() -> Dict[str, Any]:
    blank_frame = np.zeros((MODEL_IMAGE_SIZE[1], MODEL_IMAGE_SIZE[0], 3), dtype=np.uint8)
    profile_statuses: Dict[str, Dict[str, Any]] = {}
    warmed = True
    for profile_key in _PROFILE_DIRS:
        model = get_model(profile_key)
        if model is None:
            warmed = False
            profile_statuses[profile_key] = {
                "attempted": True,
                "warmed": False,
                "source": _MODEL_SOURCES[profile_key],
                "error": _MODEL_LOAD_ERRORS[profile_key],
            }
            continue

        started_at = time.perf_counter()
        try:
            _predict_batch([blank_frame], media_type=profile_key)
            profile_statuses[profile_key] = {
                "attempted": True,
                "warmed": True,
                "source": _MODEL_SOURCES[profile_key],
                "processing_ms": int((time.perf_counter() - started_at) * 1000),
            }
        except Exception as exc:
            warmed = False
            profile_statuses[profile_key] = {
                "attempted": True,
                "warmed": False,
                "source": _MODEL_SOURCES[profile_key],
                "error": str(exc),
            }
    return {
        "attempted": True,
        "warmed": warmed,
        "mode": "hybrid" if len({str(path) for path in _PROFILE_DIRS.values()}) > 1 else "single_profile",
        "profiles": profile_statuses,
    }


def _load_model_metadata(media_type: str) -> Dict[str, Any]:
    metadata_path = _get_profile_artifacts(media_type)["meta"]
    if metadata_path.exists():
        try:
            return json.loads(metadata_path.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def _get_fake_threshold(media_type: str = "image") -> float:
    profile_key = _normalize_profile_key(media_type)
    raw_threshold = _MODEL_METADATA[profile_key].get("decision_threshold", DEFAULT_FAKE_THRESHOLD)
    try:
        return float(raw_threshold)
    except Exception:
        return DEFAULT_FAKE_THRESHOLD


def _get_preprocess_mode(media_type: str = "image") -> str:
    profile_key = _normalize_profile_key(media_type)
    raw_mode = _MODEL_METADATA[profile_key].get("preprocess_mode", "legacy_0_1")
    if isinstance(raw_mode, str) and raw_mode.strip():
        return raw_mode.strip()
    return "legacy_0_1"


def _prepare_frames(
    frames_bgr: Sequence[np.ndarray],
    *,
    media_type: str,
) -> tuple[np.ndarray, List[Dict[str, Any]]]:
    prepared_frames: List[np.ndarray] = []
    frame_metadata: List[Dict[str, Any]] = []
    preprocess_mode = _get_preprocess_mode(media_type)
    for frame in frames_bgr:
        prepared, metadata = prepare_image_for_model(
            frame,
            image_size=MODEL_IMAGE_SIZE,
            prefer_face=True,
            preprocess_mode=preprocess_mode,
        )
        prepared_frames.append(prepared)
        frame_metadata.append(metadata)

    return np.stack(prepared_frames, axis=0), frame_metadata


def _predict_batch(
    frames_bgr: Sequence[np.ndarray],
    *,
    media_type: str,
) -> tuple[np.ndarray, List[Dict[str, Any]]]:
    profile_key = _normalize_profile_key(media_type)
    model = get_model(profile_key)
    if model is None:
        raise RuntimeError(_MODEL_LOAD_ERRORS[profile_key] or "Model is unavailable")

    batch, frame_metadata = _prepare_frames(frames_bgr, media_type=profile_key)
    return model.predict(batch, verbose=0), frame_metadata


def _resolve_label_index(scores: np.ndarray, *, media_type: str) -> int:
    fake_threshold = _get_fake_threshold(media_type)
    return 0 if float(scores[0]) >= fake_threshold else 1


def _build_decision_details(scores: np.ndarray, *, media_type: str) -> Dict[str, Any]:
    fake_score = float(scores[0])
    fake_threshold = _get_fake_threshold(media_type)
    raw_top_index = int(np.argmax(scores))
    decided_fake = fake_score >= fake_threshold

    return {
        "decision_rule": "fake score compared against configured threshold",
        "decision_basis": "fake_score_above_threshold" if decided_fake else "fake_score_below_threshold",
        "decision_threshold": round(fake_threshold, 4),
        "decision_margin": round(abs(fake_score - fake_threshold), 4),
        "raw_top_label": MODEL_LABELS[raw_top_index],
        "raw_top_score": round(float(scores[raw_top_index]), 4),
    }


def _format_common_response(
    *,
    media_type: str,
    label_index: int,
    scores: np.ndarray,
    started_at: float,
    filename: str,
    content_type: str | None,
    details: Dict[str, Any],
    warnings: List[str] | None = None,
) -> Dict[str, Any]:
    profile_key = _normalize_profile_key(media_type)
    confidence = float(scores[label_index])
    enriched_details = {
        **details,
        **_build_decision_details(scores, media_type=profile_key),
    }

    response = {
        "analysis_id": f"pp_{uuid4().hex[:12]}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "media_type": media_type,
        "filename": filename,
        "content_type": content_type or "application/octet-stream",
        "label": MODEL_LABELS[label_index],
        "confidence": round(confidence, 4),
        "scores": {
            "fake": round(float(scores[0]), 4),
            "real": round(float(scores[1]), 4),
        },
        "processing_ms": int((time.perf_counter() - started_at) * 1000),
        "model": {
            "name": MODEL_NAME,
            "profile": profile_key,
            "source": _MODEL_SOURCES[profile_key],
            "input_size": list(MODEL_IMAGE_SIZE),
            "fake_threshold": round(_get_fake_threshold(profile_key), 4),
        },
        "details": enriched_details,
        "warnings": warnings or [],
    }
    report_payload = {
        key: response[key]
        for key in (
            "analysis_id",
            "created_at",
            "media_type",
            "filename",
            "content_type",
            "label",
            "confidence",
            "scores",
            "processing_ms",
            "model",
            "details",
            "warnings",
        )
    }
    response["report"] = _build_signed_report(report_payload)
    return response


def analyze_image_bytes(
    file_bytes: bytes,
    *,
    filename: str = "upload",
    content_type: str | None = None,
) -> Dict[str, Any]:
    started_at = time.perf_counter()

    np_arr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        return {"error": "Invalid image file", "status_code": 400}

    try:
        batch_scores, frame_metadata = _predict_batch([image], media_type="image")
        scores = batch_scores[0]
    except RuntimeError as exc:
        return {"error": str(exc), "status_code": 503}
    except Exception as exc:
        return {"error": str(exc), "status_code": 500}

    label_index = _resolve_label_index(scores, media_type="image")
    image_meta = frame_metadata[0]
    return _format_common_response(
        media_type="image",
        label_index=label_index,
        scores=scores,
        started_at=started_at,
        filename=filename,
        content_type=content_type,
        details={
            "strategy": "single-frame image classification",
            "frames_sampled": 1,
            "suspicious_frame_ratio": 1.0 if float(scores[0]) >= _get_fake_threshold("image") else 0.0,
            "face_detected_frames": 1 if image_meta["face_detected"] else 0,
            "face_detection_rate": 1.0 if image_meta["face_detected"] else 0.0,
            "used_full_frame": image_meta["used_full_frame"],
            "face_box": image_meta["face_box"],
        },
        warnings=[],
    )


def _compute_sample_indices(frame_count: int) -> List[int]:
    if frame_count <= 0:
        return []

    target = min(VIDEO_SAMPLE_FRAMES, frame_count)
    if target <= 1:
        return [0]

    indices = np.linspace(0, frame_count - 1, target, dtype=int).tolist()
    return sorted(set(indices))


def _sample_video_frames(
    capture: cv2.VideoCapture,
    *,
    frame_count: int,
) -> tuple[List[np.ndarray], List[int]]:
    sample_indices = _compute_sample_indices(frame_count)
    if sample_indices:
        sampled_frames: List[np.ndarray] = []
        resolved_indices: List[int] = []
        for frame_index in sample_indices:
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = capture.read()
            if ok and frame is not None:
                sampled_frames.append(frame)
                resolved_indices.append(frame_index)
        return sampled_frames, resolved_indices

    sampled_frames = []
    resolved_indices = []
    frame_index = 0
    while len(sampled_frames) < VIDEO_SAMPLE_FRAMES:
        ok, frame = capture.read()
        if not ok or frame is None:
            break
        sampled_frames.append(frame)
        resolved_indices.append(frame_index)
        frame_index += 1
    return sampled_frames, resolved_indices


def analyze_video_bytes(
    file_bytes: bytes,
    *,
    filename: str = "upload.mp4",
    content_type: str | None = None,
) -> Dict[str, Any]:
    started_at = time.perf_counter()
    suffix = Path(filename).suffix or ".mp4"
    temp_path = ""
    warnings: List[str] = []

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(file_bytes)
        temp_path = temp_file.name

    capture = cv2.VideoCapture(temp_path)
    try:
        if not capture.isOpened():
            return {"error": "Invalid or unsupported video file", "status_code": 400}

        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        duration_seconds = round(frame_count / fps, 2) if frame_count > 0 and fps > 0 else None
        if duration_seconds is not None and duration_seconds > MAX_VIDEO_DURATION_SECONDS:
            return {
                "error": (
                    f"Video is too long for online analysis. Upload a clip up to "
                    f"{MAX_VIDEO_DURATION_SECONDS} seconds."
                ),
                "status_code": 413,
            }

        sampled_frames, resolved_indices = _sample_video_frames(capture, frame_count=frame_count)

        if len(sampled_frames) < VIDEO_MIN_SAMPLE_FRAMES:
            warnings.append(
                "Limited frame access from the uploaded video; confidence may be less stable than image analysis."
            )
        if frame_count <= 0:
            warnings.append(
                "Video metadata was incomplete, so PixelProof sampled the first readable frames instead of evenly spaced frames."
            )

        if not sampled_frames:
            return {
                "error": "No readable frames were found in the uploaded video",
                "status_code": 400,
            }

        try:
            frame_scores, frame_metadata = _predict_batch(sampled_frames, media_type="video")
        except RuntimeError as exc:
            return {"error": str(exc), "status_code": 503}
        except Exception as exc:
            return {"error": str(exc), "status_code": 500}

        aggregated_scores = frame_scores.mean(axis=0)
        label_index = _resolve_label_index(aggregated_scores, media_type="video")
        fake_scores = frame_scores[:, 0]
        fake_threshold = _get_fake_threshold("video")

        strongest_frame_idx = int(np.argmax(fake_scores))
        suspicious_ratio = float(np.mean(fake_scores >= fake_threshold))
        face_detected_frames = int(sum(1 for meta in frame_metadata if meta["face_detected"]))
        full_frame_fallbacks = int(sum(1 for meta in frame_metadata if meta["used_full_frame"]))

        return _format_common_response(
            media_type="video",
            label_index=label_index,
            scores=aggregated_scores,
            started_at=started_at,
            filename=filename,
            content_type=content_type,
            details={
                "strategy": "multi-frame video aggregation",
                "frames_sampled": len(sampled_frames),
                "sampled_frame_indices": resolved_indices,
                "video_frame_count": frame_count if frame_count > 0 else None,
                "duration_seconds": duration_seconds,
                "fps": round(fps, 2) if fps > 0 else None,
                "suspicious_frame_ratio": round(suspicious_ratio, 4),
                "peak_fake_frame_index": resolved_indices[strongest_frame_idx],
                "peak_fake_score": round(float(fake_scores[strongest_frame_idx]), 4),
                "face_detected_frames": face_detected_frames,
                "face_detection_rate": round(face_detected_frames / len(sampled_frames), 4),
                "full_frame_fallbacks": full_frame_fallbacks,
            },
            warnings=warnings,
        )
    finally:
        capture.release()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


def predict_from_bytes(
    file_bytes: bytes,
    *,
    media_type: str,
    filename: str = "upload",
    content_type: str | None = None,
) -> Dict[str, Any]:
    if media_type == "image":
        return analyze_image_bytes(file_bytes, filename=filename, content_type=content_type)
    if media_type == "video":
        return analyze_video_bytes(file_bytes, filename=filename, content_type=content_type)
    return {"error": f"Unsupported media type: {media_type}", "status_code": 415}
