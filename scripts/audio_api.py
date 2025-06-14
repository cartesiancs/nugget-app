import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from fastapi import UploadFile, File, HTTPException, APIRouter
from pydantic import BaseModel
import numpy as np
import soundfile as sf

from models.audio import text_to_speech, remove_noise, transcribe_audio_to_srt, transcribe_audio_to_text

# Create router
router = APIRouter()

# Request models
class TextToSpeechRequest(BaseModel):
    text: str
    speaker: str = "v2/en_speaker_6"
    output_path: Optional[str] = None

class TranscriptionRequest(BaseModel):
    output_format: str = "srt"  # "srt" or "text"
    chunk_duration: float = 30.0
    target_sample_rate: int = 16000


def _validate_audio_file(file: UploadFile) -> None:
    """
    Validate uploaded audio file type and size constraints.
    
    Args:
        file: FastAPI uploaded file object
        
    Raises:
        HTTPException: If file validation fails
    """
    # Check if file exists
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.wav', '.mp3', '.m4a', '.ogg', '.flac']:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format. Supported formats: WAV, MP3, M4A, OGG, FLAC"
        )
    
    # Check file size (max 50MB)
    if file.size and file.size > 50 * 1024 * 1024:  # 50MB in bytes
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 50MB"
        )


def _save_processed_audio(audio_array: np.ndarray, filename: str, sample_rate: int) -> str:
    """
    Save processed audio array to assets/public directory.
    
    Args:
        audio_array: Processed audio as numpy array
        filename: Target filename for saving
        sample_rate: Audio sample rate
        
    Returns:
        Relative path to saved file
    """
    output_dir = Path("assets/public")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename
    sf.write(output_path, audio_array, sample_rate)
    return str(output_path)


def _generate_unique_filename(original_filename: str, prefix: str = "audio") -> str:
    """
    Generate unique filename with UUID prefix to prevent conflicts.
    
    Args:
        original_filename: Original uploaded filename
        prefix: Prefix for the filename
        
    Returns:
        Unique filename with UUID prefix
    """
    file_ext = Path(original_filename).suffix
    unique_id = str(uuid.uuid4())[:8]
    return f"{prefix}_{unique_id}{file_ext}"


async def _process_audio_upload(file: UploadFile) -> Tuple[np.ndarray, int]:
    """
    Process uploaded file and convert to numpy array.
    
    Args:
        file: FastAPI uploaded file object
        
    Returns:
        Tuple of (audio data as numpy array, sample rate)
        
    Raises:
        HTTPException: If audio processing fails
    """
    try:
        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        
        # Load audio file
        audio_data, sample_rate = sf.read(temp_path)
        
        # Clean up temporary file
        os.remove(temp_path)
        
        return audio_data, sample_rate
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid audio file: {str(e)}")


@router.post("/api/audio/text-to-speech")
async def api_audio_text_to_speech(request: TextToSpeechRequest) -> Dict[str, Any]:
    """
    Convert text to speech using Bark.
    
    Args:
        request: TextToSpeechRequest object containing:
            - text: Text to convert to speech
            - speaker: Speaker voice to use (default: v2/en_speaker_6)
            - output_path: Optional path to save the audio file
        
    Returns:
        JSON object containing download link to generated audio
        
    Raises:
        HTTPException: If text-to-speech processing fails
    """
    try:
        # Generate audio using text-to-speech
        audio_array = text_to_speech(request.text, speaker=request.speaker)
        
        # Generate unique filename and save processed audio
        unique_filename = _generate_unique_filename("tts_output.wav", prefix="tts")
        saved_path = _save_processed_audio(audio_array, unique_filename, 24000)  # Bark uses 24kHz
        
        # Construct public download URL
        download_url = f"/api/assets/public/{unique_filename}"
        
        return {"link": download_url}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-speech failed: {str(e)}")


@router.post("/api/audio/remove-noise")
async def api_audio_remove_noise(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Remove noise from uploaded audio file.
    
    Args:
        file: Uploaded audio file (WAV, MP3, etc.)
        
    Returns:
        JSON object containing download link to processed audio
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate uploaded file format
        _validate_audio_file(file)
        
        # Process uploaded file to numpy array
        audio_data, sample_rate = await _process_audio_upload(file)
        
        # Apply noise removal
        enhanced_audio = remove_noise(audio_data)
        
        # Generate unique filename and save processed audio
        unique_filename = _generate_unique_filename(file.filename, prefix="denoised")
        saved_path = _save_processed_audio(enhanced_audio, unique_filename, sample_rate)
        
        # Construct public download URL
        download_url = f"/api/assets/public/{unique_filename}"
        
        return {"link": download_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.post("/api/audio/transcribe")
async def api_audio_transcribe(
    file: UploadFile = File(...),
    request: TranscriptionRequest = None
) -> Dict[str, Any]:
    """
    Transcribe audio file to text or SRT format.
    
    Args:
        file: Uploaded audio file (WAV, MP3, etc.)
        request: TranscriptionRequest object containing:
            - output_format: Output format ("srt" or "text")
            - chunk_duration: Duration of each audio chunk in seconds
            - target_sample_rate: Target sample rate for transcription
        
    Returns:
        JSON object containing transcription result or download link
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate uploaded file format
        _validate_audio_file(file)
        
        # Process uploaded file to numpy array
        audio_data, sample_rate = await _process_audio_upload(file)
        
        # Save audio data temporarily with .wav extension for processing
        temp_path = f"temp_{Path(file.filename).stem}.wav"
        sf.write(temp_path, audio_data, sample_rate)
        
        try:
            if request and request.output_format == "text":
                # Transcribe to text
                transcript = transcribe_audio_to_text(
                    temp_path,
                    target_sample_rate=request.target_sample_rate
                )
                return {"text": transcript}
            else:
                # Transcribe to SRT
                srt_path = transcribe_audio_to_srt(
                    temp_path,
                    chunk_duration=request.chunk_duration if request else 30.0,
                    target_sample_rate=request.target_sample_rate if request else 16000
                )
                
                # Generate unique filename for SRT with proper extension
                unique_filename = f"transcript_{uuid.uuid4().hex[:8]}.srt"
                output_path = Path("assets/public") / unique_filename
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Copy SRT file to public directory
                import shutil
                shutil.copy2(srt_path, output_path)
                
                # Clean up temporary SRT file
                os.remove(srt_path)
                
                # Construct public download URL
                download_url = f"/api/assets/public/{unique_filename}"
                return {"link": download_url}
                
        finally:
            # Clean up temporary audio file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
