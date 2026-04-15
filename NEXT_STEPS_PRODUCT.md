# PixelProof Product Roadmap

## Current Product Position

PixelProof is now a working deepfake-detection product with:

- image upload and analysis
- short-video upload and analysis
- confidence scores
- signed result reports
- report verification endpoint
- in-app report verification page
- persistent SQLite analysis history
- admin CLI for training, evaluation, benchmarking, and verification

The current live model is trained on:

- `archive1` for image-heavy data
- `Celeb-DF` for video data

## Priority 1: Submission And Deployment

These items should be finished first:

- add a fixed `demo_samples` folder on your machine for repeatable demos
- benchmark short-video latency on at least `3-5` real clips
- backend warm-up on startup is now in place; verify it through `/health` after deployment
- set a strong `PIXELPROOF_REPORT_SIGNING_SECRET`
- set final `PIXELPROOF_CORS_ORIGINS` and `PIXELPROOF_TRUSTED_HOSTS`
- deploy with persistent database storage
- write a short limitations section for the dissertation

## Priority 2: Product Quality

These upgrades will improve the actual user experience:

- separate thresholds for image and video analysis
- better warnings for:
  - no face detected
  - multiple faces
  - very low-quality uploads
  - very short videos
- batch upload support in the web UI
- report download directly from history items
- filterable history page
- clearer result explanations for non-technical users

## Priority 3: Model Quality

These are the best next technical improvements:

- add `FaceForensics++` as another structured video dataset
- extract and train on more real video frames from multiple sources
- tune image and video scoring separately
- create a dedicated validation set for threshold tuning
- track metrics per source and per media type in one place
- add robustness evaluation for compression and lighting changes

## Priority 4: Deployment Readiness

To make it more production-safe:

- add user authentication for private analysis history
- move uploaded media handling to managed object storage when deployed
- add request logging and error monitoring
- basic in-memory rate limiting is now in place; upgrade later to proxy or Redis-backed rate limiting for multi-instance deployments
- add automated health checks and smoke tests
- add database backup/export support

## Best Platforms To Launch On

If you want PixelProof online for real users, the best order is:

1. `Render` for the fastest first public deployment
2. `Railway` if you want easier service variables and persistent volume setup
3. `Docker on a VPS` if you want the most control over cost, logs, and scaling

For all three, keep:

- one backend service
- one persistent volume for `pixelproof.db`
- one real domain
- TLS/HTTPS enabled
- a strong report signing secret

## Can We Add Voice?

Yes, but it should be added as a separate phase, not rushed into the current submission.

The best voice-related additions are:

- synthetic speech detection
- speaker verification
- lip-sync mismatch detection for videos
- audio tampering detection

## Recommendation On Voice

For this submission:

- keep PixelProof focused on image and video deepfake detection
- describe voice as a planned multimodal extension

For the next version:

- add an `audio forensic module`
- combine face, audio, and lip-sync evidence into one final risk score

That would make PixelProof a much stronger multimodal authenticity product.

## Best Next Feature Set

If time allows, this is the best order:

1. startup warm-up
2. video benchmarking
3. better upload warnings
4. report download from history items
5. batch upload support
6. image/video threshold separation
7. user accounts with private history
8. FaceForensics++ integration
9. voice and lip-sync module

## Dissertation Framing

A strong way to describe the product is:

`PixelProof is a web-based deepfake detection and authenticity platform that analyzes facial images and short-form videos, stores signed forensic results, and supports iterative model evaluation through a reproducible backend training pipeline.`

## Final Honest Position

PixelProof is now good enough to present as a real product, not just a one-screen prototype. The biggest strengths are:

- full stack workflow
- mixed image and video handling
- signed results
- persistent history
- retrainable pipeline

The biggest remaining weaknesses are:

- dataset shift across very different sources
- cold-start latency
- limited production hardening
- no audio or lip-sync evidence yet
