from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.layers import DataSource
from app.schemas.layers import DataSourceResponse

router = APIRouter()


@router.get("", response_model=List[DataSourceResponse], tags=["Data Sources"])
def get_data_sources(db: Session = Depends(get_db)):
    """Retrieve all authoritative and registered data sources in the MP matrix."""
    return db.query(DataSource).filter(DataSource.is_enabled == True).order_by(DataSource.name_en.asc()).all()
