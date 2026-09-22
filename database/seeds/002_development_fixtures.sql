-- ==============================================================================
-- NAGARDRISHTI — DEVELOPMENT TEST FIXTURES (DEVELOPMENT ENVIRONMENT ONLY)
-- Scope: Gwalior Reference City Test Samples
-- DISCLAIMER: THIS FILE CONTAINS CLEARLY TAGGED TEST FIXTURES FOR LOCAL TESTING.
-- ALL RECORDS ARE EXPLICITLY MARKED AS 'development_fixture'.
-- DO NOT RUN THIS IN PRODUCTION DEPLOYMENTS.
-- ==============================================================================

-- 0. Ensure Enums and Columns Exist
DO $$ BEGIN
    CREATE TYPE data_provenance_type AS ENUM (
        'official_verified',
        'community_open',
        'citizen_submitted',
        'internal_derived',
        'development_fixture'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE gis_features 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'official_verified' NOT NULL;

ALTER TABLE citizen_reports 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'citizen_submitted' NOT NULL;

ALTER TABLE issue_clusters 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'internal_derived' NOT NULL;

-- 1. Sample Gwalior Wards (Clearly labeled test geometry)
INSERT INTO wards (id, city_id, ward_number, ward_code, name_en, name_hi, zone_number, zone_name_en, zone_name_hi, corporator_name, area_sq_km, population, geometry, centroid)
VALUES 
    (
        'b0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        1,
        'GWL-W01',
        'Lashkar West / Phoolbagh',
        'लश्कर पश्चिम / फूलबाग',
        1,
        'Zone 1 - Lashkar Central',
        'ज़ोन 1 - लश्कर मध्य',
        'Dev Test Corporator 1',
        4.2,
        28500,
        ST_Multi(ST_GeomFromText('POLYGON((78.150 26.200, 78.170 26.200, 78.170 26.220, 78.150 26.220, 78.150 26.200))', 4326)),
        ST_SetSRID(ST_MakePoint(78.160, 26.210), 4326)
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        15,
        'GWL-W15',
        'Maharaj Bada & Sarafa',
        'महाराज बाड़ा एवं सराफा',
        2,
        'Zone 2 - Lashkar South',
        'ज़ोन 2 - लश्कर दक्षिण',
        'Dev Test Corporator 15',
        3.1,
        34200,
        ST_Multi(ST_GeomFromText('POLYGON((78.160 26.190, 78.180 26.190, 78.180 26.210, 78.160 26.210, 78.160 26.190))', 4326)),
        ST_SetSRID(ST_MakePoint(78.170, 26.200), 4326)
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        24,
        'GWL-W24',
        'Morar East & Cantt Link',
        'मुरार पूर्व एवं कैंट लिंक',
        3,
        'Zone 3 - Morar',
        'ज़ोन 3 - मुरार',
        'Dev Test Corporator 24',
        5.8,
        31000,
        ST_Multi(ST_GeomFromText('POLYGON((78.210 26.210, 78.240 26.210, 78.240 26.240, 78.210 26.240, 78.210 26.210))', 4326)),
        ST_SetSRID(ST_MakePoint(78.225, 26.225), 4326)
    ),
    (
        'b0000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        38,
        'GWL-W38',
        'Thatipur & Suresh Nagar',
        'थाटीपुर एवं सुरेश नगर',
        4,
        'Zone 4 - Thatipur',
        'ज़ोन 4 - थाटीपुर',
        'Dev Test Corporator 38',
        3.9,
        29800,
        ST_Multi(ST_GeomFromText('POLYGON((78.190 26.210, 78.215 26.210, 78.215 26.235, 78.190 26.235, 78.190 26.210))', 4326)),
        ST_SetSRID(ST_MakePoint(78.2025, 26.2225), 4326)
    ),
    (
        'b0000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000001',
        52,
        'GWL-W52',
        'City Center & University',
        'सिटी सेंटर एवं विश्वविद्यालय',
        5,
        'Zone 5 - City Center',
        'ज़ोन 5 - सिटी सेंटर',
        'Dev Test Corporator 52',
        4.6,
        27400,
        ST_Multi(ST_GeomFromText('POLYGON((78.180 26.195, 78.210 26.195, 78.210 26.220, 78.180 26.220, 78.180 26.195))', 4326)),
        ST_SetSRID(ST_MakePoint(78.195, 26.2075), 4326)
    )
ON CONFLICT (id) DO NOTHING;


-- 2. Single Sample Citizen Report (Tagged as development_fixture)
INSERT INTO citizen_reports (id, report_number, city_id, ward_id, category, subcategory, title, description, normalized_text, input_language, location_geometry, location_address, severity_input, status, is_anonymous, is_public, corroboration_count, provenance_type)
VALUES 
    (
        'ea000000-0000-0000-0000-000000000001',
        'DEV-TEST-GWL-001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000004',
        'road_pothole',
        'severe_pothole',
        '[TEST FIXTURE] Road Pothole Test Record',
        '[DEVELOPMENT TEST FIXTURE] Test report for feedback submission verification.',
        'सड़क गड्ढा परीक्षण रिकॉर्ड',
        'hi',
        ST_SetSRID(ST_MakePoint(78.2038, 26.2220), 4326),
        'Near Thatipur Test Chowk, Gwalior',
        'high',
        'verified',
        FALSE,
        TRUE,
        1,
        'development_fixture'
    )
ON CONFLICT (id) DO NOTHING;
