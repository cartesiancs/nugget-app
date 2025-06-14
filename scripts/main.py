from typing import Union, Dict
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Initialize FastAPI application (not router)
app = FastAPI()

# Mount static files directory to serve processed images
# This allows direct download access via /api/assets/public/<filename>
if os.path.exists("assets/public"):
    app.mount(
        "/api/assets/public", StaticFiles(directory="assets/public"), name="static"
    )

# Import routers with error handling
try:
    import cv_api
    app.include_router(cv_api.router)
except ImportError:
    print("cv_api not found, skipping")

try:
    import llm_api
    app.include_router(llm_api.router)
except ImportError:
    print("llm_api not found, skipping")

try:
    import video_api
    app.include_router(video_api.router)
except ImportError:
    print("video_api not found, skipping")

# try:
#     from fakeserver import router as fake_router
#     app.include_router(fake_router)
# except ImportError:
#     print("fakeserver not found, skipping")


@app.get("/api/health")
def health() -> Dict[str, Union[int, str]]:
    """
    Health check endpoint to verify backend service status.

    Returns:
        Dict containing status code and message indicating service health
    """
    return {"status": 200, "message": "quartz backend working"}


# if __name__ == "__main__":
#     import uvicorn

#     print("Starting FastAPI server on http://localhost:8000")
#     uvicorn.run(app, host="0.0.0.0", port=8000)
