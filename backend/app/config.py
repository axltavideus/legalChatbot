"""Application configuration loaded from .env via pydantic-settings."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./lexindo.db"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Admin
    ADMIN_INVITE_CODE: str = "ADMIN2025"

    # Gemini / LLM
    GEMINI_API_KEY: str = ""
    MOCK_LLM: bool = True

    # ChromaDB
    CHROMA_PATH: str = "./chroma_db"

    # Embeddings
    EMBEDDING_PROVIDER: str = "gemini"  # "gemini" | "sentence-transformers" | "offline"
    GEMINI_EMBEDDING_MODEL: str = "models/text-embedding-004"
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-base"
    SIMILARITY_THRESHOLD: float = 0.45
    RETRIEVAL_TOP_K: int = 5

    # CORS — comma-separated origins in .env, e.g. "http://localhost:3000"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

