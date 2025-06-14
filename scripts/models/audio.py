#!/usr/bin/env python3
"""
Audio processing models for various audio tasks.

This module provides implementations for various audio processing tasks including:
- Noise removal (DeepFilter)
- Text to speech
- Audio transcription

All functions are implemented with modular design and proper type hints.
Author: Audio Processing AI System
"""

import os
import torch
import numpy as np
import soundfile as sf
import librosa
from pathlib import Path
from typing import Union, Optional, Tuple
import warnings
from df import enhance, init_df

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# Type aliases for better readability
AudioType = Union[str, Path, np.ndarray]
AudioArray = np.ndarray
def _validate_audio_input(audio: AudioType) -> Tuple[np.ndarray, int]:
    """
    Validate and convert audio input to numpy array format.
    Handles WAV and MP3 files and ensures audio is at 48kHz sample rate.
    """
    TARGET_SAMPLE_RATE = 48000  # DeepFilter expects 48kHz audio
    
    if isinstance(audio, (str, Path)):
        if not os.path.exists(audio):
            raise FileNotFoundError(f"Audio file not found: {audio}")
        
        file_path = str(audio)
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.mp3':
            # Load MP3 using librosa and resample to 48kHz
            print(f"Loading MP3 file and converting to 48kHz: {file_path}")
            audio_data, sample_rate = librosa.load(file_path, sr=TARGET_SAMPLE_RATE)
        else:
            # Load WAV or other formats using soundfile
            audio_data, sample_rate = sf.read(file_path)
            
            # Resample if needed
            if sample_rate != TARGET_SAMPLE_RATE:
                print(f"Resampling audio from {sample_rate}Hz to {TARGET_SAMPLE_RATE}Hz")
                audio_data = librosa.resample(
                    audio_data,
                    orig_sr=sample_rate,
                    target_sr=TARGET_SAMPLE_RATE
                )
                sample_rate = TARGET_SAMPLE_RATE
                
        return audio_data, sample_rate
    elif isinstance(audio, np.ndarray):
        # Assuming default sample rate of 48000 Hz for numpy arrays
        return audio, TARGET_SAMPLE_RATE
    else:
        raise TypeError(f"Unsupported audio type: {type(audio)}")
        raise TypeError(f"Unsupported audio type: {type(audio)}")

def _load_df_model():
    """Load DeepFilter model and state."""
    model, df_state, _ = init_df()  # Load default model
    return model, df_state

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
        TypeError: If input audio format is not supported
        RuntimeError: If noise removal processing fails
    """
    try:
        # Load and validate audio
        audio_data, sample_rate = _validate_audio_input(audio)
    
        model, df_state = _load_df_model()
        
        # Convert numpy array to PyTorch tensor before processing
        audio_tensor = torch.from_numpy(audio_data).float()
        
        if audio_tensor.dim() == 1:
            audio_tensor = audio_tensor.unsqueeze(0)  # Add channel dimension [samples] -> [1, samples]
        
        enhanced_audio = enhance(model, df_state, audio_tensor)
        
        # If enhanced_audio is a tensor, convert back to numpy
        if isinstance(enhanced_audio, torch.Tensor):
            enhanced_audio = enhanced_audio.squeeze().numpy()
        
        if output_path:
            sf.write(output_path, enhanced_audio, sample_rate)
            return output_path
        else:
            return enhanced_audio
            
    except Exception as e:
        raise RuntimeError(f"Noise removal failed: {str(e)}")

def main() -> None:
    """Main function for testing the module."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Audio processing module")
    parser.add_argument("--input", required=True, help="Input audio file path")
    parser.add_argument("--output", help="Output audio file path")
    parser.add_argument("--task", choices=["remove-noise"], required=True, help="Task to perform")
    
    args = parser.parse_args()
    
    if args.task == "remove-noise":
        result = remove_noise(args.input, args.output)
        print(f"Processing complete. Result saved to: {result}")

if __name__ == "__main__":
    main()
