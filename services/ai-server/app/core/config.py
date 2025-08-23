"""
Production-grade configuration management with validation and environment-specific settings.
"""
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """
    Application settings with validation and environment-specific configurations.
    Follows 12-factor app methodology for configuration management.
    """
    
    # Application Info
    APP_NAME: str = "NextShop AI Inference Server"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = Field(default=False)
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8009, ge=1024, le=65535)
    WORKERS: int = Field(default=1, ge=1, le=8)
    
    # Security
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )
    API_KEY: Optional[str] = Field(default=None)
    
    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    LOG_FILE: Optional[str] = Field(default="logs/ai_server.log")
    LOG_ROTATION: str = Field(default="1 day")
    LOG_RETENTION: str = Field(default="30 days")
    
    # Model Configuration
    MODELS_DIR: Path = Field(default_factory=lambda: Path(__file__).parent.parent.parent / "models")
    MODEL_CACHE_SIZE: int = Field(default=1, ge=1, le=5)
    AUTO_DETECT_MODELS: bool = Field(default=True)
    PREFERRED_MODEL_PATTERN: str = Field(default="*instruct*.gguf")
    
    # Performance Configuration
    MAX_TOKENS_DEFAULT: int = Field(default=512, ge=1, le=4096)
    TEMPERATURE_DEFAULT: float = Field(default=0.7, ge=0.0, le=2.0)
    TOP_P_DEFAULT: float = Field(default=0.9, ge=0.0, le=1.0)
    
    # Hardware Configuration
    FORCE_CPU: bool = Field(default=False)
    GPU_LAYERS: int = Field(default=-1, ge=-1)
    N_THREADS: int = Field(default=0, ge=0)  # 0 = auto-detect
    N_CTX: int = Field(default=2048, ge=256, le=8192)
    N_BATCH: int = Field(default=512, ge=1, le=2048)
    
    # Health Check Configuration
    HEALTH_CHECK_INTERVAL: int = Field(default=30, ge=10)
    STARTUP_TIMEOUT: int = Field(default=300, ge=60)
    
    # Rate Limiting
    ENABLE_RATE_LIMITING: bool = Field(default=True)
    REQUESTS_PER_MINUTE: int = Field(default=100, ge=1)
    
    model_config = {
        "env_prefix": "",  # No prefix for environment variables
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }
    
    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of: {valid_levels}")
        return v.upper()
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @field_validator("MODELS_DIR")
    @classmethod
    def validate_models_dir(cls, v):
        if isinstance(v, str):
            v = Path(v)
        v.mkdir(exist_ok=True)
        return v
    
    @property
    def n_threads_computed(self) -> int:
        """Compute optimal thread count if set to 0 (auto)"""
        if self.N_THREADS == 0:
            return min(8, os.cpu_count() or 4)
        return self.N_THREADS
    
    def get_available_models(self) -> List[Path]:
        """Get all available GGUF models with smart sorting"""
        if not self.MODELS_DIR.exists():
            return []
        
        # Get all GGUF files
        gguf_files = list(self.MODELS_DIR.glob("*.gguf"))
        if not gguf_files:
            return []
        
        # Smart sorting: prefer instruct models, then by size (smaller first)
        def sort_key(model_path: Path) -> tuple:
            name_lower = model_path.name.lower()
            
            # Priority scoring
            priority = 0
            if "instruct" in name_lower:
                priority += 1000
            if "chat" in name_lower:
                priority += 500
            if any(size in name_lower for size in ["3b", "7b", "8b"]):
                priority += 100
            
            # Size scoring (smaller files first for better performance)
            try:
                size_mb = model_path.stat().st_size / (1024 * 1024)
                size_score = 10000 - min(size_mb, 9999)  # Invert size
            except:
                size_score = 5000
            
            return (-priority, -size_score, name_lower)
        
        return sorted(gguf_files, key=sort_key)
    
    def get_primary_model(self) -> Optional[Path]:
        """Get the primary model to load"""
        models = self.get_available_models()
        return models[0] if models else None
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get comprehensive model information"""
        models = self.get_available_models()
        primary = self.get_primary_model()
        
        model_details = []
        for model_path in models:
            try:
                stat = model_path.stat()
                model_details.append({
                    "name": model_path.name,
                    "path": str(model_path),
                    "size_mb": round(stat.st_size / (1024 * 1024), 1),
                    "modified": stat.st_mtime,
                    "is_primary": model_path == primary
                })
            except Exception as e:
                model_details.append({
                    "name": model_path.name,
                    "path": str(model_path),
                    "error": str(e),
                    "is_primary": False
                })
        
        return {
            "models_directory": str(self.MODELS_DIR),
            "total_models": len(models),
            "primary_model": primary.name if primary else None,
            "models": model_details,
            "auto_detect_enabled": self.AUTO_DETECT_MODELS
        }


# Global settings instance
settings = Settings()

def get_settings() -> Settings:
    """Get the global settings instance"""
    return settings

# Logging configuration
def setup_logging():
    """Setup production-grade logging configuration"""
    from app.utils.logger import setup_logger
    setup_logger(settings)

# Validate critical settings on import
def validate_environment():
    """Validate critical environment settings"""
    if not settings.MODELS_DIR.exists():
        raise RuntimeError(f"Models directory does not exist: {settings.MODELS_DIR}")
    
    if settings.AUTO_DETECT_MODELS and not settings.get_primary_model():
        logging.warning(f"No GGUF models found in {settings.MODELS_DIR}")

# Export commonly used settings
__all__ = ["settings", "setup_logging", "validate_environment"]
