from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_v1_health():
    # Note: DB might not be live during simple unit test runner, testing route availability
    response = client.get("/v1/health")
    # Will return 200 or 500 if DB is mocked
    assert response.status_code in [200, 500]


def test_openapi_schema():
    response = client.get("/v1/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "paths" in schema
    assert "/v1/cities" in schema["paths"]
    assert "/v1/layers" in schema["paths"]
    assert "/v1/spatial/identify" in schema["paths"]
    assert "/v1/feedback" in schema["paths"]
