#!/usr/bin/env python3
"""
Auto-download required AI models for NextShop
Automatically selects best model based on available RAM
Run this after installing dependencies to set up models automatically
"""

import os
import sys
import logging
import psutil
from pathlib import Path
from huggingface_hub import hf_hub_download
from transformers import pipeline

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_available_ram():
            """Get available (free) RAM in GB"""
            try:
                memory = psutil.virtual_memory()
                available_ram = memory.available / (1024**3)  # Convert to GB
                total_ram = memory.total / (1024**3)
                used_ram = memory.used / (1024**3)
                
                logger.info(f"RAM Status - Total: {total_ram:.1f}GB, Used: {used_ram:.1f}GB, Available: {available_ram:.1f}GB")
                return available_ram
            except Exception as e:
                logger.warning(f"Could not detect available RAM: {e}")
                return 4.0  # Conservative default assumption

def select_best_text_model():
    """Download specific Qwen model for NextShop"""
    return {
        "name": "qwen2.5-3b-instruct-q4_k_m.gguf",
        "repo_id": "Qwen/Qwen2.5-3B-Instruct-GGUF",
        "filename": "qwen2.5-3b-instruct-q4_k_m.gguf",
        "size_gb": 2.2,
        "context_tokens": 32768,
        "speed_estimate": "15-45 seconds",
        "description": "Qwen 2.5 3B Q4_K_M - High quality (2.2GB) for NextShop"
    }

def download_text_model():
    """Download the specific Qwen model for NextShop"""
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    # Get the model config
    model_config = select_best_text_model()
    model_path = models_dir / model_config["name"]
    
    if model_path.exists():
        logger.info(f"Model already exists: {model_config['name']}")
        logger.info(f"Speed estimate: {model_config['speed_estimate']}")
        logger.info(f"Context limit: {model_config['context_tokens']:,} tokens")
        return
    
    try:
        logger.info(f"Downloading: {model_config['description']}")
        logger.info(f"Downloading {model_config['name']} ({model_config['size_gb']:.1f}GB)...")
        logger.info(f"Expected speed: {model_config['speed_estimate']}")
        logger.info(f"Context limit: {model_config['context_tokens']:,} tokens")
        
        # Download from HuggingFace Hub
        downloaded_path = hf_hub_download(
            repo_id=model_config["repo_id"],
            filename=model_config["filename"],
            local_dir="models",
            local_dir_use_symlinks=False
        )
        
        logger.info(f"Text model downloaded successfully: {model_config['name']}")
        logger.info(f"Saved to: {downloaded_path}")
        
    except Exception as e:
        logger.error(f"Failed to download text model: {e}")
        logger.info(f"You can download it manually from: https://huggingface.co/{model_config['repo_id']}")

def download_vision_model():
    """Download Microsoft GIT vision model - the correct model for NextShop"""
    
    # Use the correct Microsoft GIT model (not BLIP)
    model_name = "microsoft/git-base-coco"
    size_info = "~500MB"
    
    logger.info(f"Downloading Microsoft GIT vision model: {model_name} ({size_info})")
    
    try:
        logger.info(f"Caching {model_name}...")
        
        # Use pipeline for efficient caching
        vision_pipeline = pipeline(
            "image-to-text",
            model=model_name,
            device=-1  # CPU for compatibility
        )
        
        logger.info(f"Vision model cached successfully: {model_name}")
        logger.info("Microsoft GIT model ready for NextShop image analysis")
        
    except Exception as e:
        logger.error(f"Failed to cache vision model: {e}")
        logger.info("Vision model will be downloaded on first use")

def main():
    """Download required AI models for NextShop"""
    logger.info("Setting up AI models for NextShop...")
    
    # Comprehensive RAM analysis for all hardware types
    available_ram = get_available_ram()
    total_ram = psutil.virtual_memory().total / (1024**3)
    used_percent = psutil.virtual_memory().percent
    
    logger.info(f"System Analysis:")
    logger.info(f"   Total RAM: {total_ram:.1f}GB")
    logger.info(f"   Used: {used_percent:.1f}%")
    logger.info(f"   Available: {available_ram:.1f}GB")
    
    # Check internet connection
    try:
        import urllib.request
        urllib.request.urlopen('https://huggingface.co', timeout=5)
    except:
        logger.error("No internet connection. Models cannot be downloaded.")
        sys.exit(1)
    
    # Download models
    download_text_model()
    download_vision_model()
    
    logger.info("Model setup complete!")
    logger.info("You can now start the AI server with: python dev.py")

if __name__ == "__main__":
    main()
