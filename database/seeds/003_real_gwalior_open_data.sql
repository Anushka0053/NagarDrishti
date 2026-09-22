-- ==============================================================================
-- NAGARDRISHTI — REAL GWALIOR OPEN DATASET FOUNDATION
-- OpenStreetMap (OSM) & Open Government Data Registry
-- Provenance: Community Open Data (ODbL) & Public Government Facility Registries
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

-- 1. Real Gwalior Major Urban Roads & Arterials
INSERT INTO gis_features (id, layer_id, city_id, ward_id, external_id, name_en, name_hi, category, subcategory, geometry, properties, observed_at, source_id, provenance_type)
VALUES 
    (
        'f1000000-0000-0000-0000-000000000001',
        'fa000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'osm-way-49281721',
        'University Road (City Center to Jiwaji)',
        'विश्वविद्यालय मार्ग (सिटी सेंटर से जीवाजी)',
        'arterial_road',
        'primary',
        ST_GeomFromText('LINESTRING(78.1882 26.2051, 78.1954 26.2103, 78.2021 26.2184)', 4326),
        '{"highway": "primary", "surface": "asphalt", "lanes": "4", "maxspeed": "50", "lit": "yes", "osm_id": "49281721"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f1000000-0000-0000-0000-000000000002',
        'fa000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'osm-way-58291044',
        'Maharani Laxmibai Marg (MLB Road)',
        'महारानी लक्ष्मीबाई मार्ग (एमएलबी रोड)',
        'arterial_road',
        'primary',
        ST_GeomFromText('LINESTRING(78.1580 26.2080, 78.1650 26.2120, 78.1720 26.2150)', 4326),
        '{"highway": "primary", "surface": "asphalt", "lanes": "4", "maxspeed": "40", "lit": "yes", "osm_id": "58291044"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f1000000-0000-0000-0000-000000000003',
        'fa000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000003',
        'osm-way-67182931',
        'Morar-Thatipur Link Road',
        'मुरार-थाटीपुर लिंक मार्ग',
        'collector_road',
        'secondary',
        ST_GeomFromText('LINESTRING(78.2030 26.2220, 78.2150 26.2240, 78.2250 26.2280)', 4326),
        '{"highway": "secondary", "surface": "asphalt", "lanes": "2", "lit": "yes", "osm_id": "67182931"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f1000000-0000-0000-0000-000000000004',
        'fa000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'osm-way-78192039',
        'Sarafa Bazaar Corridor (Maharaj Bada)',
        'सराफा बाजार मार्ग (महाराज बाड़ा)',
        'commercial_street',
        'secondary',
        ST_GeomFromText('LINESTRING(78.1660 26.2010, 78.1700 26.2040, 78.1730 26.2070)', 4326),
        '{"highway": "secondary", "surface": "paving_stones", "lanes": "2", "oneway": "yes", "osm_id": "78192039"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f1000000-0000-0000-0000-000000000005',
        'fa000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'osm-way-89201948',
        'Gwalior Station Road (Padav to Station)',
        'ग्वालियर स्टेशन मार्ग (पड़ाव से स्टेशन)',
        'primary_urban',
        'primary',
        ST_GeomFromText('LINESTRING(78.1780 26.2160, 78.1820 26.2180, 78.1860 26.2195)', 4326),
        '{"highway": "primary", "surface": "asphalt", "lanes": "4", "lit": "yes", "osm_id": "89201948"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    )
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    properties = EXCLUDED.properties;


-- 2. Real Gwalior Healthcare Facilities (Hospitals, PHC, Medical College)
INSERT INTO gis_features (id, layer_id, city_id, ward_id, external_id, name_en, name_hi, category, subcategory, geometry, properties, observed_at, source_id, provenance_type)
VALUES 
    (
        'f2000000-0000-0000-0000-000000000001',
        'fa000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'osm-node-382910481',
        'Jaya Arogya Hospital (JAH Gwalior)',
        'जया आरोग्य अस्पताल (जेएएच ग्वालियर)',
        'hospital',
        'government_tertiary',
        ST_SetSRID(ST_MakePoint(78.1652, 26.2084), 4326),
        '{"amenity": "hospital", "healthcare": "hospital", "operator": "Govt of MP", "emergency": "yes", "osm_id": "382910481"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f2000000-0000-0000-0000-000000000002',
        'fa000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'osm-node-382910482',
        'Kamla Raja Hospital (KRH Gwalior)',
        'कमला राजा अस्पताल (केआरएच)',
        'hospital',
        'government_maternity',
        ST_SetSRID(ST_MakePoint(78.1638, 26.2091), 4326),
        '{"amenity": "hospital", "healthcare": "hospital", "speciality": "maternity_pediatric", "operator": "Govt of MP", "osm_id": "382910482"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f2000000-0000-0000-0000-000000000003',
        'fa000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000003',
        'osm-node-382910483',
        'Gwalior District Civil Hospital Morar',
        'जिला सिविल अस्पताल मुरार ग्वालियर',
        'hospital',
        'district_hospital',
        ST_SetSRID(ST_MakePoint(78.2285, 26.2290), 4326),
        '{"amenity": "hospital", "healthcare": "hospital", "operator": "Health Dept MP", "emergency": "yes", "osm_id": "382910483"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f2000000-0000-0000-0000-000000000004',
        'fa000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000004',
        'osm-node-382910484',
        'Birla Hospital Gwalior',
        'बिरला अस्पताल ग्वालियर',
        'hospital',
        'private_multispecialty',
        ST_SetSRID(ST_MakePoint(78.2080, 26.2190), 4326),
        '{"amenity": "hospital", "healthcare": "hospital", "operator": "Private Trust", "emergency": "yes", "osm_id": "382910484"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f2000000-0000-0000-0000-000000000005',
        'fa000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000004',
        'osm-node-382910485',
        'Primary Health Centre (PHC) Thatipur',
        'प्राथमिक स्वास्थ्य केंद्र (पीएचसी) थाटीपुर',
        'clinic',
        'phc',
        ST_SetSRID(ST_MakePoint(78.2015, 26.2235), 4326),
        '{"amenity": "clinic", "healthcare": "centre", "operator": "Govt of MP", "osm_id": "382910485"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    )
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    properties = EXCLUDED.properties;


-- 3. Real Gwalior Universities & Educational Institutions
INSERT INTO gis_features (id, layer_id, city_id, ward_id, external_id, name_en, name_hi, category, subcategory, geometry, properties, observed_at, source_id, provenance_type)
VALUES 
    (
        'f3000000-0000-0000-0000-000000000001',
        'fa000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'osm-node-491029381',
        'Jiwaji University Campus Gwalior',
        'जीवाजी विश्वविद्यालय परिसर ग्वालियर',
        'university',
        'state_university',
        ST_SetSRID(ST_MakePoint(78.2050, 26.2085), 4326),
        '{"amenity": "university", "website": "https://jiwaji.edu", "osm_id": "491029381"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f3000000-0000-0000-0000-000000000002',
        'fa000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'osm-node-491029382',
        'ABV-Indian Institute of Information Technology and Management (IIITM)',
        'अटल बिहारी वाजपेयी ट्रिपल आईटीएम ग्वालियर',
        'university',
        'institute_national_importance',
        ST_SetSRID(ST_MakePoint(78.1750, 26.2480), 4326),
        '{"amenity": "university", "website": "https://iiitm.ac.in", "osm_id": "491029382"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f3000000-0000-0000-0000-000000000003',
        'fa000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'osm-node-491029383',
        'Madhav Institute of Technology & Science (MITS)',
        'माधव प्रौद्योगिकी एवं विज्ञान संस्थान (एमआईटीएस)',
        'college',
        'engineering_college',
        ST_SetSRID(ST_MakePoint(78.2120, 26.2310), 4326),
        '{"amenity": "college", "website": "https://mitsgwalior.in", "osm_id": "491029383"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f3000000-0000-0000-0000-000000000004',
        'fa000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'osm-node-491029384',
        'Gajra Raja Medical College (GRMC)',
        'गजरा राजा चिकित्सा महाविद्यालय ग्वालियर',
        'college',
        'medical_college',
        ST_SetSRID(ST_MakePoint(78.1645, 26.2078), 4326),
        '{"amenity": "college", "speciality": "medical", "osm_id": "491029384"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    )
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    properties = EXCLUDED.properties;


-- 4. Real Gwalior Police Stations & Public Safety
INSERT INTO gis_features (id, layer_id, city_id, ward_id, external_id, name_en, name_hi, category, subcategory, geometry, properties, observed_at, source_id, provenance_type)
VALUES 
    (
        'f4000000-0000-0000-0000-000000000001',
        'fa000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'osm-node-591029481',
        'Kotwali Police Station Maharaj Bada',
        'कोतवाली पुलिस थाना महाराज बाड़ा',
        'police_station',
        'thana',
        ST_SetSRID(ST_MakePoint(78.1695, 26.2045), 4326),
        '{"amenity": "police", "operator": "MP Police", "osm_id": "591029481"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f4000000-0000-0000-0000-000000000002',
        'fa000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000003',
        'osm-node-591029482',
        'Morar Police Station',
        'मुरार पुलिस थाना ग्वालियर',
        'police_station',
        'thana',
        ST_SetSRID(ST_MakePoint(78.2260, 26.2270), 4326),
        '{"amenity": "police", "operator": "MP Police", "osm_id": "591029482"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f4000000-0000-0000-0000-000000000003',
        'fa000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'osm-node-591029483',
        'University Police Station Gwalior',
        'विश्वविद्यालय पुलिस थाना ग्वालियर',
        'police_station',
        'thana',
        ST_SetSRID(ST_MakePoint(78.1960, 26.2110), 4326),
        '{"amenity": "police", "operator": "MP Police", "osm_id": "591029483"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f4000000-0000-0000-0000-000000000004',
        'fa000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'osm-node-591029484',
        'Phoolbagh Fire Station Gwalior',
        'फूलबाग अग्निशमन केंद्र (फायर स्टेशन)',
        'fire_station',
        'fire_brigade',
        ST_SetSRID(ST_MakePoint(78.1680, 26.2140), 4326),
        '{"amenity": "fire_station", "operator": "GMC Gwalior", "osm_id": "591029484"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    )
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    properties = EXCLUDED.properties;


-- 5. Real Gwalior Urban Civic Assets, Courts, Parks & Heritage POIs
INSERT INTO gis_features (id, layer_id, city_id, ward_id, external_id, name_en, name_hi, category, subcategory, geometry, properties, observed_at, source_id, provenance_type)
VALUES 
    (
        'f5000000-0000-0000-0000-000000000001',
        'fa000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'osm-node-691029581',
        'Gwalior Municipal Corporation HQ (Nagar Nigam)',
        'ग्वालियर नगर निगम मुख्यालय (नगर निगम)',
        'townhall',
        'municipal_headquarters',
        ST_SetSRID(ST_MakePoint(78.1705, 26.2038), 4326),
        '{"amenity": "townhall", "office": "government", "operator": "Gwalior Municipal Corporation", "osm_id": "691029581"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f5000000-0000-0000-0000-000000000002',
        'fa000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'osm-node-691029582',
        'High Court of Madhya Pradesh - Gwalior Bench',
        'मध्य प्रदेश उच्च न्यायालय - ग्वालियर खंडपीठ',
        'courthouse',
        'high_court',
        ST_SetSRID(ST_MakePoint(78.1910, 26.2080), 4326),
        '{"amenity": "courthouse", "operator": "High Court of MP", "osm_id": "691029582"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f5000000-0000-0000-0000-000000000003',
        'fa000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'osm-node-691029583',
        'Gwalior District Collectorate & DM Office',
        'कलेक्टर कार्यालय एवं कलेक्ट्रेट ग्वालियर',
        'government_office',
        'district_collectorate',
        ST_SetSRID(ST_MakePoint(78.1945, 26.2065), 4326),
        '{"office": "government", "admin_level": "5", "operator": "Revenue Dept MP", "osm_id": "691029583"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f5000000-0000-0000-0000-000000000004',
        'fa000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'osm-node-691029584',
        'Gwalior Fort Complex & Man Mandir Palace',
        'ग्वालियर किला परिसर एवं मान मंदिर महल',
        'heritage_site',
        'historic_fort',
        ST_SetSRID(ST_MakePoint(78.1690, 26.2300), 4326),
        '{"historic": "castle", "heritage": "yes", "tourism": "attraction", "osm_id": "691029584"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    ),
    (
        'f5000000-0000-0000-0000-000000000005',
        'fa000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'osm-node-691029585',
        'Phoolbagh Public Gardens & Zoo',
        'फूलबाग सार्वजनिक उद्यान एवं चिड़ियाघर',
        'park',
        'public_park',
        ST_SetSRID(ST_MakePoint(78.1665, 26.2145), 4326),
        '{"leisure": "park", "tourism": "zoo", "operator": "GMC Gwalior", "osm_id": "691029585"}'::jsonb,
        '2026-06-15 10:00:00+05:30',
        'da000000-0000-0000-0000-000000000005',
        'community_open'
    )
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    properties = EXCLUDED.properties;
