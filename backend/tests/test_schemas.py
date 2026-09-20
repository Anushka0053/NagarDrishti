import uuid
from app.schemas.admin import CityBase, WardBase
from app.schemas.spatial import IdentifyRequest, BufferRequest, ProximityRequest
from app.schemas.feedback import CitizenReportCreate


def test_city_schema():
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


def test_spatial_schemas():
    identify_req = IdentifyRequest(
        latitude=26.2183,
        longitude=78.1828,
        tolerance_meters=50.0
    )
    assert identify_req.latitude == 26.2183
    assert identify_req.tolerance_meters == 50.0

    buffer_req = BufferRequest(
        origin_latitude=26.2183,
        origin_longitude=78.1828,
        buffer_meters=1000.0
    )
    assert buffer_req.buffer_meters == 1000.0


def test_citizen_report_schema():
    report = CitizenReportCreate(
        city_id=uuid.uuid4(),
        category="road_pothole",
        description="Deep pothole near Thatipur circle",
        latitude=26.2220,
        longitude=78.2038
    )
    assert report.category == "road_pothole"
    assert report.latitude == 26.2220
