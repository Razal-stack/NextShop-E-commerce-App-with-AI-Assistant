# app/models.py
try:
    from transformers import (
        BlipProcessor, 
        BlipForConditionalGeneration, 
        pipeline, 
        Pipeline
    )
    import torch
    print("DEBUG: Successfully imported transformers and torch")
except ImportError as e:
    print(f"ERROR: Failed to import required packages: {e}")
    raise

class ModelLoader:
    """A singleton class to load and hold AI models in memory."""
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"INFO: ModelLoader using device: {self.device}")
        
        # These will be populated by the load_all_models method during server startup
        self.blip_processor: BlipProcessor = None
        self.blip_model: BlipForConditionalGeneration = None
        self.llm_pipeline: Pipeline = None

    def load_all_models(self):
        """Loads all necessary AI models into memory."""
        print("INFO: Loading Vision Model (Salesforce/blip-image-captioning-base)...")
        self.blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(self.device)
        print("INFO: Vision Model loaded successfully.")

        print("INFO: Loading Language Model (Qwen2.5-3B-Instruct GGUF)...")
        import os
        from llama_cpp import Llama
        model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models'))
        model_path = os.path.join(model_dir, 'qwen2.5-3b-instruct-q4_k_m.gguf')
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}. Please download it from https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/tree/main and place it in the models directory.")
        self.llm_pipeline = Llama(
            model_path=model_path,
            n_gpu_layers=-1,  # Use CPU only
            n_ctx=2048,       # Recommended context size for speed
            n_threads=8,      # Use all logical cores
            n_batch=512,      # Recommended batch size
            temperature=0.6,  # Default temperature
            top_p=0.9,        # Default top_p
            verbose=True
        )
        print("INFO: Language Model loaded successfully.")

# Create a single, global instance that will be used throughout the application's lifecycle
print("DEBUG: Creating model_loader instance...")
model_loader = ModelLoader()
print("DEBUG: model_loader instance created successfully")
