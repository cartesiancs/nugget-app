import os
import uuid
from pathlib import Path
from typing import Dict, Any

from fastapi import UploadFile, File, HTTPException
from PIL import Image
import numpy as np

from main import router
from models.image import get_super_resolution


def _validate_uploaded_file(file: UploadFile) -> None:
    """
    Validate uploaded file type and size constraints.
    
    Args:
        file: FastAPI uploaded file object
        
    Raises:
        HTTPException: If file validation fails
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")


def _save_processed_image(image_array: np.ndarray, filename: str) -> str:
    """
    Save processed image array to assets/public directory.
    
    Args:
        image_array: Processed image as numpy array
        filename: Target filename for saving
        
    Returns:
        Relative path to saved file
    """
    output_dir = Path("assets/public")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename
    Image.fromarray(image_array).save(output_path)
    return str(output_path)


def _generate_unique_filename(original_filename: str) -> str:
    """
    Generate unique filename with UUID prefix to prevent conflicts.
    
    Args:
        original_filename: Original uploaded filename
        
    Returns:
        Unique filename with UUID prefix
    """
    file_ext = Path(original_filename).suffix
    unique_id = str(uuid.uuid4())[:8]
    return f"sr_{unique_id}{file_ext}"


def _process_image_upload(file: UploadFile) -> Image.Image:
    """
    Process uploaded file and convert to PIL Image format.
    
    Args:
        file: FastAPI uploaded file object
        
    Returns:
        PIL Image object
        
    Raises:
        HTTPException: If image processing fails
    """
    try:
        return Image.open(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")


@router.post("/api/image/super-resolution")
async def api_image_super_resolution(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Apply super resolution enhancement to uploaded image.
    
    Accepts an uploaded image file, processes it using Real-ESRGAN x4plus model,
    and returns a download link to the enhanced image in assets/public directory.
    
    Args:
        file: Uploaded image file (JPEG, PNG, etc.)
        
    Returns:
        JSON object containing download link to processed image
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate uploaded file format and constraints
        _validate_uploaded_file(file)
        
        # Process uploaded file to PIL Image
        pil_image = _process_image_upload(file)
        
        # Apply super resolution using models/image function
        enhanced_array = get_super_resolution(pil_image)
        
        # Generate unique filename and save processed image
        unique_filename = _generate_unique_filename(file.filename)
        saved_path = _save_processed_image(enhanced_array, unique_filename)
        
        # Construct public download URL
        download_url = f"/api/assets/public/{unique_filename}"
        
        return {"link": download_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/api/image/remove-bg")
def api_image_background_removal():
    """Placeholder endpoint for background removal functionality."""
    pass 


@router.get("/api/image/color-grading")
def api_image_color_grading():
    """Placeholder endpoint for color grading functionality."""
    pass


@router.get("/api/image/image-generation")
def api_image_generate_image():
    """Placeholder endpoint for image generation functionality."""
    pass


@router.get("/api/image/portrait-effect")
def api_image_portrait_effect():
    """Placeholder endpoint for portrait effect functionality."""
    pass
