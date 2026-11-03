"""
NagarDrishti — Realistic Demonstration Seed System
Seeds realistic citizen reports, status history, and AI triage metadata across
Madhya Pradesh cities (Gwalior, Indore, Bhopal, Jabalpur, Ujjain).

SAFETY GUARANTEES:
1. Does NOT alter, delete, or fabricate real GIS physical features (hospitals, roads, schools).
2. Marks all records explicitly with is_demo = True and seed_batch_id = 'demo-2026-v1'.
3. Completely idempotent. Running multiple times refreshes demo data cleanly without touching real citizen records.
"""

import sys
import os
import uuid
from datetime import datetime, timedelta
import random

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.core.database import engine

DEMO_BATCH_ID = "demo-2026-v1"

# City IDs mapped from live database
CITY_IDS = {
    "gwalior": "c0000000-0000-0000-0000-000000000001",
    "indore": "c0000000-0000-0000-0000-000000000002",
    "bhopal": "c0000000-0000-0000-0000-000000000003",
    "jabalpur": "c0000000-0000-0000-0000-000000000004",
    "ujjain": "c0000000-0000-0000-0000-000000000005"
}

# Departments
DEPARTMENT_IDS = {
    "pwd": "d0000000-0000-0000-0000-000000000003",
    "water": "d0000000-0000-0000-0000-000000000001",
    "sanitation": "d0000000-0000-0000-0000-000000000002",
    "health": "d0000000-0000-0000-0000-000000000004",
    "police": "d0000000-0000-0000-0000-000000000005",
    "uadd": "d0000000-0000-0000-0000-000000000006"
}

DEMO_REPORTS = [
    # --- GWALIOR: Phoolbagh & Lashkar Cluster (Road & Water) ---
    {
        "city": "gwalior",
        "category": "road_pothole",
        "title": "Severe road craters near Phoolbagh Square",
        "desc_en": "Deep potholes across the road near Phoolbagh Garden causing traffic congestion and bike falls.",
        "desc_hi": "फूलबाग चौराहे के पास सड़क पर गहरे गड्ढे हैं जिससे दोपहिया वाहन गिर रहे हैं और जाम लग रहा है।",
        "lat": 26.2205, "lng": 78.1750,
        "address": "Phoolbagh Main Road, Lashkar, Gwalior",
        "status": "in_progress",
        "severity": "high",
        "lang": "hi",
        "department": "pwd",
        "officer": "Er. Rajesh Sharma (A.E. PWD Gwalior)",
        "days_ago": 4
    },
    {
        "city": "gwalior",
        "category": "road_pothole",
        "title": "Repeated asphalt breakage near Phoolbagh Bus Stop",
        "desc_en": "Broken road patch directly outside the city bus shelter at Phoolbagh, standing water during rains.",
        "desc_hi": "फूलबाग बस स्टॉप के ठीक बाहर डामर उखड़ गया है, पानी भरने से गड्ढा और बड़ा हो रहा है।",
        "lat": 26.2212, "lng": 78.1758,
        "address": "Near City Bus Stand, Phoolbagh, Gwalior",
        "status": "assigned",
        "severity": "medium",
        "lang": "hi",
        "department": "pwd",
        "officer": "Er. Rajesh Sharma (A.E. PWD Gwalior)",
        "days_ago": 2
    },
    {
        "city": "gwalior",
        "category": "water_leakage",
        "title": "Drinking water supply pipeline burst",
        "desc_en": "Main potable water distribution line leaking heavily on the street, causing low pressure in nearby homes.",
        "desc_hi": "पेयजल मुख्य पाइपलाइन फटने से सड़क पर भारी जलभराव हो रहा है और घरों में पानी नहीं आ रहा।",
        "lat": 26.2198, "lng": 78.1742,
        "address": "Lashkar Ward 1, Near Phoolbagh Sub-station, Gwalior",
        "status": "resolved",
        "severity": "critical",
        "lang": "hi",
        "department": "water",
        "officer": "S.K. Verma (GMC Water Works)",
        "days_ago": 8,
        "resolved_days_ago": 2,
        "res_summary": "Replaced 6-inch cracked cast-iron pipeline joint and restored road bedding."
    },
    # --- GWALIOR: Thatipur & Morar Cluster ---
    {
        "city": "gwalior",
        "category": "garbage_dump",
        "title": "Uncollected solid waste near Thatipur Subzi Mandi",
        "desc_en": "Municipal garbage bin overflowing onto roadway for past 4 days, stray cattle nuisance.",
        "desc_hi": "थाटीपुर सब्जी मंडी के पास कचरा पात्र से कूड़ा सड़क पर फैल गया है, भारी बदबू आ रही है।",
        "lat": 26.2135, "lng": 78.1990,
        "address": "Thatipur Main Market Road, Ward 38, Gwalior",
        "status": "assigned",
        "severity": "high",
        "lang": "hi",
        "department": "sanitation",
        "officer": "Mukesh Pal (Sanitary Inspector)",
        "days_ago": 3
    },
    {
        "city": "gwalior",
        "category": "street_light",
        "title": "Dark stretch due to faulty streetlights on University Road",
        "desc_en": "5 consecutive streetlights non-operational on the link road between Thatipur and Jiwaji University.",
        "desc_hi": "थाटीपुर से जीवाजी विश्वविद्यालय मार्ग पर 5 खंभों की स्ट्रीट लाइट बंद है, रात में अंधेरा रहता है।",
        "lat": 26.2080, "lng": 78.1885,
        "address": "University Link Road, Ward 52, Gwalior",
        "status": "submitted",
        "severity": "medium",
        "lang": "en",
        "department": "uadd",
        "days_ago": 1
    },
    {
        "city": "gwalior",
        "category": "sewerage_overflow",
        "title": "Drainage chamber overflowing into residential lane",
        "desc_en": "Blockage in storm sewer causing contaminated backflow into streets during evening hours.",
        "desc_hi": "नाली की सफाई न होने से सीवर का गंदा पानी सड़क पर बह रहा है।",
        "lat": 26.2150, "lng": 78.2010,
        "address": "Suresh Nagar Colony, Thatipur, Gwalior",
        "status": "triaged",
        "severity": "high",
        "lang": "hi",
        "department": "sanitation",
        "days_ago": 2
    },

    # --- INDORE: Palasia & Vijay Nagar Cluster ---
    {
        "city": "indore",
        "category": "road_pothole",
        "title": "Asphalt depression near Industry House Palasia",
        "desc_en": "Dangerous depression on BRTS feeder road after monsoon trenching work.",
        "desc_hi": "पलासिया इंडस्ट्री हाउस के पास सड़क धंसने से वाहनों को भारी असुविधा हो रही है।",
        "lat": 22.7235, "lng": 75.8820,
        "address": "AB Road near Industry House, Old Palasia, Indore",
        "status": "in_progress",
        "severity": "critical",
        "lang": "en",
        "department": "pwd",
        "officer": "Anil Joshi (IMC Roads Division)",
        "days_ago": 5
    },
    {
        "city": "indore",
        "category": "road_pothole",
        "title": "Potholes along Palasia Square service lane",
        "desc_en": "Multiple sharp potholes near commercial complex entrance, slowing traffic to a crawl.",
        "desc_hi": "पलासिया चौराहे के सर्विस रोड पर कई गड्ढे बन गए हैं।",
        "lat": 22.7242, "lng": 75.8835,
        "address": "Palasia Square Service Road, Indore",
        "status": "assigned",
        "severity": "high",
        "lang": "hi",
        "department": "pwd",
        "officer": "Anil Joshi (IMC Roads Division)",
        "days_ago": 2
    },
    {
        "city": "indore",
        "category": "water_leakage",
        "title": "Narmada pipeline valve leakage",
        "desc_en": "Narmada phase-3 feeder valve leaking thousands of liters daily onto green belt.",
        "desc_hi": "नर्मदा लाइन के वॉल्व से अत्यधिक पानी बह रहा है, शीघ्र मरम्मत करें।",
        "lat": 22.7520, "lng": 75.8940,
        "address": "Scheme 54, Near Vijay Nagar Square, Indore",
        "status": "resolved",
        "severity": "high",
        "lang": "hi",
        "department": "water",
        "officer": "R.K. Gupta (Executive Engineer Narmada Project)",
        "days_ago": 10,
        "resolved_days_ago": 4,
        "res_summary": "Replaced faulty non-return pressure valve and sealed leakage gasket."
    },
    {
        "city": "indore",
        "category": "garbage_dump",
        "title": "Secondary commercial waste accumulation",
        "desc_en": "Dumped packaging materials and carton waste behind food market.",
        "desc_hi": "फूड स्ट्रीट के पीछे दुकानों का सूखा कचरा और गत्ते जमा हैं।",
        "lat": 22.7535, "lng": 75.8960,
        "address": "Vijay Nagar Commercial Sector, Indore",
        "status": "submitted",
        "severity": "low",
        "lang": "en",
        "department": "sanitation",
        "days_ago": 1
    },

    # --- BHOPAL: MP Nagar & TT Nagar Cluster ---
    {
        "city": "bhopal",
        "category": "sewerage_overflow",
        "title": "Open drain overflow near MP Nagar Zone 1",
        "desc_en": "Choked storm water channel causing foul water overflow on pedestrian pavement.",
        "desc_hi": "एमपी नगर जोन 1 में नाला जाम होने से गंदा पानी फुटपाथ पर आ रहा है।",
        "lat": 23.2325, "lng": 77.4320,
        "address": "Zone 1, MP Nagar, Bhopal",
        "status": "in_progress",
        "severity": "high",
        "lang": "hi",
        "department": "sanitation",
        "officer": "Dinesh Chaurasia (BMC Drainage Cell)",
        "days_ago": 4
    },
    {
        "city": "bhopal",
        "category": "road_pothole",
        "title": "Severe road damage outside coaching hub MP Nagar",
        "desc_en": "Deep continuous craters near Chetak Bridge approach road causing severe student traffic jams.",
        "desc_hi": "चेतक ब्रिज के पास कोचिंग एरिया में सड़क पूरी तरह टूट चुकी है।",
        "lat": 23.2340, "lng": 77.4350,
        "address": "Near Chetak Bridge, MP Nagar Zone 2, Bhopal",
        "status": "assigned",
        "severity": "high",
        "lang": "hi",
        "department": "pwd",
        "officer": "Sunil Bansal (PWD Capital Project)",
        "days_ago": 3
    },
    {
        "city": "bhopal",
        "category": "street_light",
        "title": "High mast light failure at Roshanpura Square",
        "desc_en": "Central high-mast lighting tower non-functional at major junction, hazardous traffic.",
        "desc_hi": "रोशनपुरा चौराहे की मुख्य हाई मास्ट लाइट पिछले तीन दिन से बंद है।",
        "lat": 23.2380, "lng": 77.4010,
        "address": "Roshanpura Square, New Market, Bhopal",
        "status": "resolved",
        "severity": "high",
        "lang": "en",
        "department": "uadd",
        "officer": "V.K. Saxena (BMC Electrical)",
        "days_ago": 7,
        "resolved_days_ago": 1,
        "res_summary": "Replaced fused 400W LED flood fixture and repaired control switchboard."
    },
    {
        "city": "bhopal",
        "category": "encroachment",
        "title": "Illegal tin sheds on public pedestrian corridor",
        "desc_en": "Encroachment by roadside welding workshops blocking disabled ramps and walkway.",
        "desc_hi": "फुटपाथ पर अवैध शेड डालकर रास्ता रोक लिया गया है, पैदल चलना मुश्किल है।",
        "lat": 23.2420, "lng": 77.4080,
        "address": "TT Nagar Main Road, Bhopal",
        "status": "submitted",
        "severity": "medium",
        "lang": "hi",
        "department": "uadd",
        "days_ago": 2
    },

    # --- JABALPUR: Civic Center & Wright Town ---
    {
        "city": "jabalpur",
        "category": "water_leakage",
        "title": "Pipeline fracture near Civic Center Park",
        "desc_en": "Continuous water loss from fractured junction pipe near community park gate.",
        "desc_hi": "सिविक सेंटर पार्क गेट के पास पाइपलाइन फूटने से पानी व्यर्थ बह रहा है।",
        "lat": 23.1680, "lng": 79.9320,
        "address": "Civic Center, Marhatal, Jabalpur",
        "status": "in_progress",
        "severity": "high",
        "lang": "hi",
        "department": "water",
        "officer": "Alok Tiwari (JMC Water)",
        "days_ago": 3
    },
    {
        "city": "jabalpur",
        "category": "road_pothole",
        "title": "Surface erosion on Wright Town Stadium Road",
        "desc_en": "Large pothole cluster outside stadium entrance, sharp stones protruding.",
        "desc_hi": "स्टेडियम रोड पर गिट्टी उखड़ गई है और गड्ढों से वाहन फिसल रहे हैं।",
        "lat": 23.1630, "lng": 79.9380,
        "address": "Stadium Road, Wright Town, Jabalpur",
        "status": "submitted",
        "severity": "medium",
        "lang": "en",
        "department": "pwd",
        "days_ago": 1
    },

    # --- UJJAIN: Mahakal Corridor & Freeganj ---
    {
        "city": "ujjain",
        "category": "garbage_dump",
        "title": "Pilgrim transit corridor waste accumulation",
        "desc_en": "Plastic bottles and food packaging accumulated along main devotee path.",
        "desc_hi": "श्रद्धालु मार्ग पर कचरा पात्र भरने से गंदगी फैल रही है, अतिरिक्त सफाई की जरूरत है।",
        "lat": 23.1830, "lng": 75.7680,
        "address": "Near Mahakal Temple Corridor Entrance, Ujjain",
        "status": "in_progress",
        "severity": "critical",
        "lang": "hi",
        "department": "sanitation",
        "officer": "Rameshwar Patidar (UMC Sanitation)",
        "days_ago": 2
    },
    {
        "city": "ujjain",
        "category": "street_light",
        "title": "Dim street lighting in Freeganj Market Lane",
        "desc_en": "Multiple sodium lamps flickering and dark in busy shopping lane.",
        "desc_hi": "फ्रीगंज मार्केट की मुख्य गली में कई लाइटें बंद हैं।",
        "lat": 23.1720, "lng": 75.7920,
        "address": "Freeganj Commercial Area, Ujjain",
        "status": "resolved",
        "severity": "medium",
        "lang": "hi",
        "department": "uadd",
        "officer": "Sunil Malviya (UMC Electrical)",
        "days_ago": 6,
        "resolved_days_ago": 2,
        "res_summary": "Replaced 6 traditional sodium bulbs with new 70W LED fixtures."
    }
]


def seed_demo_data():
    with engine.connect() as conn:
        print("=" * 65)
        print("NAGARDRISHTI — SEEDING REALISTIC DEMONSTRATION CITIZEN GRIEVANCES")
        print(f"Batch Identifier: {DEMO_BATCH_ID}")
        print("=" * 65)

        # 1. Ensure is_demo column exists
        conn.execute(text("ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_citizen_reports_is_demo ON citizen_reports(is_demo);"))

        # 2. Idempotently remove existing demo data from this batch
        print("Cleaning previous demo seed records for idempotency...")
        conn.execute(text("DELETE FROM report_status_history WHERE report_id IN (SELECT id FROM citizen_reports WHERE is_demo = TRUE);"))
        conn.execute(text("DELETE FROM citizen_reports WHERE is_demo = TRUE;"))
        conn.commit()

        # 3. Insert realistic demonstration records
        now = datetime.utcnow()
        inserted_count = 0

        for idx, rep in enumerate(DEMO_REPORTS):
            report_id = uuid.uuid4()
            city_id = CITY_IDS.get(rep["city"])
            dept_id = DEPARTMENT_IDS.get(rep.get("department"))
            
            created_at = now - timedelta(days=rep.get("days_ago", 2), hours=random.randint(1, 8))
            resolved_at = None
            if rep["status"] == "resolved":
                resolved_at = now - timedelta(days=rep.get("resolved_days_ago", 1))

            report_number = f"ND-DEMO-{rep['city'][:3].upper()}-{2026}-{1001 + idx}"

            ai_metadata = {
                "seed_batch_id": DEMO_BATCH_ID,
                "is_ai_prediction": True,
                "predicted_category": rep["category"],
                "confidence": round(random.uniform(0.88, 0.96), 2),
                "urgency": rep["severity"],
                "sentiment": "urgent" if rep["severity"] in ["high", "critical"] else "negative",
                "assigned_department_name": rep.get("department", "PWD").upper(),
                "summary_en": rep["desc_en"],
                "summary_hi": rep["desc_hi"],
                "triage_summary": f"AI Triage ({rep['category'].replace('_', ' ').title()}) - Urgency: {rep['severity'].upper()}"
            }

            point_geom = f"SRID=4326;POINT({rep['lng']} {rep['lat']})"

            insert_query = text("""
                INSERT INTO citizen_reports (
                    id, report_number, city_id, category, title, description,
                    normalized_text, input_language, location_geometry, location_address,
                    severity_input, status, is_anonymous, is_public, corroboration_count,
                    ai_metadata, department_id, assigned_officer_name, resolution_summary,
                    resolved_at, is_demo, provenance_type, created_at, updated_at
                ) VALUES (
                    :id, :report_number, :city_id, :category, :title, :description,
                    :normalized_text, :input_language, ST_GeomFromText(:geom, 4326), :location_address,
                    :severity_input, CAST(:status AS report_status), FALSE, TRUE, :corroboration_count,
                    CAST(:ai_metadata AS jsonb), :department_id, :assigned_officer_name, :resolution_summary,
                    :resolved_at, TRUE, 'citizen_submitted', :created_at, :updated_at
                );
            """)

            conn.execute(insert_query, {
                "id": report_id,
                "report_number": report_number,
                "city_id": city_id,
                "category": rep["category"],
                "title": rep["title"],
                "description": rep["desc_hi"] if rep["lang"] == "hi" else rep["desc_en"],
                "normalized_text": rep["desc_en"],
                "input_language": rep["lang"],
                "geom": f"POINT({rep['lng']} {rep['lat']})",
                "location_address": rep["address"],
                "severity_input": rep["severity"],
                "status": rep["status"],
                "corroboration_count": random.randint(1, 14),
                "ai_metadata": str(ai_metadata).replace("'", '"').replace("True", "true").replace("False", "false"),
                "department_id": dept_id,
                "assigned_officer_name": rep.get("officer"),
                "resolution_summary": rep.get("res_summary"),
                "resolved_at": resolved_at,
                "created_at": created_at,
                "updated_at": resolved_at or created_at
            })

            # Append initial status history
            conn.execute(text("""
                INSERT INTO report_status_history (
                    id, report_id, previous_status, new_status, actor_role, reason, notes, created_at
                ) VALUES (
                    :hid, :report_id, NULL, CAST('submitted' AS report_status), CAST('citizen' AS user_role), 'Citizen complaint registered', 'Initial citizen submission', :created_at
                );
            """), {
                "hid": uuid.uuid4(),
                "report_id": report_id,
                "created_at": created_at
            })

            # If assigned / in_progress / resolved, add transitions
            if rep["status"] in ["assigned", "in_progress", "resolved"]:
                conn.execute(text("""
                    INSERT INTO report_status_history (
                        id, report_id, previous_status, new_status, actor_role, reason, notes, created_at
                    ) VALUES (
                        :hid, :report_id, CAST('submitted' AS report_status), CAST('assigned' AS report_status), CAST('department_head' AS user_role), 'Assigned to field officer', :notes, :created_at
                    );
                """), {
                    "hid": uuid.uuid4(),
                    "report_id": report_id,
                    "notes": f"Assigned to {rep.get('officer', 'Department Team')}",
                    "created_at": created_at + timedelta(hours=6)
                })

            if rep["status"] in ["in_progress", "resolved"]:
                conn.execute(text("""
                    INSERT INTO report_status_history (
                        id, report_id, previous_status, new_status, actor_role, reason, notes, created_at
                    ) VALUES (
                        :hid, :report_id, CAST('assigned' AS report_status), CAST('in_progress' AS report_status), CAST('field_officer' AS user_role), 'Inspection and repair underway', :notes, :created_at
                    );
                """), {
                    "hid": uuid.uuid4(),
                    "report_id": report_id,
                    "notes": f"Field inspection completed by {rep.get('officer', 'Officer')}",
                    "created_at": created_at + timedelta(days=1)
                })

            if rep["status"] == "resolved":
                conn.execute(text("""
                    INSERT INTO report_status_history (
                        id, report_id, previous_status, new_status, actor_role, reason, notes, created_at
                    ) VALUES (
                        :hid, :report_id, CAST('in_progress' AS report_status), CAST('resolved' AS report_status), CAST('field_officer' AS user_role), 'Issue remediated and verified', :notes, :created_at
                    );
                """), {
                    "hid": uuid.uuid4(),
                    "report_id": report_id,
                    "notes": rep.get("res_summary", "Resolved successfully"),
                    "created_at": resolved_at
                })

            inserted_count += 1

        conn.commit()
        print(f"✓ Successfully seeded {inserted_count} realistic demonstration reports across 5 cities.")
        print("✓ All records safely flagged with is_demo = TRUE and demo batch metadata.")
        print("✓ Realistic status histories and departmental assignments generated.")


if __name__ == "__main__":
    seed_demo_data()
