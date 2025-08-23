# Generic AI Reasoning Server

A minimal, cross-platform AI reasoning server that automatically detects and uses local AI models from the `models/` folder.

## Key Features

- **Auto-Model Detection**: Automatically finds and uses models from `models/` folder
- **Cross-Platform**: Works on Windows, Mac, and Linux
- **Generic & Dynamic**: No hardcoded business logic - adaptable for any use case
- **Minimal Dependencies**: Only essential packages
- **Mock Mode**: Works even without models for testing

## Quick Start

### 1. Setup Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Add Your Models
Place your AI models in the `models/` folder:

```
models/
├── my-chat-model/          # HuggingFace model folder
│   ├── config.json
│   ├── model.safetensors
│   └── tokenizer.json
├── vision-model.bin        # Vision model file
└── language-model.gguf     # GGUF format model
```

Supported formats:
- **HuggingFace folders** (with config.json)
- **GGUF files** (.gguf)
- **PyTorch files** (.bin, .pt, .pth)
- **SafeTensors** (.safetensors)

### 3. Start Server
```bash
python main.py
# or
.\start.bat    # Windows
.\start.ps1    # PowerShell
```

Server runs at `http://localhost:8000`

## API Usage

### Text Reasoning
```bash
curl -X POST http://localhost:8000/reason \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Analyze this customer query and suggest actions",
    "context": "Customer wants to return item after 60 days",
    "task_type": "customer_support"
  }'
```

### Image Analysis
```bash
curl -X POST http://localhost:8000/reason-image \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "What products are in this image?",
    "image_data": "base64-encoded-image-data",
    "context": "Customer wants similar products"
  }'
```

### Health Check
```bash
curl http://localhost:8000/health
```

## Model Auto-Detection

The server automatically:

1. **Scans `models/` folder** for supported formats
2. **Detects model types** (text, vision, etc.)
3. **Selects best model** based on size and type
4. **Falls back to mock mode** if no models found

**Example log output:**
```
INFO - Found 2 models in models/ directory
INFO -   - llama-7b-chat (huggingface, 13420.5MB)
INFO -   - vision-model (vision, 2100.3MB)
INFO - Loading text model: llama-7b-chat (huggingface)
INFO - Text model loaded successfully on cuda
```

## Integration Example

Use with your backend (Express.js + LangChain):

```javascript
// Your backend passes context and instructions
const aiResponse = await fetch('http://localhost:8000/reason', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        instruction: "Analyze this user query and determine which tools to use",
        context: `
            User Query: "${userMessage}"
            Available MCP Tools: ${JSON.stringify(availableTools)}
            User Session: ${JSON.stringify(userContext)}
            Previous Actions: ${JSON.stringify(previousActions)}
        `,
        task_type: "tool_selection",
        parameters: {
            max_tokens: 256,
            temperature: 0.7
        }
    })
});

const reasoning = await aiResponse.json();
// Use reasoning.result to decide which MCP tools to call
const recommendedActions = parseAIResponse(reasoning.result);
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `127.0.0.1` | Server host |
| `PORT` | `8000` | Server port |
| `DEBUG` | `true` | Debug mode |
| `MAX_TOKENS` | `512` | Default response length |
| `TEMPERATURE` | `0.7` | Creativity level |
| `DEVICE` | `auto` | Hardware: auto/cpu/cuda |

## Architecture Benefits

- **Separation of Concerns**: AI server only does reasoning
- **Reusable**: Use same server for different applications
- **Scalable**: Can run on separate machines
- **Testable**: Mock mode allows testing without models
- **Flexible**: Works with various model formats

## No Models? No Problem!

If no models are found, the server runs in **mock mode**:
- Provides intelligent mock responses
- Useful for development and testing
- Same API, just simulated responses

This ensures your backend integration works even before you have models.

---

**Philosophy**: Keep AI server generic. Let your backend provide all the context and business logic.