from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.schemas.spatial import IdentifyResult, IdentifyRequest


class SpatialService:
    @staticmethod
    def identify_at_coordinate(db: Session, request: IdentifyRequest) -> List[IdentifyResult]:
        """
        Performs spatial identify query against active/queryable GIS features and administrative boundaries
        using PostGIS ST_DWithin.
        """
        lat, lng = request.latitude, request.longitude
        tolerance = request.tolerance_meters or 30.0

        query = text("""
            SELECT 
                f.id AS feature_id,
                f.layer_id,
                l.name_en AS layer_name_en,
                l.name_hi AS layer_name_hi,
                f.name_en,
                f.name_hi,
                f.category,
                f.properties,
                ST_Distance(
                    f.geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                ) AS distance_meters,
                ds.attribution_text_en,
                ds.attribution_text_hi,
                ds.health_status,
                f.source_updated_at
            FROM gis_features f
            JOIN gis_layers l ON f.layer_id = l.id
            LEFT JOIN data_sources ds ON f.source_id = ds.id
            WHERE f.is_active = TRUE
              AND l.is_queryable = TRUE
              AND ST_DWithin(
                    f.geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :tolerance
                  )
            ORDER BY distance_meters ASC
            LIMIT 10;
        """)

        results = db.execute(query, {"lat": lat, "lng": lng, "tolerance": tolerance}).fetchall()
        
        identify_results = []
        for r in results:
            identify_results.append(IdentifyResult(
                feature_id=str(r.feature_id),
                layer_id=str(r.layer_id),
                layer_name_en=r.layer_name_en,
                layer_name_hi=r.layer_name_hi,
                name_en=r.name_en or r.category,
                name_hi=r.name_hi or r.category,
                category=r.category,
                distance_meters=round(r.distance_meters, 2) if r.distance_meters is not None else 0.0,
                properties=r.properties or {},
                source_attribution_en=r.attribution_text_en,
                source_attribution_hi=r.attribution_text_hi,
                source_health=r.health_status,
                last_updated=r.source_updated_at.isoformat() if r.source_updated_at else None
            ))

        return identify_results

    @staticmethod
    def get_features_geojson(
        db: Session, 
        layer_id: UUID, 
        city_id: Optional[UUID] = None, 
        ward_id: Optional[UUID] = None,
        bbox: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Returns GeoJSON FeatureCollection directly using PostGIS ST_AsGeoJSON for maximum performance.
        """
        extra_filters = ""
        params: Dict[str, Any] = {"layer_id": layer_id}

        if city_id:
            extra_filters += " AND f.city_id = :city_id"
            params["city_id"] = city_id

        if ward_id:
            extra_filters += " AND f.ward_id = :ward_id"
            params["ward_id"] = ward_id

        if bbox and len(bbox) == 4:
            # bbox = [min_lng, min_lat, max_lng, max_lat]
            extra_filters += " AND f.geometry && ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326)"
            params.update({
                "min_lng": bbox[0],
                "min_lat": bbox[1],
                "max_lng": bbox[2],
                "max_lat": bbox[3]
            })

        query = text(f"""
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(
                    json_agg(
                        json_build_object(
                            'type', 'Feature',
                            'id', f.id,
                            'geometry', ST_AsGeoJSON(f.geometry)::json,
                            'properties', json_build_object(
                                'id', f.id,
                                'name_en', f.name_en,
                                'name_hi', f.name_hi,
                                'category', f.category,
                                'layer_id', f.layer_id,
                                'city_id', f.city_id,
                                'ward_id', f.ward_id,
                                'attributes', f.properties
                            )
                        )
                    ),
                    '[]'::json
                )
            ) AS geojson
            FROM gis_features f
            WHERE f.layer_id = :layer_id AND f.is_active = TRUE {extra_filters};
        """)

        row = db.execute(query, params).fetchone()
        if row and row.geojson:
            return row.geojson
        return {"type": "FeatureCollection", "features": []}

    @staticmethod
    def resolve_location_hierarchy(db: Session, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Resolves point-in-polygon administrative hierarchy (State > District > City > Ward)
        for a given WGS84 coordinate.
        """
        # 1. Check Ward containment or nearest ward
        ward_query = text("""
            SELECT 
                w.id AS ward_id,
                w.ward_number,
                w.ward_code,
                w.name_en AS ward_name_en,
                w.name_hi AS ward_name_hi,
                w.zone_name_en,
                w.corporator_name,
                c.id AS city_id,
                c.name_en AS city_name_en,
                c.name_hi AS city_name_hi,
                c.ulb_type,
                a.name_en AS district_name_en,
                a.name_hi AS district_name_hi,
                ST_Contains(w.geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) AS is_inside,
                ST_Distance(w.centroid::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_meters
            FROM wards w
            JOIN cities c ON w.city_id = c.id
            LEFT JOIN admin_units a ON c.district_id = a.id
            WHERE w.is_active = TRUE
            ORDER BY is_inside DESC, distance_meters ASC
            LIMIT 1;
        """)
        ward_row = db.execute(ward_query, {"lat": latitude, "lng": longitude}).fetchone()

        if ward_row:
            return {
                "latitude": latitude,
                "longitude": longitude,
                "state": "Madhya Pradesh",
                "state_code": "MP",
                "district_en": ward_row.district_name_en or "Gwalior",
                "district_hi": ward_row.district_name_hi or "ग्वालियर",
                "city_id": str(ward_row.city_id),
                "city_en": ward_row.city_name_en,
                "city_hi": ward_row.city_name_hi,
                "ulb_type": ward_row.ulb_type,
                "ward_id": str(ward_row.ward_id),
                "ward_number": ward_row.ward_number,
                "ward_code": ward_row.ward_code,
                "ward_en": ward_row.ward_name_en,
                "ward_hi": ward_row.ward_name_hi,
                "zone_en": ward_row.zone_name_en,
                "corporator": ward_row.corporator_name,
                "is_exact_containment": bool(ward_row.is_inside)
            }

        # Fallback default MP state context
        return {
            "latitude": latitude,
            "longitude": longitude,
            "state": "Madhya Pradesh",
            "state_code": "MP",
            "district_en": "Madhya Pradesh",
            "district_hi": "मध्य प्रदेश",
            "city_id": None,
            "city_en": "Madhya Pradesh",
            "city_hi": "मध्य प्रदेश",
            "ulb_type": None,
            "ward_id": None,
            "ward_number": None,
            "ward_code": None,
            "ward_en": None,
            "ward_hi": None,
            "zone_en": None,
            "corporator": None,
            "is_exact_containment": False
        }
