-- ==============================================================================
-- [DEPRECATED / SUPERSEDED IN PHASE 2.5]
-- NAGARDRISHTI — DEVELOPMENT SEED DATA (PHASE 1 LEGACY)
-- NOTE: Please use the updated Phase 2.5 modular scripts:
--   1. database/seeds/001_master_reference.sql (Master Catalog & Layers)
--   2. database/seeds/003_real_gwalior_open_data.sql (Real Gwalior OpenStreetMap Data)
--   3. database/seeds/002_development_fixtures.sql (Dev Test Fixtures)
-- ==============================================================================

-- 1. Administrative Units: State of Madhya Pradesh & Districts
INSERT INTO admin_units (id, parent_id, unit_type, name_en, name_hi, slug, lgd_code, census_code, state_code, centroid, is_active)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', NULL, 'state', 'Madhya Pradesh', 'मध्य प्रदेश', 'madhya-pradesh', '23', '23', 'MP', ST_SetSRID(ST_MakePoint(77.4126, 23.2599), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'district', 'Gwalior', 'ग्वालियर', 'district-gwalior', '389', '421', 'MP', ST_SetSRID(ST_MakePoint(78.1828, 26.2183), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'district', 'Indore', 'इंदौर', 'district-indore', '405', '437', 'MP', ST_SetSRID(ST_MakePoint(75.8577, 22.7196), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'district', 'Bhopal', 'भोपाल', 'district-bhopal', '391', '423', 'MP', ST_SetSRID(ST_MakePoint(77.4126, 23.2599), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'district', 'Jabalpur', 'जबलपुर', 'district-jabalpur', '409', '441', 'MP', ST_SetSRID(ST_MakePoint(79.9864, 23.1815), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'district', 'Ujjain', 'उज्जैन', 'district-ujjain', '404', '436', 'MP', ST_SetSRID(ST_MakePoint(75.7873, 23.1765), 4326), TRUE)
ON CONFLICT (id) DO NOTHING;


-- 2. Cities (Urban Local Bodies)
INSERT INTO cities (id, admin_unit_id, district_id, name_en, name_hi, slug, ulb_type, lgd_code, center_latitude, center_longitude, default_zoom, is_reference_city, is_enabled, area_sq_km, population_census)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Gwalior', 'ग्वालियर', 'gwalior', 'nagar_nigam', '251147', 26.2183, 78.1828, 12, TRUE, TRUE, 289.0, 1069276),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Indore', 'इंदौर', 'indore', 'nagar_nigam', '251148', 22.7196, 75.8577, 12, FALSE, TRUE, 530.0, 1994397),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Bhopal', 'भोपाल', 'bhopal', 'nagar_nigam', '251149', 23.2599, 77.4126, 12, FALSE, TRUE, 463.0, 1798218),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Jabalpur', 'जबलपुर', 'jabalpur', 'nagar_nigam', '251150', 23.1815, 79.9864, 12, FALSE, TRUE, 367.0, 1268807),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'Ujjain', 'उज्जैन', 'ujjain', 'nagar_nigam', '251151', 23.1765, 75.7873, 12, FALSE, TRUE, 151.0, 515215)
ON CONFLICT (id) DO NOTHING;


-- 3. Sample Wards of Gwalior
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
        'Rameshwar Sharma (Dev Test)',
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
        'Sunita Verma (Dev Test)',
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
        'Anil Singh Tomar (Dev Test)',
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
        'Pooja Kushwah (Dev Test)',
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
        'Rajesh Prajapati (Dev Test)',
        4.6,
        27400,
        ST_Multi(ST_GeomFromText('POLYGON((78.180 26.195, 78.210 26.195, 78.210 26.220, 78.180 26.220, 78.180 26.195))', 4326)),
        ST_SetSRID(ST_MakePoint(78.195, 26.2075), 4326)
    )
ON CONFLICT (id) DO NOTHING;


-- 4. Sectors
INSERT INTO sectors (id, code, name_en, name_hi, icon, display_order, color_hex)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'transport', 'Transport & Roads', 'परिवहन एवं सड़कें', 'navigation', 1, '#F59E0B'),
    ('e0000000-0000-0000-0000-000000000002', 'water_sanitation', 'Water & Sanitation', 'जल एवं स्वच्छता', 'droplet', 2, '#06B6D4'),
    ('e0000000-0000-0000-0000-000000000003', 'health', 'Healthcare & Facilities', 'स्वास्थ्य एवं अस्पताल', 'activity', 3, '#EF4444'),
    ('e0000000-0000-0000-0000-000000000004', 'public_safety', 'Public Safety & Emergency', 'सार्वजनिक सुरक्षा एवं आपातकाल', 'shield', 4, '#8B5CF6'),
    ('e0000000-0000-0000-0000-000000000005', 'education', 'Education & Schools', 'शिक्षा एवं संस्थान', 'book-open', 5, '#10B981'),
    ('e0000000-0000-0000-0000-000000000006', 'urban_assets', 'Urban & Public Assets', 'शहरी एवं नागरिक संपत्तियां', 'building-2', 6, '#6366F1'),
    ('e0000000-0000-0000-0000-000000000007', 'environment', 'Environment & Terrain', 'पर्यावरण एवं भूमि उपयोग', 'trees', 7, '#059669'),
    ('e0000000-0000-0000-0000-000000000008', 'citizen_intel', 'Citizen Intelligence', 'नागरिक फीडबैक एवं रिपोर्ट', 'message-square', 8, '#EC4899')
ON CONFLICT (id) DO NOTHING;


-- 5. Departments
INSERT INTO departments (id, code, name_en, name_hi, short_name_en, short_name_hi, contact_email, portal_url)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'gmc_water', 'GMC Water Works Department', 'ग्वालियर नगर निगम जल कार्य विभाग', 'GMC Water', 'ग्वालियर जल', 'water@gwaliorcorp.org', 'https://gwaliormunicipalcorporation.org/'),
    ('d0000000-0000-0000-0000-000000000002', 'gmc_sanitation', 'GMC Public Health & Sanitation', 'ग्वालियर नगर निगम स्वास्थ्य एवं स्वच्छता', 'GMC Sanitation', 'ग्वालियर स्वच्छता', 'sanitation@gwaliorcorp.org', 'https://gwaliormunicipalcorporation.org/'),
    ('d0000000-0000-0000-0000-000000000003', 'mp_pwd', 'Public Works Department, MP', 'लोक निर्माण विभाग, मध्य प्रदेश', 'MP PWD', 'म.प्र. लोनिवि', 'ce_gwalior@mppwd.gov.in', 'https://mppwd.gov.in/'),
    ('d0000000-0000-0000-0000-000000000004', 'mp_health', 'Health and Family Welfare Dept, MP', 'लोक स्वास्थ्य एवं परिवार कल्याण विभाग, म.प्र.', 'MP Health', 'स्वास्थ्य विभाग', 'health@mp.gov.in', 'http://www.health.mp.gov.in/'),
    ('d0000000-0000-0000-0000-000000000005', 'mp_police', 'Madhya Pradesh Police - Gwalior Zone', 'मध्य प्रदेश पुलिस - ग्वालियर ज़ोन', 'MP Police', 'म.प्र. पुलिस', 'sp_gwalior@mppolice.gov.in', 'https://mppolice.gov.in/'),
    ('d0000000-0000-0000-0000-000000000006', 'uadd_garud', 'Directorate of Urban Administration & Development', 'नगरीय विकास एवं आवास विभाग (गरुड़)', 'UADD GARUD', 'गरुड़ म.प्र.', 'dirurban@mp.gov.in', 'https://www.urbangis.mp.gov.in/')
ON CONFLICT (id) DO NOTHING;


-- 6. Data Sources (Registry based on SRS Section 6)
INSERT INTO data_sources (id, source_key, name_en, name_hi, provider, authority_level, homepage_url, access_type, attribution_text_en, attribution_text_hi, expected_refresh_interval, health_status)
VALUES 
    (
        'da000000-0000-0000-0000-000000000001',
        'garud_mp_uadd',
        'GARUD MP Urban GIS',
        'गरुड़ म.प्र. अर्बन जीआईएस',
        'Directorate of Urban Administration & Development, MP',
        'conditional_official',
        'https://www.urbangis.mp.gov.in/',
        'wms',
        'Data source: Directorate of Urban Administration & Development, Govt of MP (GARUD GIS)',
        'स्रोत: नगरीय प्रशासन एवं विकास संचालनालय, म.प्र. शासन (गरुड़)',
        'monthly',
        'healthy'
    ),
    (
        'da000000-0000-0000-0000-000000000002',
        'mp_eservice_api',
        'MP eService Open API',
        'म.प्र. ई-सर्विस ओपन एपीआई',
        'MP State Electronic Development Corporation (MPSEDC)',
        'verified_state_government',
        'https://www.services.mp.gov.in/eservice/openAPI',
        'open_api',
        'Data source: MP eServices Open Directory API, Govt of Madhya Pradesh',
        'स्रोत: म.प्र. ई-सर्विस ओपन डायरेक्टरी एपीआई, मध्य प्रदेश शासन',
        'dataset_edition',
        'healthy'
    ),
    (
        'da000000-0000-0000-0000-000000000003',
        'isro_bhuvan_wms',
        'ISRO Bhuvan Thematic Geospatial Services',
        'इसरो भुवन थीमेटिक भूसूचना सेवाएं',
        'National Remote Sensing Centre (NRSC), ISRO',
        'verified_central_government',
        'https://bhuvan-app1.nrsc.gov.in/',
        'wms',
        'Geospatial services provided by ISRO Bhuvan / NRSC',
        'भू-स्थानिक सेवाएं: इसरो भुवन / एनआरएससी',
        'dataset_edition',
        'healthy'
    ),
    (
        'da000000-0000-0000-0000-000000000004',
        'data_gov_in_gwalior',
        'Open Government Data (OGD) Platform India',
        'ओपन गवर्नमेंट डेटा (ओजीडी) प्लेटफॉर्म इंडिया',
        'National Informatics Centre (NIC)',
        'verified_central_government',
        'https://data.gov.in/',
        'open_api',
        'Open Government Data Platform India (data.gov.in)',
        'ओपन गवर्नमेंट डेटा प्लेटफॉर्म इंडिया (data.gov.in)',
        'monthly',
        'healthy'
    ),
    (
        'da000000-0000-0000-0000-000000000005',
        'osm_community',
        'OpenStreetMap Contributors',
        'ओपनस्ट्रीटमैप योगदानकर्ता',
        'OpenStreetMap Community',
        'community_open',
        'https://www.openstreetmap.org/',
        'open_api',
        '© OpenStreetMap contributors under ODbL license',
        '© ओपनस्ट्रीटमैप योगदानकर्ता (ODbL लाइसेंस)',
        'weekly',
        'healthy'
    ),
    (
        'da000000-0000-0000-0000-000000000006',
        'nagardrishti_internal',
        'NagarDrishti Citizen Feedback Stream',
        'नगरदृष्टि नागरिक फीडबैक स्ट्रीम',
        'NagarDrishti Platform Engine',
        'internal_platform',
        'https://nagardrishti.mp.gov.in',
        'internal_postgis',
        'Verified Citizen Submissions & Corroborated Reports via NagarDrishti',
        'सत्यापित नागरिक फीडबैक एवं नगरदृष्टि रिपोर्ट्स',
        'realtime',
        'healthy'
    )
ON CONFLICT (id) DO NOTHING;


-- 7. GIS Layers Catalog
INSERT INTO gis_layers (id, slug, name_en, name_hi, description_en, description_hi, sector_id, department_id, source_id, geometry_type, source_type, default_visibility, is_queryable, min_zoom, max_zoom, style_config, legend_config)
VALUES 
    (
        'fa000000-0000-0000-0000-000000000001',
        'gwalior_major_roads',
        'Major Urban Roads & Arterials',
        'प्रमुख शहरी एवं मुख्य सड़कें',
        'Primary road network with pavement condition and department ownership in Gwalior',
        'ग्वालियर की मुख्य सड़क प्रणाली, स्थिति एवं विभाग',
        'e0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000003',
        'da000000-0000-0000-0000-000000000001',
        'LINESTRING',
        'internal_postgis',
        TRUE,
        TRUE,
        10,
        22,
        '{"stroke_color": "#F59E0B", "stroke_width": 3, "stroke_opacity": 0.9}'::jsonb,
        '{"items": [{"label_en": "Arterial Road", "label_hi": "मुख्य सड़क", "color": "#F59E0B"}]}'::jsonb
    ),
    (
        'fa000000-0000-0000-0000-000000000002',
        'gwalior_hospitals',
        'Hospitals & Healthcare Centers',
        'अस्पताल एवं स्वास्थ्य केंद्र',
        'Government and major private medical institutions, PHCs and CHCs in Gwalior',
        'ग्वालियर के सरकारी एवं प्रमुख निजी अस्पताल, प्राथमिक स्वास्थ्य केंद्र',
        'e0000000-0000-0000-0000-000000000003',
        'd0000000-0000-0000-0000-000000000004',
        'da000000-0000-0000-0000-000000000002',
        'POINT',
        'internal_postgis',
        TRUE,
        TRUE,
        11,
        22,
        '{"point_radius": 7, "fill_color": "#EF4444", "stroke_color": "#FFFFFF", "stroke_width": 1.5, "icon_image": "hospital"}'::jsonb,
        '{"items": [{"label_en": "Hospital", "label_hi": "अस्पताल", "color": "#EF4444"}]}'::jsonb
    ),
    (
        'fa000000-0000-0000-0000-000000000003',
        'gwalior_water_tanks',
        'Water Overhead Tanks & Supply Hubs',
        'पानी की टंकियां एवं आपूर्ति केंद्र',
        'Municipal water storage tanks, booster pumping stations and distribution nodes',
        'ग्वालियर नगर निगम के जल भंडारण टैंक एवं पंपिंग स्टेशन',
        'e0000000-0000-0000-0000-000000000002',
        'd0000000-0000-0000-0000-000000000001',
        'da000000-0000-0000-0000-000000000001',
        'POINT',
        'internal_postgis',
        FALSE,
        TRUE,
        11,
        22,
        '{"point_radius": 6, "fill_color": "#06B6D4", "stroke_color": "#0891B2", "stroke_width": 1.5}'::jsonb,
        '{"items": [{"label_en": "Overhead Tank", "label_hi": "ओवरहेड टैंक", "color": "#06B6D4"}]}'::jsonb
    ),
    (
        'fa000000-0000-0000-0000-000000000004',
        'gwalior_police_stations',
        'Police Stations & Outposts',
        'थाने एवं पुलिस चौकियां',
        'Police stations, emergency outposts, and women help desks across Gwalior',
        'ग्वालियर पुलिस थाने, सहायता चौकियां एवं सुरक्षा केंद्र',
        'e0000000-0000-0000-0000-000000000004',
        'd0000000-0000-0000-0000-000000000005',
        'da000000-0000-0000-0000-000000000002',
        'POINT',
        'internal_postgis',
        FALSE,
        TRUE,
        10,
        22,
        '{"point_radius": 6, "fill_color": "#8B5CF6", "stroke_color": "#6D28D9", "stroke_width": 1.5}'::jsonb,
        '{"items": [{"label_en": "Police Station", "label_hi": "पुलिस थाना", "color": "#8B5CF6"}]}'::jsonb
    ),
    (
        'fa000000-0000-0000-0000-000000000005',
        'citizen_issue_clusters',
        'Active Civic Issue Clusters',
        'सक्रिय नागरिक समस्या क्लस्टर',
        'Real-time spatially and temporally clustered civic complaints and potholes',
        'रीयल-टाइम स्थानिक नागरिक समस्याएं, जलभराव एवं गड्ढे',
        'e0000000-0000-0000-0000-000000000008',
        'd0000000-0000-0000-0000-000000000002',
        'da000000-0000-0000-0000-000000000006',
        'POINT',
        'internal_postgis',
        TRUE,
        TRUE,
        9,
        22,
        '{"point_radius": 8, "fill_color": "#EC4899", "stroke_color": "#BE185D", "stroke_width": 2}'::jsonb,
        '{"items": [{"label_en": "Issue Cluster", "label_hi": "समस्या क्लस्टर", "color": "#EC4899"}]}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;


-- 8. Sample Civic Geographic Features in Gwalior
INSERT INTO gis_features (id, layer_id, city_id, ward_id, external_id, name_en, name_hi, category, geometry, properties, observed_at)
VALUES 
    (
        'f0000000-0000-0000-0000-000000000001',
        'fa000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000005',
        'GWL-RD-001',
        'University Road (City Center to Jiwaji)',
        'विश्वविद्यालय मार्ग (सिटी सेंटर से जीवाजी)',
        'arterial_road',
        ST_SetSRID(ST_GeomFromText('LINESTRING(78.188 26.205, 78.195 26.210, 78.202 26.218)', 4326), 4326),
        '{"surface": "bituminous", "lanes": 4, "width_meters": 24, "maintenance_dept": "MP PWD", "condition": "good"}'::jsonb,
        '2026-08-15 10:00:00+05:30'
    ),
    (
        'f0000000-0000-0000-0000-000000000002',
        'fa000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'GWL-HOSP-001',
        'Jaya Arogya Hospital (JAH Gwalior)',
        'जया आरोग्य अस्पताल (जेएएच ग्वालियर)',
        'government_hospital',
        ST_SetSRID(ST_MakePoint(78.1652, 26.2084), 4326),
        '{"type": "tertiary_care", "beds": 1200, "emergency_24x7": true, "blood_bank": true, "super_specialty": true}'::jsonb,
        '2026-08-01 09:00:00+05:30'
    ),
    (
        'f0000000-0000-0000-0000-000000000003',
        'fa000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'GWL-PS-001',
        'Kotwali Police Station Maharaj Bada',
        'कोतवाली पुलिस थाना महाराज बाड़ा',
        'police_station',
        ST_SetSRID(ST_MakePoint(78.1695, 26.2045), 4326),
        '{"officer_in_charge": "TI Kotwali", "emergency_phone": "0751-2445222", "dial_100_available": true}'::jsonb,
        '2026-08-01 09:00:00+05:30'
    ),
    (
        'f0000000-0000-0000-0000-000000000004',
        'fa000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000004',
        'GWL-OHT-001',
        'Thatipur Overhead Water Reservoir',
        'थाटीपुर ओवरहेड जल जलाशय',
        'overhead_tank',
        ST_SetSRID(ST_MakePoint(78.2045, 26.2215), 4326),
        '{"capacity_litres": 2500000, "commission_year": 2018, "supply_timings": "06:00-08:00 AM", "scada_monitored": true}'::jsonb,
        '2026-08-01 09:00:00+05:30'
    )
ON CONFLICT (id) DO NOTHING;


-- 9. Sample Citizen Report & Issue Cluster (Clearly labeled test data)
INSERT INTO citizen_reports (id, report_number, city_id, ward_id, category, subcategory, title, description, normalized_text, input_language, location_geometry, location_address, severity_input, status, is_anonymous, is_public, corroboration_count)
VALUES 
    (
        'ea000000-0000-0000-0000-000000000001',
        'ND-GWL-2026-000001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000004',
        'road_pothole',
        'severe_pothole',
        'Deep road crater near Thatipur Main Chowk',
        'थाटीपुर मुख्य चौराहे के पास सड़क पर गहरा गड्ढा है जिससे दोपहिया वाहनों के फिसलने का खतरा बना हुआ है।',
        'थाटीपुर मुख्य चौराहे के पास सड़क पर गहरा गड्ढा है',
        'hi',
        ST_SetSRID(ST_MakePoint(78.2038, 26.2220), 4326),
        'Near SBI Thatipur Branch, Gwalior',
        'high',
        'verified',
        FALSE,
        TRUE,
        5
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO issue_clusters (id, city_id, ward_id, category, cluster_title_en, cluster_title_hi, centroid, report_count, unresolved_count, composite_risk_score, cluster_status)
VALUES 
    (
        'ca000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000004',
        'road_pothole',
        'Thatipur Commercial Hub Road Distress Cluster',
        'थाटीपुर व्यापारिक केंद्र सड़क क्षति क्लस्टर',
        ST_SetSRID(ST_MakePoint(78.2038, 26.2220), 4326),
        3,
        2,
        68.5,
        'active'
    )
ON CONFLICT (id) DO NOTHING;
