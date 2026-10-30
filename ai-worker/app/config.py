import os
import socket
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class WorkerSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    SUPABASE_URL: str = Field(default="https://placeholder.supabase.co")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="placeholder-key")
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-3.8-flash")
    SUPABASE_STORAGE_BUCKET: str = Field(default="documents")
    
    JOB_POLL_INTERVAL_SECONDS: int = Field(default=5)
    JOB_MAX_ATTEMPTS: int = Field(default=3)
    JOB_STALE_AFTER_MINUTES: int = Field(default=20)
    
    MAX_FILE_SIZE_MB: int = Field(default=25)
    MAX_PDF_PAGES: int = Field(default=200)
    MAX_OCR_PAGES: int = Field(default=100)
    GEMINI_MAX_RETRIES: int = Field(default=2)
    
    WORKER_ID: str = Field(default_factory=lambda: f"worker-{socket.gethostname()}-{os.getpid()}")

settings = WorkerSettings()

