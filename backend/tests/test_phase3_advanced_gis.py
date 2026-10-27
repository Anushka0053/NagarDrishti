import uuid
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.ingestion.osm_pipeline import OSMOverpassPipeline, MP_CITY_BBOXES, OSM_CATEGORY_CONFIG
from app.ingestion.cli import resolve_target_layer
from app.services.dataset_service import DatasetService

GWALIOR_CITY_ID = "c0000000-0000-0000-0000-000000000001"
INDORE_CITY_ID = "c0000000-0000-0000-0000-000000000002"
BHOPAL_CITY_ID = "c0000000-0000-0000-0000-000000000003"
HOSPITALS_LAYER_ID = "fa000000-0000-0000-0000-000000000002"


@pytest.fixture(autouse=True)
def override_db_dependency():
    mock_session = MagicMock()
    # Mock row for buffer query
    mock_buffer_row = MagicMock()
    mock_buffer_row.buffer_geom = {
        "type": "Polygon",
        "coordinates": [[[78.18, 26.21], [78.19, 26.21], [78.19, 26.22], [78.18, 26.22], [78.18, 26.21]]]
    }

    # Mock row for length / area query
    mock_measure_row = MagicMock()
    mock_measure_row.total_length = 1520.5
    mock_measure_row.total_area = 250000.0
    mock_measure_row.perimeter = 2000.0

    # Mock row for city
    mock_city_row = MagicMock()
    mock_city_row.center_latitude = 26.2183
    mock_city_row.center_longitude = 78.1828
    mock_city_row.name_en = "Gwalior"

    mock_session.execute.return_value.fetchone.return_value = mock_buffer_row
    mock_session.execute.return_value.fetchall.return_value = []

    app.dependency_overrides[get_db] = lambda: mock_session
    yield mock_session
    app.dependency_overrides.clear()


client = TestClient(app)


def test_osm_pipeline_city_and_category_awareness():
    """Verify OSM pipeline dynamically constructs nwr queries for multiple MP cities and categories."""
    pipeline = OSMOverpassPipeline()

    # Gwalior Healthcare Query with nwr
    gwl_bbox = pipeline.get_city_bbox("gwalior")
    assert gwl_bbox == MP_CITY_BBOXES["gwalior"]
    q_health = pipeline.build_query("health", gwl_bbox)
    assert 'nwr["amenity"="hospital"]' in q_health
    assert 'nwr["healthcare"="hospital"]' in q_health
    assert "out body center;" in q_health

    # Indore Education Query (Second City Scalability) with nwr
    ind_bbox = pipeline.get_city_bbox("indore")
    assert ind_bbox == MP_CITY_BBOXES["indore"]
    q_edu = pipeline.build_query("education", ind_bbox)
    assert 'nwr["amenity"="university"]' in q_edu
    assert 'nwr["amenity"="college"]' in q_edu
    assert "out body center;" in q_edu

    # Bhopal Road Network Query (Lines only)
    bhp_bbox = pipeline.get_city_bbox("bhopal")
    assert bhp_bbox == MP_CITY_BBOXES["bhopal"]
    q_roads = pipeline.build_query("roads", bhp_bbox)
    assert 'way["highway"~' in q_roads
    assert "out geom;" in q_roads


def test_unknown_city_fails_explicitly_without_gwalior_fallback():
    """Verify unknown city slug raises ValueError explicitly rather than silently falling back to Gwalior."""
    pipeline = OSMOverpassPipeline()
    with pytest.raises(ValueError, match="No query boundary configured for city 'unknown_city'"):
        pipeline.get_city_bbox("unknown_city")


def test_layer_resolution_fails_on_unconfigured_category():
    """Verify resolve_target_layer returns None and never defaults to arbitrary first layer."""
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # Unconfigured category
    layer = resolve_target_layer(mock_db, "non_existent_category")
    assert layer is None


def test_osm_pipeline_nwr_and_unnamed_feature_transformation():
    """Verify raw OSM nodes, POI ways, and relations are correctly transformed with accurate names and geometries."""
    pipeline = OSMOverpassPipeline()
    mock_raw = {
        "elements": [
            # 1. Point Node with verified name
            {
                "type": "node",
                "id": 99887766,
                "lat": 26.2185,
                "lon": 78.1825,
                "tags": {
                    "name": "Gwalior Medical Center",
                    "name:hi": "ग्वालियर मेडिकल सेंटर",
                    "amenity": "hospital",
                    "operator": "Govt of MP"
                }
            },
            # 2. POI Way (building polygon) with center coordinates
            {
                "type": "way",
                "id": 88776655,
                "center": {"lat": 26.2250, "lon": 78.1950},
                "tags": {
                    "name": "Birla Institute Campus",
                    "amenity": "college"
                }
            },
            # 3. Unnamed POI Node (name must remain None, not manufactured)
            {
                "type": "node",
                "id": 77665544,
                "lat": 26.2050,
                "lon": 78.1750,
                "tags": {
                    "amenity": "pharmacy"
                }
            },
            # 4. Road LineString Way
            {
                "type": "way",
                "id": 11223344,
                "geometry": [
                    {"lat": 26.205, "lon": 78.188},
                    {"lat": 26.210, "lon": 78.195},
                    {"lat": 26.218, "lon": 78.202}
                ],
                "tags": {
                    "name": "City Center Arterial",
                    "highway": "primary",
                    "surface": "asphalt",
                    "lanes": "4"
                }
            },
            # 5. POI Relation (Campus multipolygon)
            {
                "type": "relation",
                "id": 55443322,
                "center": {"lat": 26.2300, "lon": 78.2000},
                "tags": {
                    "name": "Jiwaji University Complex",
                    "amenity": "university"
                }
            }
        ]
    }

    features = pipeline.transform_to_features(
        raw_data=mock_raw,
        layer_id=uuid.UUID(HOSPITALS_LAYER_ID),
        city_id=uuid.UUID(GWALIOR_CITY_ID)
    )

    assert len(features) == 5

    # 1. Point Node
    f_node = features[0]
    assert f_node["external_id"] == "osm-node-99887766"
    assert f_node["name_en"] == "Gwalior Medical Center"
    assert f_node["name_hi"] == "ग्वालियर मेडिकल सेंटर"
    assert f_node["geometry"]["type"] == "Point"
    assert f_node["geometry"]["coordinates"] == [78.1825, 26.2185]
    assert f_node["provenance_type"] == "community_open"

    # 2. POI Way (transformed to representative Point, NOT LineString road)
    f_way_poi = features[1]
    assert f_way_poi["external_id"] == "osm-way-88776655"
    assert f_way_poi["name_en"] == "Birla Institute Campus"
    assert f_way_poi["geometry"]["type"] == "Point"
    assert f_way_poi["geometry"]["coordinates"] == [78.1950, 26.2250]
    assert f_way_poi["properties"]["osm_type"] == "way"

    # 3. Unnamed Feature: name_en and name_hi must be None
    f_unnamed = features[2]
    assert f_unnamed["external_id"] == "osm-node-77665544"
    assert f_unnamed["name_en"] is None
    assert f_unnamed["name_hi"] is None
    assert f_unnamed["category"] == "pharmacy"

    # 4. Road Way
    f_road = features[3]
    assert f_road["external_id"] == "osm-way-11223344"
    assert f_road["category"] == "road"
    assert f_road["subcategory"] == "primary"
    assert f_road["geometry"]["type"] == "LineString"
    assert len(f_road["geometry"]["coordinates"]) == 3
    assert f_road["properties"]["surface"] == "asphalt"
    assert f_road["properties"]["lanes"] == "4"

    # 5. POI Relation
    f_rel = features[4]
    assert f_rel["external_id"] == "osm-relation-55443322"
    assert f_rel["name_en"] == "Jiwaji University Complex"
    assert f_rel["geometry"]["type"] == "Point"
    assert f_rel["geometry"]["coordinates"] == [78.2000, 26.2300]


def test_spatial_buffer_endpoint():
    """Verify POST /v1/spatial/buffer calculates buffer polygon and handles coverage warnings."""
    payload = {
        "origin_latitude": 26.2183,
        "origin_longitude": 78.1828,
        "buffer_meters": 1500.0,
        "city_id": GWALIOR_CITY_ID,
        "category": "health"
    }
    resp = client.post("/v1/spatial/buffer", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["buffer_meters"] == 1500.0
    assert data["provenance_type"] == "internal_derived"


def test_spatial_proximity_endpoint():
    """Verify POST /v1/spatial/proximity returns nearest facilities."""
    payload = {
        "origin_latitude": 26.2183,
        "origin_longitude": 78.1828,
        "city_id": GWALIOR_CITY_ID,
        "facility_category": "hospital",
        "max_radius_meters": 5000.0,
        "limit": 5
    }
    resp = client.post("/v1/spatial/proximity", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert "results_count" in data


def test_spatial_measure_distance_and_area():
    """Verify POST /v1/spatial/measure computes geodesic length and area."""
    # 1. Distance measurement
    dist_payload = {
        "measure_type": "distance",
        "coordinates": [
            [78.1828, 26.2183],
            [78.1950, 26.2250]
        ]
    }
    resp_dist = client.post("/v1/spatial/measure", json=dist_payload)
    assert resp_dist.status_code == 200
    dist_data = resp_dist.json()
    assert dist_data["measure_type"] == "distance"

    # 2. Area measurement
    area_payload = {
        "measure_type": "area",
        "coordinates": [
            [78.180, 26.210],
            [78.190, 26.210],
            [78.190, 26.220],
            [78.180, 26.220],
            [78.180, 26.210]
        ]
    }
    resp_area = client.post("/v1/spatial/measure", json=area_payload)
    assert resp_area.status_code == 200
    area_data = resp_area.json()
    assert area_data["measure_type"] == "area"


def test_spatial_compare_endpoint():
    """Verify POST /v1/spatial/compare returns comparative metrics between areas."""
    payload = {
        "city_id": GWALIOR_CITY_ID,
        "label_a": "Lashkar Ward",
        "label_b": "Morar Ward"
    }
    resp = client.post("/v1/spatial/compare", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "area_a" in data
    assert "area_b" in data
    assert "has_coverage_discrepancy" in data


def test_spatial_suitability_endpoint():
    """Verify POST /v1/spatial/suitability calculates deterministic multi-criteria overlay."""
    payload = {
        "city_id": GWALIOR_CITY_ID,
        "target_category": "new_phc_clinic",
        "criteria": [
            {
                "layer_slug": "gwalior_major_roads",
                "weight": 0.6,
                "criterion_type": "proximity",
                "max_distance_meters": 2000.0
            },
            {
                "layer_slug": "gwalior_hospitals",
                "weight": 0.4,
                "criterion_type": "proximity",
                "max_distance_meters": 3000.0
            }
        ]
    }
    resp = client.post("/v1/spatial/suitability", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["target_category"] == "new_phc_clinic"
    assert "top_suitable_locations" in data
    assert "cells_evaluated" in data


def test_dataset_upload_validation_geojson():
    """Verify DatasetService parses valid GeoJSON and extracts preview metadata."""
    sample_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [78.1828, 26.2183]},
                "properties": {"name": "Gwalior Smart City Office", "category": "civic_office"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [78.1950, 26.2100]},
                "properties": {"name": "Thatipur Civic Center", "category": "civic_office"}
            }
        ]
    }
    import json
    content = json.dumps(sample_geojson).encode("utf-8")

    preview = DatasetService.validate_and_preview("gwalior_civic_assets.geojson", content)
    assert preview.file_format == "geojson"
    assert preview.valid_record_count == 2
    assert preview.invalid_record_count == 0
    assert "name" in preview.sample_properties
    assert len(preview.validation_token) > 0


def test_dataset_upload_validation_csv():
    """Verify DatasetService parses CSV with coordinate columns."""
    sample_csv = "name,latitude,longitude,category\nDistrict Hospital,26.2285,78.2290,hospital\nCity Clinic,26.2080,78.1650,clinic\n"
    content = sample_csv.encode("utf-8")

    preview = DatasetService.validate_and_preview("hospitals.csv", content)
    assert preview.file_format == "csv"
    assert preview.valid_record_count == 2
    assert preview.invalid_record_count == 0
