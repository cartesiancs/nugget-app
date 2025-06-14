import os
from pathlib import Path
from typing import Dict, Any

from fastapi import UploadFile, File, HTTPException
from PIL import Image

from main import router
from models.image import get_super_resolution
from data_models import (
    ImageRequest,
    ColorTransferRequest,
    SuperResolutionResponse,
    BackgroundRemovalResponse,
    ColorTransferResponse,
    PortraitEffectResponse
)
from utils.image_helpers import (
    validate_uploaded_file,
    process_image_upload,
    generate_unique_filename,
    save_processed_image,
    create_portrait_effect,
    perform_color_transfer,
    save_processed_image_png,
    generate_bg_removal_filename,
    perform_background_removal,
    validate_image_path,
    load_image_from_path,
    generate_filename_from_path
)


@router.post("/api/image/super-resolution")
async def api_image_super_resolution(request: ImageRequest) -> SuperResolutionResponse:
    """
    Apply super resolution enhancement to image specified by path.
    
    Accepts an image path, processes it using Real-ESRGAN x4plus model,
    and returns a download link to the enhanced image in assets/public directory.
    
    Args:
        request: ImageRequest containing the absolute path to the image file
        
    Returns:
        SuperResolutionResponse containing download link and absolute path to processed image
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate image path and load image
        validate_image_path(request.image_path)
        pil_image = load_image_from_path(request.image_path)
        
        # Apply super resolution using models/image function
        enhanced_array = get_super_resolution(pil_image)
        
        # Generate unique filename and save processed image
        unique_filename = generate_filename_from_path(request.image_path, "sr")
        saved_path = save_processed_image(enhanced_array, unique_filename)
        
        # Construct public download URL and absolute path
        download_url = f"/api/assets/public/{unique_filename}"
        absolute_path = os.path.join(os.getcwd(), "assets", "public", unique_filename)
        
        return SuperResolutionResponse(link=download_url, absolute_path=absolute_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.post("/api/image/remove-bg")
async def api_image_background_removal(request: ImageRequest) -> BackgroundRemovalResponse:
    """
    Remove background from image specified by path using RMBG-1.4 model.
    
    Accepts an image path, removes the background using state-of-the-art
    RMBG-1.4 model, and returns a download link to the PNG image with transparent
    background in assets/public directory.
    
    Args:
        request: ImageRequest containing the absolute path to the image file
        
    Returns:
        BackgroundRemovalResponse containing download link and absolute path to background-removed PNG image
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate image path and load image
        validate_image_path(request.image_path)
        pil_image = load_image_from_path(request.image_path)
        
        # Apply background removal using models/image function
        rgba_array = perform_background_removal(pil_image)
        
        # Generate unique PNG filename and save processed image
        unique_filename = generate_filename_from_path(request.image_path, "bg_removed").replace('.jpg', '.png').replace('.jpeg', '.png')
        saved_path = save_processed_image_png(rgba_array, unique_filename)
        
        # Construct public download URL and absolute path
        download_url = f"/api/assets/public/{unique_filename}"
        absolute_path = os.path.join(os.getcwd(), "assets", "public", unique_filename)
        
        return BackgroundRemovalResponse(link=download_url, absolute_path=absolute_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}") 


@router.post("/api/image/color-transfer")
async def api_image_color_transfer(request: ColorTransferRequest) -> ColorTransferResponse:
    """
    Apply color transfer from reference image to target image.
    
    Accepts paths to two images - a reference image providing the color palette
    and a target image to receive the color transfer. Uses LAB color space statistics
    matching to transfer color characteristics while preserving image structure.
    Returns download link to the processed image in assets/public directory.
    
    Args:
        request: ColorTransferRequest containing paths to reference and target image files
        
    Returns:
        ColorTransferResponse containing download link and absolute path to color-transferred image
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate both image paths and load images
        validate_image_path(request.reference_image_path)
        validate_image_path(request.image_path)
        
        reference_image = load_image_from_path(request.reference_image_path)
        target_image = load_image_from_path(request.image_path)
        
        # Apply color transfer from reference to target
        transferred_array = perform_color_transfer(reference_image, target_image)
        
        # Generate unique filename and save processed image
        unique_filename = generate_filename_from_path(request.image_path, "color_transfer")
        saved_path = save_processed_image(transferred_array, unique_filename)
        
        # Construct public download URL and absolute path
        download_url = f"/api/assets/public/{unique_filename}"
        absolute_path = os.path.join(os.getcwd(), "assets", "public", unique_filename)
        
        return ColorTransferResponse(link=download_url, absolute_path=absolute_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color transfer processing failed: {str(e)}")


@router.get("/api/image/image-generation")
def api_image_generate_image():
    """Placeholder endpoint for image generation functionality."""
    pass


@router.post("/api/image/portrait-effect")
async def api_image_portrait_effect(request: ImageRequest) -> PortraitEffectResponse:
    """
    Apply portrait effect with depth-based background blur to image specified by path.
    
    Accepts an image path, generates depth map, and applies Gaussian blur
    to background areas (depth < 0.65) while keeping foreground subjects sharp.
    Returns download link to the processed image in assets/public directory.
    
    Args:
        request: ImageRequest containing the absolute path to the image file
        
    Returns:
        PortraitEffectResponse containing download link and absolute path to processed portrait image
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate image path and load image
        validate_image_path(request.image_path)
        pil_image = load_image_from_path(request.image_path)
        
        # Apply portrait effect using depth-based blur
        portrait_array = create_portrait_effect(pil_image)
        
        # Generate unique filename and save processed image
        unique_filename = generate_filename_from_path(request.image_path, "portrait")
        saved_path = save_processed_image(portrait_array, unique_filename)
        
        # Construct public download URL and absolute path
        download_url = f"/api/assets/public/{unique_filename}"
        absolute_path = os.path.join(os.getcwd(), "assets", "public", unique_filename)
        
        return PortraitEffectResponse(link=download_url, absolute_path=absolute_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portrait effect processing failed: {str(e)}")
