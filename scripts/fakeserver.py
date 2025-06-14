from http.client import HTTPException
from pydantic import BaseModel
from requests import Request
import requests
from fastapi import APIRouter
from typing import Optional, Dict, Any
import base64
import tempfile
import os
import ffmpeg

router = APIRouter()


class LLMRequest(BaseModel):
    command: str
    context: Optional[dict] = None

class AudioDataRequest(BaseModel):
    audioData: str

@router.post("/api/transcribe")
async def transcribeAudio(request: AudioDataRequest): # Updated type hint
    """
    Endpoint to handle audio transcription requests.
    
    Args:
        request (AudioDataRequest): The incoming request containing audio data.
        
    Returns:
        dict: A dictionary with the transcription result.
    """
    print("Received audio data for transcription")
    
    webm_path = None
    wav_path = None
    
    try:
        # Clean and validate base64 audio data
        print("Cleaning and decoding base64 audio data...")
        audio_data = request.audioData
        
        # Remove data URL prefix if present (e.g., "data:audio/webm;base64,")
        if audio_data.startswith('data:'):
            audio_data = audio_data.split(',', 1)[1]
        
        # Remove any whitespace
        audio_data = audio_data.strip()
        
        # Add padding if necessary
        missing_padding = len(audio_data) % 4
        if missing_padding:
            audio_data += '=' * (4 - missing_padding)
        
        print(f"Cleaned base64 string length: {len(audio_data)}")
        print(f"First 50 chars: {audio_data[:50]}")
        
        try:
            audio_bytes = base64.b64decode(audio_data)
            print(f"Decoded {len(audio_bytes)} bytes of audio data")
        except Exception as decode_error:
            print(f"Base64 decode error: {decode_error}")
            return {"error": f"Invalid base64 audio data: {str(decode_error)}"}
        
        # Check if we have any data
        if len(audio_bytes) == 0:
            return {"error": "No audio data received after decoding"}
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as webm_temp:
            webm_temp.write(audio_bytes)
            webm_path = webm_temp.name
        
        print(f"Saved webm to: {webm_path}")
        
        # Check webm file size
        webm_size = os.path.getsize(webm_path)
        print(f"WebM file size: {webm_size} bytes")
        
        # Create output WAV file path
        wav_path = webm_path.replace('.webm', '.wav')
        print(f"Output WAV path: {wav_path}")
        
        # Convert webm to WAV using ffmpeg
        print("Starting ffmpeg conversion...")
        try:
            (
                ffmpeg
                .input(webm_path)
                .output(wav_path, acodec='pcm_s16le', ar=16000)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            print("FFmpeg conversion completed successfully")
            
        except ffmpeg.Error as e:
            print(f"FFmpeg error occurred:")
            print(f"stdout: {e.stdout.decode() if e.stdout else 'None'}")
            print(f"stderr: {e.stderr.decode() if e.stderr else 'None'}")
            raise Exception(f"FFmpeg conversion failed: {e.stderr.decode() if e.stderr else str(e)}")
        
        print(f"Converted audio saved to: {wav_path}")
        
        # Check if WAV file was created and has content
        if os.path.exists(wav_path):
            wav_size = os.path.getsize(wav_path)
            print(f"WAV file created successfully, size: {wav_size} bytes")
        else:
            raise Exception("WAV file was not created")
        
        # Clean up temporary webm file
        if webm_path and os.path.exists(webm_path):
            os.unlink(webm_path)
            print("Cleaned up temporary webm file")
        
        # TODO: Use the WAV file for actual transcription
        
        return {"data": "hi cuti i got transcribed aww cute", "wav_path": wav_path}
        
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        print(f"Exception type: {type(e)}")
        
        # Clean up files on error
        if webm_path and os.path.exists(webm_path):
            try:
                os.unlink(webm_path)
                print("Cleaned up webm file after error")
            except:
                pass
        
        if wav_path and os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
                print("Cleaned up wav file after error")
            except:
                pass
        
        return {"error": f"Failed to process audio: {str(e)}"}


@router.post("/api/llm")
async def getResponseFromLlama3(request: LLMRequest):
    try:
        print("request for llm:", request.command, request.context)
        
        if request.command == "sr":
            fppp = request.context["preview"]["selectedData"]["localpath"]
            if "file://" in fppp:
                filepath = fppp[7:]
            else:
                filepath = fppp

            print(filepath)

            target_url = "http://localhost:5151/api/image/super-resolution"
            
            headers = {
                "accept": "application/json",
            }

            try:
                with open(filepath, "rb") as f:
                    files = {
                        "file": (filepath.split('/')[-1], f, "image/jpeg") # Or appropriate content type
                    }
                    
                    # Make the POST request to the other service
                    response_from_service = requests.post(target_url, headers=headers, files=files)
                    
                    print(f"Response from {target_url}: {response_from_service.status_code}")
                    # You might want to process response_from_service.json() or .text here

                    print(response_from_service.json())

            except FileNotFoundError:
                raise HTTPException(status_code=404, detail=f"File not found: {filepath}")
            except requests.RequestException as e:
                # This catches errors from the requests.post call to the other service
                raise HTTPException(
                    status_code=502, # Bad Gateway, as this service acts as a gateway
                    detail=f"Error communicating with image service at {target_url}: {str(e)}"
                )
            
            return {"type": "sr", "data": {"outpath": response_from_service.json()["path"]}}
        elif request.command == "cg":
            fppp = request.context["preview"]["selectedData"]["localpath"]

            if "file://" in fppp:
                filepath = fppp[7:]
            else:
                filepath = fppp

            print(filepath)

            target_url = "http://localhost:5151/api/image/portrait-effect"
            
            headers = {
                "accept": "application/json",
            }

            try:
                with open(filepath, "rb") as f:
                    files = {
                        "file": (filepath.split('/')[-1], f, "image/jpeg") # Or appropriate content type
                    }
                    
                    # Make the POST request to the other service
                    response_from_service = requests.post(target_url, headers=headers, files=files)
                    
                    print(f"Response from {target_url}: {response_from_service.status_code}")
                    # You might want to process response_from_service.json() or .text here

                    print(response_from_service.json())

            except FileNotFoundError:
                raise HTTPException(status_code=404, detail=f"File not found: {filepath}")
            except requests.RequestException as e:
                # This catches errors from the requests.post call to the other service
                raise HTTPException(
                    status_code=502, # Bad Gateway, as this service acts as a gateway
                    detail=f"Error communicating with image service at {target_url}: {str(e)}"
                )
            
            return {"type": "sr", "data": {"outpath": response_from_service.json()["path"]}} 
        else:
            return {"type": "unknown"}

    
    except HTTPException as e: # Re-raise HTTPExceptions to be handled by FastAPI
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
