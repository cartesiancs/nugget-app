from typing import Dict, Any

from fastapi import UploadFile, File, HTTPException

from main import router
from models.image import get_super_resolution
from utils.image_helpers import (
    validate_uploaded_file,
    process_image_upload,
    generate_unique_filename,
    save_processed_image,
    create_portrait_effect,
    perform_color_transfer,
    save_processed_image_png,
    generate_bg_removal_filename,
    perform_background_removal
)


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
        validate_uploaded_file(file)
        
        # Process uploaded file to PIL Image
        pil_image = process_image_upload(file)
        
        # Apply super resolution using models/image function
        enhanced_array = get_super_resolution(pil_image)
        
        # Generate unique filename and save processed image
        unique_filename = generate_unique_filename(file.filename)
        saved_path = save_processed_image(enhanced_array, unique_filename)
        
        # Construct public download URL
        download_url = f"/api/assets/public/{unique_filename}"
        
        return {"link": download_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.post("/api/image/remove-bg")
async def api_image_background_removal(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Remove background from uploaded image using RMBG-1.4 model.
    
    Accepts an uploaded image file, removes the background using state-of-the-art
    RMBG-1.4 model, and returns a download link to the PNG image with transparent
    background in assets/public directory.
    
    Args:
        file: Uploaded image file (JPEG, PNG, etc.)
        
    Returns:
        JSON object containing download link to background-removed PNG image
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate uploaded file format and constraints
        validate_uploaded_file(file)
        
        # Process uploaded file to PIL Image
        pil_image = process_image_upload(file)
        
        # Apply background removal using models/image function
        rgba_array = perform_background_removal(pil_image)
        
        # Generate unique PNG filename and save processed image
        unique_filename = generate_bg_removal_filename(file.filename)
        saved_path = save_processed_image_png(rgba_array, unique_filename)
        
        # Construct public download URL
        download_url = f"/api/assets/public/{unique_filename}"
        
        return {"link": download_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}") 


@router.post("/api/image/color-transfer")
async def api_image_color_transfer(
    reference_file: UploadFile = File(..., description="Reference image for color grading"),
    target_file: UploadFile = File(..., description="Target image to apply color transfer")
) -> Dict[str, Any]:
    """
    Apply color transfer from reference image to target image.
    
    Accepts two uploaded image files - a reference image providing the color palette
    and a target image to receive the color transfer. Uses LAB color space statistics
    matching to transfer color characteristics while preserving image structure.
    Returns download link to the processed image in assets/public directory.
    
    Args:
        reference_file: Reference image file for color palette (JPEG, PNG, etc.)
        target_file: Target image file to receive color transfer (JPEG, PNG, etc.)
        
    Returns:
        JSON object containing download link to color-transferred image
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate both uploaded files
        validate_uploaded_file(reference_file)
        validate_uploaded_file(target_file)
        
        # Process uploaded files to PIL Images
        reference_image = process_image_upload(reference_file)
        target_image = process_image_upload(target_file)
        
        # Apply color transfer from reference to target
        transferred_array = perform_color_transfer(reference_image, target_image)
        
        # Generate unique filename and save processed image
        unique_filename = generate_unique_filename(target_file.filename)
        unique_filename = unique_filename.replace("sr_", "color_transfer_")
        saved_path = save_processed_image(transferred_array, unique_filename)
        
        # Construct public download URL
        download_url = f"/api/assets/public/{unique_filename}"
        
        return {"link": download_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color transfer processing failed: {str(e)}")


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
        validate_uploaded_file(file)
        
        # Process uploaded file to PIL Image
        pil_image = process_image_upload(file)
        
        # Apply portrait effect using depth-based blur
        portrait_array = create_portrait_effect(pil_image)
        
        # Generate unique filename and save processed image
        unique_filename = generate_unique_filename(file.filename)
        unique_filename = unique_filename.replace("sr_", "portrait_")
        saved_path = save_processed_image(portrait_array, unique_filename)
        
        # Construct public download URL
        download_url = f"/api/assets/public/{unique_filename}"
        
        return {"link": download_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portrait effect processing failed: {str(e)}")
