from typing import Union, Dict
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from fastapi.staticfiles import StaticFiles 

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

logger.info("Starting FastAPI application setup...")

# Create FastAPI app
# app = FastAPI()
logger.info("FastAPI app created.")

# Add CORS middleware
logger.info("Adding CORS middleware...")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Allows all origins
#     allow_credentials=True,
#     allow_methods=["*"],  # Allows all methods
#     allow_headers=["*"],  # Allows all headers
# )
logger.info("CORS middleware added.")

# Create main router
router = APIRouter()
logger.info("Main router created.")


# Mount static files directory to serve processed images
# This allows direct download access via /api/assets/public/<filename>
logger.info("Checking for static files directory...")
if os.path.exists("assets/public"):
    logger.info("Mounting static files directory at /api/assets/public...")
    router.mount(
        "/api/assets/public", StaticFiles(directory="assets/public"), name="static"
    )
    logger.info("Static files directory mounted.")
else:
    logger.warning("Static files directory 'assets/public' not found. Skipping mount.")

# Import cv_api to register image processing endpoints
logger.info("Importing API routers...")
import cv_api
# logger.info("cv_api router imported.")
import llm_api
# logger.info("llm_api router imported.")
import video_api
# logger.info("video_api router imported.")
import audio_api
# logger.info("audio_api router imported.")

# Include routers
# logger.info("Including API routers...")
router.include_router(cv_api.router)
# logger.info("cv_api router included.")
router.include_router(llm_api.router)
# logger.info("llm_api router included.")
router.include_router(video_api.router)
# logger.info("video_api router included.")
router.include_router(audio_api.router)


@router.get("/api/health")
def health() -> Dict[str, Union[int, str]]:
    return {"status": 200, "message": "quarts backend working"}

# Include the main router in the app
logger.info("Including main router into the app...")
logger.info("FastAPI application setup complete.")
