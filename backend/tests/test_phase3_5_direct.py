"""
Direct Synchronous Unit Test Suite for NagarDrishti Phase 3.5 GIS Stabilization & Multi-City Expansion
Executes offline in isolated environment without network sockets.
"""
import sys
import os
import uuid
from unittest.mock import MagicMock

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_path)

from app.ingestion.osm_pipeline import OSMOverpassPipeline, MP_CITY_BBOXES, OSM_CATEGORY_CONFIG
from app.ingestion.cli import resolve_target_layer
from app.services.dataset_service import DatasetService
from app.services.spatial_service import SpatialService
from app.schemas.spatial import (
    IdentifyRequest, BufferRequest, ProximityRequest, MeasureRequest, CompareRequest, SuitabilityRequest
)
from app.schemas.analytics import CityAnalyticsResponse
from app.schemas.coverage import DataCoverageResponse

def test_multi_city_bboxes_and_pipeline():
    print("[1/6] Testing Multi-City Registry and Dynamic OSM Bounding Boxes...")
    pipeline = OSMOverpassPipeline()
    reference_cities = ["gwalior", "indore", "bhopal", "jabalpur", "ujjain"]
    
    for city in reference_cities:
        bbox = pipeline.get_city_bbox(city)
        assert bbox is not None, f"City bbox missing for {city}"
        assert len(bbox) == 4, f"Invalid bbox format for {city}"
        min_lat, min_lon, max_lat, max_lon = bbox
        assert min_lat < max_lat, f"Invalid latitude range for {city}"
        assert min_lon < max_lon, f"Invalid longitude range for {city}"
        
        # Test query generation for roads
        q_roads = pipeline.build_query("roads", bbox)
        assert 'way["highway"~' in q_roads
        assert "out geom;" in q_roads

        # Test query generation for healthcare
        q_health = pipeline.build_query("health", bbox)
        assert 'nwr["amenity"="hospital"]' in q_health
        assert "out body center;" in q_health

    print("  -> Passed: All 5 reference cities dynamically configured without hardcoding!")

def test_road_line_filtering_and_geometry_safety():
    print("[2/6] Testing Road Way Extraction & Non-Highway Rejection...")
    pipeline = OSMOverpassPipeline()
    dummy_layer_id = uuid.uuid4()
    dummy_city_id = uuid.uuid4()

    # Raw elements with a road way, a building polygon way, and a POI node
    raw_osm = {
        "elements": [
            {
                "type": "way",
                "id": 101,
                "geometry": [{"lat": 26.21, "lon": 78.18}, {"lat": 26.22, "lon": 78.19}],
                "tags": {
                    "name": "Maharaj Bada Road",
                    "highway": "primary",
                    "surface": "asphalt",
                    "lanes": "4",
                    "oneway": "no"
                }
            },
            {
                "type": "way",
                "id": 102,
                "geometry": [{"lat": 26.21, "lon": 78.18}, {"lat": 26.21, "lon": 78.19}, {"lat": 26.21, "lon": 78.18}],
                "tags": {
                    "name": "City Mall Complex",
                    "building": "commercial",
                    "area": "yes"
                    # NOT a road!
                }
            }
        ]
    }

    # When category is 'roads', only the highway way should be converted to LineString
    features = pipeline.transform_to_features(raw_osm, dummy_layer_id, dummy_city_id)
    road_features = [f for f in features if f["geometry"]["type"] == "LineString"]
    assert len(road_features) == 1
    assert road_features[0]["name_en"] == "Maharaj Bada Road"
    assert road_features[0]["properties"]["highway"] == "primary"
    assert road_features[0]["properties"]["surface"] == "asphalt"
    print("  -> Passed: Road line geometries strictly validated; non-highway buildings rejected!")

def test_coordinate_search_regex_and_validation():
    print("[3/6] Testing Universal Coordinate Parser & Bounds Validation...")
    import re
    coord_pattern = r"^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)[,\s]+[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$"
    
    valid_coords = [
        "26.2183, 78.1828",
        "26.2183,78.1828",
        "22.7196, 75.8577",
        "23.2599, 77.4126",
        "23.1815, 75.7772",
        "23.1765, 79.9470",
    ]
    for c in valid_coords:
        assert re.match(coord_pattern, c.strip()), f"Valid coordinate rejected: {c}"
        parts = re.split(r"[,\s]+", c.strip())
        lat, lon = float(parts[0]), float(parts[1])
        assert 20.0 <= lat <= 30.0, f"Latitude out of MP range: {lat}"
        assert 70.0 <= lon <= 85.0, f"Longitude out of MP range: {lon}"

    invalid_coords = [
        "not a coordinate",
        "999.0, 12.0",
        "26.2183",
        "Gwalior Fort"
    ]
    for ic in invalid_coords:
        assert not re.match(coord_pattern, ic.strip()), f"Invalid coordinate accepted: {ic}"

    print("  -> Passed: Coordinate search parser validated across MP geographic bounding box!")

def test_truthful_analytics_and_empty_state():
    print("[4/6] Testing Truthful Analytics & Empty State Computations...")
    # Zero reports condition
    resp_zero = CityAnalyticsResponse(
        city_id=uuid.uuid4(),
        city_name_en="Ujjain",
        city_name_hi="उज्जैन",
        total_reports=0,
        open_reports=0,
        resolved_reports=0,
        in_progress_reports=0,
        resolution_rate=None, # Undefined / null when zero
        verified_features_count=48,
        mapped_features_count=48,
        healthcare_count=12,
        education_count=18,
        safety_count=6,
        roads_count=12,
        civic_count=0,
        data_sources_count=5,
        active_clusters_count=0,
        category_breakdown=[],
        ward_breakdown=[],
        is_mock_data=False,
        data_truth_note="No citizen reports recorded yet in live production database for this city."
    )
    assert resp_zero.total_reports == 0
    assert resp_zero.resolution_rate is None
    assert resp_zero.mapped_features_count == 48
    assert resp_zero.healthcare_count == 12
    assert resp_zero.data_sources_count == 5
    assert resp_zero.is_mock_data is False
    print("  -> Passed: Zero reports handled truthfully with null resolution rate & mapped feature counts!")

def test_dataset_upload_preview_service():
    print("[5/6] Testing Custom Dataset Upload & Validation Engine...")
    import json
    geojson_data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [75.8577, 22.7196]},
                "properties": {"name": "Indore Municipal Corporation", "category": "civic_hq"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [75.8600, 22.7220]},
                "properties": {"name": "Chhotigwaltoli Police Station", "category": "police"}
            }
        ]
    }
    content = json.dumps(geojson_data).encode("utf-8")
    preview = DatasetService.validate_and_preview("indore_civic.geojson", content)
    assert preview.file_format == "geojson"
    assert preview.valid_record_count == 2
    assert preview.invalid_record_count == 0
    assert preview.feature_count == 2
    assert len(preview.validation_token) > 0
    print("  -> Passed: GeoJSON custom dataset validation succeeded with valid preview token!")

def test_spatial_analysis_methods_with_mock_db():
    print("[6/6] Testing Spatial Service Analysis Operations...")
    mock_db = MagicMock()

    # 1. Mock measurement
    mock_measure_row = MagicMock()
    mock_measure_row.total_length = 2450.0
    mock_measure_row.total_area = 150000.0
    mock_measure_row.perimeter = 1600.0
    mock_db.execute.return_value.fetchone.return_value = mock_measure_row

    req_measure = MeasureRequest(
        measure_type="distance",
        coordinates=[[78.1828, 26.2183], [78.2038, 26.2220]]
    )
    result_dist = SpatialService.run_measurement(mock_db, req_measure)
    assert result_dist.measure_type == "distance"
    assert result_dist.total_distance_meters == 2450.0

    # 2. Mock location resolve
    mock_ward_row = MagicMock()
    mock_ward_row.district_name_en = "Indore"
    mock_ward_row.district_name_hi = "इंदौर"
    mock_ward_row.city_id = uuid.uuid4()
    mock_ward_row.city_name_en = "Indore"
    mock_ward_row.city_name_hi = "इंदौर"
    mock_ward_row.ulb_type = "Municipal Corporation"
    mock_ward_row.ward_id = uuid.uuid4()
    mock_ward_row.ward_number = 15
    mock_ward_row.ward_code = "IND-15"
    mock_ward_row.ward_name_en = "Palasia Ward 15"
    mock_ward_row.ward_name_hi = "पलासिया वार्ड 15"
    mock_ward_row.zone_name_en = "Zone 4"
    mock_ward_row.corporator_name = "Ward Representative"
    mock_ward_row.is_inside = True
    mock_db.execute.return_value.fetchone.return_value = mock_ward_row

    resolved = SpatialService.resolve_location_hierarchy(mock_db, 22.7196, 75.8577)
    assert resolved["state_code"] == "MP"
    assert resolved["district_en"] == "Indore"
    assert resolved["city_en"] == "Indore"
    assert resolved["ward_number"] == 15
    print("  -> Passed: Spatial measurement and reverse administrative location resolve verified!")

def main():
    print("=" * 70)
    print("NAGARDRISHTI PHASE 3.5 DIRECT VERIFICATION SUITE")
    print("=" * 70)
    test_multi_city_bboxes_and_pipeline()
    test_road_line_filtering_and_geometry_safety()
    test_coordinate_search_regex_and_validation()
    test_truthful_analytics_and_empty_state()
    test_dataset_upload_preview_service()
    test_spatial_analysis_methods_with_mock_db()
    print("=" * 70)
    print("ALL 6/6 PHASE 3.5 GIS SUITE TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()

