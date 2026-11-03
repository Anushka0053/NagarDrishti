from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator

_BASE_DIR = Path(__file__).resolve().parents[2]
_ENV_FILES = [str(_BASE_DIR / ".env"), str(_BASE_DIR / "backend" / ".env"), ".env", "backend/.env"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "NagarDrishti API"
    API_V1_PREFIX: str = "/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:8000"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/nagardrishti"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None

    # Sarvam AI
    SARVAM_API_KEY: Optional[str] = None
    SARVAM_BASE_URL: str = "https://api.sarvam.ai"

    # Geospatial Providers
    BHUVAN_API_KEY: Optional[str] = None
    BHUVAN_BASE_URL: str = "https://bhuvan-app1.nrsc.gov.in/api"
    DATA_GOV_IN_API_KEY: Optional[str] = None
    MP_ESERVICE_API_URL: str = "https://www.services.mp.gov.in/eservice/openAPI"
    GARUD_PORTAL_URL: str = "https://www.urbangis.mp.gov.in/"
    ROUTING_API_URL: str = "https://router.project-osrm.org"
    GEOCODING_URL: Optional[str] = None  # Explicitly approved Nominatim-compatible /search endpoint
    GEOCODING_USER_AGENT: str = "NagarDrishti/1.0"


settings = Settings()
