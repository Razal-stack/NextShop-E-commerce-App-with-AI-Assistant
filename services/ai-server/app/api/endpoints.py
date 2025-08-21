# app/api/endpoints.py
import base64
import io
import re
import json
from fastapi import APIRouter, HTTPException
from PIL import Image

from app.schemas import (
    TextGenerationRequest, TextGenerationResponse,
    ImageDescriptionRequest, ImageDescriptionResponse
)


from app.models import model_loader

router = APIRouter()

@router.post("/generate", response_model=TextGenerationResponse)
def generate_text(req: TextGenerationRequest):
    """
    Receives a prompt and generates a text completion using the Phi-3-mini GGUF model (llama_cpp.Llama).
    """
    if not model_loader.llm_pipeline:
        raise HTTPException(status_code=503, detail="Language model is not loaded yet.")
    try:
        # Build the full prompt with context if provided
        # Prompt instructs LLM to only output tool call instructions
        system_prompt = (
            "You are NextShop's AI assistant. Your job is to select the right tools and parameters to answer user queries about products, carts, and orders. "
            "Do not answer directly. Instead, specify which tool to call, with what arguments, and in what order. Output only tool call instructions in JSON format, e.g.:\n"
            "{\n  'tool': 'products.list',\n  'args': { 'category': 'electronics', 'priceMax': 50 }\n}"
        )
        full_prompt = f"System: {system_prompt}\nHuman: {req.prompt}"
        if req.context:
            context_text = "\n".join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in req.context])
            full_prompt = f"System: {system_prompt}\nPrevious conversation:\n{context_text}\n\nHuman: {req.prompt}"
        # Use llama_cpp.Llama API
        output = model_loader.llm_pipeline(
            full_prompt,
            max_tokens=req.max_tokens or 512,
            temperature=req.temperature or 0.7
        )
        print(f"DEBUG: Raw LLM output: {output}")
        response_text = output['choices'][0]['text'] if 'choices' in output and output['choices'] else ""
        if isinstance(response_text, str):
            response_text = response_text.strip()
        if not response_text:
            print(f"DEBUG: No response text generated for prompt: {full_prompt}")
            response_text = "I apologize, but I couldn't generate a proper response. Please try rephrasing your question."

        # Try to extract tool call with both double and single quotes
        tool_call_json = None
        tool_call_match = re.search(r'{\s*"tool"\s*:\s*"[^"]+"[\s\S]+?}\s*}', response_text)
        if not tool_call_match:
            tool_call_match = re.search(r"{\s*'tool'\s*:\s*'[^']+'[\s\S]+?}\s*}", response_text)
        if tool_call_match:
            try:
                tool_call_json = json.loads(tool_call_match.group(0))
            except Exception as e:
                print(f"ERROR parsing tool call JSON: {e}")
        if tool_call_json:
            generation = {
                "text": json.dumps(tool_call_json, indent=2),
                "message": {
                    "content": json.dumps(tool_call_json, indent=2),
                    "role": "ai"
                }
            }
        else:
            generation = {
                "text": response_text,
                "message": {
                    "content": response_text,
                    "role": "ai"
                }
            }
        return {
            "generations": [generation]
        }
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
        # Handle both raw base64 and data URL formats (data:image/jpeg;base64,...)
        image_data = req.image_b64.split(",")[-1] if "," in req.image_b64 else req.image_b64
        img_bytes = base64.b64decode(image_data)
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
