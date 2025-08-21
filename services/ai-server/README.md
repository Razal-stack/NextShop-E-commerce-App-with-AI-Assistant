# NextShop AI Inference Server

## Overview

This is the **AI Inference Server** for the NextShop AI Assistant "Nex". It's a specialized FastAPI microservice that provides AI model inference capabilities to the main Express.js MCP Server.

### Architecture Role

- **What it does**: Provides AI model inference (text generation + image description)
- **What it doesn't do**: Business logic, MCP tools, user management, or decision making
- **Communication**: Called by Express.js MCP Server via HTTP when AI computation is needed

## Models Used

- **Language Model**: `microsoft/phi-2` - For text generation and reasoning
- **Vision Model**: `Salesforce/blip-image-captioning-base` - For image description

## API Endpoints

### POST `/api/v1/generate`
Generates text using the Phi-2 language model.

**Request:**
```json
{
  "prompt": "Your text prompt here"
}
```

**Response:**
```json
{
  "response": "Generated text response"
}
```

### POST `/api/v1/describe-image`
Describes an image using the BLIP vision model.

**Request:**
```json
{
  "image_b64": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "caption": "Description of the image"
}
```

### GET `/health`
Health check endpoint to verify model loading status.

## Setup Instructions

### Prerequisites

1. **Python 3.12+** installed with "Add Python.exe to PATH" checked
2. **Visual Studio Code** with Python extension (recommended)

### Quick Setup

1. Run the setup script:
   ```powershell
   .\services\ai-server\setup.ps1
   ```

### Manual Setup

1. Navigate to the AI server directory:
   ```powershell
   cd services\ai-server
   ```

2. Create and activate virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Start the server:
   ```powershell
   uvicorn main:app --reload --port 8009
   ```

## Development

### Project Structure

```
services/ai-server/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env                # Environment variables
├── setup.ps1           # Automated setup script
└── app/
    ├── __init__.py     # Python package marker
    ├── models.py       # Model loading and management
    ├── schemas.py      # Pydantic request/response schemas
    └── api/
        ├── __init__.py # Python package marker
        └── endpoints.py # API route definitions
```

### Key Features

- **Model Preloading**: Models are loaded once at startup for fast inference
- **GPU Support**: Automatically uses CUDA if available
- **Health Monitoring**: Health check endpoint for monitoring
- **API Documentation**: Auto-generated docs at `/docs`
- **Error Handling**: Comprehensive error handling and logging

## Integration with MCP Server

The Express.js MCP Server will call this AI Inference Server via HTTP:

1. **Text Generation**: MCP Server sends prompts to `/api/v1/generate` for LangChain agent reasoning
2. **Image Analysis**: MCP Server sends images to `/api/v1/describe-image` for image search functionality

## Performance Notes

- **First Startup**: Takes 5-15 minutes to download and load models
- **Subsequent Startups**: ~1-2 minutes to load models from cache
- **Inference Speed**: Fast after models are loaded (subsecond responses)
- **Memory Usage**: ~4-8GB RAM depending on model size and GPU availability

## Troubleshooting

### Common Issues

1. **Import errors**: Make sure virtual environment is activated
2. **Model loading errors**: Check internet connection for first download
3. **CUDA errors**: GPU drivers may need updating
4. **Port conflicts**: Ensure port 8009 is available

### Logs

Check the console output for detailed startup and error logs.

## Production Deployment

For production deployment, consider:

- Using a process manager like PM2 or systemd
- Configuring proper logging
- Setting up health check monitoring
- Using a reverse proxy (nginx)
- Optimizing for your specific hardware (GPU/CPU)
