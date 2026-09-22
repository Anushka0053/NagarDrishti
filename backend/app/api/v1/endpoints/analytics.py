from typing import Optional, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.core.database import get_db
from app.models.admin import City, Ward
from app.models.feedback import CitizenReport
from app.models.features import GISFeature
from app.models.intelligence import IssueCluster
from app.schemas.analytics import (
    CityAnalyticsResponse,
    WardAnalyticsResponse,
    CategoryBreakdownItem,
    WardBreakdownItem,
    MonthlyTrendItem
)

router = APIRouter()


@router.get("/city/{city_id}", response_model=CityAnalyticsResponse, tags=["Analytics"])
def get_city_analytics(city_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieve live aggregated civic intelligence metrics for a city.
    Zero synthetic or hardcoded data: Returns genuine totals from the database.
    If no citizen reports exist, returns 0 with null resolution rate cleanly.
    """
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"City '{city_id}' not found.")

    # 1. Citizen reports metrics
    report_stats = db.query(
        func.count(CitizenReport.id).label("total"),
        func.count(case((CitizenReport.status.in_(["submitted", "triaged", "assigned", "in_progress", "under_review"]), 1))).label("open"),
        func.count(case((CitizenReport.status == "resolved", 1))).label("resolved"),
        func.count(case((CitizenReport.status == "in_progress", 1))).label("in_progress"),
    ).filter(CitizenReport.city_id == city_id).first()

    total_reports = report_stats.total if report_stats else 0
    open_reports = report_stats.open if report_stats else 0
    resolved_reports = report_stats.resolved if report_stats else 0
    in_progress_reports = report_stats.in_progress if report_stats else 0

    resolution_rate = round((resolved_reports / total_reports) * 100.0, 1) if total_reports > 0 else None

    # 2. Verified GIS features count
    features_count = db.query(func.count(GISFeature.id)).filter(
        GISFeature.city_id == city_id,
        GISFeature.is_active == True
    ).scalar() or 0

    # 3. Active clusters count
    active_clusters_count = db.query(func.count(IssueCluster.id)).filter(
        IssueCluster.city_id == city_id,
        IssueCluster.cluster_status == "active"
    ).scalar() or 0

    # 4. Category breakdown
    cat_rows = db.query(
        CitizenReport.category,
        func.count(CitizenReport.id).label("count"),
        func.count(case((CitizenReport.status.in_(["submitted", "triaged", "assigned", "in_progress", "under_review"]), 1))).label("open"),
        func.count(case((CitizenReport.status == "resolved", 1))).label("resolved")
    ).filter(CitizenReport.city_id == city_id).group_by(CitizenReport.category).all()

    category_breakdown = [
        CategoryBreakdownItem(
            category=r.category,
            category_name_en=r.category.replace("_", " ").title(),
            count=r.count,
            open_count=r.open,
            resolved_count=r.resolved
        ) for r in cat_rows
    ]

    # 5. Ward breakdown
    ward_rows = db.query(
        Ward.id.label("ward_id"),
        Ward.ward_number,
        Ward.name_en.label("ward_name_en"),
        Ward.name_hi.label("ward_name_hi"),
        func.count(CitizenReport.id).label("count"),
        func.count(case((CitizenReport.status.in_(["submitted", "triaged", "assigned", "in_progress", "under_review"]), 1))).label("open"),
        func.count(case((CitizenReport.status == "resolved", 1))).label("resolved")
    ).outerjoin(CitizenReport, CitizenReport.ward_id == Ward.id)\
     .filter(Ward.city_id == city_id, Ward.is_active == True)\
     .group_by(Ward.id, Ward.ward_number, Ward.name_en, Ward.name_hi)\
     .order_by(Ward.ward_number.asc()).all()

    ward_breakdown = [
        WardBreakdownItem(
            ward_id=r.ward_id,
            ward_number=r.ward_number,
            ward_name_en=r.ward_name_en,
            ward_name_hi=r.ward_name_hi,
            count=r.count,
            open_count=r.open,
            resolved_count=r.resolved
        ) for r in ward_rows
    ]

    # Truth note if zero reports
    data_truth_note = None
    if total_reports == 0:
        data_truth_note = "No citizen reports recorded yet in live production database for this city."

    return CityAnalyticsResponse(
        city_id=city.id,
        city_name_en=city.name_en,
        city_name_hi=city.name_hi,
        total_reports=total_reports,
        open_reports=open_reports,
        resolved_reports=resolved_reports,
        in_progress_reports=in_progress_reports,
        resolution_rate=resolution_rate,
        avg_resolution_hours=None,
        sla_adherence_rate=None,
        verified_features_count=features_count,
        active_clusters_count=active_clusters_count,
        category_breakdown=category_breakdown,
        ward_breakdown=ward_breakdown,
        monthly_trend=[],
        is_mock_data=False,
        data_truth_note=data_truth_note
    )


@router.get("/ward/{ward_id}", response_model=WardAnalyticsResponse, tags=["Analytics"])
def get_ward_analytics(ward_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieve live aggregated civic intelligence metrics for a specific ward.
    """
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ward '{ward_id}' not found.")

    report_stats = db.query(
        func.count(CitizenReport.id).label("total"),
        func.count(case((CitizenReport.status.in_(["submitted", "triaged", "assigned", "in_progress", "under_review"]), 1))).label("open"),
        func.count(case((CitizenReport.status == "resolved", 1))).label("resolved"),
        func.count(case((CitizenReport.status == "in_progress", 1))).label("in_progress"),
    ).filter(CitizenReport.ward_id == ward_id).first()

    total_reports = report_stats.total if report_stats else 0
    open_reports = report_stats.open if report_stats else 0
    resolved_reports = report_stats.resolved if report_stats else 0
    in_progress_reports = report_stats.in_progress if report_stats else 0

    resolution_rate = round((resolved_reports / total_reports) * 100.0, 1) if total_reports > 0 else None

    features_count = db.query(func.count(GISFeature.id)).filter(
        GISFeature.ward_id == ward_id,
        GISFeature.is_active == True
    ).scalar() or 0

    cat_rows = db.query(
        CitizenReport.category,
        func.count(CitizenReport.id).label("count"),
        func.count(case((CitizenReport.status.in_(["submitted", "triaged", "assigned", "in_progress", "under_review"]), 1))).label("open"),
        func.count(case((CitizenReport.status == "resolved", 1))).label("resolved")
    ).filter(CitizenReport.ward_id == ward_id).group_by(CitizenReport.category).all()

    category_breakdown = [
        CategoryBreakdownItem(
            category=r.category,
            category_name_en=r.category.replace("_", " ").title(),
            count=r.count,
            open_count=r.open,
            resolved_count=r.resolved
        ) for r in cat_rows
    ]

    return WardAnalyticsResponse(
        ward_id=ward.id,
        ward_number=ward.ward_number,
        ward_name_en=ward.name_en,
        ward_name_hi=ward.name_hi,
        city_id=ward.city_id,
        total_reports=total_reports,
        open_reports=open_reports,
        resolved_reports=resolved_reports,
        in_progress_reports=in_progress_reports,
        resolution_rate=resolution_rate,
        category_breakdown=category_breakdown,
        features_count=features_count
    )
