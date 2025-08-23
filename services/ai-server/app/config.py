"""
Simple configuration management for Generic AI Reasoning Server
"""
import os
from pathlib import Path
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Simple settings for AI reasoning server"""
    
    # Application Info
    APP_NAME: str = "Generic AI Reasoning Server"
    APP_VERSION: str = "1.0.0"
    
    # Server Configuration
    HOST: str = Field(default="127.0.0.1")
    PORT: int = Field(default=8000)
    DEBUG: bool = Field(default=True)
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(default=["*"])
    
    # Model Configuration - Auto-detected from models/ folder
    MAX_TOKENS: int = Field(default=512)
    TEMPERATURE: float = Field(default=0.7)
    
    # Hardware
    DEVICE: str = Field(default="auto")  # "auto", "cpu", or "cuda"
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }


# Global settings instance
_settings = None

def get_settings() -> Settings:
    """Get settings instance"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
