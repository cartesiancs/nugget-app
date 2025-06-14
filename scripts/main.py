from typing import Union, Dict
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

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

@router.get("/api/health")
def health() -> Dict[str, Union[int, str]]:
    return {"status": 200, "message": "quarts backend working"}

# Include the main router in the app
app.include_router(router)
