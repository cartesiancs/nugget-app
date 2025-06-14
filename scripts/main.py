from typing import Union, Dict
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import os

from fastapi.staticfiles import StaticFiles 

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Create main router
router = APIRouter()

# Import and include routers
from audio_api import router as audio_router
router.include_router(audio_router)

# Mount static files directory to serve processed images
# This allows direct download access via /api/assets/public/<filename>
if os.path.exists("assets/public"):
    router.mount(
        "/api/assets/public", StaticFiles(directory="assets/public"), name="static"
    )

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
    return {"status": 200, "message": "quarts backend working"}

# Include the main router in the app
app.include_router(router)
