from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db

client = TestClient(app)


def get_mock_db():
    mock_session = MagicMock()
    mock_session.execute.return_value.fetchall.return_value = []
    mock_session.execute.return_value.fetchone.return_value = None
    mock_session.query.return_value.filter.return_value.all.return_value = []
    mock_session.query.return_value.filter.return_value.first.return_value = None
    return mock_session


def test_search_coordinates():
    app.dependency_overrides[get_db] = get_mock_db
    response = client.get("/v1/search?q=26.2183,78.1828")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) >= 1
    coord_res = data["results"][0]
    assert coord_res["type"] == "coordinate"
    assert coord_res["coordinates"] == [78.1828, 26.2183]
    app.dependency_overrides.clear()


def test_search_city_and_wards():
    app.dependency_overrides[get_db] = get_mock_db
    response = client.get("/v1/search?q=Gwalior")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "query" in data
    app.dependency_overrides.clear()


def test_spatial_resolve_location_schema():
    app.dependency_overrides[get_db] = get_mock_db
    payload = {"latitude": 26.2183, "longitude": 78.1828}
    response = client.post("/v1/spatial/resolve-location", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["latitude"] == 26.2183
    assert data["longitude"] == 78.1828
    assert "state" in data
    assert data["state_code"] == "MP"
    app.dependency_overrides.clear()


def test_spatial_routes_no_fake_straight_line():
    payload = {
        "origin_latitude": 26.2183,
        "origin_longitude": 78.1828,
        "destination_latitude": 26.2220,
        "destination_longitude": 78.2038,
        "profile": "driving"
    }
    response = client.post("/v1/spatial/routes", json=payload)
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        assert "route_geometry" in data
        assert data["route_geometry"]["type"] in ["LineString", "MultiLineString"]
