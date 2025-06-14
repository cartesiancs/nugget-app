import os
import uuid
from pathlib import Path
from typing import Dict, Any
import yaml

from fastapi import UploadFile, HTTPException
from PIL import Image
import numpy as np
import cv2

from models.image import get_depth_map, remove_background


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


def validate_image_path(image_path: str) -> None:
    """
    Validate that the image path exists and is a valid image file.
    
    Args:
        image_path: Path to the image file
        
    Raises:
        HTTPException: If file doesn't exist or is not a valid image
    """
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail=f"Image file not found: {image_path}")
    
    if not os.path.isfile(image_path):
        raise HTTPException(status_code=400, detail=f"Path is not a file: {image_path}")
    
    # Check if it's a valid image extension
    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    file_ext = Path(image_path).suffix.lower()
    if file_ext not in valid_extensions:
        raise HTTPException(status_code=400, detail=f"Invalid image format. Supported formats: {valid_extensions}")


def load_image_from_path(image_path: str) -> Image.Image:
    """
    Load image from file path.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        PIL Image object
        
    Raises:
        HTTPException: If image cannot be loaded
    """
    try:
        return Image.open(image_path).convert('RGB')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load image from {image_path}: {str(e)}")


def generate_filename_from_path(image_path: str, prefix: str = "processed") -> str:
    """
    Generate unique filename based on original file path.
    
    Args:
        image_path: Original image path
        prefix: Prefix for the generated filename
        
    Returns:
        Unique filename
    """
    original_name = Path(image_path).stem
    extension = Path(image_path).suffix
    unique_id = str(uuid.uuid4())[:8]
    return f"{prefix}_{original_name}_{unique_id}{extension}"


def validate_uploaded_file(file: UploadFile) -> None:
    """
    Validate uploaded file type and size constraints.
    
    Args:
        file: FastAPI uploaded file object
        
    Raises:
        HTTPException: If file validation fails
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")


def save_processed_image(image_array: np.ndarray, filename: str) -> str:
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


def generate_unique_filename(original_filename: str) -> str:
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


def process_image_upload(file: UploadFile) -> Image.Image:
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


def apply_depth_based_blur(image_array: np.ndarray, depth_map: np.ndarray, 
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


def create_portrait_effect(pil_image: Image.Image) -> np.ndarray:
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
        portrait_result = apply_depth_based_blur(image_array, depth_map)
        return portrait_result
        
    except Exception as e:
        raise RuntimeError(f"Portrait effect processing failed: {str(e)}")


def convert_to_lab_color_space(image_array: np.ndarray) -> np.ndarray:
    """
    Convert RGB image array to LAB color space for color transfer processing.
    
    Args:
        image_array: RGB image as numpy array
        
    Returns:
        Image array in LAB color space
    """
    return cv2.cvtColor(image_array, cv2.COLOR_RGB2LAB).astype(np.float32)


def calculate_color_statistics(lab_image: np.ndarray) -> tuple:
    """
    Calculate mean and standard deviation for each LAB channel.
    
    Args:
        lab_image: Image in LAB color space
        
    Returns:
        Tuple of (mean, std) arrays for LAB channels
    """
    mean = np.mean(lab_image, axis=(0, 1))
    std = np.std(lab_image, axis=(0, 1))
    return mean, std


def apply_color_transfer_statistics(target_lab: np.ndarray, target_stats: tuple, 
                                  reference_stats: tuple) -> np.ndarray:
    """
    Apply reference image color statistics to target image.
    
    Args:
        target_lab: Target image in LAB color space
        target_stats: Target image (mean, std) statistics
        reference_stats: Reference image (mean, std) statistics
        
    Returns:
        Color-transferred image in LAB color space
    """
    target_mean, target_std = target_stats
    ref_mean, ref_std = reference_stats
    
    # Normalize target image and apply reference statistics
    normalized = (target_lab - target_mean) * (ref_std / target_std) + ref_mean
    return np.clip(normalized, 0, 255)


def convert_lab_to_rgb(lab_image: np.ndarray) -> np.ndarray:
    """
    Convert LAB color space image back to RGB format.
    
    Args:
        lab_image: Image in LAB color space
        
    Returns:
        RGB image as numpy array (uint8)
    """
    rgb_image = cv2.cvtColor(lab_image.astype(np.uint8), cv2.COLOR_LAB2RGB)
    return rgb_image


def perform_color_transfer(reference_image: Image.Image, target_image: Image.Image) -> np.ndarray:
    """
    Transfer color characteristics from reference image to target image.
    
    Args:
        reference_image: PIL Image to use as color reference
        target_image: PIL Image to apply color transfer to
        
    Returns:
        Color-transferred image as numpy array
        
    Raises:
        RuntimeError: If color transfer processing fails
    """
    try:
        # Convert PIL images to numpy arrays
        ref_array = np.array(reference_image)
        target_array = np.array(target_image)
        
        # Convert to LAB color space for better color transfer
        ref_lab = convert_to_lab_color_space(ref_array)
        target_lab = convert_to_lab_color_space(target_array)
        
        # Calculate color statistics for both images
        ref_stats = calculate_color_statistics(ref_lab)
        target_stats = calculate_color_statistics(target_lab)
        
        # Apply color transfer using statistical matching
        transferred_lab = apply_color_transfer_statistics(target_lab, target_stats, ref_stats)
        
        # Convert back to RGB color space
        result_rgb = convert_lab_to_rgb(transferred_lab)
        return result_rgb
        
    except Exception as e:
        raise RuntimeError(f"Color transfer processing failed: {str(e)}")


def save_processed_image_png(image_array: np.ndarray, filename: str) -> str:
    """
    Save processed RGBA image array to assets/public directory as PNG.
    
    Args:
        image_array: Processed RGBA image as numpy array
        filename: Target filename for saving
        
    Returns:
        Relative path to saved PNG file
    """
    output_dir = Path("assets/public")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename
    Image.fromarray(image_array, mode='RGBA').save(output_path, format='PNG')
    return str(output_path)


def generate_bg_removal_filename(original_filename: str) -> str:
    """
    Generate unique filename for background removal with PNG extension.
    
    Args:
        original_filename: Original uploaded filename
        
    Returns:
        Unique PNG filename with UUID prefix
    """
    unique_id = str(uuid.uuid4())[:8]
    return f"bg_removed_{unique_id}.png"


def perform_background_removal(pil_image: Image.Image) -> np.ndarray:
    """
    Remove background from image using RMBG-1.4 model.
    
    Args:
        pil_image: Input PIL Image object
        
    Returns:
        RGBA image array with transparent background
        
    Raises:
        RuntimeError: If background removal processing fails
    """
    try:
        # Apply background removal using models/image function
        rgba_array = remove_background(pil_image)
        return rgba_array
        
    except Exception as e:
        raise RuntimeError(f"Background removal processing failed: {str(e)}")
