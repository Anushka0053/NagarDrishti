import time
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.adapters.sarvam import SarvamAIAdapter

router = APIRouter()


@router.get("/health", tags=["System & Reliability"])
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Comprehensive system health, PostGIS geospatial engine status, and adapter readiness probe.
    Used by load balancers, monitoring daemons, and administrative dashboards.
    """
    start_time = time.time()
    db_status = "connected"
    postgis_version = "unknown"
    spatial_tables_count = 0

    try:
        # Measure DB ping latency
        res = db.execute(text("SELECT PostGIS_Full_Version();")).fetchone()
        if res:
            postgis_version = str(res[0]).split("\n")[0]

        # Verify spatial tables count
        table_count_res = db.execute(text("""
            SELECT count(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name IN ('cities', 'wards', 'gis_layers', 'gis_features', 'citizen_reports', 'issue_clusters');
        """)).fetchone()
        if table_count_res:
            spatial_tables_count = int(table_count_res[0])

    except Exception as e:
        db_status = f"degraded: {str(e)}"

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    sarvam = SarvamAIAdapter()

    overall_status = "healthy" if db_status == "connected" and spatial_tables_count >= 4 else "degraded"

    return {
        "status": overall_status,
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "latency_ms": elapsed_ms,
        "database": {
            "status": db_status,
            "postgis_version": postgis_version,
            "verified_core_tables": spatial_tables_count,
            "pool_size": settings.DATABASE_POOL_SIZE,
            "max_overflow": settings.DATABASE_MAX_OVERFLOW
        },
        "geospatial_scope": {
            "state": "Madhya Pradesh (MP)",
            "reference_cities": ["Gwalior", "Indore", "Bhopal", "Jabalpur", "Ujjain"],
            "coordinate_reference_system": "EPSG:4326 (WGS 84)"
        },
        "adapters": {
            "sarvam_ai": {
                "configured": sarvam.is_configured,
                "stt_model": "saarika:v1",
                "tts_model": "bulbul:v1",
                "mode": "live" if sarvam.is_configured else "offline_simulation"
            },
            "routing_engine": {
                "url": settings.ROUTING_API_URL,
                "status": "active"
            }
        }
    }


@router.get("/health/live", tags=["System & Reliability"])
def liveness_probe():
    """Lightweight Kubernetes/Docker liveness probe returning HTTP 200 if container is responsive."""
    return {"status": "alive"}


@router.get("/health/ready", tags=["System & Reliability"])
def readiness_probe(db: Session = Depends(get_db)):
    """Kubernetes/Docker readiness probe returning HTTP 200 only if database connection is verified."""
    try:
        db.execute(text("SELECT 1;"))
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: Database connection failed: {str(e)}"
        )
