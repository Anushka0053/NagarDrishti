import re
from typing import List, Optional, Any, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()


@router.get("", tags=["Search"])
def universal_search(
    q: str = Query(..., min_length=1, description="Search query string (city, ward, feature, or lat,lng coordinates)"),
    city_id: Optional[UUID] = Query(None, description="Optional city scope filter"),
    limit: int = Query(15, ge=1, le=50, description="Maximum number of search results"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Universal search across administrative entities, municipal wards, civic features, and raw coordinates.
    """
    query_str = q.strip()
    results = []

    # 1. Coordinate check: e.g. "26.2183, 78.1828" or "26.2183 78.1828"
    coord_pattern = r"^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)[,\s]+[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$"
    if re.match(coord_pattern, query_str):
        parts = re.split(r"[,\s]+", query_str)
        if len(parts) >= 2:
            try:
                lat = float(parts[0])
                lng = float(parts[1])
                # Ensure plausible range for MP / India (lat ~20-30, lng ~70-85)
                # If reversed (lng first), handle cleanly
                if lat > 50 and lng < 40:
                    lat, lng = lng, lat

                results.append({
                    "id": f"coord-{lat}-{lng}",
                    "title": f"Coordinate Location: {lat:.5f}, {lng:.5f}",
                    "subtitle": "Geographic WGS84 Point",
                    "type": "coordinate",
                    "category": "point_of_interest",
                    "city_id": None,
                    "ward_id": None,
                    "coordinates": [lng, lat],
                    "bbox": None,
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat]
                    }
                })
            except ValueError:
                pass

    # 2. Search Cities (name_en, name_hi, slug)
    city_query = text("""
        SELECT 
            id, name_en, name_hi, ulb_type, center_latitude, center_longitude, default_zoom
        FROM cities
        WHERE is_enabled = TRUE
          AND (name_en ILIKE :pattern OR name_hi ILIKE :pattern OR slug ILIKE :pattern)
        ORDER BY is_reference_city DESC, name_en ASC
        LIMIT 5;
    """)
    matching_cities = db.execute(city_query, {"pattern": f"%{query_str}%"}).fetchall()
    for c in matching_cities:
        results.append({
            "id": str(c.id),
            "title": f"{c.name_en} ({c.name_hi})",
            "subtitle": f"Urban Local Body • {c.ulb_type.replace('_', ' ').title()}",
            "type": "city",
            "category": "city",
            "city_id": str(c.id),
            "ward_id": None,
            "coordinates": [c.center_longitude, c.center_latitude],
            "zoom": c.default_zoom,
            "bbox": None,
            "geometry": {
                "type": "Point",
                "coordinates": [c.center_longitude, c.center_latitude]
            }
        })

    # 3. Search Wards (name_en, name_hi, ward_code, ward_number)
    ward_filter = ""
    ward_params = {"pattern": f"%{query_str}%"}
    if city_id:
        ward_filter = "AND w.city_id = :city_id"
        ward_params["city_id"] = city_id

    # Check if query is numeric e.g. "15" or "Ward 15"
    num_match = re.search(r"\b(\d{1,3})\b", query_str)
    num_filter = ""
    if num_match:
        ward_params["ward_num"] = int(num_match.group(1))
        num_filter = "OR w.ward_number = :ward_num"

    ward_query = text(f"""
        SELECT 
            w.id, w.city_id, w.ward_number, w.ward_code, w.name_en, w.name_hi,
            w.zone_name_en, c.name_en AS city_name_en,
            ST_X(w.centroid) AS center_lng, ST_Y(w.centroid) AS center_lat,
            ST_AsGeoJSON(w.geometry)::json AS geometry
        FROM wards w
        JOIN cities c ON w.city_id = c.id
        WHERE w.is_active = TRUE {ward_filter}
          AND (w.name_en ILIKE :pattern OR w.name_hi ILIKE :pattern OR w.ward_code ILIKE :pattern {num_filter})
        ORDER BY w.ward_number ASC
        LIMIT 5;
    """)
    matching_wards = db.execute(ward_query, ward_params).fetchall()
    for w in matching_wards:
        results.append({
            "id": str(w.id),
            "title": f"Ward {w.ward_number}: {w.name_en} ({w.name_hi})",
            "subtitle": f"{w.zone_name_en or 'Zone'} • {w.city_name_en}",
            "type": "ward",
            "category": "administrative_boundary",
            "city_id": str(w.city_id),
            "ward_id": str(w.id),
            "coordinates": [w.center_lng, w.center_lat] if w.center_lng and w.center_lat else None,
            "bbox": None,
            "geometry": w.geometry
        })

    # 4. Search GIS Features & Civic Assets
    feature_filter = ""
    feature_params = {"pattern": f"%{query_str}%", "limit": limit}
    if city_id:
        feature_filter = "AND f.city_id = :city_id"
        feature_params["city_id"] = city_id

    feature_query = text(f"""
        SELECT 
            f.id, f.layer_id, f.city_id, f.ward_id, f.external_id, f.name_en, f.name_hi,
            f.category, f.subcategory, l.name_en AS layer_name_en, c.name_en AS city_name_en,
            ST_AsGeoJSON(f.geometry)::json AS geometry,
            ST_X(ST_Centroid(f.geometry)) AS center_lng,
            ST_Y(ST_Centroid(f.geometry)) AS center_lat
        FROM gis_features f
        JOIN gis_layers l ON f.layer_id = l.id
        LEFT JOIN cities c ON f.city_id = c.id
        WHERE f.is_active = TRUE {feature_filter}
          AND (f.name_en ILIKE :pattern OR f.name_hi ILIKE :pattern OR f.category ILIKE :pattern OR f.external_id ILIKE :pattern)
        ORDER BY f.name_en ASC
        LIMIT :limit;
    """)
    matching_features = db.execute(feature_query, feature_params).fetchall()
    for f in matching_features:
        results.append({
            "id": str(f.id),
            "title": f"{f.name_en or f.category} ({f.name_hi or f.category})",
            "subtitle": f"{f.layer_name_en} • {f.city_name_en or 'Madhya Pradesh'}",
            "type": "feature",
            "category": f.category,
            "city_id": str(f.city_id) if f.city_id else None,
            "ward_id": str(f.ward_id) if f.ward_id else None,
            "coordinates": [f.center_lng, f.center_lat] if f.center_lng and f.center_lat else None,
            "bbox": None,
            "geometry": f.geometry
        })

    return {
        "query": query_str,
        "count": len(results),
        "results": results[:limit]
    }
