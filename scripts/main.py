from typing import Union, Dict
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Initialize FastAPI application
router = FastAPI()

# Mount static files directory to serve processed images
# This allows direct download access via /api/assets/public/<filename>
if os.path.exists("assets/public"):
    router.mount("/api/assets/public", StaticFiles(directory="assets/public"), name="static")

# Import cv_api to register image processing endpoints
import cv_api
import llm_api
import video_api

# Include routers
router.include_router(cv_api.router)
router.include_router(llm_api.router)
router.include_router(video_api.router)



@router.get("/api/health")
def health() -> Dict[str, Union[int, str]]:
    """
    Health check endpoint to verify backend service status.
    
    Returns:
        Dict containing status code and message indicating service health
    """
    return {"status": 200, "message": "quartz backend working"}