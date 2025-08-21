Of course. This is the definitive, highly-detailed blueprint for building the **AI Inference Server**. It is designed to be a standalone guide, perfect for you (especially as someone new to the Python ecosystem) and for your AI coding assistant.

It covers everything from environment setup on Windows to a modular, production-ready code structure, and explains not just *what* to do, but *why* you are doing it. This server will function as the powerful, specialized "calculator" for our Express.js MCP Server.

You are also correct in your belief: **All advanced functionalities like CSV export and email will be handled by the Express.js backend.** This AI Inference Server's sole purpose is to provide the raw computational power for language and vision tasks.

---

# **Definitive Specification & Build Guide: The AI Inference Server**

**Version:** 1.0 (Component Specification)
**Project:** NextShop AI Assistant "Nex"
**Component:** AI Inference Server
**Technology:** Python, FastAPI, Hugging Face Transformers
**Author:** Gemini AI

## **1. Core Mission & Architecture**

### **1.1. Mission Statement**
The AI Inference Server's mission is to be a high-performance, stateless, and specialized microservice. It has only two jobs:
1.  **Generate Text:** Given a prompt, use the **`microsoft/phi-2`** model to generate a coherent continuation.
2.  **Describe Images:** Given an image, use the **`Salesforce/blip-image-captioning-base`** model to generate a descriptive text caption.

It is architecturally "dumb" by design. It knows nothing about users, carts, or business logic. It simply performs its two tasks with maximum efficiency when requested by the Express MCP Server.

### **1.2. Architectural Philosophy: The Specialized Calculator**
This server is not the "brain"; it is the powerful GPU-enabled calculator that the brain (our Express MCP Server) uses for heavy lifting. This separation of concerns ensures:
*   **Performance:** All heavy AI computations are isolated on this server, which can be scaled or moved to a machine with a powerful GPU without affecting the main application.
*   **Stability:** If an AI model crashes, it will only affect this microservice, not the entire e-commerce backend.
*   **Maintainability:** The Python AI stack is managed in one place, cleanly separated from the TypeScript/Node.js stack.

### **1.3. Execution Flow within the Server**
1.  **Startup (`lifespan` manager):** The server starts. The massive, multi-gigabyte Hugging Face models are loaded into RAM/VRAM. This is a slow, one-time operation.
2.  **Request Arrival:** An HTTP POST request arrives at either `/generate` or `/describe-image` from the Express MCP Server.
3.  **Data Validation:** FastAPI uses **Pydantic** to instantly validate that the incoming JSON body is correctly formatted.
4.  **Model Inference:** The request data is passed to the appropriate, pre-loaded **Hugging Face model pipeline**. The model runs its computation (inference).
5.  **Response:** The raw output from the model is formatted into a clean JSON response and sent back to the Express MCP Server.

## **2. Prerequisites: Setting Up Your Windows Machine for Python AI**

This section is a detailed checklist to prepare your development environment.

### **Step 1: Install Python**
1.  Go to the official Python website: `https://www.python.org/downloads/`
2.  Download the latest stable Windows installer for **Python 3.12.x**.
3.  Run the installer. **This is the most important step:** On the first screen of the installer, **check the box that says "Add Python.exe to PATH"**. This will allow you to run Python from any terminal.
4.  Choose "Install Now" to proceed with the default installation.
5.  After installation, open a new **PowerShell** or **Command Prompt** terminal and type `python --version`. You should see the version you just installed. If you do, you are ready.

### **Step 2: Install a Code Editor**
1.  If you don't already have it, download and install **Visual Studio Code (VS Code)** from `https://code.visualstudio.com/`. It's free and the standard for this kind of development.
2.  Open VS Code, go to the **Extensions** tab (the icon with four squares), and install the official **"Python"** extension by Microsoft. This will give you code highlighting, debugging, and IntelliSense.

## **3. Project Structure: A Modular & Scalable Design**

First, we will define the complete folder structure for the AI server. This clean separation of concerns is crucial for a professional application.

Inside your main `NextShop-Monorepo/` directory, create the `services/ai-server/` folder. Inside `ai-server`, the structure will be:

```plaintext
services/ai-server/
├── 📄 .env                  # Environment variables (e.g., for future model revisions)
├── 📄 main.py               # The main FastAPI application entry point
├── 📄 requirements.txt      # List of all Python packages to install
│
└── 📁 app/
    ├── 📄 __init__.py         # Makes 'app' a Python package
    ├── 📄 models.py            # Loads and manages all Hugging Face models
    ├── 📄 schemas.py           # Pydantic schemas for API request/response validation
    └── 📁 api/
        ├── 📄 __init__.py     # Makes 'api' a Python package
        └── 📄 endpoints.py     # Defines the API routes (/generate, /describe-image)
```

## **4. Step-by-Step Implementation Guide**

Follow these steps precisely. We will create each file and fill it with the necessary code.

### **Step 1: Create the Project Folders and Files**
1.  Open your project in VS Code.
2.  Open a new terminal in VS Code (`Terminal > New Terminal`).
3.  Execute these commands one by one to create the structure:
    ```powershell
    cd services
    mkdir ai-server
    cd ai-server
    mkdir -p app/api
    New-Item app/__init__.py
    New-Item app/api/__init__.py
    New-Item app/models.py
    New-Item app/schemas.py
    New-Item app/api/endpoints.py
    New-Item main.py
    New-Item requirements.txt
    New-Item .env
    ```

### **Step 2: Set Up the Virtual Environment**
A virtual environment is a private sandbox for your project's dependencies. This is a mandatory best practice in Python.

1.  In your terminal (which should be in the `services/ai-server` directory), run:
    ```powershell
    python -m venv venv
    ```
    This creates a `venv` folder containing a private copy of Python.

2.  **Activate the virtual environment.** You must do this every time you open a new terminal to work on this project.
    ```powershell
    .\venv\Scripts\activate
    ```
    You will see `(venv)` appear at the beginning of your terminal prompt. This means the sandbox is active.

### **Step 3: Define and Install Dependencies**
1.  Open the `requirements.txt` file and paste the following content:
    ```
    # FastAPI & Server
    fastapi~=0.111.0
    uvicorn[standard]~=0.30.1

    # AI & Machine Learning - Hugging Face Stack
    transformers~=4.42.3
    torch~=2.3.1
    accelerate~=0.31.0
    Pillow~=10.4.0

    # Utilities
    python-dotenv~=1.0.1
    ```

2.  In your **activated** terminal, run this command to install all these packages into your virtual environment:
    ```powershell
    pip install -r requirements.txt
    ```
    This will take several minutes as it downloads PyTorch and the other large libraries.

### **Step 4: Configure the Environment**
1.  Open the `.env` file and paste the following. While we don't have many variables now, this is good practice for the future.
    ```env
    # .env file for AI Inference Server
    LOG_LEVEL="INFO"
    ```

### **Step 5: Write the Code (Module by Module)**

We will now populate each file with its code, starting from the foundational modules.

#### **File 1: `app/schemas.py` (API Data Contracts)**
This file defines the expected shape of our API requests and responses using Pydantic, ensuring data integrity.
```python
# app/schemas.py
from pydantic import BaseModel

class TextGenerationRequest(BaseModel):
    prompt: str

class TextGenerationResponse(BaseModel):
    response: str

class ImageDescriptionRequest(BaseModel):
    image_b64: str

class ImageDescriptionResponse(BaseModel):
    caption: str
```

#### **File 2: `app/models.py` (Model Loading Logic)**
This is the heart of the server. It handles the loading and management of the heavy AI models.
```python
# app/models.py
from transformers import (
    BlipProcessor, 
    BlipForConditionalGeneration, 
    pipeline, 
    Pipeline
)
import torch

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
        """Loads all necessary AI models from Hugging Face into memory."""
        print("INFO: Loading Vision Model (Salesforce/blip-image-captioning-base)...")
        self.blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(self.device)
        print("INFO: Vision Model loaded successfully.")
        
        print("INFO: Loading Language Model (microsoft/phi-2)... This may take several minutes.")
        # `device_map="auto"` will automatically use a GPU if available
        self.llm_pipeline = pipeline(
            "text-generation", 
            model="microsoft/phi-2", 
            trust_remote_code=True, 
            torch_dtype="auto", 
            device_map="auto"
        )
        print("INFO: Language Model loaded successfully.")

# Create a single, global instance that will be used throughout the application's lifecycle
model_loader = ModelLoader()
```

#### **File 3: `app/api/endpoints.py` (The API Endpoints)**
This module defines the actual API routes, keeping the `main.py` file clean.
```python
# app/api/endpoints.py
import base64
import io
from fastapi import APIRouter, HTTPException
from PIL import Image

from app.models import model_loader
from app.schemas import (
    TextGenerationRequest, TextGenerationResponse,
    ImageDescriptionRequest, ImageDescriptionResponse
)

router = APIRouter()

@router.post("/generate", response_model=TextGenerationResponse)
def generate_text(req: TextGenerationRequest):
    """
    Receives a prompt and generates a text completion using the Phi-2 model.
    This is used by the MCP Server for all reasoning and text-generation tasks.
    """
    if not model_loader.llm_pipeline:
        raise HTTPException(status_code=503, detail="Language model is not loaded yet.")
    
    try:
        outputs = model_loader.llm_pipeline(req.prompt, max_new_tokens=512)
        # The pipeline returns the full text; we must clean it to only return the new part
        response_text = outputs[0]['generated_text'].replace(req.prompt, "").strip()
        return TextGenerationResponse(response=response_text)
    except Exception as e:
        print(f"ERROR in /generate: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate text.")

@router.post("/describe-image", response_model=ImageDescriptionResponse)
def describe_image(req: ImageDescriptionRequest):
    """
    Receives a Base64 encoded image and generates a descriptive caption.
    This is used by the MCP Server to power image search functionality.
    """
    if not model_loader.blip_model or not model_loader.blip_processor:
        raise HTTPException(status_code=503, detail="Vision model is not loaded yet.")
        
    try:
        # Decode the Base64 string back into image bytes
        img_bytes = base64.b64decode(req.image_b64)
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        processor = model_loader.blip_processor
        model = model_loader.blip_model
        
        # Process the image and generate a caption
        inputs = processor(image, return_tensors="pt").to(model_loader.device)
        out = model.generate(**inputs, max_new_tokens=40)
        caption = processor.decode(out[0], skip_special_tokens=True)
        
        return ImageDescriptionResponse(caption=caption)
    except Exception as e:
        print(f"ERROR in /describe-image: {e}")
        raise HTTPException(status_code=500, detail="Failed to process image.")
```

#### **File 4: `main.py` (The Server Entrypoint)**
This file assembles the application, starts the model loading process, and includes the API routes.
```python
# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.models import model_loader
from app.api.endpoints import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    The lifespan manager handles startup and shutdown events.
    This is the modern way to handle background tasks in FastAPI.
    """
    print("INFO: Server startup sequence initiated...")
    # This is a non-blocking call in the sense that it doesn't block the event loop,
    # but the server won't start accepting requests until it's done.
    model_loader.load_all_models()
    print("INFO: Startup complete. Server is ready.")
    yield
    # This code would run on shutdown (e.g., to clean up resources)
    print("INFO: Server is shutting down.")

app = FastAPI(
    title="NextShop AI Inference Server", 
    description="Provides access to language and vision models for the MCP Server.",
    version="1.0.0",
    lifespan=lifespan
)

# Include the API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "AI Inference Server is running"}
```

### **Step 6: Run and Test Your AI Server**

1.  Make sure your terminal is in the `services/ai-server` directory and your virtual environment `(venv)` is active.
2.  Run the server with this command:
    ```powershell
    uvicorn main:app --reload
    ```
3.  Wait for the models to download (on first run) and load. This can take 5-15 minutes. Once you see a line like `INFO: Uvicorn running on http://127.0.0.1:8000`, your server is live.
4.  **Test it:** Open your browser and go to `http://127.0.0.1:8000`. You should see `{"status": "AI Inference Server is running"}`. This confirms your server is operational and ready to receive requests from your Express MCP Server.

You have now built a complete, modular, and powerful AI Inference Server from scratch. It is ready to be the computational engine for your NextShop AI assistant.