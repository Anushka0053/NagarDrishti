"""
Direct Python Test Runner for NagarDrishti Backend (Phase 1 & Phase 2)
"""
import sys
import os
from unittest.mock import MagicMock

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_path)

import asyncio
from app.schemas.admin import CityBase, WardBase
from app.schemas.spatial import IdentifyRequest, BufferRequest
from app.schemas.feedback import CitizenReportCreate
from app.adapters.garud import GarudMPAdapter
from app.adapters.sources import BhuvanAdapter, MPEserviceAdapter, OpenStreetMapAdapter
from app.adapters.sarvam import SarvamAIAdapter

def get_mock_db():
    mock_session = MagicMock()
    mock_session.execute.return_value.fetchall.return_value = []
    mock_session.execute.return_value.fetchone.return_value = None
    mock_session.query.return_value.filter.return_value.all.return_value = []
    mock_session.query.return_value.filter.return_value.first.return_value = None
    return mock_session

def test_schemas():
    print("Testing Pydantic Schemas...")
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
    print("[OK] Pydantic schemas test passed!")

async def test_adapters():
    print("Testing External Source Adapters...")
    garud = GarudMPAdapter()
    assert garud.source_key == "garud_mp_uadd"
    assert "Directorate of Urban Administration & Development" in garud.get_attribution("en")

    bhuvan = BhuvanAdapter()
    assert bhuvan.source_key == "isro_bhuvan_wms"
    assert "इसरो भुवन" in bhuvan.get_attribution("hi")

    sarvam = SarvamAIAdapter()
    summary = await sarvam.generate_grounded_summary("Gwalior Road", {}, language="hi")
    assert len(summary) > 0
    print("[OK] External source adapters test passed!")

def test_fastapi_routes():
    print("Testing FastAPI app & OpenAPI schema generation...")
    from app.main import app
    from app.core.database import get_db
    from fastapi.testclient import TestClient
    openapi = app.openapi()
    paths = openapi.get("paths", {})
    print(f"Registered API endpoints: {len(paths)}")
    assert "/health" in paths
    assert "/v1/cities" in paths
    assert "/v1/layers" in paths
    assert "/v1/layers/{layer_id}/features" in paths
    assert "/v1/search" in paths
    assert "/v1/spatial/identify" in paths
    assert "/v1/spatial/resolve-location" in paths

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

    # Test routing: returns 200 with valid OSRM geometry or 503 if unreachable (never straight-line fallback)
    res_route = client.post("/v1/spatial/routes", json={
        "origin_latitude": 26.2183, "origin_longitude": 78.1828,
        "destination_latitude": 26.2220, "destination_longitude": 78.2038,
        "profile": "driving"
    })
    assert res_route.status_code in [200, 503]
    if res_route.status_code == 200:
        data = res_route.json()
        assert "route_geometry" in data
        assert data["route_geometry"]["type"] in ["LineString", "MultiLineString"]

    app.dependency_overrides.clear()
    print("[OK] FastAPI routing, search & Phase 2 endpoints test passed!")

def main():
    print("=" * 60)
    print("NAGARDRISHTI -- PHASE 2 BACKEND AUTOMATED TEST SUITE")
    print("=" * 60)
    test_schemas()
    asyncio.run(test_adapters())
    test_fastapi_routes()
    print("=" * 60)
    print("ALL TESTS PASSED! Phase 2 backend gateway is fully operational.")
    print("=" * 60)

if __name__ == "__main__":
    main()
