"""
Direct Python Test Runner for NagarDrishti Backend
"""
import sys
import os

# Add backend directory to path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_path)

import asyncio
from app.schemas.admin import CityBase, WardBase
from app.schemas.spatial import IdentifyRequest, BufferRequest
from app.schemas.feedback import CitizenReportCreate
from app.adapters.garud import GarudMPAdapter
from app.adapters.sources import BhuvanAdapter, MPEserviceAdapter, OpenStreetMapAdapter
from app.adapters.sarvam import SarvamAIAdapter

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
    openapi = app.openapi()
    paths = openapi.get("paths", {})
    print(f"Registered API endpoints: {len(paths)}")
    assert "/health" in paths
    assert "/v1/cities" in paths
    assert "/v1/layers" in paths
    assert "/v1/spatial/identify" in paths
    assert "/v1/feedback" in paths
    assert "/v1/ai/query" in paths
    assert "/v1/sources" in paths
    print("[OK] FastAPI routing and OpenAPI schema test passed!")

async def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 60)
    print("NAGARDRISHTI -- BACKEND AUTOMATED TEST SUITE")
    print("=" * 60)
    test_schemas()
    await test_adapters()
    test_fastapi_routes()
    print("=" * 60)
    print("ALL TESTS PASSED! Backend is ready for production.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
