"""
Direct Python Test Runner for NagarDrishti Backend (Phase 1, Phase 2 & Phase 3.5)
"""
import sys
import os
import json
from unittest.mock import MagicMock, patch

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_path)

import asyncio
from app.schemas.admin import CityBase, WardBase
from app.schemas.spatial import IdentifyRequest, BufferRequest, RouteRequest
from app.schemas.feedback import CitizenReportCreate
from app.adapters.garud import GarudMPAdapter
from app.adapters.sources import BhuvanAdapter, MPEserviceAdapter, OpenStreetMapAdapter
from app.adapters.sarvam import SarvamAIAdapter

def get_mock_db():
    mock_session = MagicMock()
    mock_session.execute.return_value.fetchall.return_value = []
    
    mock_row = MagicMock()
    mock_row.district_name_en = "Gwalior"
    mock_row.district_name_hi = "ग्वालियर"
    mock_row.city_id = "00000000-0000-0000-0000-000000000001"
    mock_row.city_name_en = "Gwalior"
    mock_row.city_name_hi = "ग्वालियर"
    mock_row.ulb_type = "Municipal Corporation"
    mock_row.ward_id = "00000000-0000-0000-0000-000000000002"
    mock_row.ward_number = 1
    mock_row.ward_code = "GWL-01"
    mock_row.ward_name_en = "Morar Ward 1"
    mock_row.ward_name_hi = "मुरार वार्ड 1"
    mock_row.zone_name_en = "Morar Zone"
    mock_row.corporator_name = "Public Representative"
    mock_row.is_inside = True

    mock_session.execute.return_value.fetchone.return_value = mock_row
    mock_session.query.return_value.filter.return_value.all.return_value = []
    mock_session.query.return_value.filter.return_value.first.return_value = None
    mock_session.query.return_value.scalar.return_value = 0
    return mock_session

def test_schemas():
    print("Testing Pydantic Schemas...", flush=True)
    city = CityBase(
        name_en="Gwalior",
        name_hi="ग्वालियर",
        slug="gwalior",
        center_latitude=26.2183,
        center_longitude=78.1828,
        is_reference_city=True
    )
    assert city.name_en == "Gwalior"
    assert city.center_latitude == 26.2183
    assert city.is_reference_city is True

    req = IdentifyRequest(latitude=26.2183, longitude=78.1828, tolerance_meters=30.0)
    assert req.latitude == 26.2183
    assert req.tolerance_meters == 30.0
    print("[OK] Pydantic schemas test passed!", flush=True)

async def test_adapters():
    print("Testing External Source Adapters...", flush=True)
    garud = GarudMPAdapter()
    assert garud.source_key == "garud_mp_uadd"
    assert "Directorate of Urban Administration & Development" in garud.get_attribution("en")

    bhuvan = BhuvanAdapter()
    assert bhuvan.source_key == "isro_bhuvan_wms"
    assert "इसरो भुवन" in bhuvan.get_attribution("hi")

    sarvam = SarvamAIAdapter()
    sarvam.api_key = None
    summary = await sarvam.generate_grounded_summary("Gwalior Road", {}, language="hi")
    assert len(summary) > 0
    print("[OK] External source adapters test passed!", flush=True)

def test_fastapi_routes():
    print("Testing FastAPI app & OpenAPI schema generation...", flush=True)
    from app.main import app
    from app.core.database import get_db
    from fastapi.testclient import TestClient
    openapi = app.openapi()
    paths = openapi.get("paths", {})
    print(f"Registered API endpoints: {len(paths)}", flush=True)
    assert "/health" in paths
    assert "/v1/cities" in paths
    assert "/v1/layers" in paths
    assert "/v1/layers/{layer_id}/features" in paths
    assert "/v1/search" in paths
    assert "/v1/spatial/identify" in paths
    assert "/v1/spatial/resolve-location" in paths
    assert "/v1/spatial/routes" in paths

    app.dependency_overrides[get_db] = get_mock_db
    client = TestClient(app)
    
    # Test search with coordinates
    res_search = client.get("/v1/search?q=26.2183,78.1828")
    assert res_search.status_code == 200
    assert len(res_search.json()["results"]) >= 1

    # Test spatial resolve location
    res_resolve = client.post("/v1/spatial/resolve-location", json={"latitude": 26.2183, "longitude": 78.1828})
    assert res_resolve.status_code == 200
    assert res_resolve.json()["state_code"] == "MP"

    # Test routing with mocked OSRM response
    mock_osrm = {
        "routes": [{
            "distance": 1850.5,
            "duration": 280.0,
            "geometry": {
                "type": "LineString",
                "coordinates": [[78.1828, 26.2183], [78.1900, 26.2200], [78.2038, 26.2220]]
            },
            "legs": [{"steps": []}]
        }]
    }

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_osrm
        mock_get.return_value = mock_resp

        res_route = client.post("/v1/spatial/routes", json={
            "origin_latitude": 26.2183, "origin_longitude": 78.1828,
            "destination_latitude": 26.2220, "destination_longitude": 78.2038,
            "profile": "driving"
        })
        assert res_route.status_code == 200
        data = res_route.json()
        assert "route_geometry" in data
        assert data["route_geometry"]["type"] in ["LineString", "MultiLineString"]
        assert data["distance_meters"] == 1850.5

    app.dependency_overrides.clear()
    print("[OK] FastAPI routing, search & Phase 2 endpoints test passed!", flush=True)

from test_phase2_5 import (
    test_provenance_and_coverage_schemas,
    test_zero_reports_analytics_calculation,
    test_osm_pipeline_transformation,
    test_fastapi_phase2_5_endpoints,
)

def main():
    print("=" * 60, flush=True)
    print("NAGARDRISHTI -- PHASE 2 & 2.5 & 3.5 BACKEND TEST SUITE", flush=True)
    print("=" * 60, flush=True)
    test_schemas()
    asyncio.run(test_adapters())
    test_fastapi_routes()
    
    print("\n--- Running Phase 2.5 & 3.5 Foundation Tests ---", flush=True)
    test_provenance_and_coverage_schemas()
    print("[OK] Provenance and coverage schemas test passed!", flush=True)
    test_zero_reports_analytics_calculation()
    print("[OK] Zero-reports analytics calculation test passed!", flush=True)
    test_osm_pipeline_transformation()
    print("[OK] OpenStreetMap Overpass ingestion pipeline test passed!", flush=True)
    test_fastapi_phase2_5_endpoints()
    print("[OK] Phase 2.5 coverage & analytics endpoints test passed!", flush=True)

    print("=" * 60, flush=True)
    print("ALL TESTS PASSED! Phase 3.5 GIS stabilization & backend verified.", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    main()
