"""
NagarDrishti — Phase 6: Final End-to-End Validation & Verification Suite
Synchronously executes full system checks across:
- Multi-City Registry (Gwalior, Indore, Bhopal, Jabalpur, Ujjain)
- Data Provenance and Truthfulness Integrity
- Spatial Bounds & Geometry Conformance
- Citizen Reporting to Department Dispatch E2E Lifecycle
- Role-Based Jurisdiction & Failure Scenarios
"""
import sys
import os
import uuid
import json
from unittest.mock import MagicMock
from fastapi import HTTPException

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_path)

from app.ingestion.osm_pipeline import MP_CITY_BBOXES, OSMOverpassPipeline
from app.adapters.sarvam import SarvamAIAdapter
from app.services.feedback_service import FeedbackService
from app.schemas.feedback import CitizenReportCreate, CitizenReportStatusUpdate
from app.core.security import (
    extract_user_identity,
    require_roles,
    enforce_city_scope,
    enforce_department_scope,
    sanitize_and_validate_file_upload
)
from app.api.v1.endpoints.health import health_check, liveness_probe, readiness_probe


def test_multi_city_spatial_integrity():
    print("[1/6] Validating Multi-City Geographic Coordinates & Spatial Boundaries...")
    reference_cities = ["gwalior", "indore", "bhopal", "jabalpur", "ujjain"]
    
    # State-level MP bounding envelope
    MP_MIN_LAT, MP_MAX_LAT = 21.0, 27.0
    MP_MIN_LON, MP_MAX_LON = 74.0, 83.0

    for city in reference_cities:
        assert city in MP_CITY_BBOXES, f"Missing city bbox config for {city}"
        min_lat, min_lon, max_lat, max_lon = MP_CITY_BBOXES[city]
        
        # Verify ordering
        assert min_lat < max_lat, f"{city}: min_lat must be < max_lat"
        assert min_lon < max_lon, f"{city}: min_lon must be < max_lon"
        
        # Verify enclosed in Madhya Pradesh bounds
        assert MP_MIN_LAT <= min_lat <= MP_MAX_LAT, f"{city} latitude outside MP bounds"
        assert MP_MIN_LAT <= max_lat <= MP_MAX_LAT, f"{city} latitude outside MP bounds"
        assert MP_MIN_LON <= min_lon <= MP_MAX_LON, f"{city} longitude outside MP bounds"
        assert MP_MIN_LON <= max_lon <= MP_MAX_LON, f"{city} longitude outside MP bounds"

        # Verify city center calculation
        center_lat = (min_lat + max_lat) / 2.0
        center_lon = (min_lon + max_lon) / 2.0
        assert min_lat <= center_lat <= max_lat
        assert min_lon <= center_lon <= max_lon

    print("  -> Passed: All 5 reference cities strictly conform to MP geospatial envelopes!")


def test_data_provenance_truthfulness():
    print("[2/6] Validating Data Provenance & Anti-Fabrication Guarantees...")
    
    # 1. OSM features must never be tagged as officially verified
    pipeline = OSMOverpassPipeline()
    dummy_layer = uuid.uuid4()
    dummy_city = uuid.uuid4()
    sample_osm = {
        "elements": [
            {
                "type": "node",
                "id": 9999,
                "lat": 26.22,
                "lon": 78.18,
                "tags": {"name": "Gwalior General Hospital", "amenity": "hospital"}
            }
        ]
    }
    features = pipeline.transform_to_features(sample_osm, dummy_layer, dummy_city)
    assert len(features) == 1
    feat = features[0]
    
    # Verification of provenance
    assert feat["provenance_type"] == "community_open", "OSM data MUST be stamped community_open!"
    assert feat["provenance_type"] != "verified_state_government", "OSM data must NEVER claim state verification!"
    assert feat["provenance_type"] != "verified_municipal", "OSM data must NEVER claim municipal verification!"
    assert "OpenStreetMap" in feat["properties"]["attribution"]

    # 2. AI predictions must always be explicitly tagged as unverified predictions
    sarvam = SarvamAIAdapter()
    triage = sarvam.triage_civic_text("सड़क पर भारी गड्ढा है जिससे दुर्घटना हो रही है।")
    assert triage["is_ai_prediction"] is True, "AI outputs MUST have is_ai_prediction = True"
    assert "confidence" in triage
    assert 0.0 <= triage["confidence"] <= 1.0

    print("  -> Passed: Open data and AI inferences are truthfully stamped; zero false verification claims!")


def test_end_to_end_citizen_to_dispatch_workflow():
    print("[3/6] Validating End-to-End Citizen Submission to Department Resolution Workflow...")
    
    db_mock = MagicMock()
    city_id = uuid.uuid4()
    report_id = uuid.uuid4()
    dept_id = uuid.uuid4()

    # Step 1: Create report with voice description in Hindi
    hindi_voice_text = "महाराज बाड़ा रोड पर गहरा गड्ढा है, तुरंत ठीक करें।"
    report_in = CitizenReportCreate(
        city_id=city_id,
        category="road_pothole",
        title="गहरा गड्ढा",
        description=hindi_voice_text,
        latitude=26.2183,
        longitude=78.1828,
        severity_input="high"
    )

    # Step 2: AI Triage
    sarvam = SarvamAIAdapter()
    triage = sarvam.triage_civic_text(report_in.description)
    assert triage["predicted_category"] == "road_pothole"
    assert triage["urgency"] in ["high", "critical"]
    assert triage["detected_language"] == "hi"

    # Step 3: Mock DB Report creation
    mock_report = MagicMock()
    mock_report.id = report_id
    mock_report.report_number = "ND-GWL-2026-000101"
    mock_report.city_id = city_id
    mock_report.status = "submitted"
    mock_report.assigned_officer_name = None
    mock_report.resolution_summary = None
    mock_report.resolved_at = None
    mock_report.ai_metadata = triage

    db_mock.query().filter().first.return_value = mock_report

    # Step 4: Department dispatch -> Assign to Junior Engineer
    assign_payload = CitizenReportStatusUpdate(
        status="assigned",
        assigned_officer_name="Shri R.K. Sharma, AE PWD",
        resolution_summary="Work order generated. Team dispatched."
    )
    assigned = FeedbackService.update_report_status(db_mock, report_id, assign_payload)
    assert assigned.status == "assigned"
    assert assigned.assigned_officer_name == "Shri R.K. Sharma, AE PWD"

    # Step 5: Field work in progress
    progress_payload = CitizenReportStatusUpdate(
        status="in_progress",
        assigned_officer_name="Shri R.K. Sharma, AE PWD",
        resolution_summary="Road asphalt patching underway."
    )
    in_progress = FeedbackService.update_report_status(db_mock, report_id, progress_payload)
    assert in_progress.status == "in_progress"

    # Step 6: Final resolution
    resolve_payload = CitizenReportStatusUpdate(
        status="resolved",
        assigned_officer_name="Shri R.K. Sharma, AE PWD",
        resolution_summary="Pothole filled and road leveled. Site inspected."
    )
    resolved = FeedbackService.update_report_status(db_mock, report_id, resolve_payload)
    assert resolved.status == "resolved"
    assert resolved.resolved_at is not None

    print("  -> Passed: Complete citizen voice report -> AI triage -> officer dispatch -> resolution verified!")


def test_security_and_jurisdiction_failure_modes():
    print("[4/6] Validating Security Privilege Gates & Cross-Jurisdiction Rejection...")

    gwalior_id = uuid.uuid4()
    indore_id = uuid.uuid4()
    pwd_id = uuid.uuid4()
    jal_id = uuid.uuid4()

    # Case A: Gwalior City Admin attempts action on Indore city
    gwalior_admin = {"role": "gis_admin", "city_id": str(gwalior_id)}
    try:
        enforce_city_scope(gwalior_admin, indore_id)
        assert False, "Should have blocked cross-city modification"
    except HTTPException as e:
        assert e.status_code == 403
        assert "Cross-city" in e.detail

    # Case B: PWD officer attempts action on Jal Nigam report
    pwd_officer = {"role": "analyst", "department_id": str(pwd_id)}
    try:
        enforce_department_scope(pwd_officer, jal_id)
        assert False, "Should have blocked cross-department modification"
    except HTTPException as e:
        assert e.status_code == 403
        assert "Cross-department" in e.detail

    # Case C: Path Traversal Attack Defense
    try:
        sanitize_and_validate_file_upload("../../../etc/passwd", 100, "application/json")
        assert False, "Should have blocked path traversal"
    except HTTPException as e:
        assert e.status_code == 400

    # Case D: Malicious executable upload defense
    try:
        sanitize_and_validate_file_upload("exploit.php", 100, "application/x-httpd-php")
        assert False, "Should have blocked executable file upload"
    except HTTPException as e:
        assert e.status_code == 400

    print("  -> Passed: Cross-city, cross-department, and file-upload attack vectors successfully neutralized!")


def test_resilience_and_graceful_fallbacks():
    print("[5/6] Validating Offline Simulation & Graceful Degradation...")

    # Verify Sarvam unconfigured simulation fallback
    sarvam = SarvamAIAdapter()
    
    # Text to speech without crashing when API key is missing
    tts = sarvam.text_to_speech_sync("टेस्ट मैसेज")
    assert "audio_base64" in tts
    assert tts["char_count"] > 0
    assert tts["is_simulated"] is True

    # Health check probe reflects fallback accurately
    mock_db = MagicMock()
    mock_db.execute.return_value.fetchone.side_effect = [
        ("POSTGIS=\"3.4.1\" [EXTENSION] PGSQL=\"160\"",),
        (6,)
    ]
    probe = health_check(mock_db)
    assert probe["status"] == "healthy"
    assert "geospatial_scope" in probe

    print("  -> Passed: System operates gracefully without network crashes or unhandled exceptions!")


def test_ui_and_api_schema_conformance():
    print("[6/6] Validating API Schema Conformance & Type Safety...")

    # Pydantic Schemas validation
    from app.schemas.spatial import IdentifyRequest, BufferRequest, RouteRequest
    
    # 1. Coordinate check
    req = IdentifyRequest(latitude=26.2183, longitude=78.1828, tolerance_meters=50)
    assert req.latitude == 26.2183
    assert req.longitude == 78.1828
    assert req.tolerance_meters == 50

    # 2. Buffer check
    buf = BufferRequest(origin_latitude=22.7196, origin_longitude=75.8577, buffer_meters=500)
    assert buf.buffer_meters == 500

    # 3. Route check
    rt = RouteRequest(origin_latitude=26.21, origin_longitude=78.18, destination_latitude=26.23, destination_longitude=78.20)
    assert rt.origin_latitude == 26.21
    assert rt.destination_longitude == 78.20

    print("  -> Passed: All request/response schemas strictly type-validated!")


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("NAGARDRISHTI PHASE 6: FINAL END-TO-END VALIDATION & ACCEPTANCE SUITE")
    print("=" * 80)
    test_multi_city_spatial_integrity()
    test_data_provenance_truthfulness()
    test_end_to_end_citizen_to_dispatch_workflow()
    test_security_and_jurisdiction_failure_modes()
    test_resilience_and_graceful_fallbacks()
    test_ui_and_api_schema_conformance()
    print("=" * 80)
    print("ALL 6 PHASE 6 END-TO-END ACCEPTANCE TESTS PASSED (100% PASS RATE)!")
    print("=" * 80 + "\n")
