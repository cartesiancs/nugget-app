from typing import Union, Dict
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Initialize FastAPI routerlication
router = FastAPI()

# Mount static files directory to serve processed images
# This allows direct download access via /api/assets/public/<filename>
if os.path.exists("assets/public"):
    router.mount(
        "/api/assets/public", StaticFiles(directory="assets/public"), name="static"
    )

# Import routers
import cv_api
import llm_api
# import video_api

# Include routers
router.include_router(cv_api.router)
router.include_router(llm_api.router)
# router.include_router(video_api.router)


# Import video_api to register video processing endpoints
import video_api

@router.get("/api/health")
def health() -> Dict[str, Union[int, str]]:
    """
    Health check endpoint to verify backend service status.

    Returns:
        Dict containing status code and message indicating service health
    """
    return {"status": 200, "message": "quartz backend working"}
