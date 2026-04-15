# PixelProof Security Showcase

## Security Position

PixelProof is not only an AI model demo. It is a full-stack web application with security controls across:

- frontend behavior
- backend API handling
- data storage
- report integrity
- deployment configuration

This is the strongest way to present it:

`PixelProof combines AI-based media analysis with practical application security controls so the platform is not only functional, but also safer and more trustworthy to operate.`

## Security Controls Already Implemented

### 1. Upload validation and abuse reduction

Implemented in the backend and frontend:

- strict allow-list for image and video extensions and MIME types
- max upload size limit
- short-video duration limit
- basic request rate limiting on `/analyze`

Why this matters:

- reduces accidental misuse
- narrows attack surface
- protects the model pipeline from oversized or abusive requests

Code references:

- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:66)
- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:115)
- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:257)
- [predict.py](C:/Users/JAY/Desktop/PixelProof/code/backend/predict.py:449)
- [AnalyzePage.tsx](C:/Users/JAY/Desktop/PixelProof/code/frontend/public/src/pages/AnalyzePage.tsx:64)

### 2. Browser security hardening

Implemented through response headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`
- `Content-Security-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` when deployed behind HTTPS

Why this matters:

- reduces clickjacking risk
- reduces MIME confusion
- limits browser features that the app does not need
- helps prevent unsafe third-party script or resource loading
- strengthens the browser-side security story for a full-stack application

Code references:

- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:145)

### 3. Origin and host controls

Implemented through deployment configuration:

- configurable CORS origin list
- trusted host enforcement
- production guard against default signing secret use

Why this matters:

- prevents unsafe cross-origin defaults in production
- reduces host-header abuse
- forces secret management before public deployment

Code references:

- [config.py](C:/Users/JAY/Desktop/PixelProof/code/backend/config.py:89)
- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:58)
- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:186)

### 4. Privacy-aware media handling

Implemented in the processing flow:

- raw uploads are analyzed transiently
- temporary video files are deleted after processing
- analysis history stores metadata and signed results, not the raw uploaded media itself
- SHA-256 of uploaded files is stored for traceability

Why this matters:

- limits retained sensitive data
- reduces privacy risk
- supports auditability without keeping all user media on disk

Code references:

- [predict.py](C:/Users/JAY/Desktop/PixelProof/code/backend/predict.py:437)
- [predict.py](C:/Users/JAY/Desktop/PixelProof/code/backend/predict.py:518)
- [storage.py](C:/Users/JAY/Desktop/PixelProof/code/backend/storage.py:38)
- [storage.py](C:/Users/JAY/Desktop/PixelProof/code/backend/storage.py:79)

### 5. Integrity and provenance controls

Implemented through signed reports:

- server-side HMAC-signed result reports
- report verification endpoint
- in-app report verification page

Why this matters:

- supports authenticity and audit workflows
- helps detect tampering with stored/exported reports
- gives the project a stronger cybersecurity and provenance angle

Code references:

- [predict.py](C:/Users/JAY/Desktop/PixelProof/code/backend/predict.py:36)
- [predict.py](C:/Users/JAY/Desktop/PixelProof/code/backend/predict.py:78)
- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:291)
- [VerifyReportPage.tsx](C:/Users/JAY/Desktop/PixelProof/code/frontend/public/src/pages/VerifyReportPage.tsx:1)

### 6. Operational resilience

Implemented for safer deployment behavior:

- startup model warm-up
- health endpoint exposing protection settings
- SQLite storage readiness checks

Why this matters:

- reduces cold-start surprises
- gives you a cleaner operations story
- makes it easier to prove the service is healthy before exposing it

Code references:

- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:181)
- [app.py](C:/Users/JAY/Desktop/PixelProof/code/backend/app.py:220)

## What Is Still Missing For Enterprise-Level Security

Be honest about this in front of your supervisor. PixelProof is much stronger now, but it is not yet a finished enterprise security platform.

Main remaining gaps:

- no authentication or user accounts yet
- no role-based access control
- no Redis or gateway-backed distributed rate limiting
- no malware scanning for uploaded files
- no SIEM, audit log pipeline, or alerting system
- no object storage isolation for large deployments
- no secret rotation or key management service
- no formal penetration test report

The correct framing is:

`PixelProof implements meaningful web-application and provenance-oriented security controls, while leaving enterprise identity, distributed protection, and advanced monitoring as future production hardening work.`

## How To Showcase Security To Your Supervisor

Use this short demo flow.

### Step 1. Show the health endpoint

Open:

- `http://127.0.0.1:8000/health`

Explain:

- warm-up status
- upload limits
- video duration limits
- rate limiting settings
- browser security settings
- storage readiness

### Step 2. Show safe upload handling

Test:

- upload a valid image
- upload a valid short video
- try an unsupported file type
- mention that large files and long videos are rejected

Talking point:

`The platform uses allow-listed media handling rather than accepting arbitrary uploads.`

### Step 3. Show report integrity

Demo:

1. analyze a file
2. download the signed report
3. open the `Verify Report` page
4. re-upload the report
5. show that the report verifies successfully

Talking point:

`This adds a traceability layer beyond simple prediction output.`

### Step 4. Show browser-level security

Use browser DevTools or PowerShell and show response headers.

PowerShell example:

```powershell
(Invoke-WebRequest -Uri http://127.0.0.1:8000 -UseBasicParsing).Headers
```

Point out:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Permissions-Policy`
- `Referrer-Policy`

### Step 5. Show privacy-aware storage

Explain:

- uploaded files are not kept as raw media in the history database
- temporary video files are removed after processing
- the database stores metadata, scores, signed reports, and file hash

Talking point:

`The system preserves traceability without retaining every uploaded media file in persistent storage.`

## How To Test Security Features

### Quick checklist

- `Unsupported file type rejected`
- `Oversized file rejected`
- `Long video rejected`
- `Signed report verifies successfully`
- `Tampered report fails verification`
- `Security headers visible in response`
- `Production mode fails if default signing secret is used`
- `Rate limiting can block repeated requests when enabled`

### Easy tampered-report test

1. Download a signed report.
2. Open the JSON file.
3. Change one field such as the label or confidence.
4. Save it.
5. Re-upload it in the `Verify Report` page.

Expected result:

- verification should fail

This is one of the best supervisor-friendly security demonstrations in the project.

## Best Cybersecurity Talking Points

Use these lines in your viva or demonstration:

- `PixelProof does not only classify media; it also protects the surrounding workflow with upload controls, host/origin restrictions, secure headers, and signed report verification.`
- `The product reduces retained sensitive data by storing report metadata and hashes rather than persisting raw uploaded media.`
- `The browser-facing side is hardened with CSP and related headers, while the backend is protected with validation, limits, and configurable deployment controls.`
- `The provenance workflow is a key security differentiator because exported analysis reports can later be re-verified for integrity.`

## Strong Honest Summary

`PixelProof demonstrates a security-aware full-stack AI application. It includes practical controls at the browser, API, storage, and provenance layers, while clearly identifying authentication, distributed protection, and advanced monitoring as future production-security upgrades.`
