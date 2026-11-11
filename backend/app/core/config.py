from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/travellers_inn"
    SECRET_KEY: str = "changeme"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173"
    ADMIN_EMAIL: str = "admin@gmail.com"
    ADMIN_PASSWORD: str = "admin123"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
