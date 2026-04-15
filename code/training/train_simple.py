from __future__ import annotations

import argparse
import json
import math
import sys
import time
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.losses import CategoricalCrossentropy
from tensorflow.keras.models import Sequential, load_model

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from modeling import build_classifier
from utils.preprocess import (
    apply_model_preprocessing,
    extract_resized_rgb_image,
    prepare_image_for_model,
)

SEED = 42
CLASS_NAMES = ("training_fake", "training_real")
CLASS_TO_INDEX = {name: index for index, name in enumerate(CLASS_NAMES)}
DEFAULT_IMG_SIZE = (96, 96)
DEFAULT_BATCH_SIZE = 32
DEFAULT_HEAD_EPOCHS = 4
DEFAULT_FINE_TUNE_EPOCHS = 0
DEFAULT_UNFREEZE_LAST_N = 60
DEFAULT_VAL_RATIO = 0.15
DEFAULT_TEST_RATIO = 0.15
DEFAULT_MAX_REAL_FPR = 0.20
DEFAULT_EVAL_VIDEO_FRAMES = 5
DEFAULT_PREPROCESS_MODE = "mobilenet_v2"
DEFAULT_FACE_CROP_PROBABILITY = 0.75

PRIMARY_DATASET_DIR = BASE_DIR.parent / "data" / "real_and_fake_face"
LEGACY_DATASET_DIR = BASE_DIR.parent / "data" / "real_and_fake_face_detection" / "real_and_fake_face"
ARCHIVE_DATASET_DIR = BASE_DIR.parent / "data" / "archive1"
CELEB_DF_DATASET_DIR = BASE_DIR.parent / "data" / "Celeb-DF"
MODEL_DIR = BACKEND_DIR / "model"
MODEL_FULL_PATH = MODEL_DIR / "deepfake_detection_model.h5"
MODEL_WEIGHTS_PATH = MODEL_DIR / "deepfake_detection_model.weights.h5"
MODEL_META_PATH = MODEL_DIR / "deepfake_detection_model.meta.json"
MODEL_SPLITS_PATH = MODEL_DIR / "deepfake_detection_splits.json"
ALLOWED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_SUFFIXES = {".mp4", ".mov", ".avi", ".webm", ".mkv"}
GENERIC_REAL_DIR_NAMES = {"real", "reals", "training_real", "original", "authentic"}
GENERIC_FAKE_DIR_NAMES = {
    "fake",
    "fakes",
    "training_fake",
    "manipulated",
    "manipulations",
    "synthesis",
    "synthetic",
    "deepfake",
    "deepfakes",
}


@dataclass(frozen=True)
class Sample:
    path: Path
    label: int
    source: str
    media_kind: str
    preferred_split: str | None = None


class FaceSequence(tf.keras.utils.Sequence):
    def __init__(
        self,
        samples: list[Sample],
        *,
        batch_size: int,
        image_size: tuple[int, int],
        augment: bool,
        shuffle: bool,
        seed: int,
        preprocess_mode: str,
        face_crop_probability: float,
    ) -> None:
        self.samples = samples
        self.batch_size = batch_size
        self.image_size = image_size
        self.augment = augment
        self.shuffle = shuffle
        self.preprocess_mode = preprocess_mode
        self.face_crop_probability = min(max(face_crop_probability, 0.0), 1.0)
        self.rng = np.random.default_rng(seed)
        self.indices = np.arange(len(samples))
        if self.shuffle:
            self.rng.shuffle(self.indices)

    def __len__(self) -> int:
        return math.ceil(len(self.indices) / self.batch_size)

    def __getitem__(self, index: int) -> tuple[np.ndarray, np.ndarray]:
        batch_indices = self.indices[index * self.batch_size : (index + 1) * self.batch_size]
        images: list[np.ndarray] = []
        labels: list[np.ndarray] = []

        for sample_index in batch_indices:
            sample = self.samples[sample_index]
            frames_bgr = load_media_frames(
                sample,
                video_frames=1,
                rng=self.rng,
                random_video_frame=(sample.media_kind == "video"),
            )
            if not frames_bgr:
                continue

            prefer_face = True
            if self.augment:
                prefer_face = self.rng.random() < self.face_crop_probability

            rgb_image, _ = extract_resized_rgb_image(
                frames_bgr[0],
                image_size=self.image_size,
                prefer_face=prefer_face,
            )
            if self.augment:
                rgb_image = self._augment(rgb_image)

            prepared = apply_model_preprocessing(
                rgb_image,
                preprocess_mode=self.preprocess_mode,
            )

            images.append(prepared)
            labels.append(tf.keras.utils.to_categorical(sample.label, num_classes=2))

        if not images:
            fallback_image = apply_model_preprocessing(
                np.zeros((self.image_size[0], self.image_size[1], 3), dtype="float32"),
                preprocess_mode=self.preprocess_mode,
            )
            fallback_label = tf.keras.utils.to_categorical(1, num_classes=2)
            return np.expand_dims(fallback_image, axis=0), np.expand_dims(fallback_label, axis=0)

        return np.stack(images, axis=0), np.stack(labels, axis=0)

    def on_epoch_end(self) -> None:
        if self.shuffle:
            self.rng.shuffle(self.indices)

    def _augment(self, image_rgb: np.ndarray) -> np.ndarray:
        augmented = image_rgb.copy()

        if self.rng.random() < 0.5:
            augmented = np.flip(augmented, axis=1)

        brightness = self.rng.uniform(-18.0, 18.0)
        contrast = self.rng.uniform(0.9, 1.12)
        augmented = np.clip((augmented - 127.5) * contrast + 127.5 + brightness, 0.0, 255.0)

        if self.rng.random() < 0.2:
            noise = self.rng.normal(0.0, 4.0, size=augmented.shape)
            augmented = np.clip(augmented + noise, 0.0, 255.0)

        if self.rng.random() < 0.2:
            augmented = cv2.GaussianBlur(augmented, (3, 3), sigmaX=0.8)

        if self.rng.random() < 0.3:
            quality = int(self.rng.integers(50, 96))
            encode_ok, encoded = cv2.imencode(
                ".jpg",
                cv2.cvtColor(augmented.astype("uint8"), cv2.COLOR_RGB2BGR),
                [int(cv2.IMWRITE_JPEG_QUALITY), quality],
            )
            if encode_ok:
                decoded = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
                if decoded is not None:
                    augmented = cv2.cvtColor(decoded, cv2.COLOR_BGR2RGB).astype("float32")

        return augmented.astype("float32")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train PixelProof with stronger evaluation.")
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        action="append",
        default=None,
        help="Repeat this flag to combine multiple dataset roots.",
    )
    parser.add_argument(
        "--holdout-dataset-dir",
        type=Path,
        action="append",
        default=None,
        help="Optional dataset roots reserved for external holdout evaluation only.",
    )
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--head-epochs", type=int, default=DEFAULT_HEAD_EPOCHS)
    parser.add_argument("--fine-tune-epochs", type=int, default=DEFAULT_FINE_TUNE_EPOCHS)
    parser.add_argument("--unfreeze-last-n", type=int, default=DEFAULT_UNFREEZE_LAST_N)
    parser.add_argument("--val-ratio", type=float, default=DEFAULT_VAL_RATIO)
    parser.add_argument("--test-ratio", type=float, default=DEFAULT_TEST_RATIO)
    parser.add_argument("--max-real-fpr", type=float, default=DEFAULT_MAX_REAL_FPR)
    parser.add_argument("--eval-video-frames", type=int, default=DEFAULT_EVAL_VIDEO_FRAMES)
    parser.add_argument("--preprocess-mode", type=str, default=DEFAULT_PREPROCESS_MODE)
    parser.add_argument("--face-crop-probability", type=float, default=DEFAULT_FACE_CROP_PROBABILITY)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--dry-run", action="store_true", help="Inspect datasets and planned splits without training.")
    parser.add_argument("--evaluate-current-model", action="store_true")
    return parser.parse_args()


def resolve_dataset_dirs(
    cli_dataset_dirs: list[Path] | None,
    *,
    fallback_to_candidates: bool = True,
    allow_empty: bool = False,
) -> list[Path]:
    if cli_dataset_dirs:
        resolved: list[Path] = []
        for dataset_dir in cli_dataset_dirs:
            if not dataset_dir.exists():
                raise FileNotFoundError(f"Dataset path does not exist: {dataset_dir}")
            resolved.append(dataset_dir)
        return resolved

    if fallback_to_candidates:
        resolved = _resolve_default_dataset_dirs()
        if resolved:
            return resolved

    if allow_empty:
        return []

    expected = "\n".join(f"  - {candidate}" for candidate in _default_dataset_candidates())
    raise FileNotFoundError(f"Dataset not found. Checked:\n{expected}")


def _default_dataset_candidates() -> list[Path]:
    return [ARCHIVE_DATASET_DIR, CELEB_DF_DATASET_DIR, PRIMARY_DATASET_DIR, LEGACY_DATASET_DIR]


def _resolve_default_dataset_dirs() -> list[Path]:
    resolved: list[Path] = []

    if ARCHIVE_DATASET_DIR.exists():
        resolved.append(ARCHIVE_DATASET_DIR)
    if CELEB_DF_DATASET_DIR.exists():
        resolved.append(CELEB_DF_DATASET_DIR)

    # Fall back to the older image-only datasets only when the preferred
    # archive/video pair is not available.
    if not resolved:
        if PRIMARY_DATASET_DIR.exists():
            resolved.append(PRIMARY_DATASET_DIR)
        elif LEGACY_DATASET_DIR.exists():
            resolved.append(LEGACY_DATASET_DIR)

        if ARCHIVE_DATASET_DIR.exists():
            resolved.append(ARCHIVE_DATASET_DIR)

    return resolved


def _resolve_default_holdout_dataset_dirs(training_dataset_dirs: list[Path]) -> list[Path]:
    training_resolved = {str(path.resolve()) for path in training_dataset_dirs}

    for candidate in (PRIMARY_DATASET_DIR, LEGACY_DATASET_DIR):
        if not candidate.exists():
            continue
        if str(candidate.resolve()) in training_resolved:
            continue
        return [candidate]

    return []


def _media_kind_for_path(path: Path) -> str | None:
    suffix = path.suffix.lower()
    if suffix in ALLOWED_IMAGE_SUFFIXES:
        return "image"
    if suffix in ALLOWED_VIDEO_SUFFIXES:
        return "video"
    return None


def _iter_supported_media_files(root: Path) -> list[Path]:
    if not root.exists():
        return []
    return sorted(
        path
        for path in root.rglob("*")
        if path.is_file() and _media_kind_for_path(path) is not None
    )


def _collect_labeled_samples(
    root: Path,
    *,
    label: int,
    source_name: str,
    preferred_split: str | None = None,
) -> list[Sample]:
    media_paths = _iter_supported_media_files(root)
    if not media_paths:
        return []

    image_paths = [path for path in media_paths if path.suffix.lower() in ALLOWED_IMAGE_SUFFIXES]
    chosen_paths = image_paths if image_paths else media_paths

    samples: list[Sample] = []
    for path in chosen_paths:
        media_kind = _media_kind_for_path(path)
        if media_kind is None:
            continue
        samples.append(
            Sample(
                path=path,
                label=label,
                source=source_name,
                media_kind=media_kind,
                preferred_split=preferred_split,
            )
        )
    return samples


def _collect_from_class_dirs(
    real_dirs: list[Path],
    fake_dirs: list[Path],
    *,
    source_name: str,
    preferred_split: str | None = None,
) -> list[Sample]:
    samples: list[Sample] = []
    for real_dir in real_dirs:
        samples.extend(
            _collect_labeled_samples(
                real_dir,
                label=CLASS_TO_INDEX["training_real"],
                source_name=source_name,
                preferred_split=preferred_split,
            )
        )
    for fake_dir in fake_dirs:
        samples.extend(
            _collect_labeled_samples(
                fake_dir,
                label=CLASS_TO_INDEX["training_fake"],
                source_name=source_name,
                preferred_split=preferred_split,
            )
        )
    return samples


def _discover_kaggle_layout(dataset_dir: Path) -> list[Sample]:
    fake_dir = dataset_dir / "training_fake"
    real_dir = dataset_dir / "training_real"
    if fake_dir.exists() and real_dir.exists():
        return _collect_from_class_dirs([real_dir], [fake_dir], source_name=dataset_dir.name)
    return []


def _load_celeb_df_test_paths(dataset_dir: Path) -> set[str]:
    test_list_path = dataset_dir / "List_of_testing_videos.txt"
    if not test_list_path.exists():
        return set()

    resolved_paths: set[str] = set()
    for raw_line in test_list_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue

        tokens = line.split(None, 1)
        relative_path = tokens[1] if len(tokens) == 2 and tokens[0] in {"0", "1"} else line
        normalized = relative_path.replace("\\", "/").lstrip("./")
        if normalized:
            resolved_paths.add(normalized)

    return resolved_paths


def _discover_celeb_df_layout(dataset_dir: Path) -> list[Sample]:
    celeb_real_dir = dataset_dir / "Celeb-real"
    celeb_fake_dir = dataset_dir / "Celeb-synthesis"
    youtube_real_dir = dataset_dir / "YouTube-real"
    if celeb_real_dir.exists() and celeb_fake_dir.exists():
        official_test_paths = _load_celeb_df_test_paths(dataset_dir)
        real_dirs = [celeb_real_dir]
        if youtube_real_dir.exists():
            real_dirs.append(youtube_real_dir)

        samples: list[Sample] = []
        for label, directories in (
            (CLASS_TO_INDEX["training_real"], real_dirs),
            (CLASS_TO_INDEX["training_fake"], [celeb_fake_dir]),
        ):
            for directory in directories:
                for path in _iter_supported_media_files(directory):
                    media_kind = _media_kind_for_path(path)
                    if media_kind is None:
                        continue

                    relative_path = path.relative_to(dataset_dir).as_posix()
                    preferred_split = "test" if relative_path in official_test_paths else None
                    samples.append(
                        Sample(
                            path=path,
                            label=label,
                            source=dataset_dir.name,
                            media_kind=media_kind,
                            preferred_split=preferred_split,
                        )
                    )

        return samples
    return []


def _discover_faceforensics_layout(dataset_dir: Path) -> list[Sample]:
    original_dir = dataset_dir / "original_sequences"
    manipulated_dir = dataset_dir / "manipulated_sequences"
    if original_dir.exists() and manipulated_dir.exists():
        return _collect_from_class_dirs([original_dir], [manipulated_dir], source_name=dataset_dir.name)
    return []


def _normalize_predefined_split_name(name: str) -> str | None:
    normalized = name.lower()
    if normalized in {"train", "training"}:
        return "train"
    if normalized in {"val", "validation", "dev"}:
        return "val"
    if normalized in {"test", "testing"}:
        return "test"
    return None


def _discover_predefined_split_layout(dataset_dir: Path) -> list[Sample]:
    candidate_roots = [dataset_dir]
    candidate_roots.extend(path for path in dataset_dir.iterdir() if path.is_dir())

    for candidate_root in candidate_roots:
        split_dirs: dict[str, Path] = {}
        for path in candidate_root.iterdir():
            if not path.is_dir():
                continue
            split_name = _normalize_predefined_split_name(path.name)
            if split_name is not None:
                split_dirs[split_name] = path

        if not split_dirs:
            continue

        samples: list[Sample] = []
        for split_name, split_dir in split_dirs.items():
            real_dirs = [
                path
                for path in split_dir.iterdir()
                if path.is_dir() and path.name.lower() in GENERIC_REAL_DIR_NAMES
            ]
            fake_dirs = [
                path
                for path in split_dir.iterdir()
                if path.is_dir() and path.name.lower() in GENERIC_FAKE_DIR_NAMES
            ]
            if not real_dirs or not fake_dirs:
                continue
            samples.extend(
                _collect_from_class_dirs(
                    real_dirs,
                    fake_dirs,
                    source_name=dataset_dir.name,
                    preferred_split=split_name,
                )
            )

        if samples:
            return samples

    return []


def _discover_generic_two_class_layout(dataset_dir: Path) -> list[Sample]:
    real_dirs = [
        path
        for path in dataset_dir.iterdir()
        if path.is_dir() and path.name.lower() in GENERIC_REAL_DIR_NAMES
    ]
    fake_dirs = [
        path
        for path in dataset_dir.iterdir()
        if path.is_dir() and path.name.lower() in GENERIC_FAKE_DIR_NAMES
    ]
    if real_dirs and fake_dirs:
        return _collect_from_class_dirs(real_dirs, fake_dirs, source_name=dataset_dir.name)
    return []


def collect_samples(dataset_dirs: list[Path]) -> list[Sample]:
    discovered: list[Sample] = []
    seen_paths: set[str] = set()

    for dataset_dir in dataset_dirs:
        dataset_samples = (
            _discover_kaggle_layout(dataset_dir)
            or _discover_celeb_df_layout(dataset_dir)
            or _discover_faceforensics_layout(dataset_dir)
            or _discover_predefined_split_layout(dataset_dir)
            or _discover_generic_two_class_layout(dataset_dir)
        )
        if not dataset_samples:
            raise FileNotFoundError(
                "Unsupported dataset layout at "
                f"{dataset_dir}. Supported layouts include Kaggle image folders, "
                "Celeb-DF video roots, FaceForensics++ roots, predefined train/validation/test folders, "
                "or generic real/fake folders."
            )

        for sample in dataset_samples:
            resolved = str(sample.path.resolve())
            if resolved in seen_paths:
                continue
            seen_paths.add(resolved)
            discovered.append(sample)

    if not discovered:
        raise FileNotFoundError("No supported media files found in the configured dataset roots.")
    return discovered


def stratified_split(
    samples: list[Sample],
    *,
    val_ratio: float,
    test_ratio: float,
    seed: int,
) -> dict[str, list[Sample]]:
    if val_ratio + test_ratio >= 0.9:
        raise ValueError("Validation and test ratios are too large.")

    rng = np.random.default_rng(seed)
    grouped: dict[tuple[str, int], list[Sample]] = {}
    split_sets = {"train": [], "val": [], "test": []}
    flexible_samples: list[Sample] = []

    for sample in samples:
        if sample.preferred_split in split_sets:
            split_sets[sample.preferred_split].append(sample)
            continue
        flexible_samples.append(sample)

    for sample in flexible_samples:
        grouped.setdefault((sample.source, sample.label), []).append(sample)

    for group_samples in grouped.values():
        shuffled = group_samples.copy()
        rng.shuffle(shuffled)

        total = len(shuffled)
        if total == 1:
            split_sets["train"].extend(shuffled)
            continue

        val_count = int(round(total * val_ratio))
        test_count = int(round(total * test_ratio))
        if total >= 3:
            val_count = max(1, val_count)
            test_count = max(1, test_count)

        if val_count + test_count >= total:
            overflow = (val_count + test_count) - (total - 1)
            while overflow > 0 and (val_count > 0 or test_count > 0):
                if val_count >= test_count and val_count > 0:
                    val_count -= 1
                elif test_count > 0:
                    test_count -= 1
                overflow -= 1

        train_count = total - val_count - test_count

        split_sets["train"].extend(shuffled[:train_count])
        split_sets["val"].extend(shuffled[train_count : train_count + val_count])
        split_sets["test"].extend(shuffled[train_count + val_count : train_count + val_count + test_count])

    rng.shuffle(split_sets["train"])
    rng.shuffle(split_sets["val"])
    rng.shuffle(split_sets["test"])
    return split_sets


def build_model(image_size: tuple[int, int]) -> tuple[Sequential, tf.keras.Model]:
    return build_classifier(image_size, backbone_weights="imagenet")


def compile_model(model: Sequential, learning_rate: float) -> None:
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=CategoricalCrossentropy(label_smoothing=0.03),
        metrics=["accuracy"],
    )


def build_class_weights(samples: list[Sample]) -> dict[int, float]:
    counts = Counter(sample.label for sample in samples)
    total = sum(counts.values())
    num_classes = len(counts)
    return {label: total / (num_classes * count) for label, count in counts.items()}


def _sample_video_indices(
    frame_count: int,
    target_frames: int,
    *,
    rng: np.random.Generator | None,
    random_single_frame: bool,
) -> list[int]:
    if frame_count <= 0:
        return []

    target = max(1, min(target_frames, frame_count))
    if random_single_frame and target == 1 and rng is not None:
        return [int(rng.integers(0, frame_count))]

    indices = np.linspace(0, frame_count - 1, target, dtype=int).tolist()
    return sorted(set(int(index) for index in indices))


def _read_video_frames(
    path: Path,
    *,
    target_frames: int,
    rng: np.random.Generator | None,
    random_single_frame: bool,
) -> list[np.ndarray]:
    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        return []

    frames: list[np.ndarray] = []
    try:
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if frame_count > 0:
            for index in _sample_video_indices(
                frame_count,
                target_frames,
                rng=rng,
                random_single_frame=random_single_frame,
            ):
                capture.set(cv2.CAP_PROP_POS_FRAMES, index)
                ok, frame = capture.read()
                if ok and frame is not None:
                    frames.append(frame)
        else:
            while len(frames) < max(1, target_frames):
                ok, frame = capture.read()
                if not ok or frame is None:
                    break
                frames.append(frame)
                if random_single_frame:
                    break
    finally:
        capture.release()

    return frames


def load_media_frames(
    sample: Sample,
    *,
    video_frames: int,
    rng: np.random.Generator | None,
    random_video_frame: bool,
) -> list[np.ndarray]:
    if sample.media_kind == "image":
        image_bgr = cv2.imread(str(sample.path))
        return [image_bgr] if image_bgr is not None else []

    return _read_video_frames(
        sample.path,
        target_frames=max(1, video_frames),
        rng=rng,
        random_single_frame=random_video_frame,
    )


def predict_scores(
    model: Sequential,
    samples: list[Sample],
    *,
    image_size: tuple[int, int],
    batch_size: int,
    eval_video_frames: int,
    preprocess_mode: str,
    split_name: str | None = None,
    progress_every: int = 250,
) -> dict[str, Any]:
    raw_true_labels: list[int] = []
    raw_sources: list[str] = []
    raw_media_kinds: list[str] = []
    raw_evaluated_samples: list[Sample] = []
    raw_sample_face_detection_rates: list[float] = []
    sample_frame_scores: list[list[float]] = []
    pending_frames: list[np.ndarray] = []
    pending_sample_indices: list[int] = []
    started_at = time.perf_counter()
    label = split_name or "evaluation"

    def flush_pending_predictions() -> None:
        nonlocal pending_frames, pending_sample_indices
        if not pending_frames:
            return

        predictions = model.predict(
            np.stack(pending_frames, axis=0),
            batch_size=min(batch_size, len(pending_frames)),
            verbose=0,
        )
        for sample_index, frame_scores in zip(pending_sample_indices, predictions, strict=False):
            sample_frame_scores[sample_index].append(float(frame_scores[0]))

        pending_frames = []
        pending_sample_indices = []

    total_samples = len(samples)
    for sample_number, sample in enumerate(samples, start=1):
        target_frames = 1 if sample.media_kind == "image" else max(1, eval_video_frames)
        frames_bgr = load_media_frames(
            sample,
            video_frames=target_frames,
            rng=None,
            random_video_frame=False,
        )
        if not frames_bgr:
            continue

        sample_index = len(raw_evaluated_samples)
        raw_true_labels.append(sample.label)
        raw_sources.append(sample.source)
        raw_media_kinds.append(sample.media_kind)
        raw_evaluated_samples.append(sample)
        sample_frame_scores.append([])

        face_detected_count = 0
        for frame in frames_bgr:
            prepared, metadata = prepare_image_for_model(
                frame,
                image_size=image_size,
                prefer_face=True,
                preprocess_mode=preprocess_mode,
            )
            pending_frames.append(prepared)
            pending_sample_indices.append(sample_index)
            face_detected_count += int(metadata["face_detected"])
            if len(pending_frames) >= batch_size:
                flush_pending_predictions()

        raw_sample_face_detection_rates.append(face_detected_count / max(len(frames_bgr), 1))

        if sample_number % progress_every == 0 or sample_number == total_samples:
            elapsed_seconds = time.perf_counter() - started_at
            print(
                f"[{label}] Processed {sample_number}/{total_samples} samples "
                f"in {elapsed_seconds / 60:.1f}m"
            )

    flush_pending_predictions()

    fake_scores: list[float] = []
    true_labels: list[int] = []
    sources: list[str] = []
    media_kinds: list[str] = []
    evaluated_samples: list[Sample] = []
    sample_face_detection_rates: list[float] = []
    for sample_index, frame_scores in enumerate(sample_frame_scores):
        if not frame_scores:
            continue

        fake_scores.append(float(np.mean(frame_scores)))
        true_labels.append(raw_true_labels[sample_index])
        sources.append(raw_sources[sample_index])
        media_kinds.append(raw_media_kinds[sample_index])
        evaluated_samples.append(raw_evaluated_samples[sample_index])
        sample_face_detection_rates.append(raw_sample_face_detection_rates[sample_index])

    return {
        "samples": evaluated_samples,
        "true_labels": np.array(true_labels, dtype=np.int32),
        "fake_scores": np.array(fake_scores, dtype=np.float32),
        "sources": sources,
        "media_kinds": media_kinds,
        "face_detection_rate": round(float(np.mean(sample_face_detection_rates or [0.0])), 4),
    }


def compute_roc_auc(true_labels: np.ndarray, fake_scores: np.ndarray) -> float | None:
    positive_mask = true_labels == CLASS_TO_INDEX["training_fake"]
    negative_mask = true_labels == CLASS_TO_INDEX["training_real"]
    positive_count = int(np.sum(positive_mask))
    negative_count = int(np.sum(negative_mask))
    if positive_count == 0 or negative_count == 0:
        return None

    order = np.argsort(fake_scores, kind="mergesort")
    sorted_scores = fake_scores[order]
    ranks = np.zeros(len(fake_scores), dtype=np.float64)

    start = 0
    while start < len(sorted_scores):
        end = start
        while end + 1 < len(sorted_scores) and sorted_scores[end + 1] == sorted_scores[start]:
            end += 1
        average_rank = (start + end + 2) / 2.0
        ranks[order[start : end + 1]] = average_rank
        start = end + 1

    positive_rank_sum = float(np.sum(ranks[positive_mask]))
    auc = (
        positive_rank_sum
        - (positive_count * (positive_count + 1) / 2.0)
    ) / (positive_count * negative_count)
    return float(auc)


def compute_binary_metrics(
    true_labels: np.ndarray,
    fake_scores: np.ndarray,
    *,
    threshold: float,
) -> dict[str, Any]:
    predicted_fake = fake_scores >= threshold

    tp = int(np.sum((true_labels == 0) & predicted_fake))
    tn = int(np.sum((true_labels == 1) & (~predicted_fake)))
    fp = int(np.sum((true_labels == 1) & predicted_fake))
    fn = int(np.sum((true_labels == 0) & (~predicted_fake)))

    total = max(len(true_labels), 1)
    precision_fake = tp / max(tp + fp, 1)
    recall_fake = tp / max(tp + fn, 1)
    specificity_real = tn / max(tn + fp, 1)
    false_positive_rate_real = fp / max(fp + tn, 1)
    false_negative_rate_fake = fn / max(fn + tp, 1)
    accuracy = (tp + tn) / total
    f1_fake = (2 * precision_fake * recall_fake) / max(precision_fake + recall_fake, 1e-8)
    roc_auc_fake = compute_roc_auc(true_labels, fake_scores)

    return {
        "threshold": round(float(threshold), 4),
        "accuracy": round(float(accuracy), 4),
        "precision_fake": round(float(precision_fake), 4),
        "recall_fake": round(float(recall_fake), 4),
        "specificity_real": round(float(specificity_real), 4),
        "false_positive_rate_real": round(float(false_positive_rate_real), 4),
        "false_negative_rate_fake": round(float(false_negative_rate_fake), 4),
        "f1_fake": round(float(f1_fake), 4),
        "roc_auc_fake": round(float(roc_auc_fake), 4) if roc_auc_fake is not None else None,
        "confusion_matrix": [[tp, fn], [fp, tn]],
        "support": {
            "fake": int(np.sum(true_labels == 0)),
            "real": int(np.sum(true_labels == 1)),
        },
    }


def compute_group_metrics(
    true_labels: np.ndarray,
    fake_scores: np.ndarray,
    groups: list[str],
    *,
    threshold: float,
) -> dict[str, dict[str, Any]]:
    if len(true_labels) == 0 or not groups:
        return {}

    group_array = np.array(groups, dtype=object)
    metrics_by_group: dict[str, dict[str, Any]] = {}
    for group_name in sorted(set(groups)):
        mask = group_array == group_name
        metrics_by_group[group_name] = compute_binary_metrics(
            true_labels[mask],
            fake_scores[mask],
            threshold=threshold,
        )
    return metrics_by_group


def choose_threshold(
    true_labels: np.ndarray,
    fake_scores: np.ndarray,
    *,
    max_real_fpr: float,
) -> tuple[float, dict[str, Any]]:
    candidates = np.linspace(0.05, 0.95, 91)
    best_threshold = 0.5
    best_metrics = compute_binary_metrics(true_labels, fake_scores, threshold=0.5)
    best_score = -1.0

    constrained_candidates: list[tuple[float, dict[str, Any], float]] = []
    fallback_candidates: list[tuple[float, dict[str, Any], float]] = []

    for threshold in candidates:
        metrics = compute_binary_metrics(true_labels, fake_scores, threshold=float(threshold))
        score = (
            (0.45 * metrics["accuracy"])
            + (0.35 * metrics["f1_fake"])
            + (0.20 * metrics["specificity_real"])
        )
        fallback_candidates.append((float(threshold), metrics, score))
        if metrics["false_positive_rate_real"] <= max_real_fpr:
            constrained_candidates.append((float(threshold), metrics, score))

    search_pool = constrained_candidates if constrained_candidates else fallback_candidates
    for threshold, metrics, score in search_pool:
        if score > best_score:
            best_threshold = threshold
            best_metrics = metrics
            best_score = score

    return best_threshold, best_metrics


def collect_error_examples(
    samples: list[Sample],
    true_labels: np.ndarray,
    fake_scores: np.ndarray,
    *,
    threshold: float,
    limit: int = 10,
) -> dict[str, list[dict[str, Any]]]:
    predicted_fake = fake_scores >= threshold
    false_positives: list[dict[str, Any]] = []
    false_negatives: list[dict[str, Any]] = []

    for sample, true_label, fake_score, pred_fake in zip(samples, true_labels, fake_scores, predicted_fake):
        record = {
            "path": str(sample.path),
            "source": sample.source,
            "media_kind": sample.media_kind,
            "fake_score": round(float(fake_score), 4),
            "predicted_label": "training_fake" if pred_fake else "training_real",
        }
        if true_label == 1 and pred_fake:
            false_positives.append(record)
        elif true_label == 0 and not pred_fake:
            false_negatives.append(record)

    false_positives.sort(key=lambda item: item["fake_score"], reverse=True)
    false_negatives.sort(key=lambda item: item["fake_score"])

    return {
        "top_false_positives_real_as_fake": false_positives[:limit],
        "top_false_negatives_fake_as_real": false_negatives[:limit],
    }


def summarize_samples(samples: list[Sample]) -> dict[str, dict[str, int]]:
    summary: dict[str, dict[str, int]] = {}
    for sample in samples:
        record = summary.setdefault(
            sample.source,
            {"total": 0, "fake": 0, "real": 0, "images": 0, "videos": 0},
        )
        record["total"] += 1
        if sample.label == CLASS_TO_INDEX["training_fake"]:
            record["fake"] += 1
        else:
            record["real"] += 1
        if sample.media_kind == "video":
            record["videos"] += 1
        else:
            record["images"] += 1

    return {source: summary[source] for source in sorted(summary)}


def save_split_manifest(split_sets: dict[str, list[Sample]]) -> None:
    manifest = {
        split_name: [
            {
                "path": str(sample.path),
                "label": sample.label,
                "source": sample.source,
                "media_kind": sample.media_kind,
                "preferred_split": sample.preferred_split,
            }
            for sample in samples
        ]
        for split_name, samples in split_sets.items()
    }
    MODEL_SPLITS_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def build_metric_section(
    predictions: dict[str, Any],
    *,
    threshold: float,
) -> dict[str, Any]:
    return {
        **compute_binary_metrics(
            predictions["true_labels"],
            predictions["fake_scores"],
            threshold=threshold,
        ),
        "face_detection_rate": predictions["face_detection_rate"],
        "by_source": compute_group_metrics(
            predictions["true_labels"],
            predictions["fake_scores"],
            predictions["sources"],
            threshold=threshold,
        ),
        "by_media_kind": compute_group_metrics(
            predictions["true_labels"],
            predictions["fake_scores"],
            predictions["media_kinds"],
            threshold=threshold,
        ),
    }


def load_existing_preprocess_mode() -> str:
    if MODEL_META_PATH.exists():
        try:
            metadata = json.loads(MODEL_META_PATH.read_text(encoding="utf-8"))
            raw_mode = metadata.get("preprocess_mode")
            if isinstance(raw_mode, str) and raw_mode.strip():
                return raw_mode.strip()
        except Exception:
            pass
    return "legacy_0_1"


def main() -> None:
    args = parse_args()
    dataset_dirs = resolve_dataset_dirs(args.dataset_dir)
    if args.holdout_dataset_dir:
        holdout_dataset_dirs = resolve_dataset_dirs(
            args.holdout_dataset_dir,
            fallback_to_candidates=False,
            allow_empty=True,
        )
    else:
        holdout_dataset_dirs = _resolve_default_holdout_dataset_dirs(dataset_dirs)
    preprocess_mode = load_existing_preprocess_mode() if args.evaluate_current_model else args.preprocess_mode
    image_size = DEFAULT_IMG_SIZE
    MODEL_DIR.mkdir(exist_ok=True)

    np.random.seed(args.seed)
    tf.random.set_seed(args.seed)

    print("=" * 80)
    print("PixelProof training and evaluation pipeline")
    print("=" * 80)
    print("Training dataset roots:")
    for dataset_dir in dataset_dirs:
        print(f"  - {dataset_dir}")
    if holdout_dataset_dirs:
        print("Holdout dataset roots:")
        for dataset_dir in holdout_dataset_dirs:
            print(f"  - {dataset_dir}")
    print(f"Full model output: {MODEL_FULL_PATH}")
    print(f"Weights output: {MODEL_WEIGHTS_PATH}")
    print(f"Metadata output: {MODEL_META_PATH}")

    samples = collect_samples(dataset_dirs)
    holdout_samples = collect_samples(holdout_dataset_dirs) if holdout_dataset_dirs else []

    print("\nDiscovered training source breakdown:")
    print(json.dumps(summarize_samples(samples), indent=2))
    if holdout_samples:
        print("\nDiscovered holdout source breakdown:")
        print(json.dumps(summarize_samples(holdout_samples), indent=2))

    split_sets = stratified_split(
        samples,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio,
        seed=args.seed,
    )
    if holdout_samples:
        split_sets["holdout"] = holdout_samples
    save_split_manifest(split_sets)

    print("\nSplit sizes:")
    split_names = ["train", "val", "test"]
    if holdout_samples:
        split_names.append("holdout")
    for split_name in split_names:
        counts = Counter(sample.label for sample in split_sets[split_name])
        print(
            f"  {split_name}: {len(split_sets[split_name])} "
            f"(fake={counts.get(0, 0)}, real={counts.get(1, 0)})"
        )

    print("\nSplit source breakdown:")
    split_breakdown = {split_name: summarize_samples(split_sets[split_name]) for split_name in split_sets}
    print(json.dumps(split_breakdown, indent=2))

    if args.dry_run:
        print("\nDry run complete. No training or evaluation was executed.")
        print(f"Split manifest saved to: {MODEL_SPLITS_PATH}")
        print("=" * 80)
        return

    if args.evaluate_current_model:
        from predict import get_model, get_model_status

        eval_model = get_model()
        if eval_model is None:
            raise RuntimeError("Current backend model could not be loaded for evaluation.")
        model_status = get_model_status()
        print(f"\nEvaluating current backend model from source: {model_status['source']}")
        eval_model.save_weights(str(MODEL_WEIGHTS_PATH))
    else:
        train_sequence = FaceSequence(
            split_sets["train"],
            batch_size=args.batch_size,
            image_size=image_size,
            augment=True,
            shuffle=True,
            seed=args.seed,
            preprocess_mode=preprocess_mode,
            face_crop_probability=args.face_crop_probability,
        )
        val_sequence = FaceSequence(
            split_sets["val"],
            batch_size=args.batch_size,
            image_size=image_size,
            augment=False,
            shuffle=False,
            seed=args.seed,
            preprocess_mode=preprocess_mode,
            face_crop_probability=1.0,
        )

        model, backbone = build_model(image_size)
        compile_model(model, learning_rate=1e-3)
        class_weights = build_class_weights(split_sets["train"])

        callbacks = [
            EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True, verbose=1),
            ModelCheckpoint(
                str(MODEL_FULL_PATH),
                monitor="val_loss",
                save_best_only=True,
                save_weights_only=False,
                verbose=1,
            ),
            ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, verbose=1),
        ]

        if args.head_epochs > 0:
            print("\nTraining classifier head...")
            model.fit(
                train_sequence,
                epochs=args.head_epochs,
                validation_data=val_sequence,
                callbacks=callbacks,
                class_weight=class_weights,
                verbose=1,
            )

        if args.fine_tune_epochs > 0:
            print(f"\nFine-tuning last {args.unfreeze_last_n} MobileNetV2 layers...")
            for layer in backbone.layers[-args.unfreeze_last_n :]:
                layer.trainable = True

            compile_model(model, learning_rate=1e-5)
            model.fit(
                train_sequence,
                initial_epoch=args.head_epochs,
                epochs=args.head_epochs + args.fine_tune_epochs,
                validation_data=val_sequence,
                callbacks=callbacks,
                class_weight=class_weights,
                verbose=1,
            )

        eval_model = load_model(str(MODEL_FULL_PATH), compile=False)
        compile_model(eval_model, learning_rate=1e-5)
        eval_model.save_weights(str(MODEL_WEIGHTS_PATH))

    validation_predictions = predict_scores(
        eval_model,
        split_sets["val"],
        image_size=image_size,
        batch_size=args.batch_size,
        eval_video_frames=args.eval_video_frames,
        preprocess_mode=preprocess_mode,
        split_name="validation",
    )
    decision_threshold, validation_metrics = choose_threshold(
        validation_predictions["true_labels"],
        validation_predictions["fake_scores"],
        max_real_fpr=args.max_real_fpr,
    )

    test_predictions = predict_scores(
        eval_model,
        split_sets["test"],
        image_size=image_size,
        batch_size=args.batch_size,
        eval_video_frames=args.eval_video_frames,
        preprocess_mode=preprocess_mode,
        split_name="test",
    )
    error_examples = collect_error_examples(
        test_predictions["samples"],
        test_predictions["true_labels"],
        test_predictions["fake_scores"],
        threshold=decision_threshold,
    )
    holdout_predictions: dict[str, Any] | None = None
    holdout_error_examples: dict[str, list[dict[str, Any]]] | None = None
    if holdout_samples:
        holdout_predictions = predict_scores(
            eval_model,
            split_sets["holdout"],
            image_size=image_size,
            batch_size=args.batch_size,
            eval_video_frames=args.eval_video_frames,
            preprocess_mode=preprocess_mode,
            split_name="holdout",
        )
        holdout_error_examples = collect_error_examples(
            holdout_predictions["samples"],
            holdout_predictions["true_labels"],
            holdout_predictions["fake_scores"],
            threshold=decision_threshold,
        )

    metadata = {
        "dataset_roots": [str(path) for path in dataset_dirs],
        "dataset_sources": summarize_samples(samples),
        "holdout_dataset_roots": [str(path) for path in holdout_dataset_dirs],
        "holdout_dataset_sources": summarize_samples(holdout_samples),
        "class_indices": CLASS_TO_INDEX,
        "image_size": list(image_size),
        "preprocess_mode": preprocess_mode,
        "batch_size": args.batch_size,
        "head_epochs": args.head_epochs,
        "fine_tune_epochs": args.fine_tune_epochs,
        "unfreeze_last_n": args.unfreeze_last_n,
        "eval_video_frames": args.eval_video_frames,
        "face_crop_probability": args.face_crop_probability,
        "artifact_source": "current_backend_model" if args.evaluate_current_model else "new_training_run",
        "split_counts": {name: len(items) for name, items in split_sets.items()},
        "split_breakdown": split_breakdown,
        "decision_threshold": round(float(decision_threshold), 4),
        "threshold_objective": {
            "priority": "favor overall accuracy and fake-class F1 while keeping real false positives controlled",
            "max_real_fpr_target": args.max_real_fpr,
        },
        "validation": build_metric_section(
            validation_predictions,
            threshold=decision_threshold,
        ),
        "test": build_metric_section(
            test_predictions,
            threshold=decision_threshold,
        ),
        "error_examples": error_examples,
    }
    if holdout_predictions is not None and holdout_error_examples is not None:
        metadata["holdout"] = build_metric_section(
            holdout_predictions,
            threshold=decision_threshold,
        )
        metadata["holdout_error_examples"] = holdout_error_examples
    MODEL_META_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print("\nValidation metrics at chosen threshold:")
    print(json.dumps(metadata["validation"], indent=2))
    print("\nTest metrics at chosen threshold:")
    print(json.dumps(metadata["test"], indent=2))
    if "holdout" in metadata:
        print("\nHoldout metrics at chosen threshold:")
        print(json.dumps(metadata["holdout"], indent=2))
    print(f"\nChosen fake threshold: {decision_threshold:.4f}")
    print(f"Split manifest saved to: {MODEL_SPLITS_PATH}")
    print(f"Metadata saved to: {MODEL_META_PATH}")
    print(f"Weights saved to: {MODEL_WEIGHTS_PATH}")
    print("=" * 80)


if __name__ == "__main__":
    main()
