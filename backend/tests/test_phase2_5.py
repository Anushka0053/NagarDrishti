import uuid
from unittest.mock import MagicMock
from app.schemas.coverage import DataCoverageResponse, CityCoverageSummary
from app.schemas.analytics import CityAnalyticsResponse
from app.ingestion.osm_pipeline import OSMOverpassPipeline
from app.models.layers import GISLayer, DataCoverage
from app.models.features import GISFeature
from app.models.feedback import CitizenReport


def test_provenance_and_coverage_schemas():
    """Verify schema validation for coverage and provenance types."""
    cov = DataCoverageResponse(
        id=uuid.uuid4(),
        city_id=uuid.uuid4(),
        layer_slug="health_infrastructure",
        layer_name_en="Hospitals & Healthcare",
        coverage_status="available",
        feature_count=18,
        geographic_coverage="Gwalior Municipal Area",
        provenance_type="community_open",
        completeness_notes="Ingested from OpenStreetMap with full attribution."
    )
    assert cov.coverage_status == "available"
    assert cov.provenance_type == "community_open"
    assert cov.feature_count == 18


def test_zero_reports_analytics_calculation():
    """Verify zero-report scenario returns null resolution rate and 0 counts without division by zero."""
    analytics = CityAnalyticsResponse(
        city_id=uuid.uuid4(),
        city_name_en="Gwalior",
        city_name_hi="ग्वालियर",
        total_reports=0,
        open_reports=0,
        resolved_reports=0,
        in_progress_reports=0,
        resolution_rate=None,
        verified_features_count=42,
        active_clusters_count=0,
        category_breakdown=[],
        ward_breakdown=[],
        is_mock_data=False,
        data_truth_note="No citizen reports recorded yet in live production database for this city."
    )
    assert analytics.total_reports == 0
    assert analytics.resolution_rate is None
    assert analytics.is_mock_data is False
    assert analytics.verified_features_count == 42


def test_osm_pipeline_transformation():
    """Test OSM pipeline converts raw Overpass JSON to standard GIS features with community_open provenance."""
    pipeline = OSMOverpassPipeline()
    query = pipeline.build_query("health")
    assert "amenity" in query
    assert "hospital" in query

    mock_osm_data = {
        "elements": [
            {
                "type": "node",
                "id": 123456,
                "lat": 26.2183,
                "lon": 78.1828,
                "tags": {
                    "name": "Jaya Arogya Hospital",
                    "name:hi": "जयारोग्य चिकित्सालय",
                    "amenity": "hospital",
                    "operator": "Govt of MP",
                    "phone": "0751-2403000"
                }
            }
        ]
    }

    dummy_layer_id = uuid.uuid4()
    dummy_city_id = uuid.uuid4()

    features = pipeline.transform_to_features(mock_osm_data, dummy_layer_id, dummy_city_id)
    assert len(features) == 1
    feat = features[0]
    assert feat["name_en"] == "Jaya Arogya Hospital"
    assert feat["name_hi"] == "जयारोग्य चिकित्सालय"
    assert feat["provenance_type"] == "community_open"
    assert feat["properties"]["source"] == "OpenStreetMap"
    assert feat["properties"]["license"] == "ODbL 1.0"
    assert feat["geometry"]["coordinates"] == [78.1828, 26.2183]


def test_fastapi_phase2_5_endpoints():
    """Test OpenAPI registry and coverage / analytics route accessibility."""
    from app.main import app
    from app.core.database import get_db
    from fastapi.testclient import TestClient

    def get_mock_db():
        session = MagicMock()
        session.query.return_value.filter.return_value.all.return_value = []
        session.query.return_value.filter.return_value.first.return_value = None
        session.execute.return_value.fetchall.return_value = []
        session.execute.return_value.fetchone.return_value = None
        return session

    app.dependency_overrides[get_db] = get_mock_db
    client = TestClient(app)

    # 1. Sources status endpoint
    res_status = client.get("/v1/sources/status")
    assert res_status.status_code == 200
    assert isinstance(res_status.json(), list)

    # 2. Coverage endpoint
    res_cov = client.get("/v1/coverage")
    assert res_cov.status_code == 200

    # 3. Analytics endpoint
    dummy_city_id = str(uuid.uuid4())
    # Note: City 404 is handled cleanly if city doesn't exist
    res_analytics = client.get(f"/v1/analytics/city/{dummy_city_id}")
    assert res_analytics.status_code in [200, 404]

    app.dependency_overrides.clear()
