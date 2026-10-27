from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.schemas.datasets import (
    DatasetValidateResponse, DatasetImportRequest, DatasetImportResponse,
    AdminCreateFeatureRequest, AdminFeatureResponse
)
from app.services.dataset_service import DatasetService

router = APIRouter()


@router.post("/validate", response_model=DatasetValidateResponse, tags=["Dataset Administration"])
async def validate_dataset_upload(
    file: UploadFile = File(...)
):
    """
    Upload and validate a vector dataset file (GeoJSON, KML, CSV, zipped Shapefile).
    Returns file metadata, feature count, CRS, geometry types, and sample preview.
    """
    try:
        content = await file.read()
        return DatasetService.validate_and_preview(file.filename, content)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded file: {str(e)}"
        )


@router.post("/import", response_model=DatasetImportResponse, tags=["Dataset Administration"])
def import_dataset(
    request: DatasetImportRequest,
    db: Session = Depends(get_db)
):
    """
    Executes the validated vector dataset import into PostGIS gis_features table,
    updates DataCoverage metadata, and logs an IngestionRun audit record.
    """
    try:
        return DatasetService.execute_import(db, request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dataset import failed: {str(e)}"
        )


@router.post("/features", response_model=AdminFeatureResponse, tags=["Dataset Administration"])
def create_admin_feature(
    request: AdminCreateFeatureRequest,
    db: Session = Depends(get_db)
):
    """
    Manually creates a new verified feature in a GIS layer with explicit provenance and attributes.
    """
    try:
        return DatasetService.create_admin_feature(db, request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feature creation failed: {str(e)}"
        )


@router.get("/runs", tags=["Dataset Administration"])
def get_ingestion_runs(
    db: Session = Depends(get_db),
    limit: int = 20
):
    """
    Returns audit history of automated sync and dataset upload runs.
    """
    query = text("""
        SELECT 
            r.id,
            r.run_type,
            r.status,
            r.records_fetched,
            r.records_inserted,
            r.records_quarantined AS records_rejected,
            r.started_at,
            r.completed_at,
            r.error_summary AS error_log,
            ds.name_en AS source_name
        FROM ingestion_runs r
        LEFT JOIN data_sources ds ON r.source_id = ds.id
        ORDER BY r.started_at DESC
        LIMIT :limit;
    """)
    rows = db.execute(query, {"limit": limit}).fetchall()
    return [
        {
            "id": str(r.id),
            "run_type": r.run_type,
            "status": r.status,
            "records_fetched": r.records_fetched,
            "records_inserted": r.records_inserted,
            "records_rejected": r.records_rejected,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "error_log": r.error_log,
            "source_name": r.source_name
        }
        for r in rows
    ]


