from pydantic import BaseModel
from typing import List


class VideoStabilizationRequest(BaseModel):
    """
    Request model for video stabilization endpoint.
    
    Attributes:
        video_path: Absolute path to the input video file
        time_stamp: List containing start and end timestamps in seconds [start, end]
    """
    video_path: str
    time_stamp: List[float]


class VideoStabilizationResponse(BaseModel):
    """
    Response model for video stabilization endpoint.
    
    Attributes:
        link: URL path to access the stabilized video file
        absolute_path: Absolute file system path to the stabilized video
    """
    link: str
    absolute_path: str


# New request models for image processing with file paths
class ImageRequest(BaseModel):
    """
    Request model for single image processing endpoints.
    
    Attributes:
        image_path: Absolute path to the input image file
    """
    image_path: str


class ColorTransferRequest(BaseModel):
    """
    Request model for color transfer endpoint.
    
    Attributes:
        image_path: Absolute path to the target image file
        reference_image_path: Absolute path to the reference image file
    """
    image_path: str
    reference_image_path: str


class ImageProcessingResponse(BaseModel):
    """
    Response model for image processing endpoints.
    
    Attributes:
        link: URL path to access the processed image file
        absolute_path: Absolute file system path to the processed image
    """
    link: str
    absolute_path: str


class SuperResolutionResponse(ImageProcessingResponse):
    """Response model for super resolution endpoint."""
    pass


class BackgroundRemovalResponse(ImageProcessingResponse):
    """Response model for background removal endpoint."""
    pass


class ColorTransferResponse(ImageProcessingResponse):
    """Response model for color transfer endpoint."""
    pass


class PortraitEffectResponse(ImageProcessingResponse):
    """Response model for portrait effect endpoint."""
    pass
