# PixelProof Code Layout

## Folders

- `backend/` FastAPI API, inference code, model artifacts
- `frontend/` React + Vite product UI
- `training/` model training scripts
- `data/` local datasets used for experimentation and retraining

## Backend Model Loading Order

1. `backend/model/deepfake_detection_model.weights.h5`
2. `backend/model/deepfake_detection_model.h5`
3. `backend/models/...` fallback if present

## Training

Run the compatible trainer from the backend directory:

```powershell
venv310\Scripts\python.exe ..\training\train_simple.py
```

By default, the trainer now merges:

- `data/archive1`
- `data/Celeb-DF` when present

If `data/real_and_fake_face` is present and not part of the training roots, it is used automatically as an external holdout dataset.

- `archive1` keeps its predefined `train / validation / test` folders.
- `Celeb-DF` honors `List_of_testing_videos.txt` for its official test set when that file exists.

You can also combine multiple dataset roots:

```powershell
venv310\Scripts\python.exe ..\training\train_simple.py `
  --dataset-dir ..\data\real_and_fake_face `
  --dataset-dir C:\datasets\Celeb-DF `
  --dataset-dir C:\datasets\FaceForensics++
```

Or keep one dataset only for holdout scoring:

```powershell
venv310\Scripts\python.exe ..\training\train_simple.py `
  --dataset-dir C:\datasets\FaceForensics++ `
  --holdout-dataset-dir C:\datasets\Celeb-DF
```

To validate dataset structure without training:

```powershell
venv310\Scripts\python.exe ..\training\train_simple.py `
  --dataset-dir C:\datasets\FaceForensics++ `
  --holdout-dataset-dir C:\datasets\Celeb-DF `
  --dry-run
```

Supported dataset layouts:

- `training_real/` and `training_fake/`
- predefined split folders like `train/real`, `validation/fake`, and `test/real`
- `Celeb-real/`, `Celeb-synthesis/`, optional `YouTube-real/`
- `original_sequences/` and `manipulated_sequences/`
- generic `real/` and `fake/`

## API Endpoints

- `GET /`
- `GET /health`
- `POST /analyze`
- `POST /verify-report`
- `GET /analyses`
- `GET /analyses/{analysis_id}`
- `DELETE /analyses/{analysis_id}`

Analysis responses now include a signed report bundle for integrity checks, SQLite-backed history records for persistence, and training metadata that records ROC-AUC alongside thresholded metrics.

## Admin CLI

Run from `backend/`:

```powershell
venv310\Scripts\python.exe admin_cli.py status
venv310\Scripts\python.exe admin_cli.py analyze ..\data\real_and_fake_face\training_real\real_00001.jpg
venv310\Scripts\python.exe admin_cli.py benchmark ..\data\real_and_fake_face\training_real\real_00001.jpg --runs 3
venv310\Scripts\python.exe admin_cli.py batch-eval ..\data\real_and_fake_face
venv310\Scripts\python.exe admin_cli.py train -- --evaluate-current-model
```

## Deployment Notes

- The root `Dockerfile` builds the frontend and serves it from the FastAPI backend.
- Persistent analysis history is stored in SQLite at `PIXELPROOF_DATABASE_PATH`.
- Use the root `.env.example` and `compose.yaml` as the starting point for deployment.
