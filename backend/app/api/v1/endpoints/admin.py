from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.security import require_roles, extract_user_identity, enforce_city_scope
from app.models.operations import IngestionRun, AuditLog
from app.models.feedback import UserProfile, CitizenReport
from app.models.admin import City
from app.models.features import GISFeature
from app.models.layers import GISLayer

router = APIRouter()


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Role to assign: super_admin, gis_admin, analyst, verifier, citizen")
    city_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    is_verified: Optional[bool] = None


class IngestionTriggerRequest(BaseModel):
    city_slug: str = Field(..., description="Target city: gwalior, indore, bhopal, jabalpur, ujjain")
    category: str = Field(..., description="Category to ingest: roads, health, education, etc.")
    source: str = Field("osm_overpass", description="Data source adapter")


@router.get("/overview", tags=["Admin & Department Portal"])
def get_admin_system_overview(
    claims: Dict[str, Any] = Depends(require_roles(["super_admin", "gis_admin", "analyst", "verifier"])),
    db: Session = Depends(get_db)
):
    """
    Consolidated operational overview for state and city administrators.
    Provides verifiable metrics on PostGIS data volumes, reports triage status, and system operations.
    """
    # 1. Total Features count
    total_features = db.query(GISFeature).count()
    total_layers = db.query(GISLayer).filter(GISLayer.is_active == True).count()

    # 2. City coverage breakdown across the 5 reference cities
    cities_query = text("""
        SELECT 
            c.id,
            c.name_en,
            c.name_hi,
            c.slug,
            c.is_enabled,
            COUNT(f.id) AS feature_count
        FROM cities c
        LEFT JOIN gis_features f ON c.id = f.city_id
        GROUP BY c.id, c.name_en, c.name_hi, c.slug, c.is_enabled
        ORDER BY feature_count DESC;
    """)
    cities_rows = db.execute(cities_query).fetchall()

    # 3. Citizen report counts grouped by status
    reports_status_query = text("""
        SELECT 
            status,
            COUNT(*) as count
        FROM citizen_reports
        GROUP BY status;
    """)
    report_rows = db.execute(reports_status_query).fetchall()
    report_counts = {r.status: r.count for r in report_rows}
    total_reports = sum(report_counts.values())

    # 4. Department distribution
    dept_reports_query = text("""
        SELECT 
            d.name_en,
            COUNT(r.id) as count
        FROM departments d
        LEFT JOIN citizen_reports r ON d.id = r.department_id
        GROUP BY d.name_en
        ORDER BY count DESC;
    """)
    dept_rows = db.execute(dept_reports_query).fetchall()

    # 5. Recent ingestion runs
    recent_runs = db.query(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(5).all()

    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "total_gis_features": total_features,
        "total_active_layers": total_layers,
        "total_citizen_reports": total_reports,
        "reports_by_status": report_counts,
        "cities": [
            {
                "id": str(c.id),
                "name_en": c.name_en,
                "name_hi": c.name_hi,
                "slug": c.slug,
                "is_enabled": c.is_enabled,
                "feature_count": c.feature_count
            }
            for c in cities_rows
        ],
        "departments_workload": [
            {"department": d.name_en, "reports_count": d.count}
            for d in dept_rows
        ],
        "recent_ingestion_runs": [
            {
                "id": str(r.id),
                "run_type": r.run_type,
                "status": r.status,
                "records_inserted": r.records_inserted,
                "started_at": r.started_at.isoformat()
            }
            for r in recent_runs
        ]
    }


@router.get("/users", tags=["Admin & Department Portal"])
def list_administrative_users(
    city_id: Optional[UUID] = Query(None),
    role: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    claims: Dict[str, Any] = Depends(require_roles(["super_admin", "gis_admin"])),
    db: Session = Depends(get_db)
):
    """List staff profiles and roles across MP Municipal Corporations."""
    query = db.query(UserProfile)
    if city_id:
        query = query.filter(UserProfile.preferred_city_id == city_id)
    if role:
        query = query.filter(UserProfile.role == role)

    total = query.count()
    users = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "users": [
            {
                "id": str(u.id),
                "role": u.role,
                "full_name": u.full_name or "N/A",
                "phone_number": u.phone_number,
                "preferred_city_id": str(u.preferred_city_id) if u.preferred_city_id else None,
                "department_id": str(u.department_id) if u.department_id else None,
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ]
    }


@router.patch("/users/{user_id}/role", tags=["Admin & Department Portal"])
def update_user_role(
    user_id: UUID,
    req: UserRoleUpdateRequest,
    claims: Dict[str, Any] = Depends(require_roles(["super_admin"])),
    db: Session = Depends(get_db)
):
    """Assign or modify municipal staff roles and department scopes (Super Admin only)."""
    valid_roles = ["super_admin", "gis_admin", "analyst", "verifier", "citizen", "guest"]
    if req.role not in valid_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role '{req.role}'. Allowed: {valid_roles}")

    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found.")

    old_role = user.role
    user.role = req.role
    if req.city_id is not None:
        user.preferred_city_id = req.city_id
    if req.department_id is not None:
        user.department_id = req.department_id
    if req.is_verified is not None:
        user.is_verified = req.is_verified

    user.updated_at = datetime.utcnow()

    # Log audit entry
    actor = extract_user_identity(claims)
    audit = AuditLog(
        actor_id=UUID(actor["user_id"]) if actor["user_id"] else None,
        actor_role=actor["role"],
        action="update_user_role",
        resource_type="user_profile",
        resource_id=user.id,
        diff_before={"role": old_role},
        diff_after={"role": req.role, "city_id": str(req.city_id) if req.city_id else None}
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"User role updated to '{req.role}'",
        "user_id": str(user.id),
        "new_role": user.role
    }


@router.get("/audit-logs", tags=["Admin & Department Portal"])
def list_system_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None),
    claims: Dict[str, Any] = Depends(require_roles(["super_admin", "gis_admin"])),
    db: Session = Depends(get_db)
):
    """Retrieve immutable security and administrative audit trail."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": [
            {
                "id": str(l.id),
                "actor_id": str(l.actor_id) if l.actor_id else None,
                "actor_role": l.actor_role,
                "action": l.action,
                "resource_type": l.resource_type,
                "resource_id": str(l.resource_id) if l.resource_id else None,
                "diff_before": l.diff_before,
                "diff_after": l.diff_after,
                "created_at": l.created_at.isoformat()
            }
            for l in logs
        ]
    }


@router.get("/ingestion-runs", tags=["Admin & ETL"])
def list_ingestion_runs(
    limit: int = Query(20, ge=1, le=100),
    claims: Dict[str, Any] = Depends(require_roles(["super_admin", "gis_admin", "analyst"])),
    db: Session = Depends(get_db)
):
    """Retrieve history and health of automated data source sync runs."""
    runs = db.query(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(limit).all()
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
