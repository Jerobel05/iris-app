from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./iris.db"
    SECRET_KEY: str = "iris-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    SESSION_SECRET_KEY: str = "change-this-secret-key-in-production"
    FRONTEND_URL: str = "http://localhost:5173"
    PORT: int = 8000

    GMAIL_ADDRESS: Optional[str] = None
    GMAIL_APP_PASSWORD: Optional[str] = None
    GMAIL_CLIENT_ID: Optional[str] = None
    GMAIL_CLIENT_SECRET: Optional[str] = None
    GMAIL_REDIRECT_URI: str = "http://localhost:8000/api/gmail/oauth/callback"

    OPENAI_API_KEY: Optional[str] = None

    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""
    AZURE_TENANT_ID: str = "common"
    AZURE_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback"

    GOOGLE_CALENDAR_CREDENTIALS: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
