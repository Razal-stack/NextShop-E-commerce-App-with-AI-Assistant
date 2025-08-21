# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    EXPRESS_API_BASE: str = os.getenv("EXPRESS_API_BASE", "http://localhost:3001/api")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

settings = Settings()
