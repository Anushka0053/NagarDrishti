from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """System and database connectivity health probe."""
    db_status = "connected"
    postgis_version = "unknown"
    try:
        res = db.execute(text("SELECT PostGIS_Full_Version();")).fetchone()
        if res:
            postgis_version = str(res[0])
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "postgis_version": postgis_version,
        "reference_city": "Gwalior (MP)",
        "scope": "Madhya Pradesh"
    }
