from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from predict import predict_from_bytes
from config import MAX_UPLOAD_MB
from typing import Dict, Any

app = FastAPI(title="PixelProof API")

# Allow React frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # for demo (later restrict)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root() -> Dict[str, str]:
    return {"status": "ok", "message": "PixelProof backend running"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)) -> Dict[str, Any]:
    contents = await file.read()

    if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    result = predict_from_bytes(contents)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result
