# app/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional

class TextGenerationRequest(BaseModel):
    prompt: str
    context: Optional[List[Dict[str, str]]] = None  # For conversation history
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7

class ChatGenerationMessage(BaseModel):
    content: str
    role: str

class ChatGeneration(BaseModel):
    text: str
    message: ChatGenerationMessage

class TextGenerationResponse(BaseModel):
    generations: List[ChatGeneration]

class ImageDescriptionRequest(BaseModel):
    image_b64: str

class ImageDescriptionResponse(BaseModel):
    caption: str
