#!/usr/bin/env python3
"""
Audio processing models for various audio tasks.

This module provides implementations for various audio processing tasks including:
- Noise removal (DeepFilter)
- Text to speech (Bark)
- Audio transcription (Whisper with SRT/VTT/TXT output)

All functions are implemented with modular design and proper type hints.
Author: Audio Processing AI System
"""

import os
import torch
import numpy as np
import soundfile as sf
import librosa
from pathlib import Path
from typing import Union, Optional, Tuple, List, Dict, Any
import warnings
import datetime
from df import enhance, init_df
from transformers import AutoProcessor, BarkModel
# from torch.serialization import safe_globals
from .model import WhisperBaseEnONNX
from .WhisperApp import WhisperApp

# Try to import yaml, but make it optional
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# Type aliases for better readability
AudioType = Union[str, Path, np.ndarray]
AudioArray = np.ndarray
ConfigDict = Dict[str, Any]

# Constants
TARGET_SAMPLE_RATE = 48000  # DeepFilter expects 48kHz audio
WHISPER_SAMPLE_RATE = 16000  # Whisper expects 16kHz audio
DEFAULT_CHUNK_DURATION = 15.0  # Default chunk duration for transcription

class AudioProcessingError(Exception):
    """Base exception class for audio processing errors."""
    pass

class ModelLoadingError(AudioProcessingError):
    """Exception raised when model loading fails."""
    pass

class AudioValidationError(AudioProcessingError):
    """Exception raised when audio validation fails."""
    pass

def _load_config() -> ConfigDict:
    """
    Load configuration from YAML file if available.
    
    Returns:
        Dictionary containing configuration values
    """
    config = {}
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml")
    if HAS_YAML and os.path.exists(config_path):
        with open(config_path, "r") as f:
            config = yaml.safe_load(f) or {}
    return config

def _validate_audio_input(audio: AudioType) -> Tuple[np.ndarray, int]:
    """
    Validate and convert audio input to numpy array format.
    
    Args:
        audio: Input audio as file path or numpy array
        
    Returns:
        Tuple of (audio_data, sample_rate)
        
    Raises:
        AudioValidationError: If audio validation fails
    """
    try:
        if isinstance(audio, (str, Path)):
            if not os.path.exists(audio):
                raise AudioValidationError(f"Audio file not found: {audio}")
            
            file_path = str(audio)
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext == '.mp3':
                audio_data, sample_rate = librosa.load(file_path, sr=TARGET_SAMPLE_RATE)
            else:
                audio_data, sample_rate = sf.read(file_path)
                
                if sample_rate != TARGET_SAMPLE_RATE:
                    audio_data = librosa.resample(
                        audio_data,
                        orig_sr=sample_rate,
                        target_sr=TARGET_SAMPLE_RATE
                    )
                    sample_rate = TARGET_SAMPLE_RATE
                    
            return audio_data, sample_rate
        elif isinstance(audio, np.ndarray):
            return audio, TARGET_SAMPLE_RATE
        else:
            raise AudioValidationError(f"Unsupported audio type: {type(audio)}")
    except Exception as e:
        raise AudioValidationError(f"Audio validation failed: {str(e)}")

def _load_df_model() -> Tuple[Any, Any]:
    """
    Load DeepFilter model and state.
    
    Returns:
        Tuple of (model, df_state)
        
    Raises:
        ModelLoadingError: If model loading fails
    """
    try:
        return init_df()
    except Exception as e:
        raise ModelLoadingError(f"Failed to load DeepFilter model: {str(e)}")

def remove_noise(audio: AudioType, output_path: Optional[str] = None) -> Union[np.ndarray, str]:
    """
    Remove noise from audio using DeepFilter.
    
    Args:
        audio: Input audio as file path or numpy array
        output_path: Optional path to save the processed audio
        
    Returns:
        If output_path is provided, returns the path to the saved audio file
        Otherwise, returns the processed audio as numpy array
        
    Raises:
        AudioProcessingError: If noise removal processing fails
    """
    try:
        audio_data, sample_rate = _validate_audio_input(audio)
        model, df_state, _ = _load_df_model()
        
        audio_tensor = torch.from_numpy(audio_data).float()
        if audio_tensor.dim() == 1:
            audio_tensor = audio_tensor.unsqueeze(0)
        
        enhanced_audio = enhance(model, df_state, audio_tensor)
        
        if isinstance(enhanced_audio, torch.Tensor):
            enhanced_audio = enhanced_audio.squeeze().numpy()
        
        if output_path:
            sf.write(output_path, enhanced_audio, sample_rate)
            return output_path
        return enhanced_audio
            
    except Exception as e:
        raise AudioProcessingError(f"Noise removal failed: {str(e)}")

def _load_bark_model() -> Tuple[Any, Any]:
    """
    Load Bark model and processor for text-to-speech.
    
    Returns:
        Tuple of (processor, model)
        
    Raises:
        ModelLoadingError: If model loading fails
    """
    try:
        processor = AutoProcessor.from_pretrained("suno/bark")
        model = BarkModel.from_pretrained("suno/bark")
        return processor, model
    except Exception as e:
        raise ModelLoadingError(f"Failed to load Bark model: {str(e)}")

def text_to_speech(text: str, output_path: Optional[str] = None, speaker: str = "v2/en_speaker_6") -> Union[np.ndarray, str]:
    """
    Convert text to speech using Bark.
    
    Args:
        text: Input text to convert to speech
        output_path: Optional path to save the generated audio
        speaker: Speaker voice to use
        
    Returns:
        If output_path is provided, returns the path to the saved audio file
        Otherwise, returns the generated audio as numpy array
        
    Raises:
        AudioProcessingError: If text-to-speech processing fails
    """
    try:
        processor, model = _load_bark_model()
        
        inputs = processor(text, voice_preset=speaker)
        audio_array = model.generate(**inputs)
        audio_array = audio_array.cpu().numpy().squeeze()
        
        if output_path:
            sf.write(output_path, audio_array, 24000)  # Bark uses 24kHz sample rate
            return output_path
        return audio_array
            
    except Exception as e:
        raise AudioProcessingError(f"Text-to-speech failed: {str(e)}")

def _format_timestamp(seconds: float, format_type: str = "vtt") -> str:
    """
    Format timestamp for subtitle files.
    
    Args:
        seconds: Time in seconds
        format_type: Format type ("vtt" or "srt")
        
    Returns:
        Formatted timestamp string
    """
    if format_type == "vtt":
        dt = datetime.timedelta(seconds=seconds)
        return str(dt)
    else:  # srt format
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millisecs = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def _load_whisper_model(encoder_path: str, decoder_path: str) -> WhisperApp:
    """
    Load Whisper model for transcription.
    
    Args:
        encoder_path: Path to the encoder ONNX model
        decoder_path: Path to the decoder ONNX model
        
    Returns:
        WhisperApp instance
        
    Raises:
        ModelLoadingError: If model loading fails
    """
    if not os.path.exists(encoder_path):
        raise ModelLoadingError(f"Encoder model not found at {encoder_path}")
    if not os.path.exists(decoder_path):
        raise ModelLoadingError(f"Decoder model not found at {decoder_path}")
    
    try:
        whisper_model = WhisperBaseEnONNX(encoder_path, decoder_path)
        return WhisperApp(whisper_model)
    except Exception as e:
        raise ModelLoadingError(f"Failed to load Whisper model: {str(e)}")

def _chunk_audio_for_transcription(audio_data: np.ndarray, sample_rate: int, chunk_duration: float = DEFAULT_CHUNK_DURATION) -> List[Tuple[np.ndarray, float, float]]:
    """
    Split audio into chunks for transcription with timestamps.
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        chunk_duration: Duration of each chunk in seconds
        
    Returns:
        List of tuples containing (audio_chunk, start_time, end_time)
    """
    chunk_samples = int(chunk_duration * sample_rate)
    chunks = []
    
    for i in range(0, len(audio_data), chunk_samples):
        start_sample = i
        end_sample = min(i + chunk_samples, len(audio_data))
        
        start_time = start_sample / sample_rate
        end_time = end_sample / sample_rate
        
        chunk = audio_data[start_sample:end_sample]
        chunks.append((chunk, start_time, end_time))
    
    return chunks

def _generate_srt_content(transcriptions: List[Tuple[str, float, float]]) -> str:
    """
    Generate SRT file content from transcriptions with timestamps.
    
    Args:
        transcriptions: List of tuples containing (text, start_time, end_time)
        
    Returns:
        SRT formatted string
    """
    srt_content = []
    
    for i, (text, start_time, end_time) in enumerate(transcriptions, 1):
        if text.strip():
            start_timestamp = _format_timestamp(start_time, "srt")
            end_timestamp = _format_timestamp(end_time, "srt")
            
            srt_content.append(f"{i}")
            srt_content.append(f"{start_timestamp} --> {end_timestamp}")
            srt_content.append(text.strip())
            srt_content.append("")
    
    return "\n".join(srt_content)

def _get_model_paths(config: ConfigDict, encoder_path: Optional[str], decoder_path: Optional[str]) -> Tuple[str, str]:
    """
    Get model paths from config or defaults.
    
    Args:
        config: Configuration dictionary
        encoder_path: Optional encoder path override
        decoder_path: Optional decoder path override
        
    Returns:
        Tuple of (encoder_path, decoder_path)
    """
    if encoder_path is None:
        default_encoder = config.get("encoder_path", "models/whisper/WhisperEncoder.onnx")
        encoder_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), default_encoder) if not os.path.isabs(default_encoder) else default_encoder
        
    if decoder_path is None:
        default_decoder = config.get("decoder_path", "models/whisper/WhisperDecoder.onnx")
        decoder_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), default_decoder) if not os.path.isabs(default_decoder) else default_decoder
        
    return encoder_path, decoder_path

def transcribe_audio_to_srt(
    audio_file: str,
    output_path: Optional[str] = None,
    encoder_path: Optional[str] = None,
    decoder_path: Optional[str] = None,
    chunk_duration: float = DEFAULT_CHUNK_DURATION,
    target_sample_rate: int = WHISPER_SAMPLE_RATE
) -> str:
    """
    Transcribe audio file and generate SRT subtitle file.
    
    Args:
        audio_file: Path to the input audio file
        output_path: Optional path for the output SRT file
        encoder_path: Path to Whisper encoder ONNX model
        decoder_path: Path to Whisper decoder ONNX model
        chunk_duration: Duration of each audio chunk in seconds
        target_sample_rate: Target sample rate for transcription
        
    Returns:
        Path to the generated SRT file
        
    Raises:
        AudioProcessingError: If transcription processing fails
    """
    try:
        config = _load_config()
        encoder_path, decoder_path = _get_model_paths(config, encoder_path, decoder_path)
        
        if output_path is None:
            base_name = os.path.splitext(os.path.basename(audio_file))[0]
            output_path = f"{base_name}.srt"
        
        if not os.path.exists(audio_file):
            raise AudioValidationError(f"Audio file not found: {audio_file}")
        
        audio_data, original_sample_rate = sf.read(audio_file)
        
        if original_sample_rate != target_sample_rate:
            audio_data = librosa.resample(
                audio_data,
                orig_sr=original_sample_rate,
                target_sr=target_sample_rate
            )
        
        whisper_app = _load_whisper_model(encoder_path, decoder_path)
        chunks = _chunk_audio_for_transcription(audio_data, target_sample_rate, chunk_duration)
        
        transcriptions = []
        for chunk, start_time, end_time in chunks:
            transcript = whisper_app.transcribe(chunk, target_sample_rate)
            if transcript.strip():
                transcriptions.append((transcript, start_time, end_time))
        
        srt_content = _generate_srt_content(transcriptions)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(srt_content)
        
        return output_path
        
    except Exception as e:
        raise AudioProcessingError(f"Audio transcription failed: {str(e)}")

def transcribe_audio_to_text(
    audio_file: str,
    encoder_path: Optional[str] = None,
    decoder_path: Optional[str] = None,
    target_sample_rate: int = WHISPER_SAMPLE_RATE
) -> str:
    """
    Transcribe audio file to plain text.
    
    Args:
        audio_file: Path to the input audio file
        encoder_path: Path to Whisper encoder ONNX model
        decoder_path: Path to Whisper decoder ONNX model
        target_sample_rate: Target sample rate for transcription
        
    Returns:
        Transcribed text as string
        
    Raises:
        AudioProcessingError: If transcription processing fails
    """
    try:
        config = _load_config()
        encoder_path, decoder_path = _get_model_paths(config, encoder_path, decoder_path)
        
        if not os.path.exists(audio_file):
            raise AudioValidationError(f"Audio file not found: {audio_file}")
        
        audio_data, original_sample_rate = sf.read(audio_file)
        
        if original_sample_rate != target_sample_rate:
            audio_data = librosa.resample(
                audio_data,
                orig_sr=original_sample_rate,
                target_sr=target_sample_rate
            )
        
        whisper_app = _load_whisper_model(encoder_path, decoder_path)
        transcript = whisper_app.transcribe(audio_data, target_sample_rate)
        
        return transcript.strip()
        
    except Exception as e:
        raise AudioProcessingError(f"Audio transcription failed: {str(e)}")

def main() -> None:
    """Main function for testing the module."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Audio processing module")
    parser.add_argument("--input", required=True, help="Input audio file path or text for TTS")
    parser.add_argument("--output", help="Output file path (audio file for TTS/noise removal, SRT file for transcription)")
    parser.add_argument("--task", choices=["remove-noise", "text-to-speech", "transcribe", "transcribe-srt", "transcribe-text"], required=True, help="Task to perform")
    parser.add_argument("--speaker", default="v2/en_speaker_6", help="Speaker voice for TTS")
    parser.add_argument("--output-vtt", help="Output VTT file path for transcription")
    parser.add_argument("--output-txt", help="Output TXT file path for transcription")
    parser.add_argument("--encoder-path", help="Path to Whisper encoder ONNX model")
    parser.add_argument("--decoder-path", help="Path to Whisper decoder ONNX model")
    parser.add_argument("--chunk-duration", type=float, default=DEFAULT_CHUNK_DURATION, help="Audio chunk duration for transcription")
    
    args = parser.parse_args()
    
    try:
        if args.task == "remove-noise":
            result = remove_noise(args.input, args.output)
            print(f"Processing complete. Result saved to: {result}")
        elif args.task == "text-to-speech":
            result = text_to_speech(args.input, args.output, args.speaker)
            print(f"Processing complete. Result saved to: {result}")
        elif args.task == "transcribe":
            result = transcribe_audio(args.input, args.output_vtt, args.output_txt)
            print(f"Transcription complete. Segments: {len(result)}")
        elif args.task == "transcribe-srt":
            result = transcribe_audio_to_srt(
                args.input, 
                args.output, 
                args.encoder_path, 
                args.decoder_path,
                args.chunk_duration
            )
            print(f"Transcription complete. SRT file saved to: {result}")
        elif args.task == "transcribe-text":
            result = transcribe_audio_to_text(
                args.input,
                args.encoder_path,
                args.decoder_path
            )
            print(f"Transcription complete. Text: {result}")
    except AudioProcessingError as e:
        print(f"Error: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()
