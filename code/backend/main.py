import os

import uvicorn


def _default_host() -> str:
    return "0.0.0.0" if os.getenv("PIXELPROOF_ENV", "").strip().lower() == "production" else "127.0.0.1"


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=os.getenv("PIXELPROOF_HOST", _default_host()),
        port=int(os.getenv("PIXELPROOF_PORT", "8000")),
        reload=os.getenv("PIXELPROOF_RELOAD", "").lower() in {"1", "true", "yes"},
    )
