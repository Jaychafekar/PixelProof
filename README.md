# PixelProof

PixelProof is a deployable deepfake detection product built with:

- `FastAPI` for the backend API
- `TensorFlow / Keras` for the classifier
- `React + Vite` for the frontend
- `SQLite` for persistent analysis history

## Product Scope

- Image analysis for `JPG`, `JPEG`, `PNG`, `WEBP`
- Video analysis for `MP4`, `MOV`, `WEBM`, `AVI`, `MKV`
- Video support works through sampled-frame aggregation
- Structured JSON reports with confidence, timing, and scan metadata
- Server-signed JSON reports with local integrity verification
- In-app signed report verification for previously exported report bundles
- Visible `Verified Real` watermark export for authentic image results
- Persistent SQLite-backed history with report reopening and CSV export
- Startup model warm-up and basic `/analyze` rate limiting for live deployments
- Browser security hardening with CSP, permissions policy, trusted hosts, and HTTPS-ready HSTS
- Media-specific promoted checkpoints so images and videos can use different tuned model artifacts

## Backend

Use Python `3.10`.

```powershell
cd code/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend docs:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/verify-report`
- `http://127.0.0.1:8000/analyses`

Admin CLI examples:

```powershell
cd code/backend
venv310\Scripts\python.exe admin_cli.py status
venv310\Scripts\python.exe admin_cli.py analyze ..\data\real_and_fake_face\training_real\real_00001.jpg
venv310\Scripts\python.exe admin_cli.py benchmark ..\data\real_and_fake_face\training_real\real_00001.jpg --runs 3
venv310\Scripts\python.exe admin_cli.py batch-eval ..\data\real_and_fake_face
```

## Frontend

```powershell
cd code/frontend
npm install
npm run dev
```

Frontend app:

- `http://localhost:5173`

## Deployment

PixelProof now ships with container-ready deployment files:

- `Dockerfile`
- `.dockerignore`
- `.env.example`
- `compose.yaml`

Build and run with Docker:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Important production settings:

- Set `PIXELPROOF_REPORT_SIGNING_SECRET` to a strong random value.
- Optionally set `PIXELPROOF_IMAGE_MODEL_DIR` and `PIXELPROOF_VIDEO_MODEL_DIR` if you want to pin deployment to promoted image/video checkpoints explicitly.
- Set `PIXELPROOF_CORS_ORIGINS` to your deployed frontend origin.
- Set `PIXELPROOF_TRUSTED_HOSTS` to your deployed hostname(s).
- Keep `PIXELPROOF_DATABASE_PATH` on a persistent volume such as `/data/pixelproof.db`.
- Keep `PIXELPROOF_WARMUP_ON_STARTUP=true` so the first user request is faster after a restart.
- Tune `PIXELPROOF_ANALYZE_RATE_LIMIT_COUNT` and `PIXELPROOF_ANALYZE_RATE_LIMIT_WINDOW_SECONDS` for your expected traffic.
- Keep `PIXELPROOF_MAX_VIDEO_DURATION_SECONDS` low enough to protect latency for public uploads.
- Keep `PIXELPROOF_ENABLE_CSP=true` and use `PIXELPROOF_CSP_CONNECT_SRC` if your frontend needs to call a separate API origin.
- Keep `PIXELPROOF_ENABLE_HSTS=true` once the site is running behind HTTPS.

The backend will refuse to start in `production` mode if the default signing secret is still in use.

`GET /health` now exposes warm-up status, request protection settings, and upload/video limits, which makes it easier to confirm a deployment is ready before sharing it with users.

Example hosting targets:

- `Render` if you want the simplest web-service deployment
- `Railway` if you want easy env var and volume management
- a small `Ubuntu VPS` if you want full control over Docker and persistent storage

## Submission Packaging

To create a clean ZIP archive from tracked project files only:

```powershell
.\prepare_submission.ps1
```

By default this creates `dist\PixelProof-submission.zip` from the current `HEAD`, which keeps
logs, datasets, virtual environments, and other local machine files out of the hand-in package.

## Retraining

The training pipeline now includes:

- face-aware preprocessing
- source-aware stratified `train / val / test` splits
- support for datasets that already ship with predefined `train / validation / test` folders
- support for both image datasets and video-first dataset roots
- threshold selection aimed at reducing false positives on real images
- saved evaluation metadata, source breakdowns, ROC-AUC, and error examples
- export of a backend-compatible `deepfake_detection_model.weights.h5`

```powershell
cd code/backend
venv310\Scripts\python.exe ..\training\train_simple.py
```

When run with no `--dataset-dir` flags, the trainer now uses:

- `code/data/archive1`
- `code/data/Celeb-DF` if it exists

If `code/data/real_and_fake_face` is present and not part of the training roots, it is used automatically as an external holdout dataset.

- `archive1` keeps its built-in `train / validation / test` boundaries instead of being reshuffled.
- `Celeb-DF` honors its official `List_of_testing_videos.txt` split when that file is present.

Output files:

- `code/backend/model/deepfake_detection_model.h5`
- `code/backend/model/deepfake_detection_model.weights.h5`
- `code/backend/model/deepfake_detection_model.meta.json`
- `code/backend/model/deepfake_detection_splits.json`

To evaluate the current backend model without retraining:

```powershell
cd code/backend
venv310\Scripts\python.exe ..\training\train_simple.py --evaluate-current-model
```

Or forward training arguments through the admin CLI:

```powershell
cd code/backend
venv310\Scripts\python.exe admin_cli.py train -- --evaluate-current-model
```

To combine multiple dataset roots:

```powershell
cd code/backend
venv310\Scripts\python.exe ..\training\train_simple.py `
  --dataset-dir ..\data\real_and_fake_face `
  --dataset-dir C:\datasets\Celeb-DF `
  --dataset-dir C:\datasets\FaceForensics++
```

To train on one set and score against a separate holdout dataset:

```powershell
cd code/backend
venv310\Scripts\python.exe ..\training\train_simple.py `
  --dataset-dir C:\datasets\FaceForensics++ `
  --holdout-dataset-dir C:\datasets\Celeb-DF
```

To inspect downloaded datasets before training:

```powershell
cd code/backend
venv310\Scripts\python.exe ..\training\train_simple.py `
  --dataset-dir C:\datasets\FaceForensics++ `
  --holdout-dataset-dir C:\datasets\Celeb-DF `
  --dry-run
```

Supported dataset layouts:

- Kaggle-style image folders with `training_real/` and `training_fake/`
- predefined split roots such as `train/real`, `train/fake`, `validation/real`, `validation/fake`, `test/real`, `test/fake`
- `Celeb-DF` roots with `Celeb-real/`, `Celeb-synthesis/`, and optional `YouTube-real/`
- `FaceForensics++` roots with `original_sequences/` and `manipulated_sequences/`
- generic `real/` and `fake/` style folders

## Notes

- The repo still contains a compatibility `.h5` model file for older loading paths.
- The backend now loads a shared classifier architecture and prefers `.weights.h5` artifacts first.
- The backend uses metadata-driven thresholding to avoid overcalling fake on real images.
- Analysis responses now include an HMAC-signed report bundle that can be checked later with `POST /verify-report`.
- Analysis history is persisted in SQLite without retaining uploaded media files themselves.
- The strongest next step is cross-dataset training plus holdout evaluation on better sources like `FaceForensics++` and `Celeb-DF`.
