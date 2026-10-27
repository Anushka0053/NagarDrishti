from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.main import app


LAYER_ID = "fa000000-0000-0000-0000-000000000002"


@pytest.fixture
def layer_client():
    db = MagicMock()
    db.execute.return_value.fetchall.return_value = []
    app.dependency_overrides[get_db] = lambda: db
    try:
        yield TestClient(app), db
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_layer_features_empty_collection(layer_client):
    client, db = layer_client
    response = client.get(f"/v1/layers/{LAYER_ID}/features")
    assert response.status_code == 200
    assert response.json() == {"type": "FeatureCollection", "features": [], "next_offset": None}
    db.execute.assert_called_once()


def test_layer_features_geometry_and_filters(layer_client):
    client, db = layer_client
    feature_id = UUID("fa000000-0000-0000-0000-000000000003")
    db.execute.return_value.fetchall.return_value = [SimpleNamespace(
        id=feature_id, name_en="School", name_hi=None, category="education",
        subcategory=None, properties={"capacity": 100}, provenance_type="community_open",
        geojson='{"type":"Point","coordinates":[78.2,26.2]}',
    )]
    response = client.get(f"/v1/layers/{LAYER_ID}/features", params={
        "city_id": "c0000000-0000-0000-0000-000000000001",
        "ward_id": "fa000000-0000-0000-0000-000000000004",
        "bbox": "78,26,79,27",
    })
    assert response.status_code == 200
    feature = response.json()["features"][0]
    assert feature["id"] == str(feature_id)
    assert feature["geometry"] == {"type": "Point", "coordinates": [78.2, 26.2]}
    assert feature["properties"]["capacity"] == 100
    query, params = db.execute.call_args.args
    assert "f.city_id = :city_id" in str(query)
    assert "f.ward_id = :ward_id" in str(query)
    assert "ST_MakeEnvelope" in str(query)
    assert params["min_lng"] == 78


@pytest.mark.parametrize("bbox", ["1,2,3", "nan,1,2,3", "0,0,inf,1", "79,26,78,27", "0,-91,1,1", "bad"])
def test_invalid_bbox_rejected_before_database(layer_client, bbox):
    client, db = layer_client
    response = client.get(f"/v1/layers/{LAYER_ID}/features", params={"bbox": bbox})
    assert response.status_code == 400
    db.execute.assert_not_called()
