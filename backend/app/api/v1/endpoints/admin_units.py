from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.admin import AdminUnit
from app.schemas.admin import AdminUnitResponse

router = APIRouter()


@router.get("", response_model=List[AdminUnitResponse], tags=["Admin Units"])
def get_admin_units(
    unit_type: Optional[str] = Query(None, description="Filter by unit type (state, district, etc.)"),
    parent_id: Optional[str] = Query(None, description="Filter by parent administrative unit UUID"),
    db: Session = Depends(get_db)
):
    """Retrieve MP administrative hierarchy units."""
    query = db.query(AdminUnit).filter(AdminUnit.is_active == True)
    if unit_type:
        query = query.filter(AdminUnit.unit_type == unit_type)
    if parent_id:
        query = query.filter(AdminUnit.parent_id == parent_id)
    return query.order_by(AdminUnit.name_en.asc()).all()
