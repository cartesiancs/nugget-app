import os
import subprocess
import uuid
import logging
import cv2
import numpy as np
from vidstab import VidStab
from typing import Tuple
import sys
from pathlib import Path
from datetime import datetime
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.logging import RichHandler

# Add the project root to the Python path to import from models
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Initialize Rich console
console = Console()

# Configure logging with Rich
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(console=console, rich_tracebacks=True)]
)
logger = logging.getLogger(__name__)

def generate_unique_filename(extension: str = "mov") -> str:
    """
    Generate unique filename with specified extension.
    
    Args:
        extension: File extension (default: "mov")
    Returns:
        Unique filename string
    """
    filename = f"{uuid.uuid4().hex}.{extension}"
    logger.debug(f"[cyan]🏷️  Generated unique filename: {filename}[/cyan]")
    return filename


def extract_video_clip(input_path: str, start_time: float, end_time: float, output_path: str) -> bool:
    """
    Extract video clip using FFmpeg with specified time range and convert to MOV with H264.
    
    Args:
        input_path: Path to input video file
        start_time: Start timestamp in seconds
        end_time: End timestamp in seconds 
        output_path: Path for output video clip
    Returns:
        Boolean indicating success/failure
    """
    console.print(f"[bold cyan]✂️  Extracting clip from {Path(input_path).name} ({start_time}s - {end_time}s)[/bold cyan]")
    console.print(f"[cyan]🎬 Converting to MOV with H264[/cyan]")
    
    try:
        cmd = [
            "ffmpeg", "-i", input_path, "-ss", str(start_time),
            "-to", str(end_time), "-c:v", "libx264", 
            "-preset", "medium", "-crf", "23", "-c:a", "aac", "-y", output_path
        ]
        console.print(f"[dim]🔧 Running: {' '.join(cmd)}[/dim]")
        
        # Stream FFmpeg output
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, 
                                 universal_newlines=True, bufsize=1)
        
        with console.status("[bold green]Extracting and converting to MOV..."):
            for line in process.stdout:
                if line.strip():
                    logger.debug(f"[dim]📺 {line.strip()}[/dim]")
        
        process.wait()
        
        if process.returncode == 0:
            console.print(f"[bold green]✅ Video clip extracted and converted to MOV[/bold green]")
            return True
        else:
            console.print(f"[bold red]❌ FFmpeg extraction failed with return code {process.returncode}[/bold red]")
            return False
            
    except Exception as e:
        console.print(f"[bold red]💥 Unexpected error during video extraction: {str(e)}[/bold red]")
        return False


def convert_to_mov(input_path: str, output_path: str) -> bool:
    """
    Convert video to MOV format with H264 encoding.
    
    Args:
        input_path: Path to input video file
        output_path: Path for output MOV file
    Returns:
        Boolean indicating success/failure
    """
    console.print(f"[bold blue]🔄 Converting to MOV format[/bold blue]")
    
    try:
        cmd = [
            "ffmpeg", "-i", input_path, "-c:v", "libx264", 
            "-c:a", "aac", "-movflags", "+faststart", "-y", output_path
        ]
        console.print(f"[dim]🔧 Running: {' '.join(cmd)}[/dim]")
        
        # Stream FFmpeg output
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, 
                                 universal_newlines=True, bufsize=1)
        
        with console.status("[bold blue]Converting video format..."):
            for line in process.stdout:
                if line.strip():
                    logger.debug(f"[dim]📺 {line.strip()}[/dim]")
        
        process.wait()
        
        if process.returncode == 0:
            console.print(f"[bold green]✅ Video converted successfully[/bold green]")
            return True
        else:
            console.print(f"[bold red]❌ FFmpeg conversion failed with return code {process.returncode}[/bold red]")
            return False
            
    except Exception as e:
        console.print(f"[bold red]💥 Unexpected error during video conversion: {str(e)}[/bold red]")
        return False


def stabilize_video(input_path: str, output_path: str) -> bool:
    """
    Stabilize video using VidStab library with ORB keypoint detection.
    
    Args:
        input_path: Path to input video file
        output_path: Path for output stabilized video
    Returns:
        Boolean indicating success/failure
    """
    console.print(f"[bold magenta]🎯 Stabilizing video: {Path(input_path).name}[/bold magenta]")
    console.print(f"[cyan]🔍 Method: ORB keypoint detection with reflect border[/cyan]")
    
    try:
        # Create temp output with .avi extension since VidStab works best with AVI
        temp_output = output_path.replace('.mov', '_temp.avi')
        
        # Initialize VidStab with ORB keypoint detection
        stabilizer = VidStab(kp_method='ORB')
        
        # Initialize video capture for frame-by-frame processing
        vidcap = cv2.VideoCapture(input_path)
        frame_count = 0
        
        frames = []
        while True:
            grabbed_frame, frame = vidcap.read()
            
            if frame is not None:
                # Perform any pre-processing of frame before stabilization here
                pass
            
            # Pass frame to stabilizer even if frame is None
            # stabilized_frame will be an all black frame until iteration 30
            stabilized_frame = stabilizer.stabilize_frame(input_frame=frame,
                                                        smoothing_window=30)
            
            if stabilized_frame is None:
                # There are no more frames available to stabilize
                break
            
            # Save stabilized frame to tmp directory with current timestamp
            if stabilized_frame is not None and frame_count > 30:  # Only save after stabilization kicks in
                mask = stabilizer.get_mask(stabilized_frame)
                current_time = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]  # microseconds to milliseconds
                frame_filename = f"tmp/{current_time}.jpeg"
                
                # Ensure tmp directory exists
                os.makedirs("tmp", exist_ok=True)
                
                # Save the frame
                if cv2.imwrite(frame_filename, stabilized_frame):
                    logger.debug(f"[cyan]💾 Saved stabilized frame: {frame_filename}[/cyan]")
                else:
                    logger.warning(f"[yellow]⚠️  Failed to save frame: {frame_filename}[/yellow]")
            
            frame_count += 1
        
        # Clean up video capture
        vidcap.release()
        
        with console.status("[bold green]Running stabilization process (this may take a while)..."):
            stabilizer.stabilize(
                input_path=input_path, 
                output_path=temp_output,
                border_type='reflect'
            )
        
        # If output should be MOV, convert using FFmpeg
        if output_path.endswith('.mov') and temp_output != output_path:
            console.print(f"[cyan]🔄 Converting to MOV format...[/cyan]")
            
            cmd = [
                "ffmpeg", "-i", temp_output, "-c:v", "libx264",
                "-preset", "medium", "-crf", "23", "-c:a", "aac", "-y", output_path
            ]
            console.print(f"[dim]🔧 Running: {' '.join(cmd)}[/dim]")
            
            # Stream FFmpeg output
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, 
                                     universal_newlines=True, bufsize=1)
            
            with console.status("[bold blue]Converting to MOV format..."):
                for line in process.stdout:
                    if line.strip():
                        logger.debug(f"[dim]📺 {line.strip()}[/dim]")
            
            process.wait()
            
            if process.returncode == 0:
                # Remove temp file and keep final output
                os.remove(temp_output)
                console.print("[green]✅ Successfully converted to MOV format[/green]")
            else:
                console.print(f"[yellow]⚠️  MOV conversion failed, keeping AVI format[/yellow]")
                # Rename temp file to final output if conversion fails
                os.rename(temp_output, output_path.replace('.mov', '.avi'))
        
        console.print(f"[bold green]✅ Video stabilized successfully: {Path(output_path).name}[/bold green]")
        return True
        
    except Exception as e:
        console.print(f"[bold red]❌ Video stabilization failed: {str(e)}[/bold red]")
        console.print("[yellow]💡 Check if input file exists and is a valid video format[/yellow]")
        return False


def ensure_directories_exist() -> None:
    """
    Ensure required directories exist for video processing.
    Creates tmp and assets/public directories if they don't exist.
    """
    directories = ["tmp", "assets/public"]
    console.print("[bold blue]📂 Checking directories...[/bold blue]")
    
    for directory in directories:
        if not os.path.exists(directory):
            console.print(f"[cyan]📁 Creating directory: {directory}[/cyan]")
            os.makedirs(directory, exist_ok=True)
        else:
            logger.debug(f"[dim]✅ Directory already exists: {directory}[/dim]")
    
    console.print("[bold green]✅ All directories ready[/bold green]")


def get_absolute_path(relative_path: str) -> str:
    """
    Convert relative path to absolute path.
    
    Args:
        relative_path: Relative file path
    Returns:
        Absolute file path
    """
    absolute_path = os.path.abspath(relative_path)
    logger.debug(f"📍 Converted {relative_path} to absolute path: {absolute_path}")
    return absolute_path


def cleanup_temp_files(*file_paths: str) -> None:
    """
    Clean up temporary files after processing.
    
    Args:
        *file_paths: Variable number of file paths to delete
    """
    console.print(f"[bold yellow]🧹 Cleaning up {len(file_paths)} temporary files...[/bold yellow]")
    
    for file_path in file_paths:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.debug(f"[dim]🗑️  Deleted: {Path(file_path).name}[/dim]")
            except Exception as e:
                logger.warning(f"[yellow]⚠️  Failed to delete {Path(file_path).name}: {str(e)}[/yellow]")
        else:
            logger.debug(f"[dim]⏭️  File doesn't exist (already cleaned?): {Path(file_path).name}[/dim]")
    
    console.print("[bold green]✅ Cleanup completed[/bold green]")
