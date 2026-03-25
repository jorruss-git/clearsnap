"""
ClearSnap API — Background removal only.
All other image processing runs client-side in the browser.
"""
from __future__ import annotations

import asyncio
import io
from concurrent.futures import ProcessPoolExecutor

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image, ImageOps
from rembg import remove
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

# --- Rate limiting ---
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="ClearSnap API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://clearsnap.app"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# --- Process pool for CPU-heavy rembg ---
executor = ProcessPoolExecutor(max_workers=2)


def _remove_background(image_bytes: bytes) -> bytes:
    """Run rembg in a separate process to avoid blocking the async event loop."""
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)
    image = image.convert("RGBA")

    output = remove(image)

    out_buf = io.BytesIO()
    output.save(out_buf, format="PNG")
    return out_buf.getvalue()


@app.post("/api/remove")
@limiter.limit("10/minute")
async def remove_background(request, file: UploadFile = File(...)):
    """Remove the background from an uploaded image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image.")

    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB).")

    try:
        loop = asyncio.get_event_loop()
        result_bytes = await loop.run_in_executor(executor, _remove_background, data)
    except Exception:
        raise HTTPException(status_code=500, detail="Background removal failed.")

    return StreamingResponse(io.BytesIO(result_bytes), media_type="image/png")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
