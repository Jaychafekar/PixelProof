from __future__ import annotations

import argparse
import json
import mimetypes
import statistics
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from config import ALLOWED_IMAGE_EXTENSIONS, ALLOWED_VIDEO_EXTENSIONS
from predict import get_model_status, predict_from_bytes, verify_signed_report

PROJECT_ROOT = Path(__file__).resolve().parents[1]
TRAINING_DIR = PROJECT_ROOT / "training"
TRAINING_SCRIPT = TRAINING_DIR / "train_simple.py"

if str(TRAINING_DIR) not in sys.path:
    sys.path.insert(0, str(TRAINING_DIR))

from train_simple import build_metric_section, collect_samples  # noqa: E402


def _resolve_media_type(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in ALLOWED_IMAGE_EXTENSIONS:
        return "image"
    if suffix in ALLOWED_VIDEO_EXTENSIONS:
        return "video"
    raise ValueError(
        f"Unsupported media type for {path.name}. Expected one of "
        f"{sorted(ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS)}."
    )


def _read_bytes(path: Path) -> bytes:
    if not path.exists():
        raise FileNotFoundError(f"Path does not exist: {path}")
    if not path.is_file():
        raise ValueError(f"Expected a file path, got directory: {path}")
    return path.read_bytes()


def _guess_content_type(path: Path) -> str | None:
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed


def _print_json(payload: Any) -> None:
    print(json.dumps(payload, indent=2))


def _parse_float_list(raw_value: str) -> list[float]:
    return [float(item.strip()) for item in raw_value.split(",") if item.strip()]


def _parse_int_list(raw_value: str) -> list[int]:
    return [int(item.strip()) for item in raw_value.split(",") if item.strip()]


def _encode_image_bytes(image_bgr: np.ndarray, *, extension: str, jpeg_quality: int | None = None) -> bytes:
    encode_params: list[int] = []
    if extension in {".jpg", ".jpeg"} and jpeg_quality is not None:
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), int(jpeg_quality)]

    ok, encoded = cv2.imencode(extension, image_bgr, encode_params)
    if not ok:
        raise RuntimeError("Failed to encode transformed image for robustness evaluation.")
    return encoded.tobytes()


def cmd_status(_: argparse.Namespace) -> int:
    _print_json(get_model_status())
    return 0


def cmd_analyze(args: argparse.Namespace) -> int:
    target = Path(args.path).resolve()
    result = predict_from_bytes(
        _read_bytes(target),
        media_type=_resolve_media_type(target),
        filename=target.name,
        content_type=_guess_content_type(target),
    )
    _print_json(result)
    return 0 if "error" not in result else int(result.get("status_code", 1))


def cmd_verify_report(args: argparse.Namespace) -> int:
    target = Path(args.path).resolve()
    report_payload = json.loads(target.read_text(encoding="utf-8"))
    result = verify_signed_report(report_payload)
    _print_json(result)
    return 0 if result.get("valid") else 1


def cmd_benchmark(args: argparse.Namespace) -> int:
    target = Path(args.path).resolve()
    media_bytes = _read_bytes(target)
    media_type = _resolve_media_type(target)

    durations_ms: list[float] = []
    last_result: dict[str, Any] | None = None
    for _ in range(max(1, args.runs)):
        started_at = time.perf_counter()
        last_result = predict_from_bytes(
            media_bytes,
            media_type=media_type,
            filename=target.name,
            content_type=_guess_content_type(target),
        )
        durations_ms.append((time.perf_counter() - started_at) * 1000.0)

    if last_result is None:
        raise RuntimeError("Benchmark did not produce any inference result.")

    benchmark_summary = {
        "path": str(target),
        "media_type": media_type,
        "runs": len(durations_ms),
        "timing_ms": {
            "min": round(min(durations_ms), 2),
            "mean": round(statistics.fmean(durations_ms), 2),
            "median": round(statistics.median(durations_ms), 2),
            "max": round(max(durations_ms), 2),
        },
        "last_result": last_result,
    }
    _print_json(benchmark_summary)
    return 0 if "error" not in last_result else int(last_result.get("status_code", 1))


def _predict_samples_with_backend(samples: list[Any], *, progress_every: int) -> dict[str, Any]:
    started_at = time.perf_counter()
    true_labels: list[int] = []
    fake_scores: list[float] = []
    sources: list[str] = []
    media_kinds: list[str] = []
    evaluated_samples: list[Any] = []
    face_detection_rates: list[float] = []

    total_samples = len(samples)
    for sample_number, sample in enumerate(samples, start=1):
        result = predict_from_bytes(
            _read_bytes(sample.path),
            media_type=sample.media_kind,
            filename=sample.path.name,
            content_type=_guess_content_type(sample.path),
        )
        if "error" in result:
            raise RuntimeError(f"Failed to evaluate {sample.path}: {result['error']}")

        true_labels.append(sample.label)
        fake_scores.append(float(result["scores"]["fake"]))
        sources.append(sample.source)
        media_kinds.append(sample.media_kind)
        evaluated_samples.append(sample)
        details = result.get("details") or {}
        face_detection_rates.append(float(details.get("face_detection_rate") or 0.0))

        if sample_number % progress_every == 0 or sample_number == total_samples:
            elapsed_seconds = time.perf_counter() - started_at
            print(
                f"[backend-batch-eval] Processed {sample_number}/{total_samples} samples "
                f"in {elapsed_seconds / 60:.1f}m"
            )

    return {
        "samples": evaluated_samples,
        "true_labels": np.array(true_labels, dtype=np.int32),
        "fake_scores": np.array(fake_scores, dtype=np.float32),
        "sources": sources,
        "media_kinds": media_kinds,
        "face_detection_rate": round(float(np.mean(face_detection_rates or [0.0])), 4),
    }


def cmd_batch_eval(args: argparse.Namespace) -> int:
    dataset_dir = Path(args.dataset_dir).resolve()
    samples = collect_samples([dataset_dir])

    if args.split != "all":
        samples = [sample for sample in samples if sample.preferred_split == args.split]
        if not samples:
            raise ValueError(
                f"No samples with predefined split {args.split!r} were found under {dataset_dir}."
            )

    model_status = get_model_status()
    predictions = _predict_samples_with_backend(
        samples,
        progress_every=args.progress_every,
    )
    metrics = build_metric_section(
        predictions,
        threshold=float(model_status["profiles"]["image"]["fake_threshold"]),
    )
    profile_summary = {
        profile_key: {
            "source": profile_status["source"],
            "fake_threshold": profile_status["fake_threshold"],
            "input_size": profile_status["input_size"],
            "artifact_dir": profile_status["artifact_dir"],
        }
        for profile_key, profile_status in model_status.get("profiles", {}).items()
    }
    report = {
        "dataset_dir": str(dataset_dir),
        "split": args.split,
        "sample_count": len(samples),
        "model": {
            "name": model_status["name"],
            "source": model_status["source"],
            "mode": model_status.get("mode", "single_profile"),
            "profiles": profile_summary,
        },
        "metrics": metrics,
    }

    if args.output:
        output_path = Path(args.output).resolve()
        output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"Saved batch evaluation report to {output_path}")

    _print_json(report)
    return 0


def cmd_robustness_check(args: argparse.Namespace) -> int:
    target = Path(args.path).resolve()
    if _resolve_media_type(target) != "image":
        raise ValueError("Robustness checks currently support image inputs only.")

    image_bgr = cv2.imread(str(target))
    if image_bgr is None:
        raise RuntimeError(f"Could not decode image at {target}")

    suffix = target.suffix.lower() if target.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"
    brightness_scales = _parse_float_list(args.brightness_scales)
    jpeg_qualities = _parse_int_list(args.jpeg_qualities)

    checks: list[dict[str, Any]] = []

    baseline = predict_from_bytes(
        _encode_image_bytes(image_bgr, extension=suffix),
        media_type="image",
        filename=target.name,
        content_type=_guess_content_type(target),
    )
    checks.append({"scenario": "baseline", "result": baseline})

    for quality in jpeg_qualities:
        transformed_bytes = _encode_image_bytes(image_bgr, extension=".jpg", jpeg_quality=quality)
        checks.append(
            {
                "scenario": f"jpeg_quality_{quality}",
                "result": predict_from_bytes(
                    transformed_bytes,
                    media_type="image",
                    filename=f"{target.stem}-q{quality}.jpg",
                    content_type="image/jpeg",
                ),
            }
        )

    for scale in brightness_scales:
        transformed = np.clip(image_bgr.astype(np.float32) * scale, 0, 255).astype(np.uint8)
        transformed_bytes = _encode_image_bytes(transformed, extension=suffix)
        checks.append(
            {
                "scenario": f"brightness_{scale:.2f}",
                "result": predict_from_bytes(
                    transformed_bytes,
                    media_type="image",
                    filename=f"{target.stem}-brightness-{scale:.2f}{suffix}",
                    content_type=_guess_content_type(target),
                ),
            }
        )

    report = {
        "path": str(target),
        "checks": checks,
    }
    _print_json(report)
    return 0


def cmd_train(args: argparse.Namespace) -> int:
    training_args = list(args.training_args or [])
    if training_args and training_args[0] == "--":
        training_args = training_args[1:]

    command = [sys.executable, str(TRAINING_SCRIPT), *training_args]
    return subprocess.call(command, cwd=str(Path(__file__).resolve().parent))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PixelProof admin CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    status_parser = subparsers.add_parser("status", help="Print backend model and report status.")
    status_parser.set_defaults(func=cmd_status)

    analyze_parser = subparsers.add_parser("analyze", help="Analyze a local image or video file.")
    analyze_parser.add_argument("path", help="Path to the local media file.")
    analyze_parser.set_defaults(func=cmd_analyze)

    verify_parser = subparsers.add_parser(
        "verify-report",
        help="Verify a previously downloaded signed JSON report.",
    )
    verify_parser.add_argument("path", help="Path to the saved report JSON.")
    verify_parser.set_defaults(func=cmd_verify_report)

    benchmark_parser = subparsers.add_parser(
        "benchmark",
        help="Benchmark repeated inference on a local image or video file.",
    )
    benchmark_parser.add_argument("path", help="Path to the local media file.")
    benchmark_parser.add_argument("--runs", type=int, default=3, help="Number of benchmark runs.")
    benchmark_parser.set_defaults(func=cmd_benchmark)

    batch_parser = subparsers.add_parser(
        "batch-eval",
        help="Evaluate the current backend model across a labelled dataset directory.",
    )
    batch_parser.add_argument("dataset_dir", help="Dataset root containing real/fake media.")
    batch_parser.add_argument(
        "--split",
        choices=("all", "train", "val", "test"),
        default="all",
        help="Restrict evaluation to a predefined split when the dataset provides one.",
    )
    batch_parser.add_argument("--batch-size", type=int, default=16)
    batch_parser.add_argument("--eval-video-frames", type=int, default=5)
    batch_parser.add_argument("--progress-every", type=int, default=250)
    batch_parser.add_argument("--output", help="Optional path to save the JSON report.")
    batch_parser.set_defaults(func=cmd_batch_eval)

    robustness_parser = subparsers.add_parser(
        "robustness-check",
        help="Run simple image robustness checks across compression and brightness variants.",
    )
    robustness_parser.add_argument("path", help="Path to the local image file.")
    robustness_parser.add_argument(
        "--jpeg-qualities",
        default="95,75,50",
        help="Comma-separated JPEG quality settings to test.",
    )
    robustness_parser.add_argument(
        "--brightness-scales",
        default="0.70,1.00,1.30",
        help="Comma-separated brightness multipliers to test.",
    )
    robustness_parser.set_defaults(func=cmd_robustness_check)

    train_parser = subparsers.add_parser(
        "train",
        help="Forward arguments to the existing training CLI.",
    )
    train_parser.add_argument(
        "training_args",
        nargs=argparse.REMAINDER,
        help="Arguments passed through to training/train_simple.py",
    )
    train_parser.set_defaults(func=cmd_train)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
