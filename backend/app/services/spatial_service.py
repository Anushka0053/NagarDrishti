import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.schemas.spatial import (
    IdentifyResult, IdentifyRequest,
    BufferRequest, BufferAnalysisResult, BufferFeatureItem,
    ProximityRequest, ProximityAnalysisResult, ProximityFeatureItem,
    RouteRequest, RouteAnalysisResult, CivicIssueAlongRoute,
    MeasureRequest, MeasureResult,
    CompareRequest, CompareResult, AreaMetrics,
    SuitabilityRequest, SuitabilityResult, SuitabilityCell
)

logger = logging.getLogger("nagardrishti.services.spatial")


class SpatialService:
    @staticmethod
    def identify_at_coordinate(db: Session, request: IdentifyRequest) -> List[IdentifyResult]:
        """
        Performs spatial identify query against active/queryable GIS features and administrative boundaries
        using PostGIS ST_DWithin.
        """
        lat, lng = request.latitude, request.longitude
        tolerance = request.tolerance_meters or 30.0

        extra_filter = ""
        params: Dict[str, Any] = {"lat": lat, "lng": lng, "tolerance": tolerance}
        if request.city_id:
            extra_filter += " AND f.city_id = :city_id"
            params["city_id"] = request.city_id

        query = text(f"""
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
                f.provenance_type,
                f.source_updated_at
            FROM gis_features f
            JOIN gis_layers l ON f.layer_id = l.id
            LEFT JOIN data_sources ds ON f.source_id = ds.id
            WHERE f.is_active = TRUE
              AND l.is_queryable = TRUE
              {extra_filter}
              AND ST_DWithin(
                    f.geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :tolerance
                  )
            ORDER BY distance_meters ASC
            LIMIT 10;
        """)

        results = db.execute(query, params).fetchall()
        
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
                provenance_type=r.provenance_type or "official_verified",
                source_attribution_en=r.attribution_text_en,
                source_attribution_hi=r.attribution_text_hi,
                source_health=r.health_status,
                last_updated=r.source_updated_at.isoformat() if r.source_updated_at else None
            ))

        return identify_results

    @staticmethod
    def run_buffer_analysis(db: Session, request: BufferRequest) -> BufferAnalysisResult:
        """
        Calculates geodesic PostGIS ST_Buffer on EPSG:4326 geography, performs spatial intersection
        with gis_features, checks data coverage availability, and returns structured results.
        """
        lat = request.origin_latitude
        lng = request.origin_longitude
        radius = request.buffer_meters

        # 1. Generate buffer polygon geometry
        buffer_query = text("""
            SELECT ST_AsGeoJSON(
                ST_Buffer(
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radius
                )::geometry
            )::json AS buffer_geom;
        """)
        buffer_row = db.execute(buffer_query, {"lng": lng, "lat": lat, "radius": radius}).fetchone()
        buffer_geom = buffer_row.buffer_geom if buffer_row else None

        # 2. Check coverage status for requested city/target layer
        coverage_warning = None
        coverage_status = "available"
        if request.city_id and request.target_layer_ids:
            cov_query = text("""
                SELECT l.name_en, c.coverage_status
                FROM gis_layers l
                LEFT JOIN data_coverage c ON c.layer_id = l.id AND c.city_id = :city_id
                WHERE l.id = ANY(:layer_ids);
            """)
            cov_rows = db.execute(cov_query, {"city_id": request.city_id, "layer_ids": request.target_layer_ids}).fetchall()
            unavailable_layers = [r.name_en for r in cov_rows if not r.coverage_status or r.coverage_status not in ("available", "partial")]
            if unavailable_layers:
                coverage_status = "partial" if len(unavailable_layers) < len(cov_rows) else "unavailable"
                coverage_warning = f"Dataset for {', '.join(unavailable_layers)} is not currently available for this area."

        # 3. Query features within buffer with distance sorting
        extra_filters = ""
        params: Dict[str, Any] = {"lng": lng, "lat": lat, "radius": radius}
        if request.city_id:
            extra_filters += " AND f.city_id = :city_id"
            params["city_id"] = request.city_id
        if request.target_layer_ids:
            extra_filters += " AND f.layer_id = ANY(:target_layer_ids)"
            params["target_layer_ids"] = request.target_layer_ids
        if request.category:
            extra_filters += " AND (f.category = :category OR f.subcategory = :category)"
            params["category"] = request.category

        features_query = text(f"""
            SELECT 
                f.id,
                f.name_en,
                f.name_hi,
                f.category,
                f.provenance_type,
                ds.attribution_text_en,
                ST_Distance(
                    f.geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                ) AS distance_meters,
                ST_AsGeoJSON(f.geometry)::json AS geom
            FROM gis_features f
            LEFT JOIN data_sources ds ON f.source_id = ds.id
            WHERE f.is_active = TRUE
              {extra_filters}
              AND ST_DWithin(
                    f.geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radius
              )
            ORDER BY distance_meters ASC
            LIMIT 100;
        """)

        feature_rows = db.execute(features_query, params).fetchall()
        feature_items: List[BufferFeatureItem] = []
        for r in feature_rows:
            feature_items.append(BufferFeatureItem(
                id=str(r.id),
                name_en=r.name_en or "Civic Feature",
                name_hi=r.name_hi,
                category=r.category,
                distance_meters=round(r.distance_meters, 1) if r.distance_meters is not None else 0.0,
                provenance_type=r.provenance_type or "community_open",
                source_attribution=r.attribution_text_en or "NagarDrishti Spatial Platform",
                geometry=r.geom
            ))

        return BufferAnalysisResult(
            origin=[lng, lat],
            buffer_meters=radius,
            buffer_geometry=buffer_geom,
            feature_count=len(feature_items),
            features=feature_items,
            coverage_status=coverage_status,
            coverage_warning=coverage_warning,
            provenance_type="internal_derived"
        )

    @staticmethod
    def run_proximity_analysis(db: Session, request: ProximityRequest) -> ProximityAnalysisResult:
        """
        Finds nearest facilities ordered by geodesic distance using PostGIS ST_DWithin and ST_Distance.
        """
        lat = request.origin_latitude
        lng = request.origin_longitude
        max_dist = request.max_radius_meters
        limit = request.limit

        extra_filters = ""
        params: Dict[str, Any] = {"lng": lng, "lat": lat, "max_dist": max_dist, "limit": limit}

        if request.city_id:
            extra_filters += " AND f.city_id = :city_id"
            params["city_id"] = request.city_id
        if request.layer_id:
            extra_filters += " AND f.layer_id = :layer_id"
            params["layer_id"] = request.layer_id
        if request.facility_category:
            extra_filters += " AND (f.category = :cat OR f.subcategory = :cat)"
            params["cat"] = request.facility_category

        query = text(f"""
            SELECT 
                f.id,
                f.name_en,
                f.name_hi,
                f.category,
                f.provenance_type,
                ds.attribution_text_en,
                ST_Distance(
                    f.geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                ) AS distance_meters,
                ST_AsGeoJSON(f.geometry)::json AS geom
            FROM gis_features f
            LEFT JOIN data_sources ds ON f.source_id = ds.id
            WHERE f.is_active = TRUE
              {extra_filters}
              AND ST_DWithin(
                    f.geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :max_dist
              )
            ORDER BY distance_meters ASC
            LIMIT :limit;
        """)

        rows = db.execute(query, params).fetchall()
        items: List[ProximityFeatureItem] = []
        for r in rows:
            items.append(ProximityFeatureItem(
                id=str(r.id),
                name_en=r.name_en or "Facility",
                name_hi=r.name_hi,
                category=r.category,
                distance_meters=round(r.distance_meters, 1) if r.distance_meters is not None else 0.0,
                provenance_type=r.provenance_type or "community_open",
                source_attribution=r.attribution_text_en or "OpenStreetMap Contributors",
                geometry=r.geom
            ))

        coverage_warning = None
        if len(items) == 0 and request.facility_category:
            coverage_warning = f"No integrated {request.facility_category} features found within {int(max_dist)}m."

        return ProximityAnalysisResult(
            origin=[lng, lat],
            max_radius_meters=max_dist,
            results_count=len(items),
            results=items,
            coverage_status="available" if len(items) > 0 else "partial",
            coverage_warning=coverage_warning
        )

    @staticmethod
    def run_measurement(db: Session, request: MeasureRequest) -> MeasureResult:
        """
        Calculates accurate geodesic distance or polygon area using PostGIS ST_Length and ST_Area on geography.
        """
        coords = request.coordinates
        if request.measure_type == "distance":
            geom_geojson = {"type": "LineString", "coordinates": coords}
            query = text("""
                SELECT 
                    ST_Length(ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326)::geography) AS total_length;
            """)
            row = db.execute(query, {"geom": json.dumps(geom_geojson)}).fetchone()
            total_m = float(row.total_length) if row and row.total_length is not None else 0.0

            # Calculate individual segments
            segment_dists: List[float] = []
            for i in range(len(coords) - 1):
                seg_geojson = {"type": "LineString", "coordinates": [coords[i], coords[i+1]]}
                seg_row = db.execute(query, {"geom": json.dumps(seg_geojson)}).fetchone()
                segment_dists.append(round(float(seg_row.total_length), 2) if seg_row and seg_row.total_length is not None else 0.0)

            return MeasureResult(
                measure_type="distance",
                total_distance_meters=round(total_m, 2),
                total_distance_km=round(total_m / 1000.0, 3),
                segment_distances_meters=segment_dists,
                geometry=geom_geojson
            )

        else:
            # Area measurement: ensure closed polygon ring
            poly_coords = list(coords)
            if poly_coords[0] != poly_coords[-1]:
                poly_coords.append(poly_coords[0])

            geom_geojson = {"type": "Polygon", "coordinates": [poly_coords]}
            query = text("""
                SELECT 
                    ST_Area(ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326)::geography) AS total_area,
                    ST_Perimeter(ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326)::geography) AS perimeter;
            """)
            row = db.execute(query, {"geom": json.dumps(geom_geojson)}).fetchone()
            area_m2 = float(row.total_area) if row and row.total_area is not None else 0.0
            perimeter_m = float(row.perimeter) if row and row.perimeter is not None else 0.0

            return MeasureResult(
                measure_type="area",
                total_area_sq_meters=round(area_m2, 2),
                total_area_sq_km=round(area_m2 / 1_000_000.0, 4),
                perimeter_meters=round(perimeter_m, 2),
                geometry=geom_geojson
            )

    @staticmethod
    async def run_route_analysis(db: Session, request: RouteRequest) -> RouteAnalysisResult:
        """
        Queries OSRM routing engine, calculates route geometry, and queries actual civic issues
        along the route corridor buffer. No fake straight-line routes.
        """
        origin_lng, origin_lat = request.origin_longitude, request.origin_latitude
        dest_lng, dest_lat = request.destination_longitude, request.destination_latitude
        profile = request.profile or "driving"

        url = f"{settings.ROUTING_API_URL}/route/v1/{profile}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=full&geometries=geojson&steps=true"
        
        route_data = None
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    routes = data.get("routes", [])
                    if routes:
                        route_data = routes[0]
        except Exception as exc:
            logger.warning(f"External routing provider unreachable at {url}: {exc}")

        if not route_data:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Routing service is currently unreachable. No valid route could be established."
            )

        distance_m = route_data.get("distance", 0.0)
        duration_s = route_data.get("duration", 0.0)
        route_geom = route_data.get("geometry", {})
        legs = route_data.get("legs", [])
        steps = legs[0].get("steps", []) if legs else []

        # Query civic issues along route corridor
        civic_issues: List[CivicIssueAlongRoute] = []
        if request.include_civic_issues and route_geom:
            corridor_m = request.corridor_buffer_meters
            issues_query = text("""
                SELECT 
                    r.id,
                    r.title,
                    r.category,
                    r.status,
                    r.severity_input,
                    ST_Distance(
                        r.location_geometry::geography,
                        ST_SetSRID(ST_GeomFromGeoJSON(:route_geom), 4326)::geography
                    ) AS dist_meters,
                    ST_AsGeoJSON(r.location_geometry)::json AS geom
                FROM citizen_reports r
                WHERE r.status != 'resolved'
                  AND ST_DWithin(
                        r.location_geometry::geography,
                        ST_SetSRID(ST_GeomFromGeoJSON(:route_geom), 4326)::geography,
                        :corridor
                  )
                ORDER BY dist_meters ASC
                LIMIT 20;
            """)
            try:
                issue_rows = db.execute(issues_query, {
                    "route_geom": json.dumps(route_geom),
                    "corridor": corridor_m
                }).fetchall()
                for ir in issue_rows:
                    civic_issues.append(CivicIssueAlongRoute(
                        id=str(ir.id),
                        title=ir.title,
                        category=ir.category,
                        distance_to_route_meters=round(ir.dist_meters, 1) if ir.dist_meters is not None else 0.0,
                        status=ir.status,
                        severity=ir.severity_input or "medium",
                        geometry=ir.geom
                    ))
            except Exception as e:
                logger.warning(f"Corridor issue query failed: {e}")

        return RouteAnalysisResult(
            distance_meters=round(distance_m, 1),
            duration_seconds=round(duration_s, 1),
            profile=profile,
            route_geometry=route_geom,
            steps=steps,
            civic_issues_along_route=civic_issues,
            unresolved_issue_count=len(civic_issues),
            corridor_buffer_meters=request.corridor_buffer_meters
        )

    @staticmethod
    def run_comparison(db: Session, request: CompareRequest) -> CompareResult:
        """
        Performs descriptive spatial comparison between two wards or areas.
        """
        def get_ward_metrics(ward_id: Optional[UUID], label: str) -> AreaMetrics:
            if not ward_id:
                return AreaMetrics(
                    label=label,
                    name_en="Custom Area",
                    name_hi="कस्टम क्षेत्र",
                    area_sq_km=0.0,
                    population=0,
                    coverage_status="partial"
                )

            # 1. Ward demographics
            w_query = text("""
                SELECT id, ward_number, ward_code, name_en, name_hi, area_sq_km, population
                FROM wards
                WHERE id = :ward_id;
            """)
            w_row = db.execute(w_query, {"ward_id": ward_id}).fetchone()
            if not w_row:
                return AreaMetrics(label=label, name_en="Unknown Ward", area_sq_km=0.0, population=0)

            # 2. Facilities count by category in ward
            fac_query = text("""
                SELECT category, COUNT(*) as cnt
                FROM gis_features
                WHERE ward_id = :ward_id AND is_active = TRUE
                GROUP BY category;
            """)
            fac_rows = db.execute(fac_query, {"ward_id": ward_id}).fetchall()
            fac_counts = {r.category: r.cnt for r in fac_rows if r.category}
            total_fac = sum(fac_counts.values())

            # 3. Citizen reports in ward
            rep_query = text("""
                SELECT 
                    COUNT(*) as total_reports,
                    COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
                    COUNT(*) FILTER (WHERE status != 'resolved') as unresolved
                FROM citizen_reports
                WHERE ward_id = :ward_id;
            """)
            rep_row = db.execute(rep_query, {"ward_id": ward_id}).fetchone()

            return AreaMetrics(
                label=label,
                ward_id=str(w_row.id),
                ward_code=w_row.ward_code,
                name_en=w_row.name_en,
                name_hi=w_row.name_hi,
                area_sq_km=float(w_row.area_sq_km or 0.0),
                population=int(w_row.population or 0),
                facility_counts=fac_counts,
                total_facilities=total_fac,
                citizen_report_count=int(rep_row.total_reports or 0) if rep_row else 0,
                resolved_report_count=int(rep_row.resolved or 0) if rep_row else 0,
                unresolved_report_count=int(rep_row.unresolved or 0) if rep_row else 0,
                coverage_status="available" if total_fac > 0 else "partial"
            )

        metrics_a = get_ward_metrics(request.area_a_ward_id, request.label_a or "Area A")
        metrics_b = get_ward_metrics(request.area_b_ward_id, request.label_b or "Area B")

        discrepancy = (metrics_a.coverage_status != metrics_b.coverage_status) or (metrics_a.total_facilities == 0 and metrics_b.total_facilities > 0)
        warning = None
        if discrepancy:
            warning = "Dataset coverage differs between the selected areas; comparisons reflect available integrated data rather than exhaustive completeness."

        return CompareResult(
            city_id=str(request.city_id),
            area_a=metrics_a,
            area_b=metrics_b,
            has_coverage_discrepancy=discrepancy,
            coverage_discrepancy_warning=warning
        )

    @staticmethod
    def run_suitability(db: Session, request: SuitabilityRequest) -> SuitabilityResult:
        """
        Deterministic multi-criteria spatial suitability overlay analysis.
        Evaluates grid candidate locations based on proximity/avoidance to selected layers with weights.
        """
        city_query = text("SELECT center_latitude, center_longitude, name_en FROM cities WHERE id = :city_id;")
        city_row = db.execute(city_query, {"city_id": request.city_id}).fetchone()
        
        center_lat = city_row.center_latitude if city_row else 26.2183
        center_lng = city_row.center_longitude if city_row else 78.1828

        # Check which layers exist
        missing_datasets: List[str] = []
        criteria_evaluated: List[Dict[str, Any]] = []

        for crit in request.criteria:
            layer_check = db.execute(
                text("SELECT id, name_en FROM gis_layers WHERE slug = :slug;"),
                {"slug": crit.layer_slug}
            ).fetchone()
            if not layer_check:
                missing_datasets.append(crit.layer_slug)
            else:
                criteria_evaluated.append({
                    "layer_slug": crit.layer_slug,
                    "layer_name": layer_check.name_en,
                    "weight": crit.weight,
                    "type": crit.criterion_type,
                    "max_distance_meters": crit.max_distance_meters
                })

        # Generate evaluation grid (e.g. 5x5 grid around city center)
        cells: List[SuitabilityCell] = []
        grid_step = 0.01  # ~1.1km
        cell_idx = 1

        for dx in range(-2, 3):
            for dy in range(-2, 3):
                cell_lng = center_lng + (dx * grid_step)
                cell_lat = center_lat + (dy * grid_step)

                # Calculate score for each point
                cell_scores: List[float] = []
                total_weight = sum(c.weight for c in request.criteria) or 1.0

                for crit in request.criteria:
                    dist_query = text("""
                        SELECT MIN(
                            ST_Distance(
                                f.geometry::geography,
                                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                            )
                        ) AS min_dist
                        FROM gis_features f
                        JOIN gis_layers l ON f.layer_id = l.id
                        WHERE l.slug = :slug AND f.city_id = :city_id AND f.is_active = TRUE;
                    """)
                    dist_row = db.execute(dist_query, {
                        "slug": crit.layer_slug,
                        "city_id": request.city_id,
                        "lng": cell_lng,
                        "lat": cell_lat
                    }).fetchone()

                    min_dist = float(dist_row.min_dist) if dist_row and dist_row.min_dist is not None else crit.max_distance_meters
                    capped_dist = min(min_dist, crit.max_distance_meters)

                    if crit.criterion_type == "proximity":
                        # Closer is better: 100 at 0m, 0 at max_dist
                        raw_score = (1.0 - (capped_dist / crit.max_distance_meters)) * 100.0
                    else:
                        # Avoidance: Further is better: 100 at max_dist, 0 at 0m
                        raw_score = (capped_dist / crit.max_distance_meters) * 100.0

                    cell_scores.append(raw_score * crit.weight)

                final_score = round(sum(cell_scores) / total_weight, 1)

                half = grid_step / 2.0
                cell_polygon = {
                    "type": "Polygon",
                    "coordinates": [[
                        [cell_lng - half, cell_lat - half],
                        [cell_lng + half, cell_lat - half],
                        [cell_lng + half, cell_lat + half],
                        [cell_lng - half, cell_lat + half],
                        [cell_lng - half, cell_lat - half],
                    ]]
                }

                cells.append(SuitabilityCell(
                    cell_id=f"cell-{cell_idx}",
                    centroid=[round(cell_lng, 5), round(cell_lat, 5)],
                    score=final_score,
                    rank=0,
                    geometry=cell_polygon
                ))
                cell_idx += 1

        # Sort and assign ranks
        cells.sort(key=lambda c: c.score, reverse=True)
        for rank, c in enumerate(cells, start=1):
            c.rank = rank

        is_sufficient = len(missing_datasets) == 0
        warning = None
        if not is_sufficient:
            warning = f"Missing required layers for complete evaluation: {', '.join(missing_datasets)}."

        return SuitabilityResult(
            city_id=str(request.city_id),
            target_category=request.target_category,
            criteria_evaluated=criteria_evaluated,
            cells_evaluated=len(cells),
            top_suitable_locations=cells[:10],
            missing_datasets=missing_datasets,
            is_sufficient_data=is_sufficient,
            coverage_warning=warning
        )

    @staticmethod
    def resolve_location_hierarchy(db: Session, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Resolves point-in-polygon administrative hierarchy (State > District > City > Ward).
        """
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
              AND ST_Covers(w.geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
            ORDER BY distance_meters ASC
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

        return {
            "latitude": latitude,
            "longitude": longitude,
            "state": None,
            "state_code": None,
            "district_en": None,
            "district_hi": None,
            "city_id": None,
            "city_en": None,
            "city_hi": None,
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

    @staticmethod
    def get_features_geojson(
        db: Session,
        layer_id: UUID,
        city_id: Optional[UUID] = None,
        ward_id: Optional[UUID] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Retrieve layer features as a standard GeoJSON FeatureCollection using PostGIS ST_AsGeoJSON.
        Supports filtering by city_id, ward_id, and bounding box [min_lng, min_lat, max_lng, max_lat].
        """
        params: Dict[str, Any] = {"layer_id": layer_id, "limit": limit + 1, "offset": offset}
        where_clauses = ["f.layer_id = :layer_id", "f.is_active = TRUE", "f.provenance_type != 'development_fixture'"]

        if city_id:
            where_clauses.append("f.city_id = :city_id")
            params["city_id"] = str(city_id)

        if ward_id:
            where_clauses.append("f.ward_id = :ward_id")
            params["ward_id"] = str(ward_id)

        if bbox and len(bbox) == 4:
            min_lng, min_lat, max_lng, max_lat = bbox
            where_clauses.append("f.geometry && ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326)")
            params["min_lng"] = min_lng
            params["min_lat"] = min_lat
            params["max_lng"] = max_lng
            params["max_lat"] = max_lat

        where_sql = " AND ".join(where_clauses)

        query = text(f"""
            SELECT 
                f.id,
                f.external_id,
                f.name_en,
                f.name_hi,
                f.category,
                f.subcategory,
                f.properties,
                f.provenance_type,
                ST_AsGeoJSON(f.geometry) AS geojson
            FROM gis_features f
            WHERE {where_sql}
            ORDER BY f.id LIMIT :limit OFFSET :offset;
        """)

        rows = db.execute(query, params).fetchall()
        has_more = len(rows) > limit
        rows = rows[:limit]
        features = []
        for r in rows:
            geom = json.loads(r.geojson) if r.geojson else None
            props = dict(r.properties) if r.properties else {}
            props.update({
                "id": str(r.id),
                "name": r.name_en or r.name_hi or r.category,
                "name_en": r.name_en,
                "name_hi": r.name_hi,
                "category": r.category,
                "subcategory": r.subcategory,
                "provenance_type": r.provenance_type or "official_verified"
            })
            features.append({
                "type": "Feature",
                "id": str(r.id),
                "geometry": geom,
                "properties": props
            })

        return {
            "type": "FeatureCollection",
            "features": features,
            "next_offset": offset + limit if has_more else None
        }
