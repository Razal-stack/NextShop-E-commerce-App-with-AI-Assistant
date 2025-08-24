# AI Server - Simple Setup Like Your Webapp

## Prerequisites

- **Python 3.13+** (that's it!)
- Check: `python --version` should show 3.13 or higher

## Quick Start (Just Like `pnpm i` and `pnpm dev`)

```bash
# 1. Install dependencies (like 'pnpm i')
python install.py

# 2. Start development server (like 'pnpm dev') 
python dev.py
```

**That's it!** Server runs at `http://localhost:8000`

### What Each Script Does

- `install.py` = `pnpm i` for Python (creates venv, installs all dependencies)
- `dev.py` = `pnpm dev` for Python (starts development server with hot reload)

### Works Immediately

- All dependencies included - no missing packages
- Works without AI models (mock mode for testing)
- Hot reload enabled - code changes restart server automatically  
- No manual setup needed - scripts handle everything

### Troubleshooting

**"python: command not found"**  
- Install Python 3.8+ from https://python.org
- Make sure Python is in your PATH

**"Python 3.x required"**  
- You have Python 2.x or older
- Install Python 3.8+ from https://python.org

**Installation fails**  
- Make sure you have internet connection (downloads packages)
- Try running as administrator (Windows) or with sudo (Mac/Linux)

### If You Want Real AI Models (Optional)

Add models to `models/` folder and they'll be auto-detected:

```
models/
├── my-model.gguf          # GGUF format
├── chat-model/            # HuggingFace folder
└── vision-model.bin       # PyTorch model
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