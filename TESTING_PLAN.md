# PixelProof Testing Plan

## Goal

Use this plan to test PixelProof with media that was not used in training, so the final submission demo is honest and repeatable.

## Current Model Snapshot

- Active backend threshold: `0.64`
- Mixed-media training roots:
  - `code/data/archive1`
  - `code/data/Celeb-DF`
- External holdout:
  - `code/data/real_and_fake_face`

Live backend metrics from the current model:

- Overall test accuracy: `69.65%`
- Overall test F1: `0.6633`
- Overall test ROC-AUC: `0.7772`
- Video test accuracy: `67.67%`
- Video test F1: `0.7208`
- Video test ROC-AUC: `0.7530`

## Recommended Test Folder

Create a small local folder for repeatable testing:

```text
demo_samples/
  image_real_01.jpg
  image_real_02.jpg
  image_fake_01.jpg
  image_fake_02.jpg
  video_real_01.mp4
  video_real_02.mp4
  video_fake_01.mp4
  video_fake_02.mp4
```

The best test set is:

- `5` real images
- `5` fake images
- `3` real short videos
- `3` fake short videos

## What To Use

Good test media:

- your own selfie photos or webcam images
- short real talking-head videos from your phone
- celebrity interview clips with one visible face
- AI-generated face images from public tools
- known deepfake examples from public demos or your datasets

Avoid for the main demo:

- group videos with many faces
- videos with tiny faces
- heavy memes with text overlays
- very dark clips
- very long videos
- shaky clips where the face is barely visible

## Website Testing

1. Start the backend and frontend.
2. Open the Analyze page.
3. Upload one real image.
4. Record the label, confidence, and processing time.
5. Upload one fake image.
6. Upload one real short video.
7. Upload one fake short video.
8. Open History and confirm the scans were saved.
9. Use Verify Report to show signed-result validation if needed.

## CLI Testing

Run single-file checks:

```powershell
cd code\backend
venv310\Scripts\python.exe admin_cli.py analyze "C:\path\to\image.jpg"
venv310\Scripts\python.exe admin_cli.py analyze "C:\path\to\video.mp4"
```

Benchmark one sample several times:

```powershell
cd code\backend
venv310\Scripts\python.exe admin_cli.py benchmark "C:\path\to\image.jpg" --runs 3
```

## Random Media Testing

To show the product with random unseen content:

- collect media from outside `code/data`
- mix sources from your phone, YouTube clips, and AI-generated outputs
- keep videos short, ideally `5-15` seconds
- test at least one item that looks difficult or borderline

When presenting random tests, say clearly:

- the media is unseen by the model
- the result is forensic guidance, not legal proof
- confidence can change with face visibility, compression, and lighting

## Result Sheet

Use a simple table while testing:

| File | Expected | Predicted | Confidence | Media Type | Notes |
|---|---|---|---:|---|---|
| image_real_01.jpg | Real |  |  | image |  |
| image_fake_01.jpg | Fake |  |  | image |  |
| video_real_01.mp4 | Real |  |  | video |  |
| video_fake_01.mp4 | Fake |  |  | video |  |

## Best Final Demo Flow

1. Show one real image classified as `Real`.
2. Show one fake image classified as `Fake`.
3. Show one real short video.
4. Show one fake short video.
5. Open the stored history.
6. Show the signed report and verification endpoint.

## Important Talking Points

- Image support is strong and fast after warm-up.
- Video support is implemented as sampled-frame aggregation.
- The current model supports both images and short-form videos.
- The product stores analysis history in SQLite and returns signed reports.
- The biggest remaining challenge is cross-dataset generalization on older image-only sources.
