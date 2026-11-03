"""
Master Test Runner for NagarDrishti — All Verification Suites (Phase 3.5, 4, 5, 6)
Executes all 24 direct unit, integration, and security tests.
"""
import sys
import os
import time

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_path)

from tests.test_phase3_5_direct import (
    test_multi_city_bboxes_and_pipeline,
    test_road_line_filtering_and_geometry_safety,
    test_coordinate_search_regex_and_validation,
    test_truthful_analytics_and_empty_state,
    test_dataset_upload_preview_service,
    test_spatial_analysis_methods_with_mock_db
)
from tests.test_phase4_direct import (
    test_sarvam_adapter_triage,
    test_sarvam_adapter_simulation_and_tts,
    test_feedback_schemas_and_status_transitions,
    test_spatial_duplicate_detection_logic,
    test_feedback_service_workflow_mock,
    test_multi_city_reporting_support
)
from tests.test_phase5_direct import (
    test_rbac_and_role_hierarchy,
    test_city_and_department_jurisdiction_scoping,
    test_file_upload_security_and_sanitization,
    test_system_health_and_reliability_probes,
    test_production_cors_and_config,
    test_multi_city_admin_overview
)
from tests.test_phase6_final_validation import (
    test_multi_city_spatial_integrity,
    test_data_provenance_truthfulness,
    test_end_to_end_citizen_to_dispatch_workflow,
    test_security_and_jurisdiction_failure_modes,
    test_resilience_and_graceful_fallbacks,
    test_ui_and_api_schema_conformance
)

def run_all():
    print("=" * 80)
    print("NAGARDRISHTI COMPREHENSIVE AUTOMATED VERIFICATION SUITE")
    print("Madhya Pradesh Geospatial Civic Intelligence & Multilingual Telemetry Platform")
    print("=" * 80)
    start_time = time.time()
    
    passed_count = 0
    total_count = 24

    suites = [
        ("Phase 3.5 GIS Stabilization & Multi-City Expansion", [
            test_multi_city_bboxes_and_pipeline,
            test_road_line_filtering_and_geometry_safety,
            test_coordinate_search_regex_and_validation,
            test_truthful_analytics_and_empty_state,
            test_dataset_upload_preview_service,
            test_spatial_analysis_methods_with_mock_db
        ]),
        ("Phase 4 AI-Powered Civic Intelligence (Sarvam AI)", [
            test_sarvam_adapter_triage,
            test_sarvam_adapter_simulation_and_tts,
            test_feedback_schemas_and_status_transitions,
            test_spatial_duplicate_detection_logic,
            test_feedback_service_workflow_mock,
            test_multi_city_reporting_support
        ]),
        ("Phase 5 Production Readiness & Governance", [
            test_rbac_and_role_hierarchy,
            test_city_and_department_jurisdiction_scoping,
            test_file_upload_security_and_sanitization,
            test_system_health_and_reliability_probes,
            test_production_cors_and_config,
            test_multi_city_admin_overview
        ]),
        ("Phase 6 Final E2E Validation & Acceptance", [
            test_multi_city_spatial_integrity,
            test_data_provenance_truthfulness,
            test_end_to_end_citizen_to_dispatch_workflow,
            test_security_and_jurisdiction_failure_modes,
            test_resilience_and_graceful_fallbacks,
            test_ui_and_api_schema_conformance
        ])
    ]

    for suite_name, test_funcs in suites:
        print(f"\n--- Running Suite: {suite_name} ---")
        for test_fn in test_funcs:
            test_fn()
            passed_count += 1

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 80)
    print(f"VERIFICATION COMPLETE: {passed_count}/{total_count} TESTS PASSED (100% SUCCESS RATE)")
    print(f"Total Execution Time: {elapsed} seconds")
    print("Zero regressions across Gwalior, Indore, Bhopal, Jabalpur, and Ujjain.")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    run_all()
