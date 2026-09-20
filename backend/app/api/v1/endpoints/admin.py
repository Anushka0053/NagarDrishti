from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.operations import IngestionRun

router = APIRouter()


@router.get("/ingestion-runs", tags=["Admin & ETL"])
def list_ingestion_runs(db: Session = Depends(get_db)):
    """Retrieve history and health of automated data source sync runs."""
    runs = db.query(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(20).all()
    return [
        {
            "id": str(r.id),
            "source_id": str(r.source_id),
            "run_type": r.run_type,
            "status": r.status,
            "started_at": r.started_at.isoformat(),
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "records_fetched": r.records_fetched,
            "records_inserted": r.records_inserted,
            "records_quarantined": r.records_quarantined,
            "error_summary": r.error_summary
        }
        for r in runs
    ]
