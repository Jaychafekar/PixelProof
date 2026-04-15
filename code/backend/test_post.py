from __future__ import annotations

import argparse
from pathlib import Path

import requests

DEFAULT_SAMPLE = Path(__file__).resolve().parents[1] / "data" / "real_and_fake_face" / "training_real" / "real_00001.jpg"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke-test PixelProof /analyze with one local file.")
    parser.add_argument(
        "path",
        nargs="?",
        default=str(DEFAULT_SAMPLE),
        help="Path to the local image or video file to upload.",
    )
    parser.add_argument(
        "--url",
        default="http://127.0.0.1:8000/analyze",
        help="Analyze endpoint URL.",
    )
    return parser.parse_args()


def guess_content_type(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if suffix == ".png":
        return "image/png"
    if suffix == ".webp":
        return "image/webp"
    if suffix == ".mp4":
        return "video/mp4"
    if suffix == ".mov":
        return "video/quicktime"
    if suffix == ".webm":
        return "video/webm"
    if suffix == ".avi":
        return "video/x-msvideo"
    if suffix == ".mkv":
        return "video/x-matroska"
    return "application/octet-stream"


def main() -> int:
    args = parse_args()
    target = Path(args.path).resolve()
    if not target.exists():
        raise FileNotFoundError(f"Sample file not found: {target}")

    with target.open("rb") as handle:
        files = {"file": (target.name, handle, guess_content_type(target))}
        response = requests.post(args.url, files=files, timeout=120)

    print(response.status_code)
    try:
        print(response.json())
    except Exception:
        print(response.text)

    return 0 if response.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
