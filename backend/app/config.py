import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Locate and load project root .env file
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH, override=True)
else:
    load_dotenv(override=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "AegisAgent — Agentic AppSec Testing Platform"
    VERSION: str = "1.0.0"
    AUTHOR: str = "Harsh Patel"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # LLM Settings (Configured for gpt-6-luna with xhigh thinking mode)
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-6-luna")
    LLM_THINKING_MODE: str = os.getenv("LLM_THINKING_MODE", "xhigh")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip("[] \n\r\"'")
    ENABLE_FALLBACK_SIMULATOR: bool = True
    
    # Probing safety & limits
    SAFE_ACTIVE_MODE: bool = True
    MAX_PROBE_CONCURRENCY: int = 5
    REQUEST_TIMEOUT_SECONDS: float = 8.0
    
    # Target Ports & Endpoints
    WEB_TARGET_PORT: int = 80
    API_TARGET_PORT: int = 8081
    CHATBOT_TARGET_PORT: int = 8082
    SIMULATOR_PORT: int = 8090

settings = Settings()

