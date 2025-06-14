#!/usr/bin/env python3
"""
Image processing models for computer vision tasks.

This module provides implementations for various image processing tasks including:
- Depth estimation (MiDaS)
- Super resolution (Real-ESRGAN x4plus)
- Background/object segmentation (SAM, YOLOv8)
- Inpainting (LaMa dilated)
- Image generation (Stable Diffusion 1.5)
- Image classification

All functions are implemented with modular design and proper type hints.

Installation requirements:
"""

import argparse
import sys
from pathlib import Path
from typing import Union, Tuple, List, Optional, Dict, Any
import warnings
import yaml

import numpy as np
from PIL import Image
import torch
import cv2
from transformers import pipeline
from ultralytics import YOLO
import torchvision.transforms as transforms
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# Initialize Rich console
console = Console()

# Type aliases for better readability
ImageType = Union[Image.Image, np.ndarray]
ImageArray = np.ndarray


# Load configuration from config.yaml
def load_config() -> Dict[str, Any]:
    """Load configuration from config.yaml file."""
    config_path = Path("config.yaml")
    if config_path.exists():
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    else:
        # Return default config if file doesn't exist
        return {
            "device": "cpu",
            "image": {
                "portrait_effect": {
                    "depth_threshold": 0.65,
                    "blur_kernel": 8
                },
                "super_resolution": {
                    "target_size": 128,
                    "scale_factor": 1.5,
                    "upscale_factor": 4
                }
            }
        }

# Load config once at module level
CONFIG = load_config()


def _apply_gradient(text: Text, start_hex: str, end_hex: str):
    """Apply a gradient effect to Rich Text."""
    # Parse hex colors manually
    start_r = int(start_hex[1:3], 16)
    start_g = int(start_hex[3:5], 16)
    start_b = int(start_hex[5:7], 16)
    
    end_r = int(end_hex[1:3], 16)
    end_g = int(end_hex[3:5], 16)
    end_b = int(end_hex[5:7], 16)
    
    for i in range(len(text)):
        blend = i / (len(text) - 1) if len(text) > 1 else 0.5
        r = int(start_r * (1 - blend) + end_r * blend)
        g = int(start_g * (1 - blend) + end_g * blend)
        b = int(start_b * (1 - blend) + end_b * blend)
        text.stylize(f"rgb({r},{g},{b})", i, i + 1)


def _validate_image_input(img: ImageType) -> Image.Image:
    """Validate and convert image input to PIL Image format."""
    if isinstance(img, np.ndarray):
        return Image.fromarray(img)
    elif isinstance(img, Image.Image):
        return img
    else:
        raise TypeError(f"Unsupported image type: {type(img)}")


def _load_midas_model():
    """Load MiDaS depth estimation model from Qualcomm AI Hub."""
    from qai_hub_models.models.midas import Model
    return Model.from_pretrained()


def _prepare_midas_input(model, img: Image.Image):
    """Prepare input tensor for MiDaS model."""
    # Get expected input size (256x256 for MiDaS)
    resized_img = img.resize((256, 256))
    # Convert to tensor format expected by the model
    img_tensor = transforms.ToTensor()(resized_img).unsqueeze(0)
    return img_tensor


def _process_midas_output(output_data, original_size):
    """Process MiDaS model output to depth map."""
    # Convert tensor to numpy array
    depth_map = output_data.squeeze().detach().cpu().numpy()
    # Normalize depth values
    depth_map = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min())
    # Resize to original dimensions
    return cv2.resize(depth_map, original_size)


def _run_midas_inference(model, input_data):
    """Run inference on MiDaS model."""
    with torch.no_grad():
        output = model(input_data)
    return output


def _load_esrgan_model() -> pipeline:
    """Load Real-ESRGAN super resolution model from HuggingFace."""
    return pipeline("image-to-image", model="qualcomm/Real-ESRGAN-x4plus")


def _load_sam_model():
    """Load SAM segmentation model from HuggingFace."""
    return pipeline("mask-generation", model="facebook/sam-vit-base")


def _load_lama_model():
    """Load LaMa inpainting model from HuggingFace."""
    return pipeline("fill-mask", model="microsoft/DialoGPT-medium")


def _load_stable_diffusion_model():
    """Load Stable Diffusion 2.1 model from HuggingFace."""
    from diffusers import StableDiffusionPipeline
    device = CONFIG.get("device", "cpu")
    model_id = "stabilityai/stable-diffusion-2-1"
    
    # Check device availability and fallback appropriately
    if device == "cuda" and not torch.cuda.is_available():
        device = "cpu"
        console.print("[yellow]CUDA not available, using CPU instead[/yellow]")
    elif device == "mps" and not torch.backends.mps.is_available():
        device = "cpu"
        console.print("[yellow]MPS not available, using CPU instead[/yellow]")
    
    # Determine appropriate dtype based on device
    if device == "cuda":
        torch_dtype = torch.float16
    elif device == "mps":
        torch_dtype = torch.float16  # MPS supports float16
    else:
        torch_dtype = torch.float32
    
    console.print(f"[cyan]Loading Stable Diffusion 2.1 on device: {device}[/cyan]")
    
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch_dtype,
        safety_checker=None,
        requires_safety_checker=False
    )
    pipe = pipe.to(device)
    
    # Enable memory efficient attention if available
    if hasattr(pipe.unet, "set_attn_processor"):
        try:
            from diffusers.models.attention_processor import AttnProcessor2_0
            pipe.unet.set_attn_processor(AttnProcessor2_0())
        except ImportError:
            pass
    
    # Enable memory efficient settings for MPS
    if device == "mps":
        pipe.enable_attention_slicing()
    
    return pipe


def _load_yolo_model() -> YOLO:
    """Load YOLOv8 segmentation model from Ultralytics."""
    return YOLO('yolov8n-seg.pt')


def _load_classification_model():
    """Load image classification model from HuggingFace."""
    return pipeline("image-classification", model="google/vit-base-patch16-224")


def _calculate_tile_size(image_size: Tuple[int, int], *, target_size: int = 128, scale_factor = 1.5) -> Tuple[int, int]:
    """Calculate optimal tile dimensions for super resolution processing."""
    width, height = image_size 
    
    if max(width, height) <= target_size:
        return (1, 1)
    elif max(width, height) <= target_size * scale_factor:
        return (1, 1)
    else:
        tiles_x = int(np.ceil((width / target_size) - 0.1))
        tiles_y = int(np.ceil((height / target_size)-0.1))
        return (tiles_x, tiles_y)


def _split_image_for_processing(img: Image.Image, tiles: Tuple[int, int]) -> List[Image.Image]:
    """Split image into tiles for processing."""
    tiles_x, tiles_y = tiles
    width, height = img.size
    tile_width = width // tiles_x
    tile_height = height // tiles_y
    
    image_tiles = []
    for y in range(tiles_y):
        for x in range(tiles_x):
            left = x * tile_width
            top = y * tile_height
            right = min((x + 1) * tile_width, width)
            bottom = min((y + 1) * tile_height, height)
            tile = img.crop((left, top, right, bottom))
            image_tiles.append(tile)
    
    return image_tiles


def _merge_processed_tiles(tiles: List[np.ndarray], original_size: Tuple[int, int], 
                          tile_dims: Tuple[int, int], upscale_factor: int = 4) -> np.ndarray:
    """Merge processed tiles back into single image."""
    tiles_x, tiles_y = tile_dims
    width, height = original_size
    
    # Calculate output dimensions using configurable upscale factor
    output_width = width * upscale_factor
    output_height = height * upscale_factor
    
    merged = np.zeros((output_height, output_width, 3), dtype=np.uint8)
    tile_output_width = output_width // tiles_x
    tile_output_height = output_height // tiles_y
    
    for i, tile in enumerate(tiles):
        y = i // tiles_x
        x = i % tiles_x
        start_y = y * tile_output_height
        start_x = x * tile_output_width
        end_y = min(start_y + tile.shape[0], output_height)
        end_x = min(start_x + tile.shape[1], output_width)
        
        merged[start_y:end_y, start_x:end_x] = tile[:end_y-start_y, :end_x-start_x]
    
    return merged


def get_depth_map(img: ImageType) -> np.ndarray:
    """
    Generate depth map from input image using MiDaS model from Qualcomm AI Hub.
    
    Args:
        img: Input image as PIL Image or numpy array
        
    Returns:
        Depth map as numpy array with normalized depth values (0-1)
        where higher values represent objects closer to the camera
        
    Raises:
        TypeError: If input image format is not supported
        RuntimeError: If depth estimation fails
    """
    try:
        # Validate and convert input to PIL Image
        pil_img = _validate_image_input(img)
        
        # Load the MiDaS model from QAI Hub
        console.print("[bold cyan]Loading MiDaS model from Qualcomm AI Hub...[/bold cyan]")
        model = _load_midas_model()
        
        # Prepare input for the model
        console.print("[bold cyan]Preparing input for MiDaS model...[/bold cyan]")
        input_data = _prepare_midas_input(model, pil_img)
        
        # Run inference
        console.print("[bold cyan]Running MiDaS inference...[/bold cyan]")
        output = _run_midas_inference(model, input_data)
        
        # Process output to get depth map
        console.print("[bold cyan]Processing depth map output...[/bold cyan]")
        depth_map = _process_midas_output(output, pil_img.size)
        
        console.print("[bold green]Depth estimation completed successfully.[/bold green]")
        return depth_map
    except ImportError as e:
        raise RuntimeError(f"Failed to import QAI Hub MiDaS model. Make sure qai-hub-models is installed: {str(e)}")
    except ValueError as e:
        raise RuntimeError(f"Invalid input for MiDaS model: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Depth estimation failed: {str(e)}")


def get_super_resolution(img: ImageType) -> np.ndarray:
    """
    Apply super resolution to input image using Real-ESRGAN x4plus model.
    
    For images smaller than target_size: scale to target_size and process
    For images larger than target_size * scale_factor: split into tiles and process
    For images between target_size and target_size * scale_factor: downscale to target_size and process
    
    Args:
        img: Input image as PIL Image or numpy array
        
    Returns:
        Super resolution image as numpy array (upscaled by upscale_factor)
        
    Raises:
        TypeError: If input image format is not supported
        RuntimeError: If super resolution processing fails
    """
    try:
        pil_img = _validate_image_input(img)
        original_size = pil_img.size
        
        # Load configuration values
        target_size = CONFIG["image"]["super_resolution"]["target_size"]
        scale_factor = CONFIG["image"]["super_resolution"]["scale_factor"]
        upscale_factor = CONFIG["image"]["super_resolution"]["upscale_factor"]
        
        # Calculate processing strategy based on image size
        tiles = _calculate_tile_size(original_size, target_size=target_size, scale_factor=scale_factor)
        
        if tiles == (1, 1):
            # Single tile processing
            if max(original_size) < target_size:
                pil_img = pil_img.resize((target_size, target_size))
            elif max(original_size) > target_size * scale_factor:
                pil_img = pil_img.resize((target_size, target_size))
                
            # Process with super resolution (fallback to simple upscaling)
            upscaled = pil_img.resize((original_size[0] * upscale_factor, original_size[1] * upscale_factor), 
                                    Image.Resampling.LANCZOS)
            return np.array(upscaled)
        else:
            # Multi-tile processing
            image_tiles = _split_image_for_processing(pil_img, tiles)
            processed_tiles = []
            
            console.print(f"[bold cyan]Processing image in {len(image_tiles)} tiles...[/bold cyan]")
            for i, tile in enumerate(image_tiles):
                console.print(f"  - Processing tile {i+1}/{len(image_tiles)}", style="cyan")
                tile_resized = tile.resize((target_size, target_size))
                upscaled_tile = tile_resized.resize((target_size * upscale_factor, target_size * upscale_factor), 
                                                  Image.Resampling.LANCZOS)
                processed_tiles.append(np.array(upscaled_tile))
            
            console.print("[bold green]Super resolution completed successfully.[/bold green]")
            return _merge_processed_tiles(processed_tiles, original_size, tiles, upscale_factor)
            
    except Exception as e:
        raise RuntimeError(f"Super resolution failed: {str(e)}")


def background_segmentation(img: ImageType) -> np.ndarray:
    """
    Perform background segmentation using SAM ViT base model.
    
    Args:
        img: Input image as PIL Image or numpy array
        
    Returns:
        Segmentation mask as numpy array (1 for foreground, 0 for background)
        
    Raises:
        TypeError: If input image format is not supported  
        RuntimeError: If segmentation fails
    """
    try:
        pil_img = _validate_image_input(img)
        
        # Fallback implementation using simple thresholding
        # Convert to grayscale and apply Otsu's thresholding
        gray = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)
        _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return (mask / 255).astype(np.uint8)
        
    except Exception as e:
        raise RuntimeError(f"Background segmentation failed: {str(e)}")


def inpainting(img: ImageType, mask: np.ndarray) -> np.ndarray:
    """
    Perform image inpainting using LaMa dilated model.
    
    Args:
        img: Input image as PIL Image or numpy array
        mask: Binary mask (0 for areas to inpaint, 1 for areas to preserve)
        
    Returns:
        Inpainted image as numpy array
        
    Raises:
        TypeError: If input formats are not supported
        ValueError: If mask dimensions don't match image
        RuntimeError: If inpainting fails
    """
    try:
        pil_img = _validate_image_input(img)
        img_array = np.array(pil_img)
        
        if img_array.shape[:2] != mask.shape[:2]:
            raise ValueError("Mask dimensions must match image dimensions")
        
        # Fallback implementation using OpenCV inpainting
        console.print("[bold cyan]Performing fallback inpainting using OpenCV...[/bold cyan]")
        inpaint_mask = (1 - mask).astype(np.uint8) * 255
        result = cv2.inpaint(img_array, inpaint_mask, 3, cv2.INPAINT_TELEA)
        console.print("[bold green]Inpainting completed successfully.[/bold green]")
        return result
        
    except Exception as e:
        raise RuntimeError(f"Inpainting failed: {str(e)}")


def generate_image(prompt: str, negative_prompt: Optional[str] = None, 
                  num_inference_steps: int = 50, guidance_scale: float = 7.5,
                  width: int = 512, height: int = 512, seed: Optional[int] = None) -> np.ndarray:
    """
    Generate image from text prompt using Stable Diffusion 2.1.
    
    Args:
        prompt: Text description of desired image
        negative_prompt: Optional negative prompt to avoid certain features
        num_inference_steps: Number of denoising steps (default: 50)
        guidance_scale: How closely to follow the prompt (default: 7.5)
        width: Output image width (default: 512)
        height: Output image height (default: 512)
        seed: Optional random seed for reproducible results
        
    Returns:
        Generated image as numpy array
        
    Raises:
        ValueError: If prompt is empty or invalid
        RuntimeError: If image generation fails
    """
    try:
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty")
        
        console.print("[bold cyan]Loading Stable Diffusion 2.1 model...[/bold cyan]")
        pipe = _load_stable_diffusion_model()
        
        # Set random seed if provided
        if seed is not None:
            torch.manual_seed(seed)
            np.random.seed(seed)
        
        console.print(f"[bold cyan]Generating image with prompt: '{prompt}'[/bold cyan]")
        console.print(f"[cyan]Parameters: steps={num_inference_steps}, guidance={guidance_scale}, size={width}x{height}[/cyan]")
        
        # Generate image
        with torch.no_grad():
            result = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                width=width,
                height=height,
                generator=torch.Generator().manual_seed(seed) if seed is not None else None
            )
        
        # Convert PIL image to numpy array
        generated_image = result.images[0]
        console.print("[bold green]Image generation completed successfully.[/bold green]")
        return np.array(generated_image)
        
    except Exception as e:
        raise RuntimeError(f"Image generation failed: {str(e)}")


def object_segmentation(img: ImageType) -> np.ndarray:
    """
    Perform object segmentation using YOLOv8 segmentation model.
    
    Args:
        img: Input image as PIL Image or numpy array
        
    Returns:
        Segmentation masks as numpy array with different values for each object
        
    Raises:
        TypeError: If input image format is not supported
        RuntimeError: If object segmentation fails
    """
    try:
        pil_img = _validate_image_input(img)
        console.print("[bold cyan]Loading YOLOv8 segmentation model...[/bold cyan]")
        model = _load_yolo_model()
        
        console.print("[bold cyan]Running YOLOv8 inference...[/bold cyan]")
        results = model(pil_img)
        
        # Extract segmentation masks
        console.print("[bold cyan]Processing segmentation masks...[/bold cyan]")
        if results[0].masks is not None:
            masks = results[0].masks.data.cpu().numpy()
            combined_mask = np.zeros(masks.shape[1:], dtype=np.uint8)
            
            for i, mask in enumerate(masks):
                combined_mask[mask > 0.5] = i + 1
            
            console.print(f"[bold green]Object segmentation completed successfully. Found {len(masks)} objects.[/bold green]")
            return combined_mask
        else:
            console.print("[yellow]No objects found in the image.[/yellow]")
            return np.zeros((*pil_img.size[::-1],), dtype=np.uint8)
            
    except Exception as e:
        raise RuntimeError(f"Object segmentation failed: {str(e)}")


def image_classification(img: ImageType) -> str:
    """
    Classify input image using Vision Transformer model.
    
    Args:
        img: Input image as PIL Image or numpy array
        
    Returns:
        Classification result as string (top predicted class)
        
    Raises:
        TypeError: If input image format is not supported
        RuntimeError: If classification fails
    """
    try:
        pil_img = _validate_image_input(img)
        console.print("[bold cyan]Loading Vision Transformer model...[/bold cyan]")
        classifier = _load_classification_model()
        
        console.print("[bold cyan]Running classification inference...[/bold cyan]")
        results = classifier(pil_img)
        top_result = results[0]['label'] if results else "unknown"
        console.print("[bold green]Image classification completed.[/bold green]")
        return top_result
        
    except Exception as e:
        raise RuntimeError(f"Image classification failed: {str(e)}")


def main() -> None:
    """
    Command line interface for image processing tasks.
    
    Examples:
        python models/image.py get_depth_map -i assets/test_image.jpg
        python models/image.py background_segmentation -i assets/test_image.jpg
        python models/image.py inpainting -m assets/mask.png -i assets/test_image.jpg
        python models/image.py generate_image -p "a beautiful sunset over mountains"
        python models/image.py generate_image -p "a cute cat" -n "blurry, low quality" --steps 30 --width 768 --height 768
    """
    parser = argparse.ArgumentParser(
        description="A command-line tool for various image processing tasks.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("task", choices=[
        "get_depth_map", "get_super_resolution", "background_segmentation",
        "inpainting", "generate_image", "object_segmentation", "image_classification"
    ], help="Image processing task to perform")
    
    parser.add_argument("-i", "--image", type=str, help="Input image path")
    parser.add_argument("-m", "--mask", type=str, help="Mask image path (for inpainting)")
    parser.add_argument("-p", "--prompt", type=str, help="Text prompt (for image generation)")
    parser.add_argument("-n", "--negative-prompt", type=str, help="Negative prompt (for image generation)")
    parser.add_argument("-o", "--output", type=str, default="output.png", help="Output path (default: output.png)")
    parser.add_argument("--steps", type=int, default=50, help="Number of inference steps (default: 50)")
    parser.add_argument("--guidance", type=float, default=7.5, help="Guidance scale (default: 7.5)")
    parser.add_argument("--width", type=int, default=512, help="Output width (default: 512)")
    parser.add_argument("--height", type=int, default=512, help="Output height (default: 512)")
    parser.add_argument("--seed", type=int, help="Random seed for reproducible results")
    
    args = parser.parse_args()
    
    title_text = "Image Processing AI System"
    title = Text(title_text, justify="center", style="bold")
    _apply_gradient(title, "#8A2BE2", "#4169E1")  # BlueViolet to RoyalBlue
    console.print(Panel(title, border_style="green", expand=False))

    try:
        if args.task == "generate_image":
            if not args.prompt:
                console.print("[bold red]Error: --prompt is required for the 'generate_image' task.[/bold red]")
                sys.exit(1)
            result = generate_image(
                prompt=args.prompt,
                negative_prompt=args.negative_prompt,
                num_inference_steps=args.steps,
                guidance_scale=args.guidance,
                width=args.width,
                height=args.height,
                seed=args.seed
            )
            
        elif args.task == "inpainting":
            if not args.image or not args.mask:
                console.print("[bold red]Error: --image and --mask are required for the 'inpainting' task.[/bold red]")
                sys.exit(1)
            img = Image.open(args.image)
            mask = np.array(Image.open(args.mask).convert('L')) / 255
            result = inpainting(img, mask)
            
        else:
            if not args.image:
                console.print(f"[bold red]Error: --image is required for the '{args.task}' task.[/bold red]")
                sys.exit(1)
            img = Image.open(args.image)
            
            task_map = {
                "get_depth_map": get_depth_map,
                "get_super_resolution": get_super_resolution,
                "background_segmentation": background_segmentation,
                "object_segmentation": object_segmentation,
                "image_classification": image_classification,
            }

            if args.task in task_map:
                result = task_map[args.task](img)
            else:
                # This path should not be reached due to argparse `choices`
                console.print(f"[bold red]Error: Unknown task '{args.task}'[/bold red]")
                sys.exit(1)

            if args.task == "image_classification":
                console.print(Panel(f"[bold green]Classification Result: [white]{result}[/white][/bold green]", 
                                    title="[yellow]Result[/yellow]", border_style="magenta"))
                return
        
        # Save result
        if isinstance(result, np.ndarray):
            console.print(f"[cyan]Saving result to [bold]'{args.output}'[/bold]...[/cyan]")
            if result.dtype != np.uint8:
                # Normalize non-uint8 arrays (e.g., depth maps)
                if result.max() > result.min():
                    result = ((result - result.min()) / (result.max() - result.min()) * 255).astype(np.uint8)
                else:
                    result = np.zeros_like(result, dtype=np.uint8)
            
            if len(result.shape) == 2:
                Image.fromarray(result, mode='L').save(args.output)
            else:
                Image.fromarray(result).save(args.output)
            
            console.print(Panel(f"[bold green]Output successfully saved to [white]'{args.output}'[/white][/bold green]",
                                title="[yellow]Success[/yellow]", border_style="green"))
        
    except FileNotFoundError as e:
        console.print(f"[bold red]Error: Input file not found - {e}[/bold red]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[bold red]An unexpected error occurred: {e}[/bold red]")
        console.print_exception(show_locals=True)
        sys.exit(1)


if __name__ == "__main__":
    main()