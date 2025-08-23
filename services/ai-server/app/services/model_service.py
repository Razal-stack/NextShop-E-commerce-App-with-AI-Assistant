"""
Advanced model management service with lifecycle management, health monitoring, and optimization.
"""
import asyncio
import threading
import time
import gc
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.utils.logger import get_logger, log_model_operation

logger = get_logger("ai_server.models")
settings = get_settings()


@dataclass
class ModelMetrics:
    """Model performance and health metrics"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_response_time_ms: float = 0.0
    last_request_time: Optional[float] = None
    memory_usage_mb: float = 0.0
    load_time_ms: float = 0.0
    model_size_mb: float = 0.0
    
    @property
    def success_rate(self) -> float:
        return (self.successful_requests / self.total_requests * 100) if self.total_requests > 0 else 0.0
    
    @property
    def error_rate(self) -> float:
        return (self.failed_requests / self.total_requests * 100) if self.total_requests > 0 else 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ModelWrapper:
    """
    Wrapper class for AI models with health monitoring and lifecycle management.
    """
    
    def __init__(self, name: str, model_type: str):
        self.name = name
        self.model_type = model_type
        self.model = None
        self.processor = None
        self.is_loaded = False
        self.is_healthy = True
        self.metrics = ModelMetrics()
        self.load_start_time = None
        self._lock = threading.RLock()
    
    def start_load_timer(self):
        """Start timing model load"""
        self.load_start_time = time.time()
    
    def end_load_timer(self):
        """End timing model load and update metrics"""
        if self.load_start_time:
            load_time = (time.time() - self.load_start_time) * 1000
            self.metrics.load_time_ms = load_time
            self.load_start_time = None
    
    def update_request_metrics(self, success: bool, response_time_ms: float):
        """Update request metrics"""
        with self._lock:
            self.metrics.total_requests += 1
            self.metrics.last_request_time = time.time()
            
            if success:
                self.metrics.successful_requests += 1
            else:
                self.metrics.failed_requests += 1
            
            # Update average response time (exponential moving average)
            alpha = 0.1  # Smoothing factor
            if self.metrics.average_response_time_ms == 0:
                self.metrics.average_response_time_ms = response_time_ms
            else:
                self.metrics.average_response_time_ms = (
                    alpha * response_time_ms + 
                    (1 - alpha) * self.metrics.average_response_time_ms
                )
    
    def health_check(self) -> bool:
        """Perform health check on the model"""
        try:
            if not self.is_loaded or self.model is None:
                self.is_healthy = False
                return False
            
            # Additional health checks can be added here
            self.is_healthy = True
            return True
            
        except Exception as e:
            logger.error(f"Health check failed for {self.name}: {e}")
            self.is_healthy = False
            return False


class ModelManager:
    """
    Advanced model manager with lifecycle management, caching, and health monitoring.
    Implements singleton pattern for global model state management.
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, 'initialized'):
            return
        
        self.initialized = True
        self.models: Dict[str, ModelWrapper] = {}
        self.device = "cpu"  # Will be determined during initialization
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="model-loader")
        self._health_check_interval = settings.HEALTH_CHECK_INTERVAL
        self._health_check_task = None
        
        logger.info("ModelManager initialized")
    
    async def initialize(self):
        """Initialize the model manager and determine hardware configuration"""
        try:
            # Determine optimal hardware configuration
            await self._detect_hardware()
            
            # Start health monitoring
            await self._start_health_monitoring()
            
            logger.info(f"ModelManager initialized with device: {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to initialize ModelManager: {e}")
            raise
    
    async def _detect_hardware(self):
        """Detect and configure hardware (CPU/GPU)"""
        try:
            if settings.FORCE_CPU:
                self.device = "cpu"
                logger.info("Hardware detection: Forced CPU mode")
                return
            
            # Try to detect CUDA
            try:
                import torch
                if torch.cuda.is_available() and not settings.FORCE_CPU:
                    self.device = "cuda"
                    gpu_name = torch.cuda.get_device_name(0)
                    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                    logger.info(f"Hardware detection: GPU available - {gpu_name} ({gpu_memory:.1f}GB)")
                else:
                    self.device = "cpu"
                    logger.info("Hardware detection: Using CPU mode")
            except ImportError:
                self.device = "cpu"
                logger.info("Hardware detection: PyTorch not available, using CPU")
        
        except Exception as e:
            logger.warning(f"Hardware detection failed: {e}, defaulting to CPU")
            self.device = "cpu"
    
    async def load_all_models(self):
        """Load all available models with parallel loading and error handling"""
        logger.info("Starting model loading process...")
        
        try:
            # Load Vision Model
            vision_future = self.executor.submit(self._load_vision_model)
            
            # Load Language Model
            llm_future = self.executor.submit(self._load_language_model)
            
            # Wait for both models with timeout
            vision_success = await asyncio.get_event_loop().run_in_executor(
                None, self._wait_for_future, vision_future, settings.STARTUP_TIMEOUT
            )
            
            llm_success = await asyncio.get_event_loop().run_in_executor(
                None, self._wait_for_future, llm_future, settings.STARTUP_TIMEOUT
            )
            
            # Log results
            loaded_models = [name for name, wrapper in self.models.items() if wrapper.is_loaded]
            logger.info(f"Model loading completed. Loaded models: {loaded_models}")
            
            if not loaded_models:
                raise RuntimeError("No models were successfully loaded")
            
        except Exception as e:
            logger.error(f"Model loading failed: {e}")
            raise
    
    def _wait_for_future(self, future, timeout):
        """Wait for future with timeout"""
        try:
            return future.result(timeout=timeout)
        except Exception as e:
            logger.error(f"Future failed: {e}")
            return False
    
    def _load_vision_model(self) -> bool:
        """Load BLIP vision model"""
        model_name = "blip-image-captioning"
        
        try:
            with log_model_operation(logger, "load_vision_model", model_name):
                from transformers import BlipProcessor, BlipForConditionalGeneration
                
                # Create model wrapper
                wrapper = ModelWrapper(model_name, "vision")
                wrapper.start_load_timer()
                self.models[model_name] = wrapper
                
                # Load model
                logger.info("Loading BLIP vision model...")
                wrapper.processor = BlipProcessor.from_pretrained(
                    "Salesforce/blip-image-captioning-base"
                )
                wrapper.model = BlipForConditionalGeneration.from_pretrained(
                    "Salesforce/blip-image-captioning-base"
                ).to(self.device)
                
                # Update model size
                if hasattr(wrapper.model, 'num_parameters'):
                    param_count = wrapper.model.num_parameters()
                    wrapper.metrics.model_size_mb = param_count * 4 / (1024 * 1024)  # Rough estimate
                
                wrapper.end_load_timer()
                wrapper.is_loaded = True
                
                logger.info(f"BLIP vision model loaded successfully in {wrapper.metrics.load_time_ms:.1f}ms")
                return True
                
        except Exception as e:
            logger.error(f"Failed to load BLIP vision model: {e}")
            if model_name in self.models:
                self.models[model_name].is_loaded = False
                self.models[model_name].is_healthy = False
            return False
    
    def _load_language_model(self) -> bool:
        """Load GGUF language model with dynamic detection"""
        try:
            model_info = settings.get_model_info()
            if not model_info["primary_model"]:
                logger.error("No GGUF models found for loading")
                return False
            
            primary_model_path = settings.get_primary_model()
            model_name = f"llm-{primary_model_path.stem}"
            
            with log_model_operation(logger, "load_language_model", model_name):
                from llama_cpp import Llama
                
                # Create model wrapper
                wrapper = ModelWrapper(model_name, "language")
                wrapper.start_load_timer()
                self.models[model_name] = wrapper
                
                # Update model size from file
                wrapper.metrics.model_size_mb = primary_model_path.stat().st_size / (1024 * 1024)
                
                logger.info(f"Loading GGUF model: {primary_model_path.name} ({wrapper.metrics.model_size_mb:.1f}MB)")
                
                # Load model with optimized settings
                wrapper.model = Llama(
                    model_path=str(primary_model_path),
                    n_gpu_layers=settings.GPU_LAYERS if self.device == "cuda" else 0,
                    n_ctx=settings.N_CTX,
                    n_threads=settings.n_threads_computed,
                    n_batch=settings.N_BATCH,
                    verbose=False,
                    use_mmap=True,  # Enable memory mapping for efficiency
                    use_mlock=True,  # Lock memory pages
                )
                
                wrapper.end_load_timer()
                wrapper.is_loaded = True
                
                logger.info(f"GGUF model loaded successfully in {wrapper.metrics.load_time_ms:.1f}ms")
                return True
                
        except Exception as e:
            logger.error(f"Failed to load GGUF language model: {e}")
            if "llm" in [m.model_type for m in self.models.values()]:
                for wrapper in self.models.values():
                    if wrapper.model_type == "language":
                        wrapper.is_loaded = False
                        wrapper.is_healthy = False
            return False
    
    async def _start_health_monitoring(self):
        """Start background health monitoring task"""
        if self._health_check_task is None:
            self._health_check_task = asyncio.create_task(self._health_monitoring_loop())
    
    async def _health_monitoring_loop(self):
        """Background health monitoring loop"""
        while True:
            try:
                await asyncio.sleep(self._health_check_interval)
                
                for name, wrapper in self.models.items():
                    if wrapper.is_loaded:
                        is_healthy = wrapper.health_check()
                        if not is_healthy:
                            logger.warning(f"Health check failed for model: {name}")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
    
    def get_model(self, model_type: str) -> Optional[ModelWrapper]:
        """Get model wrapper by type"""
        for wrapper in self.models.values():
            if wrapper.model_type == model_type and wrapper.is_loaded:
                return wrapper
        return None
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        status = {
            "overall_healthy": True,
            "device": self.device,
            "models": {},
            "system": {
                "total_models": len(self.models),
                "loaded_models": sum(1 for w in self.models.values() if w.is_loaded),
                "healthy_models": sum(1 for w in self.models.values() if w.is_healthy),
            }
        }
        
        for name, wrapper in self.models.items():
            model_status = {
                "loaded": wrapper.is_loaded,
                "healthy": wrapper.is_healthy,
                "metrics": wrapper.metrics.to_dict()
            }
            status["models"][name] = model_status
            
            if not wrapper.is_healthy:
                status["overall_healthy"] = False
        
        return status
    
    async def shutdown(self):
        """Cleanup and shutdown model manager"""
        logger.info("Shutting down ModelManager...")
        
        # Cancel health monitoring
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
        
        # Cleanup models
        for name, wrapper in self.models.items():
            try:
                logger.info(f"Unloading model: {name}")
                wrapper.model = None
                wrapper.processor = None
                wrapper.is_loaded = False
            except Exception as e:
                logger.error(f"Error unloading model {name}: {e}")
        
        # Force garbage collection
        gc.collect()
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("ModelManager shutdown completed")


# Global model manager instance
model_manager = ModelManager()
