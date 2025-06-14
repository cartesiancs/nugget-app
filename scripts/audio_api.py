import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import subprocess
import shutil

from fastapi import UploadFile, File, HTTPException, APIRouter
from pydantic import BaseModel
import numpy as np
import soundfile as sf

from models.audio import text_to_speech, remove_noise, transcribe_audio_to_srt, transcribe_audio_to_text, TARGET_SAMPLE_RATE, DEFAULT_CHUNK_DURATION, WHISPER_SAMPLE_RATE

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


# Supported video extensions for processing
VIDEO_EXTS = ['.mp4']


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


async def _save_upload_to_temp(file: UploadFile, suffix: str) -> str:
    """
    Save uploaded file to a temporary path with a unique suffix.
    Returns the temporary file path.
    """
    temp_filename = f"temp_{suffix}_{uuid.uuid4().hex[:8]}{Path(file.filename).suffix}"
    with open(temp_filename, "wb") as f:
        f.write(await file.read())
    return temp_filename


def _extract_audio_from_video(video_path: str, audio_path: str, sample_rate: int = 48000) -> None:
    """
    Extract audio track from video using ffmpeg.
    """
    # -vn disable video, pcm_s16le for WAV, set sample rate and mono
    subprocess.run([
        'ffmpeg', '-y', '-i', video_path,
        '-vn', '-acodec', 'pcm_s16le', '-ar', str(sample_rate), '-ac', '1',
        audio_path
    ], check=True)


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
        
        # Return absolute path to saved file
        abs_path = str(Path(saved_path).resolve())
        return {"link": abs_path}
            
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
        # Check for video input
        ext = Path(file.filename).suffix.lower()
        if ext in VIDEO_EXTS:
            link = await _remove_noise_from_video(file)
            return {"link": link}
        
        # Validate uploaded file format
        _validate_audio_file(file)
        
        # Process uploaded file to numpy array
        audio_data, sample_rate = await _process_audio_upload(file)
        
        # Apply noise removal
        enhanced_audio = remove_noise(audio_data)
        
        # Generate unique filename and save processed audio
        unique_filename = _generate_unique_filename(file.filename, prefix="denoised")
        saved_path = _save_processed_audio(enhanced_audio, unique_filename, sample_rate)
        
        # Return absolute path to saved file
        abs_path = str(Path(saved_path).resolve())
        return {"link": abs_path}
        
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
        # Check for video input
        ext = Path(file.filename).suffix.lower()
        if ext in VIDEO_EXTS:
            return await _transcribe_video(file, request)
        
        # Validate uploaded file format
        _validate_audio_file(file)
        
        # Process uploaded file to numpy array
        audio_data, sample_rate = await _process_audio_upload(file)
        
        # Save audio data temporarily with .wav extension for processing
        temp_path = f"temp_{Path(file.filename).stem}.wav"
        sf.write(temp_path, audio_data, sample_rate)
        
        try:
            # Transcribe to text if requested
            if request and getattr(request, 'output_format', '') == "text":
                tgt_sr = request.target_sample_rate if getattr(request, 'target_sample_rate', None) else WHISPER_SAMPLE_RATE
                transcript = transcribe_audio_to_text(temp_path, target_sample_rate=tgt_sr)
                return {"text": transcript}
            # Transcribe to SRT
            chunk_dur = request.chunk_duration if request and getattr(request, 'chunk_duration', None) else DEFAULT_CHUNK_DURATION  # now defaults to 5s
            tgt_sr = request.target_sample_rate if request and getattr(request, 'target_sample_rate', None) else WHISPER_SAMPLE_RATE
            srt_path = transcribe_audio_to_srt(temp_path, chunk_duration=chunk_dur, target_sample_rate=tgt_sr)
            
            # Generate unique filename for SRT with proper extension
            unique_filename = f"transcript_{uuid.uuid4().hex[:8]}.srt"
            output_path = Path("assets/public") / unique_filename
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy SRT file to public directory
            shutil.copy2(srt_path, output_path)
            
            # Clean up temporary SRT file
            os.remove(srt_path)
            
            # Return absolute path to SRT file
            abs_path = str(output_path.resolve())
            return {"link": abs_path}
            
        finally:
            # Clean up temporary audio file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/api/audio/remove-noise-video")
async def api_audio_remove_noise_video(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Remove noise from uploaded video file.
    
    Args:
        file: Uploaded video file (MP4, etc.)
        
    Returns:
        JSON object containing download link to processed video
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Validate uploaded file format
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in VIDEO_EXTS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported video format. Supported format: MP4"
            )
        
        # Handle noise removal for a video file: extract audio, apply noise removal, recombine.
        # Save uploaded video and extract audio
        temp_video = await _save_upload_to_temp(file, 'video')
        temp_audio = f"{Path(temp_video).stem}_audio.wav"
        _extract_audio_from_video(temp_video, temp_audio)

        # Apply noise removal on extracted audio
        enhanced_audio = remove_noise(temp_audio)

        # Save enhanced audio to temp file
        temp_enhanced = f"{Path(temp_video).stem}_enhanced.wav"
        sf.write(temp_enhanced, enhanced_audio, 48000)

        # Recombine enhanced audio with original video (strip original audio)
        unique_video_name = f"denoised_{uuid.uuid4().hex[:8]}.mp4"
        output_path = Path("assets/public") / unique_video_name
        output_path.parent.mkdir(parents=True, exist_ok=True)

        subprocess.run([
            'ffmpeg', '-y', '-i', temp_video,
            '-i', temp_enhanced,
            '-c:v', 'copy', '-map', '0:v:0', '-map', '1:a:0', '-shortest',
            str(output_path)
        ], check=True)

        # Cleanup temporary files
        os.remove(temp_video)
        os.remove(temp_audio)
        os.remove(temp_enhanced)

        # Return absolute path to processed video
        abs_path = str(output_path.resolve())
        return {"link": abs_path}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video processing failed: {str(e)}")


@router.post("/api/audio/transcribe-video")
async def api_audio_transcribe_video(
    file: UploadFile = File(...),
    request: TranscriptionRequest = None
) -> Dict[str, Any]:
    """
    Transcribe audio from an uploaded video file to text or SRT format.
    
    Args:
        file: Uploaded video file (MP4, etc.)
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
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in VIDEO_EXTS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported video format. Supported format: MP4"
            )
        
        # Handle transcription for a video file: extract audio, transcribe, return result.
        # Save uploaded video and extract audio
        temp_video = await _save_upload_to_temp(file, 'video')
        temp_audio = f"{Path(temp_video).stem}_audio.wav"
        # Determine extraction sample rate, fallback if no request provided
        ext_sr = request.target_sample_rate if request and getattr(request, 'target_sample_rate', None) else WHISPER_SAMPLE_RATE
        _extract_audio_from_video(temp_video, temp_audio, sample_rate=ext_sr)

        try:
            # Transcribe to text if requested
            if request and getattr(request, 'output_format', '') == 'text':
                tgt_sr = request.target_sample_rate if getattr(request, 'target_sample_rate', None) else WHISPER_SAMPLE_RATE
                transcript = transcribe_audio_to_text(temp_audio, target_sample_rate=tgt_sr)
                return {"text": transcript}
            # Otherwise generate SRT
            chunk_dur = request.chunk_duration if request and getattr(request, 'chunk_duration', None) else DEFAULT_CHUNK_DURATION  # now defaults to 5s
            tgt_sr = request.target_sample_rate if request and getattr(request, 'target_sample_rate', None) else WHISPER_SAMPLE_RATE
            srt_path = transcribe_audio_to_srt(temp_audio, chunk_duration=chunk_dur, target_sample_rate=tgt_sr)
            unique_srt = f"transcript_{uuid.uuid4().hex[:8]}.srt"
            public_dir = Path("assets/public")
            public_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(srt_path, public_dir / unique_srt)
            os.remove(srt_path)
            # Return absolute path to SRT file
            abs_path = str((public_dir / unique_srt).resolve())
            return {"link": abs_path}
        finally:
            # Cleanup temporary files
            for fpath in [temp_video, temp_audio]:
                try:
                    os.remove(fpath)
                except OSError:
                    pass
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video transcription failed: {str(e)}")


target_sr = TARGET_SAMPLE_RATE  # import from models.audio

async def _remove_noise_from_video(file: UploadFile) -> str:
    """
    Extract audio from video, remove noise, recombine, and return public URL.
    """
    temp_video = await _save_upload_to_temp(file, 'video')
    temp_audio = f"{Path(temp_video).stem}_audio.wav"
    _extract_audio_from_video(temp_video, temp_audio, sample_rate=TARGET_SAMPLE_RATE)

    # Apply noise removal
    enhanced_audio = remove_noise(temp_audio)

    # Save enhanced audio
    temp_enhanced = f"{Path(temp_video).stem}_enhanced.wav"
    sf.write(temp_enhanced, enhanced_audio, TARGET_SAMPLE_RATE)

    # Recombine enhanced audio with original video
    unique_name = f"denoised_{uuid.uuid4().hex[:8]}.mp4"
    public_dir = Path("assets/public")
    public_dir.mkdir(parents=True, exist_ok=True)
    output_video = public_dir / unique_name
    subprocess.run([
        'ffmpeg', '-y', '-i', temp_video,
        '-i', temp_enhanced,
        '-c:v', 'copy', '-map', '0:v:0', '-map', '1:a:0', '-shortest',
        str(output_video)
    ], check=True)

    # Cleanup temp files
    for fpath in [temp_video, temp_audio, temp_enhanced]:
        try:
            os.remove(fpath)
        except OSError:
            pass

    # Return absolute path to processed video
    return str(output_video.resolve())


async def _transcribe_video(file: UploadFile, request: TranscriptionRequest) -> Dict[str, Any]:
    """
    Extract audio from video, transcribe, and return text or SRT link.
    """
    temp_video = await _save_upload_to_temp(file, 'video')
    temp_audio = f"{Path(temp_video).stem}_audio.wav"
    # Determine extraction sample rate, fallback if no request provided
    ext_sr = request.target_sample_rate if request and getattr(request, 'target_sample_rate', None) else WHISPER_SAMPLE_RATE
    _extract_audio_from_video(temp_video, temp_audio, sample_rate=ext_sr)

    try:
        # Transcribe to text if requested
        if request and getattr(request, 'output_format', '') == 'text':
            tgt_sr = request.target_sample_rate if getattr(request, 'target_sample_rate', None) else WHISPER_SAMPLE_RATE
            transcript = transcribe_audio_to_text(temp_audio, target_sample_rate=tgt_sr)
            return {"text": transcript}
        # Transcribe to SRT
        chunk_dur = request.chunk_duration if request and getattr(request, 'chunk_duration', None) else DEFAULT_CHUNK_DURATION  # now defaults to 5s
        tgt_sr = request.target_sample_rate if request and getattr(request, 'target_sample_rate', None) else WHISPER_SAMPLE_RATE
        srt_path = transcribe_audio_to_srt(temp_audio, chunk_duration=chunk_dur, target_sample_rate=tgt_sr)
        unique_srt = f"transcript_{uuid.uuid4().hex[:8]}.srt"
        public_dir = Path("assets/public")
        public_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(srt_path, public_dir / unique_srt)
        os.remove(srt_path)
        # Return absolute path to SRT file
        abs_path = str((public_dir / unique_srt).resolve())
        return {"link": abs_path}
    finally:
        for fpath in [temp_video, temp_audio]:
            try:
                os.remove(fpath)
            except OSError:
                pass
