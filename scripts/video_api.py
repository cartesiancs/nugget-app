import logging
from fastapi import APIRouter, HTTPException
from data_models import VideoStabilizationRequest, VideoStabilizationResponse
from utils.video_helpers import (
    generate_unique_filename, extract_video_clip, convert_to_mov,
    stabilize_video, ensure_directories_exist, get_absolute_path, cleanup_temp_files
)

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/api/video/video-stabilization")
def api_video_stabilization(request: VideoStabilizationRequest):
    """
    Stabilize video segment using VidStab library.
    
    Args:
        request: VideoStabilizationRequest containing video path and timestamps
    Returns:
        JSON object with success status and either data or error message
    Raises:
        HTTPException: If video processing fails at any step
    """
    try:
        logger.info("🎬 Starting video stabilization API call")
        logger.info(f"📁 Input video path: {request.video_path}")
        logger.info(f"⏱️  Time range: {request.time_stamp[0]}s - {request.time_stamp[1]}s")
        
        logger.info("📂 Ensuring directories exist...")
        ensure_directories_exist()
        
        # Generate unique filenames for processing steps
        temp_clip_name = generate_unique_filename("mp4")
        temp_mov_name = generate_unique_filename("mov") 
        final_output_name = generate_unique_filename("mov")
        
        # Define file paths for processing pipeline
        temp_clip_path = f"tmp/{temp_clip_name}"
        temp_mov_path = f"tmp/{temp_mov_name}"
        final_output_path = f"assets/public/{final_output_name}"
        
        logger.info(f"🔄 Generated processing pipeline:")
        logger.info(f"   • Temp clip: {temp_clip_path}")
        logger.info(f"   • Temp MOV: {temp_mov_path}")
        logger.info(f"   • Final output: {final_output_path}")
        
        # Extract video segment from specified time range
        logger.info("✂️  Step 1/3: Extracting video clip...")
        if not extract_video_clip(request.video_path, request.time_stamp[0], 
                                 request.time_stamp[1], temp_clip_path):
            logger.error("❌ Failed to extract video clip")
            raise Exception("Failed to extract video clip")
        logger.info("✅ Video clip extraction completed successfully")
        
        # Convert extracted clip to MOV format
        logger.info("🔄 Step 2/3: Converting to MOV format...")
        if not convert_to_mov(temp_clip_path, temp_mov_path):
            logger.error("❌ Failed to convert video format")
            cleanup_temp_files(temp_clip_path)
            raise Exception("Failed to convert video format")
        logger.info("✅ Video format conversion completed successfully")
        
        # Apply video stabilization using VidStab
        logger.info("🎯 Step 3/3: Applying video stabilization...")
        if not stabilize_video(temp_mov_path, final_output_path):
            logger.error("❌ Failed to stabilize video")
            cleanup_temp_files(temp_clip_path, temp_mov_path)
            raise Exception("Failed to stabilize video")
        logger.info("✅ Video stabilization completed successfully")
        
        # Clean up temporary files after successful processing
        logger.info("🧹 Cleaning up temporary files...")
        cleanup_temp_files(temp_clip_path, temp_mov_path)
        logger.info("✅ Temporary files cleaned up")
        
        # Return response with download link and absolute path
        absolute_path = get_absolute_path(final_output_path)
        download_link = f"/api/assets/public/{final_output_name}"
        
        logger.info("🎉 Video stabilization API call completed successfully!")
        logger.info(f"📥 Download link: {download_link}")
        logger.info(f"📍 Absolute path: {absolute_path}")
        
        response_data = VideoStabilizationResponse(
            link=download_link,
            absolute_path=absolute_path
        )
        return {"success": True, "data": response_data}
        
    except Exception as e:
        # Clean up any remaining temporary files on unexpected error
        logger.error(f"💥 Unexpected error during video processing: {str(e)}")
        logger.info("🧹 Attempting cleanup of temporary files...")
        cleanup_temp_files(temp_clip_path, temp_mov_path, final_output_path)
        return {"success": False, "error": f"Internal server error: {str(e)}"}



# @router.get("/api/image/remove-bg")
# def api_video_background_removal():
#     """Placeholder endpoint for background removal functionality."""
#     pass 


# @router.get("api/image/color-grading")
# def api_video_color_grading():
#     """Placeholder endpoint for color grading functionality."""
#     pass


# @router.get("api/image/portrait-effect")
# def api_video_portrait_effect():
#     """Placeholder endpoint for portrait effect functionality."""
#     pass


# @router.get("api/image/super-resolution")
# def api_video_super_resolution():
#     """Placeholder endpoint for super resolution functionality."""
#     pass
