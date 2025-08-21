
# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn
from app.models import model_loader
from app.api.endpoints import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("INFO: Server startup sequence initiated...")
    model_loader.load_all_models()
    print("INFO: Startup complete. Server is ready.")
    yield
    print("INFO: Server is shutting down.")

app = FastAPI(
    title="NextShop AI Inference Server", 
    description="Provides access to language and vision models for the MCP Server.",
    version="1.0.0",
    lifespan=lifespan
)
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "AI Inference Server is running"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "models_loaded": {
            "llm": model_loader.llm_pipeline is not None,
            "vision": model_loader.blip_model is not None
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8009, reload=False)
