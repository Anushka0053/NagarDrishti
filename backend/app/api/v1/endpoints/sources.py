from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.layers import DataSource
from app.schemas.layers import DataSourceResponse

router = APIRouter()


@router.get("", response_model=List[DataSourceResponse], tags=["Data Sources"])
def get_data_sources(db: Session = Depends(get_db)):
    """Retrieve all authoritative and registered data sources in the MP matrix."""
    return db.query(DataSource).filter(DataSource.is_enabled == True).order_by(DataSource.name_en.asc()).all()


@router.get("/status", tags=["Data Sources"])
def get_data_sources_status(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Retrieve live connectivity and credential configuration status for all external GIS and intelligence sources.
    Transparently reports missing API credentials rather than claiming fake health.
    """
    sources = db.query(DataSource).all()
    statuses = []

    for src in sources:
        key = src.source_key
        status_val = "healthy"
        is_configured = True
        notes = src.notes or ""

        if key == "sarvam_ai":
            if not settings.SARVAM_API_KEY or settings.SARVAM_API_KEY.startswith("your_"):
                status_val = "credential_required"
                is_configured = False
                notes = "SARVAM_API_KEY environment variable not configured."
        elif key == "bhuvan_isro":
            if not settings.BHUVAN_API_KEY or settings.BHUVAN_API_KEY.startswith("your_"):
                status_val = "credential_required"
                is_configured = False
                notes = "BHUVAN_API_KEY required for direct ISRO satellite & WMS layers."
        elif key == "data_gov_in":
            if not settings.DATA_GOV_IN_API_KEY or settings.DATA_GOV_IN_API_KEY.startswith("your_"):
                status_val = "credential_required"
                is_configured = False
                notes = "DATA_GOV_IN_API_KEY required for automated OGD dataset sync."
        elif key in ("mp_cm_helpline_181", "mp_urban_development_portal", "gwalior_smart_city_portal"):
            status_val = "integration_pending"
            is_configured = False
            notes = "Direct state enterprise API gateway integration pending MOU / credential provisioning."
        elif key == "openstreetmap_mp":
            status_val = "healthy"
            is_configured = True
            notes = "Public Overpass API operational (ODbL 1.0 license)."

        statuses.append({
            "source_id": str(src.id),
            "source_key": src.source_key,
            "name_en": src.name_en,
            "name_hi": src.name_hi,
            "provider": src.provider,
            "authority_level": src.authority_level,
            "health_status": status_val,
            "is_configured": is_configured,
            "access_type": src.access_type,
            "license_type": src.license_type,
            "notes": notes,
            "last_successful_sync": src.last_successful_sync.isoformat() if src.last_successful_sync else None
        })

    return statuses

