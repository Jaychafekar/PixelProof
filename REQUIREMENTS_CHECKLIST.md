# PixelProof Requirements Checklist

Source document:
- `C:\Users\JAY\Desktop\Final Year Project\project\Deepfake_Detection_PPRS.pdf`

Last reconstruction date:
- `2026-04-14`

## Current status summary

This checklist maps the PPRS requirements against the current repository state.

Legend:
- `Done`: implemented and verified in the repo
- `Partial`: some coverage exists, but the requirement is not fully satisfied
- `Missing`: not implemented yet or not evidenced strongly enough

## Aims and objectives

| Requirement | Status | Notes |
| --- | --- | --- |
| End-to-end deepfake detection pipeline for images/videos | Done | Backend accepts images and short videos, runs inference, and returns structured results. |
| Achieve >= 90% ROC-AUC on benchmark datasets | Missing | Current saved metrics are far below target. Validation ROC-AUC is about `0.5312`, test is about `0.5687`, and holdout is about `0.5319`. |
| Implement a prevention/provenance feature like watermarking | Done | Implemented as signed analysis reports and verification, not watermarking. |
| Build a web interface for uploads and results display | Done | React frontend exists and is wired into the backend build. |
| Document dataset handling, training, and ethical considerations | Partial | Training and dataset handling are documented better now; ethics are mentioned in product copy but not yet in a dedicated formal section for submission use. |

## Functional requirements

| Requirement | Status | Notes |
| --- | --- | --- |
| Upload image/video and get Real/Fake result with confidence score | Done | Verified for image and implemented for short-form video. |
| Batch evaluation on test set | Partial | Training pipeline evaluates validation, test, and optional holdout sets, but this is not exposed as a separate simple operator-facing command or UI feature. |
| Watermark or signed result report for verified-real media | Partial | Signed result reports are implemented for all analyses. Watermarking is not implemented, and reports are not limited only to verified-real outputs. |
| Admin CLI for training and validation | Done | `train_simple.py` supports training, dry runs, evaluation of the current model, and holdout testing. |

## Non-functional requirements

| Requirement | Status | Notes |
| --- | --- | --- |
| Inference latency <= 3s for images, <= 10s for short videos | Partial | A live image test completed in about `2373 ms`. Short-video timing still needs a measured benchmark pass. |
| Reproducibility with fixed seeds and documented dependencies | Partial | Seeds are set in training and dependencies are documented. A fuller reproducibility note for environment, dataset versions, and exact commands would still help. |
| Privacy and security for uploaded content | Partial | Files are processed transiently and browser history is local, but CORS is still wide open and the signing secret still has a development default. |
| Usable web interface with clear feedback | Done | Upload, results, history, and API docs flows exist and are working. |

## Tech stack alignment

| PPRS item | Current repo reality | Status |
| --- | --- | --- |
| Flask | FastAPI | Needs update in report/spec |
| SQLite | Browser local storage for history, no database in core app flow | Needs update in report/spec |
| Python, TensorFlow/Keras, OpenCV, HTML/CSS/JS, GitHub | Present | Aligned |

## Verified during recovery

- Production frontend build completes successfully.
- Backend serves `/`, `/health`, and frontend asset paths successfully.
- Image analysis request returns `200 OK` and a signed JSON report.
- Model loads from `deepfake_detection_model.weights.h5`.

## Highest-priority gaps

1. Model quality is the biggest gap against the PPRS because the ROC-AUC target is not met.
2. Security hardening is still needed before calling the app production-ready.
3. The written report/spec should be updated to match the actual implementation stack.
4. Short-video latency should be measured and recorded.
5. Ethical considerations should be written up in a cleaner submission-ready form.

## Recommended next tasks

1. Create a submission-ready requirement traceability table from this checklist.
2. Add a simple benchmark script or documented test procedure for image and video latency.
3. Harden backend configuration:
   - configurable CORS origins
   - non-default signing secret for non-dev use
4. Improve model training with better datasets and stronger holdout evaluation.
5. Update project documentation so it says `FastAPI` instead of `Flask` and reflects the real storage/provenance design.

## Likely "work in progress" area before the restart

Based on the repo state and recovery checks, the active thread appears to have been:
- compare the PPRS requirements against the implemented repo
- identify what is complete, partial, and missing
- decide the next fixes starting from the highest-value gaps
