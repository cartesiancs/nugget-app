import os
import uuid
from pathlib import Path
from typing import Dict, Any
import yaml

from fastapi import UploadFile, File, HTTPException
from PIL import Image
import numpy as np
import cv2

from main import router
from models.image import get_super_resolution, get_depth_map


# Load configuration from config.yaml
def load_config() -> Dict[str, Any]:
    """Load configuration from config.yaml file."""
    config_path = Path("config.yaml")
    if config_path.exists():
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    else:
        # Return default config if file doesn't exist
        return {
            "device": "cpu",
            "image": {
                "portrait_effect": {
                    "depth_threshold": 0.65,
                    "blur_kernel": 8
                },
                "super_resolution": {
                    "target_size": 128,
                    "scale_factor": 1.5,
                    "upscale_factor": 4
                }
            }
        }

# Load config once at module level
CONFIG = load_config()


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


def _apply_depth_based_blur(image_array: np.ndarray, depth_map: np.ndarray, 
                           depth_threshold: float = None, blur_kernel: int = None) -> np.ndarray:
    """
    Apply Gaussian blur to pixels based on depth map threshold.
    
    Args:
        image_array: Original image as numpy array
        depth_map: Depth map with normalized values (0-1)
        depth_threshold: Depth threshold below which pixels are blurred (uses config if None)
        blur_kernel: Gaussian blur kernel size in pixels (uses config if None)
        
    Returns:
        Image array with depth-based blur applied
    """
    # Use config values if parameters not provided
    if depth_threshold is None:
        depth_threshold = CONFIG["image"]["portrait_effect"]["depth_threshold"]
    if blur_kernel is None:
        blur_kernel = CONFIG["image"]["portrait_effect"]["blur_kernel"]
    # Create blur mask for pixels below depth threshold
    blur_mask = depth_map < depth_threshold
    
    # Apply Gaussian blur to entire image
    blurred_image = cv2.GaussianBlur(image_array, (blur_kernel * 2 + 1, blur_kernel * 2 + 1), 0)
    
    # Blend original and blurred based on mask
    result = np.where(blur_mask[..., np.newaxis], blurred_image, image_array)
    return result.astype(np.uint8)


def _create_portrait_effect(pil_image: Image.Image) -> np.ndarray:
    """
    Create portrait effect by applying depth-based background blur.
    
    Args:
        pil_image: Input PIL Image object
        
    Returns:
        Processed image array with portrait effect applied
        
    Raises:
        RuntimeError: If depth estimation or blur processing fails
    """
    try:
        # Generate depth map for the image
        depth_map = get_depth_map(pil_image)
        
        # Convert PIL image to numpy array
        image_array = np.array(pil_image)
        
        # Apply depth-based blur with specified parameters
        portrait_result = _apply_depth_based_blur(image_array, depth_map)
        return portrait_result
        
    except Exception as e:
        raise RuntimeError(f"Portrait effect processing failed: {str(e)}")


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


@router.post("/api/image/portrait-effect")
async def api_image_portrait_effect(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Apply portrait effect with depth-based background blur to uploaded image.
    
    Accepts an uploaded image file, generates depth map, and applies Gaussian blur
    to background areas (depth < 0.65) while keeping foreground subjects sharp.
    Returns download link to the processed image in assets/public directory.
    
    Args:
        file: Uploaded image file (JPEG, PNG, etc.)
        
    Returns:
        JSON object containing download link to processed portrait image
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate uploaded file format and constraints
        _validate_uploaded_file(file)
        
        # Process uploaded file to PIL Image
        pil_image = _process_image_upload(file)
        
        # Apply portrait effect using depth-based blur
        portrait_array = _create_portrait_effect(pil_image)
        
        # Generate unique filename and save processed image
        unique_filename = _generate_unique_filename(file.filename)
        unique_filename = unique_filename.replace("sr_", "portrait_")
        saved_path = _save_processed_image(portrait_array, unique_filename)
        
        # Construct public download URL
        download_url = f"/api/assets/public/{unique_filename}"
        
        return {"link": download_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portrait effect processing failed: {str(e)}")
