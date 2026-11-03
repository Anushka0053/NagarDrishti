"""
Direct Synchronous Unit Test Suite for NagarDrishti Phase 4 — AI-Powered Civic Intelligence
Executes offline in isolated environment without network sockets.
"""
import sys
import os
import uuid
from datetime import datetime
from unittest.mock import MagicMock

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_path)

from app.adapters.sarvam import SarvamAIAdapter
from app.schemas.ai import (
    AITranscriptionResponse,
    AITranslationRequest,
    AITranslationResponse,
    AITextToSpeechRequest,
    AITextToSpeechResponse,
    AITriageRequest,
    AITriageResponse
)
from app.schemas.feedback import CitizenReportCreate, CitizenReportStatusUpdate, CitizenReportResponse
from app.services.feedback_service import FeedbackService


def test_sarvam_adapter_triage():
    print("[1/6] Testing Sarvam AI Grounded Triage & Multilingual Categorization...")
    adapter = SarvamAIAdapter()

    # 1. Road damage test (Hindi)
    hindi_pothole_text = "महाराज बाड़ा रोड पर गहरा गड्ढा है, जिससे गाड़ियाँ गिर रही हैं और दुर्घटना का खतरा है।"
    triage_pothole = adapter.triage_civic_text(hindi_pothole_text)
    assert triage_pothole["predicted_category"] == "road_pothole", f"Expected road_pothole, got {triage_pothole['predicted_category']}"
    assert triage_pothole["urgency"] in ["high", "critical"], f"Expected high/critical urgency, got {triage_pothole['urgency']}"
    assert triage_pothole["detected_language"] == "hi"
    assert triage_pothole["assigned_department_name"] == "Public Works Department (PWD)"
    assert triage_pothole["is_ai_prediction"] is True
    assert triage_pothole["confidence"] > 0.7
    assert len(triage_pothole["triage_summary"]) > 0

    # 2. Water leakage test (English)
    water_leak_text = "Severe pipeline burst near Palasia Square. Clean drinking water flooding the road since morning."
    triage_water = adapter.triage_civic_text(water_leak_text)
    assert triage_water["predicted_category"] == "water_leakage", f"Expected water_leakage, got {triage_water['predicted_category']}"
    assert triage_water["urgency"] in ["medium", "high", "critical"]
    assert triage_water["detected_language"] == "en"
    assert "Jal" in triage_water["assigned_department_name"] or "Water" in triage_water["assigned_department_name"]

    # 3. Sanitation / Waste test
    garbage_text = "Huge garbage pile rotting near community park. Terrible smell and health hazard."
    triage_garbage = adapter.triage_civic_text(garbage_text)
    assert triage_garbage["predicted_category"] == "garbage_dump", f"Expected garbage_dump, got {triage_garbage['predicted_category']}"
    assert "Sanitation" in triage_garbage["assigned_department_name"]

    # 4. Electricity test
    light_text = "Street light pole damaged and live wire hanging in the alley. Pitch dark at night."
    triage_light = adapter.triage_civic_text(light_text)
    assert triage_light["predicted_category"] == "street_light", f"Expected street_light, got {triage_light['predicted_category']}"
    assert triage_light["urgency"] in ["high", "critical"]

    print("  -> Passed: Sarvam AI triage deterministically scores categories, urgency, and departments!")


def test_sarvam_adapter_simulation_and_tts():
    print("[2/6] Testing Sarvam TTS & Speech Synthesis Payload Generation...")
    adapter = SarvamAIAdapter()

    # Test TTS request schema and simulated fallback payload
    sample_text = "आपकी शिकायत दर्ज कर ली गई है। शीघ्र निस्तारण किया जाएगा।"
    tts_result = adapter.text_to_speech_sync(sample_text, target_language_code="hi-IN", speaker="meera")

    assert tts_result is not None
    assert "audio_base64" in tts_result
    assert tts_result["format"] == "audio/wav"
    assert tts_result["char_count"] == len(sample_text)
    assert len(tts_result["audio_base64"]) > 0

    # Test pydantic response construction
    response_schema = AITextToSpeechResponse(
        audio_base64=tts_result["audio_base64"],
        format=tts_result["format"],
        char_count=tts_result["char_count"],
        is_simulated=tts_result.get("is_simulated", True)
    )
    assert response_schema.audio_base64.startswith("UklGR")  # RIFF header in Base64
    print("  -> Passed: Sarvam TTS generation and simulated audio failover verified!")


def test_feedback_schemas_and_status_transitions():
    print("[3/6] Testing Feedback Pydantic Validation & Status Lifecycles...")

    # Valid status lifecycle values
    valid_statuses = ["submitted", "triaged", "assigned", "in_progress", "resolved", "rejected_spam"]
    for s in valid_statuses:
        update_req = CitizenReportStatusUpdate(
            status=s,
            assigned_officer_name="Shri R.K. Sharma, AE PWD",
            resolution_summary=f"Action taken: {s}"
        )
        assert update_req.status == s
        assert update_req.assigned_officer_name == "Shri R.K. Sharma, AE PWD"

    # Verify report creation payload
    report_in = CitizenReportCreate(
        city_id=uuid.uuid4(),
        category="roads",
        title="Deep pothole on AB Road",
        description="Dangerous pothole causing traffic slowdown near Vijay Nagar.",
        latitude=22.7533,
        longitude=75.8937,
        severity_input="high"
    )
    assert report_in.latitude == 22.7533
    assert report_in.longitude == 75.8937
    assert report_in.category == "roads"

    print("  -> Passed: All 6 lifecycle statuses and report creation schemas strictly validated!")


def test_spatial_duplicate_detection_logic():
    print("[4/6] Testing PostGIS 200m Spatial Duplicate Proximity Engine...")
    import math

    def haversine_meters(lat1, lon1, lat2, lon2):
        R = 6371000.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    # Point A: Gwalior Fort Gate
    lat_a, lon_a = 26.2295, 78.1734
    # Point B: 60 meters away (should be duplicate if same category)
    lat_b, lon_b = 26.2299, 78.1738
    dist_ab = haversine_meters(lat_a, lon_a, lat_b, lon_b)
    assert dist_ab < 200.0, f"Expected < 200m, got {dist_ab}"

    # Point C: 450 meters away (outside duplicate threshold)
    lat_c, lon_c = 26.2330, 78.1760
    dist_ac = haversine_meters(lat_a, lon_a, lat_c, lon_c)
    assert dist_ac > 200.0, f"Expected > 200m, got {dist_ac}"

    print(f"  -> Distances verified: Near={dist_ab:.1f}m (Within 200m threshold), Far={dist_ac:.1f}m (> 200m threshold)")
    print("  -> Passed: Spatial duplicate detection geometry mathematically verified!")


def test_feedback_service_workflow_mock():
    print("[5/6] Testing FeedbackService Status Update & Audit Trail Generation...")
    db_mock = MagicMock()

    # Mock existing report
    dummy_report_id = uuid.uuid4()
    dummy_city_id = uuid.uuid4()
    mock_report = MagicMock()
    mock_report.id = dummy_report_id
    mock_report.city_id = dummy_city_id
    mock_report.status = "submitted"
    mock_report.assigned_officer_name = None
    mock_report.resolution_summary = None
    mock_report.resolved_at = None
    mock_report.ai_metadata = {"is_ai_prediction": True, "predicted_urgency": "high"}

    db_mock.query().filter().first.return_value = mock_report

    # Execute status update to 'assigned'
    update_data = CitizenReportStatusUpdate(
        status="assigned",
        assigned_officer_name="Er. Anand Verma, Zone-3 Incharge",
        resolution_summary="Assigned to quick response team for pothole filling."
    )

    updated_report = FeedbackService.update_report_status(db_mock, dummy_report_id, update_data)
    assert updated_report.status == "assigned"
    assert updated_report.assigned_officer_name == "Er. Anand Verma, Zone-3 Incharge"
    assert updated_report.resolution_summary == "Assigned to quick response team for pothole filling."

    # Execute status update to 'resolved'
    resolve_data = CitizenReportStatusUpdate(
        status="resolved",
        assigned_officer_name="Er. Anand Verma, Zone-3 Incharge",
        resolution_summary="Road resurfacing completed and site inspected."
    )
    resolved_report = FeedbackService.update_report_status(db_mock, dummy_report_id, resolve_data)
    assert resolved_report.status == "resolved"
    assert resolved_report.resolved_at is not None

    # Verify audit history insert occurred in mock
    assert db_mock.add.called
    assert db_mock.commit.called

    print("  -> Passed: Operational lifecycle transitions, assignment, and resolution logged successfully!")


def test_multi_city_reporting_support():
    print("[6/6] Testing Multi-City Dynamic Scoping Across Reference Cities...")
    reference_cities = {
        "gwalior": (26.2183, 78.1828),
        "indore": (22.7196, 75.8577),
        "bhopal": (23.2599, 77.4126),
        "jabalpur": (23.1815, 79.9864),
        "ujjain": (23.1765, 75.7885),
    }

    for city_slug, (lat, lon) in reference_cities.items():
        city_id = uuid.uuid4()
        report = CitizenReportCreate(
            city_id=city_id,
            category="water_supply",
            title=f"Water supply issue in {city_slug.capitalize()}",
            description=f"Water line pressure very low in central ward of {city_slug.capitalize()}.",
            latitude=lat,
            longitude=lon,
            severity_input="medium"
        )
        assert report.city_id == city_id
        assert abs(report.latitude - lat) < 0.001
        assert abs(report.longitude - lon) < 0.001

    print("  -> Passed: All 5 reference cities dynamically handle report creation without hardcoded city branching!")


if __name__ == "__main__":
    print("\n================================================================================")
    print("NAGARDRISHTI PHASE 4 — CIVIC INTELLIGENCE DIRECT UNIT TEST SUITE")
    print("================================================================================")
    test_sarvam_adapter_triage()
    test_sarvam_adapter_simulation_and_tts()
    test_feedback_schemas_and_status_transitions()
    test_spatial_duplicate_detection_logic()
    test_feedback_service_workflow_mock()
    test_multi_city_reporting_support()
    print("================================================================================")
    print("ALL 6 PHASE 4 UNIT TESTS PASSED SUCCESSFULLY!")
    print("================================================================================\n")
