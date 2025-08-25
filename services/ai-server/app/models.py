"""
AI Model Management for Generic Reasoning Server
Auto-detects and loads local models from models/ folder
"""
import os
import logging
import time
import torch
from pathlib import Path
from typing import Optional, Dict, Any, List, Union
from PIL import Image
import io
import base64
import re

logger = logging.getLogger(__name__)

def estimate_tokens(text: str) -> int:
    """Simple token estimation - roughly 4 characters per token for English"""
    if not text:
        return 0
    # Simple estimation: split by words and punctuation, account for subword tokens
    words = re.findall(r'\w+|[^\w\s]', text.lower())
    # Rough estimate: average 1.3 tokens per word, plus punctuation
    return int(len(words) * 1.3)

def log_token_usage(context_name: str, text: str):
    """Log token usage for debugging"""
    token_count = estimate_tokens(text)
    char_count = len(text)
    logger.info(f"Token Usage - {context_name}: ~{token_count} tokens, {char_count} chars")
    if token_count > 3000:
        logger.warning(f"HIGH TOKEN COUNT in {context_name}: {token_count} tokens might slow down processing!")
    return token_count

# Type hint for LLAMA model (avoiding import issues)
try:
    from llama_cpp import Llama
    LlamaModel = Llama
except ImportError:
    LlamaModel = Any


class AIModelManager:
    """Manages AI models for reasoning tasks - auto-detects local models"""
    
    def __init__(self):
        self.text_model: Optional[Any] = None  # Will be LlamaModel when loaded
        self.text_pipeline: Optional[Any] = None  # HuggingFace pipeline
        self.vision_model: Optional[Any] = None
        self.device = self._get_device()
        self.loaded_models: List[str] = []
        self.models_dir = Path("models")
        self.available_models = self._scan_available_models()
        
    def _get_device(self) -> str:
        """Determine the best device to use"""
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return "mps"  # Apple Silicon Mac
        else:
            return "cpu"
    
    def _scan_available_models(self) -> List[Dict[str, Any]]:
        """Scan models/ folder for available models"""
        models = []
        
        if not self.models_dir.exists():
            logger.warning("Models directory does not exist. Creating it...")
            self.models_dir.mkdir(exist_ok=True)
            return models
        
        # Look for common model formats
        model_extensions = ['.bin', '.safetensors', '.gguf', '.pt', '.pth']
        
        for file_path in self.models_dir.rglob('*'):
            if file_path.is_file():
                if any(file_path.name.lower().endswith(ext) for ext in model_extensions):
                    models.append({
                        "name": file_path.stem,
                        "path": str(file_path),
                        "size_mb": round(file_path.stat().st_size / (1024 * 1024), 1),
                        "type": self._detect_model_type(file_path),
                        "format": file_path.suffix
                    })
                elif file_path.name in ['config.json', 'tokenizer.json']:
                    # HuggingFace model folder
                    model_folder = file_path.parent
                    if model_folder not in [m["path"] for m in models]:
                        models.append({
                            "name": model_folder.name,
                            "path": str(model_folder),
                            "size_mb": self._get_folder_size(model_folder),
                            "type": "huggingface",
                            "format": "folder"
                        })
        
        logger.info(f"Found {len(models)} models in models/ directory")
        for model in models:
            logger.info(f"  - {model['name']} ({model['type']}, {model['size_mb']}MB)")
        
        return models
    
    def _detect_model_type(self, file_path: Path) -> str:
        """Detect model type from filename patterns"""
        name_lower = file_path.name.lower()
        
        if '.gguf' in name_lower:
            return "gguf"
        elif any(keyword in name_lower for keyword in ['vision', 'clip', 'blip', 'image']):
            return "vision"
        elif any(keyword in name_lower for keyword in ['text', 'language', 'chat', 'instruct']):
            return "text"
        else:
            return "unknown"
    
    def _get_folder_size(self, folder: Path) -> float:
        """Calculate total size of folder in MB"""
        total_size = 0
        try:
            for file_path in folder.rglob('*'):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
        except:
            pass
        return round(total_size / (1024 * 1024), 1)
    
    def _get_best_text_model(self) -> Optional[Dict[str, Any]]:
        """Get the best available text model"""
        text_models = [m for m in self.available_models if m["type"] in ["text", "huggingface", "gguf"]]
        
        if not text_models:
            return None
        
        # Prefer smaller models for better performance
        text_models.sort(key=lambda x: x["size_mb"])
        return text_models[0]
    
    def _get_best_vision_model(self) -> Optional[Dict[str, Any]]:
        """Get the best available vision model"""
        vision_models = [m for m in self.available_models if m["type"] == "vision"]
        
        if vision_models:
            vision_models.sort(key=lambda x: x["size_mb"])
            return vision_models[0]
        
        return None
    
    async def initialize_text_model(self, model_name: Optional[str] = None):
        """Initialize text generation model from local files"""
        try:
            if not self.available_models:
                logger.error("No models found in models/ directory")
                # Fallback to a simple mock model
                await self._initialize_mock_model()
                return
            
            # Use specified model or auto-detect best one
            if model_name:
                selected_model = next((m for m in self.available_models if model_name in m["name"]), None)
            else:
                selected_model = self._get_best_text_model()
            
            if not selected_model:
                logger.error("No suitable text model found")
                await self._initialize_mock_model()
                return
            
            logger.info(f"Loading text model: {selected_model['name']} ({selected_model['type']})")
            
            if selected_model["type"] == "gguf":
                await self._load_gguf_model(selected_model)
            elif selected_model["type"] == "huggingface":
                await self._load_huggingface_model(selected_model)
            else:
                logger.warning(f"Unsupported model type: {selected_model['type']}, using mock model")
                await self._initialize_mock_model()
                return
            
            self.loaded_models.append(f"text:{selected_model['name']}")
            logger.info(f"Text model loaded successfully on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load text model: {e}")
            logger.info("Falling back to mock model")
            await self._initialize_mock_model()
    
    async def _load_gguf_model(self, model_info: Dict[str, Any]):
        """Load GGUF model using llama-cpp-python"""
        try:
            from llama_cpp import Llama
            
            model_path = str(Path(model_info["path"]).resolve())
            logger.info(f"Loading GGUF model from: {model_path}")
            
            # Configure based on available hardware
            n_gpu_layers = 0
            if self.device == "cuda":
                n_gpu_layers = -1  # Use all GPU layers
            elif self.device == "mps":
                n_gpu_layers = 1   # Limited GPU support on Mac
            
            # Load the model with optimized settings for faster inference
            self.text_model = Llama(
                model_path=model_path,
                n_ctx=4096,        # Increased context window for better understanding  
                n_gpu_layers=n_gpu_layers,
                verbose=False,
                n_threads=2,       # Fewer threads to avoid contention
                n_batch=8,         # Smaller batch size
                f16_kv=True,       # Use half precision for key-value cache
            )
            
            logger.info(f"GGUF model loaded successfully: {model_info['name']}")
            
        except ImportError:
            logger.error("llama-cpp-python not installed. Install with: pip install llama-cpp-python")
            await self._initialize_mock_model()
        except Exception as e:
            logger.error(f"Failed to load GGUF model: {e}")
            await self._initialize_mock_model()
    
    async def _load_huggingface_model(self, model_info: Dict[str, Any]):
        """Load HuggingFace model from local folder"""
        try:
            from transformers import pipeline
            
            model_path = model_info["path"]
            self.text_pipeline = pipeline(
                "text-generation",
                model=model_path,
                tokenizer=model_path,
                device=0 if self.device == "cuda" else -1,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
            )
            
        except Exception as e:
            logger.error(f"Failed to load HuggingFace model: {e}")
            await self._initialize_mock_model()
    
    async def _initialize_mock_model(self):
        """Initialize a mock model for testing when no real models are available"""
        logger.info("Initializing mock text model for testing")
        self.text_model = None  # Set to None so we use mock generation path
        self.loaded_models.append("text:mock_reasoning_model")
    
    async def initialize_vision_model(self):
        """Initialize vision model - either local or from HuggingFace Hub"""
        vision_model = self._get_best_vision_model()
        
        if vision_model:
            # Use local vision model
            logger.info(f"Local vision model found: {vision_model['name']}")
            await self._load_local_vision_model(vision_model)
        else:
            # Load from HuggingFace Hub - best models for product recognition
            logger.info("No local vision models found, loading from HuggingFace Hub...")
            await self._load_huggingface_vision_model()
    
    async def _load_local_vision_model(self, model_info: Dict[str, Any]):
        """Load local vision model"""
        try:
            from transformers import pipeline
            
            self.vision_pipeline = pipeline(
                "image-to-text", 
                model=model_info["path"],
                device=0 if self.device == "cuda" else -1
            )
            
            self.loaded_models.append(f"vision:{model_info['name']}")
            logger.info(f"Local vision model loaded: {model_info['name']}")
            
        except Exception as e:
            logger.error(f"Failed to load local vision model: {e}")
            await self._load_huggingface_vision_model()
    
    async def _load_huggingface_vision_model(self):
        """Load pre-trained vision model from HuggingFace for product recognition"""
        try:
            from transformers import pipeline
            
            # Try multiple models in order of preference - focusing on reliable image captioning
            vision_models = [
                "microsoft/git-base-coco",                 # Microsoft GIT - excellent for product images
                "nlpconnect/vit-gpt2-image-captioning",    # ViT-GPT2 - fast and reliable
                "Salesforce/blip-image-captioning-base",   # BLIP base - smaller, faster
                "microsoft/git-large-coco"                 # GIT large - more detailed (slower)
            ]
            
            for model_name in vision_models:
                try:
                    logger.info(f"Attempting to load vision model: {model_name}")
                    self.vision_pipeline = pipeline(
                        "image-to-text",
                        model=model_name,
                        device=0 if self.device == "cuda" else -1,
                        torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
                    )
                    
                    self.loaded_models.append(f"vision:{model_name}")
                    logger.info(f"Successfully loaded vision model: {model_name}")
                    return
                    
                except Exception as e:
                    logger.warning(f"Failed to load {model_name}: {e}")
                    continue
            
            # If all models fail, disable vision
            logger.error("Failed to load any vision model, vision capabilities disabled")
            self.vision_pipeline = None
            
        except ImportError as e:
            logger.error(f"Missing dependencies for vision models: {e}")
            self.vision_pipeline = None
        except Exception as e:
            logger.error(f"Unexpected error loading vision model: {e}")
            self.vision_pipeline = None
    
    async def generate_text(self, instruction: str, context: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Generate text based on instruction and context with token tracking"""
        if not self.text_model and not self.text_pipeline:
            raise RuntimeError("No text model loaded")
        
        start_time = time.time()
        
        # Prepare the prompt
        if context:
            prompt = f"Context: {context}\n\nInstruction: {instruction}\n\nResponse:"
        else:
            prompt = f"Instruction: {instruction}\n\nResponse:"
        
        # Log token usage for debugging
        prompt_tokens = log_token_usage("INPUT_PROMPT", prompt)
        if context:
            context_tokens = log_token_usage("CONTEXT_DATA", context)
        else:
            context_tokens = 0
        instruction_tokens = log_token_usage("INSTRUCTION", instruction)
        
        total_input_tokens = prompt_tokens
        logger.info(f"TOTAL INPUT TOKENS: {total_input_tokens} (Context: {context_tokens}, Instruction: {instruction_tokens})")
        
        # Check if we're approaching token limits
        if total_input_tokens > 3500:
            logger.warning(f"Very high input token count ({total_input_tokens})! This may cause slowdowns or failures.")
        elif total_input_tokens > 2500:
            logger.warning(f"High input token count ({total_input_tokens}) - consider reducing context size.")
        
        # Generate response
        if self.text_model:
            # GGUF model (llama-cpp-python)
            try:
                max_tokens = kwargs.get("max_tokens", 500)  # Increased default for complete JSON responses
                temperature = kwargs.get("temperature", 0.1)  # Lower temperature for more consistent output
                
                logger.info(f"GGUF Model Settings: max_tokens={max_tokens}, temperature={temperature}")
                
                # Use the create_completion method for llama-cpp-python
                result = self.text_model.create_completion(
                    prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    echo=False,  # Don't include prompt in response
                    stream=False,  # Ensure we get a single response, not a stream
                )
                
                # Type check to ensure we have the right response format
                if isinstance(result, dict) and "choices" in result:
                    response = result["choices"][0]["text"].strip()
                    output_tokens = log_token_usage("OUTPUT_RESPONSE", response)
                    logger.info(f"GGUF model generated: '{response}' (length: {len(response)}, ~{output_tokens} tokens)")
                else:
                    logger.error(f"Unexpected result format: {type(result)}")
                    response = self._generate_mock_response(instruction, context)
                    output_tokens = log_token_usage("FALLBACK_RESPONSE", response)
                
            except Exception as e:
                logger.error(f"GGUF model generation failed: {e}")
                response = self._generate_mock_response(instruction, context)
                output_tokens = log_token_usage("FALLBACK_RESPONSE", response)
                
        elif self.text_pipeline:
            # HuggingFace model
            try:
                max_length = min(kwargs.get("max_tokens", 500), 1024)  # Increased limits for complete responses
                temperature = kwargs.get("temperature", 0.7)
                
                logger.info(f"HF Pipeline Settings: max_length={max_length}, temperature={temperature}")
                
                result = self.text_pipeline(
                    prompt,
                    max_length=max_length,
                    temperature=temperature,
                    do_sample=True,
                    return_full_text=False
                )
                
                response = result[0]["generated_text"].strip()
                
            except Exception as e:
                logger.error(f"HuggingFace model generation failed: {e}")
                response = self._generate_mock_response(instruction, context)
        else:
            # Mock model
            response = self._generate_mock_response(instruction, context)
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "result": response,
            "processing_time_ms": processing_time,
            "model_used": self.loaded_models[0] if self.loaded_models else "mock_model"
        }
    
    def _generate_mock_response(self, instruction: str, context: Optional[str]) -> str:
        """Generate a mock response for testing"""
        if context:
            return f"Based on the context provided, I understand you want me to: {instruction}. This is a mock response from the AI reasoning server. In production, this would be generated by your local AI model."
        else:
            return f"I understand your instruction: {instruction}. This is a mock response from the AI reasoning server. In production, this would be generated by your local AI model."
    
    async def analyze_image(self, instruction: str, image_data: str, **kwargs) -> Dict[str, Any]:
        """Simple image analysis - just get basic description"""
        if not hasattr(self, 'vision_pipeline') or self.vision_pipeline is None:
            raise RuntimeError("No vision model loaded")
        
        start_time = time.time()
        
        # Decode image
        try:
            if image_data.startswith('data:image/'):
                header, base64_data = image_data.split(',', 1)
                image_bytes = base64.b64decode(base64_data)
            else:
                image_bytes = base64.b64decode(image_data)
            
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            logger.error(f"Failed to decode image: {e}")
            raise ValueError(f"Invalid image data: {e}")
        
        try:
            # Simple vision analysis - just get description
            result = self.vision_pipeline(image, max_new_tokens=100)
            
            # Extract simple description
            description = 'Product image detected'
            if isinstance(result, str):
                description = result.strip()
            elif hasattr(result, '__iter__') and not isinstance(result, (str, bytes)):
                first_item = next(iter(result), None)
                if first_item:
                    if isinstance(first_item, str):
                        description = first_item.strip()
                    elif isinstance(first_item, dict) and 'generated_text' in first_item:
                        description = first_item['generated_text'].strip()
                    else:
                        description = str(first_item).strip()
            
            processing_time = (time.time() - start_time) * 1000
            logger.info(f"Vision analysis completed: {description[:50]}...")
            
            # Safe model name extraction
            try:
                model_name = "vision:unknown"
                if hasattr(self.vision_pipeline, 'model'):
                    if hasattr(self.vision_pipeline.model, 'name_or_path'):
                        model_name = self.vision_pipeline.model.name_or_path
                    elif hasattr(self.vision_pipeline.model, 'config') and hasattr(self.vision_pipeline.model.config, 'name_or_path'):
                        model_name = self.vision_pipeline.model.config.name_or_path
                    else:
                        model_name = str(type(self.vision_pipeline.model).__name__)
            except Exception:
                model_name = "vision:unknown"
            
            return {
                "result": description or "Product image detected",
                "processing_time_ms": processing_time,
                "model_used": model_name
            }
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            logger.error(f"Vision analysis failed: {e}")
            
            return {
                "result": "Product image detected but analysis failed",
                "processing_time_ms": processing_time,
                "model_used": "vision:error"
            }
    
    async def _enhance_image_analysis(self, image_description: str, instruction: str) -> str:
        """Enhance image analysis with instruction context using text model"""
        try:
            prompt = f"""You are analyzing an image for an e-commerce application.

Image Description: {image_description}
User Instruction: {instruction}

Based on the image description and user instruction, provide a focused response that:
1. Directly addresses what the user asked about
2. Highlights relevant features from the image
3. Provides actionable insights for decisions

Keep response concise and helpful (2-3 sentences max).
Response:"""

            if hasattr(self, 'text_pipeline') and self.text_pipeline:
                # Use HuggingFace pipeline
                result = self.text_pipeline(prompt, max_length=200, do_sample=True, temperature=0.7)
                if isinstance(result, list) and len(result) > 0:
                    # Handle different result formats from text pipeline
                    first_result = result[0]
                    if isinstance(first_result, dict) and 'generated_text' in first_result:
                        return first_result['generated_text'].replace(prompt, '').strip()
                    elif isinstance(first_result, str):
                        return first_result.replace(prompt, '').strip()
                    else:
                        return str(first_result).replace(prompt, '').strip()
                    
            elif hasattr(self, 'text_model') and self.text_model:
                # Use GGUF model
                response = self.text_model(
                    prompt,
                    max_tokens=150,
                    temperature=0.7,
                    stop=["User:", "\n\n"]
                )
                # Handle GGUF model response format
                if isinstance(response, dict):
                    choices = response.get('choices', [{}])
                    if choices and isinstance(choices[0], dict):
                        return choices[0].get('text', '').strip()
                    else:
                        return str(response).strip()
                else:
                    return str(response).strip()
                
        except Exception as e:
            logger.warning(f"Text enhancement failed: {e}")
            
        # Fallback to simple combination
        return f"Image shows: {image_description}\n\nRegarding '{instruction}': Based on the image, this appears to be a relevant product that matches your query."
    
    def get_status(self) -> Dict[str, Any]:
        """Get model status"""
        return {
            "device": self.device,
            "models_directory": str(self.models_dir),
            "available_models": len(self.available_models),
            "loaded_models": self.loaded_models,
            "text_model_ready": self.text_model is not None or (hasattr(self, 'text_pipeline') and self.text_pipeline is not None),
            "vision_model_ready": hasattr(self, 'vision_pipeline') and self.vision_pipeline is not None,
            "memory_allocated": torch.cuda.memory_allocated() / 1024**3 if torch.cuda.is_available() else None
        }


# Global model manager instance
model_manager = AIModelManager()
