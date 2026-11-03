"""
NagarDrishti - Civic Intelligence & Report Engine Test Suite
Tests:
1. Strict input validation against gibberish, spam, keyboard mash, and low entropy.
2. Individual issue intelligence (facts vs interpretations vs recommendations, bilingual support).
3. Multi-report consolidation: 15 reports for 1 road with 4 distinct categories,
   spatial duplicate clustering, photo traceability, and dual-language executive summaries.
4. HTTP 422 validation enforcement on feedback submission.
"""

import unittest
from uuid import uuid4
from datetime import datetime, timezone
from fastapi import HTTPException
from app.adapters.sarvam import SarvamAIAdapter
from app.services.intelligence_service import IntelligenceService
from app.schemas.intelligence import AreaReportGenerateRequest
from app.schemas.feedback import CitizenReportCreate
from app.api.v1.endpoints.feedback import submit_feedback


class TestCivicIntelligencePipeline(unittest.TestCase):
    def setUp(self):
        self.sarvam = SarvamAIAdapter()

    def test_01_strict_input_validation_rejections(self):
        """Verify that meaningless text, gibberish, and spam are strictly rejected."""
        invalid_samples = [
            "asdfghjk",
            "1234567890",
            "aaaaaaaaaaa",
            "asdfasdfasdf",
            "testtesttest",
            "hello",
            "hi how are you",
            "good morning to all",
            "............",
            "abcdefghijklmnopqrstuvwxyz"
        ]

        for text in invalid_samples:
            res = self.sarvam.validate_civic_text(text)
            self.assertFalse(
                res["is_valid"],
                f"Expected '{text}' to be rejected as invalid civic input, but got valid."
            )
            self.assertIn("reason", res)
            self.assertIn("suggestion", res)

    def test_02_authentic_complaints_validation(self):
        """Verify that meaningful Hindi and English civic complaints pass validation."""
        valid_samples = [
            "सड़क पर गहरा गड्ढा है जिससे दोपहिया वाहनों की दुर्घटना का खतरा है।",
            "Gandhi Road par bada gaddha hai gaadi girne ka khatra hai.",
            "Drinking water pipeline is leaking heavily near Prayas hospital causing street flooding.",
            "Street light on pole 14 has been non-functional for 4 days leaving the road dark.",
            "Overflowing garbage dump near sector 5 gate causing terrible stench and stray dogs."
        ]

        for text in valid_samples:
            res = self.sarvam.validate_civic_text(text)
            self.assertTrue(
                res["is_valid"],
                f"Expected '{text}' to be accepted as valid civic complaint, but was rejected."
            )

    def test_03_individual_issue_intelligence_generation(self):
        """
        Verify individual report intelligence produces:
        - Reported facts vs AI interpretations vs Recommendations
        - Affected infrastructure & reported impact
        - Missing info audit & photo linkage
        - Bilingual (English + Hindi) output
        """
        complaint = "सड़क पर गहरा गड्ढा है जिससे दोपहिया वाहनों की दुर्घटना का गंभीर खतरा बना हुआ है।"
        intel = self.sarvam.generate_individual_intelligence(
            description=complaint,
            category="road_pothole",
            location_address="Gandhi Road, Near Prayas Hospital, Gwalior",
            media_paths=["/uploads/pothole_evidence_1.jpg"],
            latitude=26.21359,
            longitude=78.19727,
            nearby_reports=[{"report_number": "ND-MP-2026-9011", "distance_meters": 14.5}]
        )

        # 1. Reported facts check
        self.assertIsInstance(intel["reported_facts"], list)
        self.assertGreaterEqual(len(intel["reported_facts"]), 3)
        self.assertTrue(any("Gandhi Road" in f for f in intel["reported_facts"]))

        # 2. AI Interpretations check
        self.assertIsInstance(intel["ai_interpretations"], list)
        self.assertGreaterEqual(len(intel["ai_interpretations"]), 3)

        # 3. Recommendations check
        self.assertIsInstance(intel["recommendations"], list)
        self.assertGreaterEqual(len(intel["recommendations"]), 2)

        # 4. Infrastructure & impact check
        self.assertIn("road", intel["affected_infrastructure"].lower())
        self.assertIn("सड़क", intel["affected_infrastructure_hi"])
        self.assertTrue(any(w in intel["reported_impact"].lower() for w in ["vehicular", "skid", "accident", "damage"]))

        # 5. Department routing
        self.assertEqual(intel["responsible_department"], "Public Works Department (PWD)")
        self.assertEqual(intel["responsible_department_hi"], "लोक निर्माण विभाग (PWD)")

        # 6. Bilingual executive summary
        self.assertIn("Grievance", intel["executive_summary_en"])
        self.assertIn("नागरिक", intel["executive_summary_hi"])

    def test_04_multi_report_consolidation_15_reports(self):
        """
        Simulate 15 citizen complaints along 1 corridor (Gandhi Road):
        - 8 potholes (with clustered duplicates within 20m)
        - 3 water pipeline leaks
        - 2 damaged road surface/dividers
        - 2 non-functional streetlights
        Verify:
        - All 4 distinct categories are preserved and explained separately
        - Duplicate clusters are detected
        - Photographs are preserved with report number references
        - Dual-language executive summaries cover all 4 issues
        """
        # Synthesize 15 realistic reports
        simulated_reports = [
            # 8 Potholes along Gandhi Road (some within 15m of each other)
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-1001",
                "category": "road_pothole",
                "title": "Deep crater near hospital gate",
                "description": "Deep road pothole near hospital gate causing severe bike skids.",
                "status": "submitted",
                "severity_input": "critical",
                "location_address": "Gandhi Road Near Hospital Gate",
                "latitude": 26.21359,
                "longitude": 78.19727,
                "media_paths": ["/uploads/pothole_1.jpg"]
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-1002",
                "category": "road_pothole",
                "title": "Road pothole hospital entrance",
                "description": "Same large pothole in front of hospital entrance, urgent repair needed.",
                "status": "submitted",
                "severity_input": "critical",
                "location_address": "Gandhi Road Near Hospital Gate",
                "latitude": 26.21360,
                "longitude": 78.19728,
                "media_paths": ["/uploads/pothole_2.jpg"]
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-1003",
                "category": "road_pothole",
                "title": "Pothole near sweets shop",
                "description": "Big crater on road right outside lucky sweets.",
                "status": "submitted",
                "severity_input": "high",
                "location_address": "Gandhi Road near Lucky Sweets",
                "latitude": 26.21400,
                "longitude": 78.19850,
                "media_paths": []
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-1004",
                "category": "road_pothole",
                "title": "Road crater near Lucky Sweets",
                "description": "Vehicle wheels getting damaged in crater near lucky sweets.",
                "status": "submitted",
                "severity_input": "high",
                "location_address": "Gandhi Road near Lucky Sweets",
                "latitude": 26.21402,
                "longitude": 78.19852,
                "media_paths": ["/uploads/pothole_4.jpg"]
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-1005",
                "category": "road_pothole",
                "title": "Pothole at intersection",
                "description": "Damaged asphalt pothole at 3rd cross road intersection.",
                "status": "submitted",
                "severity_input": "medium",
                "location_address": "Gandhi Road 3rd Cross",
                "latitude": 26.21500,
                "longitude": 78.20000,
                "media_paths": []
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-1006",
                "category": "road_pothole",
                "title": "Pothole stretch",
                "description": "Multiple potholes along school boundary wall on Gandhi Road.",
                "status": "submitted",
                "severity_input": "high",
                "location_address": "Gandhi Road School Boundary",
                "latitude": 26.21600,
                "longitude": 78.20200,
                "media_paths": ["/uploads/pothole_6.jpg"]
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-1007",
                "category": "road_pothole",
                "title": "Pothole near school",
                "description": "Second complaint for school boundary potholes.",
                "status": "submitted",
                "severity_input": "medium",
                "location_address": "Gandhi Road School Boundary",
                "latitude": 26.21601,
                "longitude": 78.20202,
                "media_paths": []
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-1008",
                "category": "road_pothole",
                "title": "Deep pothole end of road",
                "description": "Pothole near flyover ramp on Gandhi Road.",
                "status": "submitted",
                "severity_input": "medium",
                "location_address": "Gandhi Road Flyover Ramp",
                "latitude": 26.21750,
                "longitude": 78.20500,
                "media_paths": []
            },
            # 3 Water Pipeline Leaks
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-2001",
                "category": "water_leakage",
                "title": "Drinking water pipeline burst",
                "description": "Main drinking water pipeline ruptured causing massive clean water loss.",
                "status": "submitted",
                "severity_input": "critical",
                "location_address": "Gandhi Road Junction 2",
                "latitude": 26.21450,
                "longitude": 78.19900,
                "media_paths": ["/uploads/water_leak_1.jpg"]
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-2002",
                "category": "water_leakage",
                "title": "Water leakage flooding road",
                "description": "Water leaking from underground valve flooding the roadway.",
                "status": "submitted",
                "severity_input": "high",
                "location_address": "Gandhi Road Junction 2",
                "latitude": 26.21452,
                "longitude": 78.19902,
                "media_paths": []
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-2003",
                "category": "water_leakage",
                "title": "Pipe leakage near park",
                "description": "Water pipe joint leaking continuously into storm drain.",
                "status": "submitted",
                "severity_input": "medium",
                "location_address": "Gandhi Road Park Gate",
                "latitude": 26.21650,
                "longitude": 78.20300,
                "media_paths": ["/uploads/water_leak_3.jpg"]
            },
            # 2 Damaged Road Surfaces / Dividers
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-3001",
                "category": "infrastructure_damage",
                "title": "Concrete road divider broken",
                "description": "Concrete median divider smashed after truck impact, iron rebars exposed.",
                "status": "submitted",
                "severity_input": "critical",
                "location_address": "Gandhi Road Central Median",
                "latitude": 26.21550,
                "longitude": 78.20100,
                "media_paths": ["/uploads/divider_damage.jpg"]
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-3002",
                "category": "infrastructure_damage",
                "title": "Pedestrian footpath tiles caved in",
                "description": "Footpath paving slabs broken causing hazard for elderly walkers.",
                "status": "submitted",
                "severity_input": "medium",
                "location_address": "Gandhi Road Footpath",
                "latitude": 26.21680,
                "longitude": 78.20400,
                "media_paths": []
            },
            # 2 Non-functional Streetlights
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-4001",
                "category": "street_light",
                "title": "Three streetlights off",
                "description": "Streetlights from pole 18 to 21 not turning on for last 3 nights.",
                "status": "submitted",
                "severity_input": "high",
                "location_address": "Gandhi Road East Stretch",
                "latitude": 26.21700,
                "longitude": 78.20450,
                "media_paths": []
            },
            {
                "id": str(uuid4()),
                "report_number": "ND-MP-2026-4002",
                "category": "street_light",
                "title": "Dark stretch on Gandhi Road",
                "description": "Complete blackout on street lights near bus stop, unsafe for women.",
                "status": "submitted",
                "severity_input": "high",
                "location_address": "Gandhi Road Bus Stop",
                "latitude": 26.21720,
                "longitude": 78.20480,
                "media_paths": ["/uploads/dark_street.jpg"]
            }
        ]

        # Mock preview response with 15 reports
        mock_preview = {
            "total_matching": 15,
            "category_distribution": {
                "road_pothole": 8,
                "water_leakage": 3,
                "infrastructure_damage": 2,
                "street_light": 2
            },
            "status_distribution": {"submitted": 15},
            "reports": simulated_reports
        }

        # Monkey-patch preview_area_reports to test consolidation logic deterministically
        orig_preview = IntelligenceService.preview_area_reports
        IntelligenceService.preview_area_reports = staticmethod(lambda db, req: mock_preview)

        # Mock database session
        class MockSession:
            def query(self, *args, **kwargs):
                class MockQ:
                    def filter(self, *a, **kw):
                        class MockObj:
                            def first(self):
                                class MockEntity:
                                    id = uuid4()
                                    name_en = "Gwalior"
                                    name_hi = "ग्वालियर"
                                    ward_number = 14
                                return MockEntity()
                        return MockObj()
                return MockQ()

            def add(self, obj):
                obj.id = uuid4()
                obj.generated_at = datetime.now(timezone.utc)

            def commit(self):
                pass

            def refresh(self, obj):
                pass

        try:
            req = AreaReportGenerateRequest(
                city_id=uuid4(),
                title="Gandhi Road Comprehensive Corridor Intelligence",
                language="en"
            )
            result = IntelligenceService.generate_consolidated_area_report(
                db=MockSession(),
                req=req
            )

            # 1. Total count check
            self.assertEqual(result.total_submissions, 15)

            # 2. Distinct issue groups check
            self.assertEqual(result.distinct_issue_groups, 4)
            self.assertEqual(len(result.distinct_issues_breakdown), 4)

            # 3. Category distribution check
            self.assertEqual(result.category_distribution["road_pothole"], 8)
            self.assertEqual(result.category_distribution["water_leakage"], 3)
            self.assertEqual(result.category_distribution["infrastructure_damage"], 2)
            self.assertEqual(result.category_distribution["street_light"], 2)

            # 4. Check that road_pothole has detected duplicates
            pothole_issue = next(b for b in result.distinct_issues_breakdown if b["category"] == "road_pothole")
            self.assertEqual(pothole_issue["count"], 8)
            self.assertGreater(pothole_issue["probable_duplicates_count"], 0)
            self.assertLess(pothole_issue["distinct_incidents_count"], 8)
            self.assertIn("Public Works Department (PWD)", pothole_issue["responsible_department_en"])

            # 5. Check probable duplicate clusters list
            self.assertGreaterEqual(len(result.probable_duplicates), 1)

            # 6. Check grouped media references
            self.assertGreaterEqual(len(result.grouped_evidence_media), 5)
            self.assertTrue(any(m["report_number"] == "ND-MP-2026-1001" for m in result.grouped_evidence_media))

            # 7. Check bilingual executive summaries
            self.assertIn("15 citizen complaints", result.executive_summary_en)
            self.assertIn("15", result.executive_summary_hi)
            self.assertIn("सड़क", result.executive_summary_hi)
            self.assertIn("पेयजल", result.executive_summary_hi)

        finally:
            IntelligenceService.preview_area_reports = orig_preview

    def test_05_api_rejects_gibberish_submission(self):
        """Verify submit_feedback raises HTTP 422 with validation failure for gibberish."""
        payload = {
            "city_id": uuid4(),
            "category": "road_pothole",
            "title": "Random Test",
            "description": "asdfghjkl",  # Gibberish keyboard smash
            "latitude": 26.2183,
            "longitude": 78.1828
        }
        with self.assertRaises(HTTPException) as ctx:
            submit_feedback(
                CitizenReportCreate(**payload),
                claims=None,
                db=None
            )
        self.assertEqual(ctx.exception.status_code, 422)
        detail = ctx.exception.detail
        self.assertEqual(detail.get("error"), "validation_failed")
        self.assertIn("too short", detail.get("message", "").lower())

    def test_06_regression_cases_grounded_triage(self):
        """
        10 Regression Cases strictly verifying zero hallucination and robust grounding:
        1. 'poor building infrastructure, lift with poor condition' -> lift maintenance, not emergency
        2. 'There is an open manhole in the middle of the road' -> acute open manhole hazard
        3. 'An exposed live electrical wire is hanging near a public walkway' -> electrical hazard
        4. 'The lift stopped between floors and passengers are trapped' -> passenger entrapment
        5. 'The building looks bad' -> needs clarification
        6. 'asdfghjklqwerty' -> rejected as invalid
        7. Hindi bus stop pothole -> pure English translation and pure Hindi
        8. Drinking water pipeline burst -> water leakage category
        9. Road pothole with asphalt breakage -> road pothole category
        10. Overflowing garbage dump -> sanitation category
        """
        # Case 1: Lift maintenance without emergency
        c1 = self.sarvam.triage_civic_text("poor building infrastructure, lift with poor condition", category_hint="infrastructure_damage")
        self.assertEqual(c1["predicted_category"], "infrastructure_damage")
        self.assertEqual(c1["subcategory"], "building_lift_maintenance")
        self.assertEqual(c1["urgency"], "medium")
        self.assertFalse(c1["is_acute_hazard"])
        self.assertNotIn("open manhole", c1["extracted_hazard"].lower())
        self.assertNotIn("live electrical wire", c1["extracted_hazard"].lower())
        self.assertIn("Civil Infrastructure", c1["assigned_department_name"])

        # Case 1b: Building infrastructure without lift - MUST NEVER MENTION LIFT!
        c1b = self.sarvam.triage_civic_text("poor building infastructure", category_hint="public_safety")
        self.assertEqual(c1b["predicted_category"], "infrastructure_damage")
        self.assertEqual(c1b["subcategory"], "building_civil_infrastructure")
        self.assertNotIn("lift", c1b["extracted_hazard"].lower())
        self.assertNotIn("elevator", c1b["extracted_hazard"].lower())
        self.assertNotIn("lift", c1b["executive_brief_en"].lower())
        self.assertNotIn("lift", c1b["recommended_action"].lower())

        # Case 2: Open manhole
        c2 = self.sarvam.triage_civic_text("There is an open manhole in the middle of the road")
        self.assertTrue(c2["is_acute_hazard"])
        self.assertEqual(c2["hazard_type"], "open_manhole")
        self.assertEqual(c2["urgency"], "critical")
        self.assertIn("manhole", c2["extracted_hazard"].lower())

        # Case 3: Live wire
        c3 = self.sarvam.triage_civic_text("An exposed live electrical wire is hanging near a public walkway")
        self.assertTrue(c3["is_acute_hazard"])
        self.assertEqual(c3["hazard_type"], "electrical_hazard")
        self.assertEqual(c3["urgency"], "critical")
        self.assertIn("electrical", c3["extracted_hazard"].lower())

        # Case 4: Passenger entrapment
        c4 = self.sarvam.triage_civic_text("The lift stopped between floors and passengers are trapped")
        self.assertTrue(c4["is_acute_hazard"])
        self.assertEqual(c4["hazard_type"], "passenger_entrapment")
        self.assertEqual(c4["urgency"], "critical")

        # Case 5: Vague building text
        c5 = self.sarvam.triage_civic_text("The building looks bad")
        self.assertTrue(c5["needs_clarification"])
        self.assertEqual(c5["quality_status"], "Needs Clarification")

        # Case 6: Keyboard mash
        v6 = self.sarvam.validate_civic_text("asdfghjklqwerty")
        self.assertFalse(v6["is_valid"])

        # Case 7: Hindi bus stop pothole
        c7 = self.sarvam.triage_civic_text("फूलबाग बस स्टॉप के ठीक बाहर डामर उखड़ गया है, पानी भरने से गड्ढा और बड़ा हो रहा है।")
        self.assertEqual(c7["original_language"], "hi")
        self.assertFalse(any(ord(ch) >= 0x0900 and ord(ch) <= 0x097F for ch in c7["description_en"]))
        self.assertTrue(any(ord(ch) >= 0x0900 and ord(ch) <= 0x097F for ch in c7["description_hi"]))

        # Case 8: Water pipeline burst
        c8 = self.sarvam.triage_civic_text("पेयजल मुख्य पाइपलाइन फटने से सड़क पर भारी जलभराव हो रहा है और घरों में पानी नहीं आ रहा।")
        self.assertEqual(c8["predicted_category"], "water_leakage")

        # Case 9: Asphalt breakage
        c9 = self.sarvam.triage_civic_text("सड़क पर बड़ा गड्ढा है डामर टूट गया है")
        self.assertEqual(c9["predicted_category"], "road_pothole")

        # Case 10: Garbage dump
        c10 = self.sarvam.triage_civic_text("कचरे का बड़ा ढेर लगा हुआ है बहुत बदबू आ रही है")
        self.assertEqual(c10["predicted_category"], "garbage_dump")

    def test_07_community_multi_feedback_consolidation_9_citizens(self):
        """
        Verify Sarvam AI synthesizes 9 diverse citizen feedbacks for a shared hotspot incident
        instead of merely repeating a single citizen's description:
        - 9 distinct citizen perspectives across multiple cascading operational aspects
        - Multi-issue breakdown with percentages
        - Consolidated dual-language executive summary
        - Joint inter-departmental action coordination (PHED + PWD)
        """
        community = SarvamAIAdapter.generate_community_multi_feedback_intelligence(
            category="water_leakage",
            primary_description="Drinking water main pipeline burst is causing severe road waterlogging and disrupting household water supply.",
            total_affected=9,
            location_address="Lashkar Ward 1, Near Phoolbagh Bus Stand, Gwalior"
        )

        # 1. Verification of total citizen count
        self.assertEqual(community["total_affected"], 9)
        self.assertEqual(len(community["citizen_feedbacks"]), 9)

        # 2. Diverse aspects among the 9 citizens
        aspects = [cf["aspect_en"] for cf in community["citizen_feedbacks"]]
        self.assertIn("Main Pipeline Rupture", aspects)
        self.assertIn("Roadway Flooding & Skidding Risk", aspects)
        self.assertIn("Domestic Water Supply Outage", aspects)

        # 3. Distinct issues breakdown with percentage allocation
        self.assertGreaterEqual(len(community["distinct_issues_breakdown"]), 3)
        total_pct = sum(d["percentage"] for d in community["distinct_issues_breakdown"])
        self.assertGreaterEqual(total_pct, 95)

        # 4. Consolidated executive briefs
        self.assertIn("9 Citizens Corroborated", community["consolidated_executive_brief_en"])
        self.assertIn("9 नागरिक", community["consolidated_executive_brief_hi"])
        self.assertIn("PHED", community["consolidated_executive_brief_en"])
        self.assertIn("PWD", community["consolidated_executive_brief_en"])

        # 5. Inter-departmental coordination
        dept_names = [d["department_en"] for d in community["coordinated_departments"]]
        self.assertTrue(any("PHED" in name for name in dept_names))
        self.assertTrue(any("PWD" in name for name in dept_names))


if __name__ == "__main__":
    unittest.main()
