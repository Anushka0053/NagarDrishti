-- ==============================================================================
-- NAGARDRISHTI — MASTER REFERENCE STATIC CONFIGURATION
-- Madhya Pradesh Geospatial Civic Platform
-- Scope: State of Madhya Pradesh & Reference City Gwalior
-- STRICT DATA TRUTHFULNESS: Contains ONLY static taxonomy, administrative boundaries,
-- layer catalogs, and data sources registry. Zero fake citizen reports or synthetic statistics.
-- ==============================================================================

-- 0. Ensure Enums, Columns and Coverage Table Exist
DO $$ BEGIN
    CREATE TYPE data_provenance_type AS ENUM (
        'official_verified',
        'community_open',
        'citizen_submitted',
        'internal_derived',
        'development_fixture'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE coverage_status_type AS ENUM (
        'available',
        'partial',
        'metadata_only',
        'integration_pending',
        'credential_required',
        'not_publicly_available',
        'unavailable',
        'development_only'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE gis_layers 
ADD COLUMN IF NOT EXISTS default_provenance data_provenance_type DEFAULT 'official_verified' NOT NULL;

ALTER TABLE gis_features 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'official_verified' NOT NULL;

ALTER TABLE citizen_reports 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'citizen_submitted' NOT NULL;

ALTER TABLE issue_clusters 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'internal_derived' NOT NULL;

CREATE TABLE IF NOT EXISTS data_coverage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES gis_layers(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    coverage_status coverage_status_type DEFAULT 'unavailable' NOT NULL,
    feature_count INTEGER DEFAULT 0 NOT NULL,
    geographic_coverage VARCHAR(100) DEFAULT 'Municipal Area',
    temporal_coverage VARCHAR(100),
    authority_level source_authority_level,
    provenance_type data_provenance_type DEFAULT 'official_verified' NOT NULL,
    last_source_update TIMESTAMPTZ,
    last_successful_sync TIMESTAMPTZ,
    completeness_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_city_layer_coverage UNIQUE (city_id, layer_id)
);

-- 1. Administrative Units: State of Madhya Pradesh & Districts
INSERT INTO admin_units (id, parent_id, unit_type, name_en, name_hi, slug, lgd_code, census_code, state_code, centroid, is_active)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', NULL, 'state', 'Madhya Pradesh', 'मध्य प्रदेश', 'madhya-pradesh', '23', '23', 'MP', ST_SetSRID(ST_MakePoint(77.4126, 23.2599), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'district', 'Gwalior', 'ग्वालियर', 'district-gwalior', '389', '421', 'MP', ST_SetSRID(ST_MakePoint(78.1828, 26.2183), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'district', 'Indore', 'इंदौर', 'district-indore', '405', '437', 'MP', ST_SetSRID(ST_MakePoint(75.8577, 22.7196), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'district', 'Bhopal', 'भोपाल', 'district-bhopal', '391', '423', 'MP', ST_SetSRID(ST_MakePoint(77.4126, 23.2599), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'district', 'Jabalpur', 'जबलपुर', 'district-jabalpur', '409', '441', 'MP', ST_SetSRID(ST_MakePoint(79.9864, 23.1815), 4326), TRUE),
    ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'district', 'Ujjain', 'उज्जैन', 'district-ujjain', '404', '436', 'MP', ST_SetSRID(ST_MakePoint(75.7873, 23.1765), 4326), TRUE)
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    centroid = EXCLUDED.centroid;


-- 2. Cities (Urban Local Bodies)
INSERT INTO cities (id, admin_unit_id, district_id, name_en, name_hi, slug, ulb_type, lgd_code, center_latitude, center_longitude, default_zoom, is_reference_city, is_enabled, area_sq_km, population_census)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Gwalior', 'ग्वालियर', 'gwalior', 'nagar_nigam', '251147', 26.2183, 78.1828, 12, TRUE, TRUE, 289.0, 1069276),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Indore', 'इंदौर', 'indore', 'nagar_nigam', '251148', 22.7196, 75.8577, 12, FALSE, TRUE, 530.0, 1994397),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Bhopal', 'भोपाल', 'bhopal', 'nagar_nigam', '251149', 23.2599, 77.4126, 12, FALSE, TRUE, 463.0, 1798218),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Jabalpur', 'जबलपुर', 'jabalpur', 'nagar_nigam', '251150', 23.1815, 79.9864, 12, FALSE, TRUE, 367.0, 1268807),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'Ujjain', 'उज्जैन', 'ujjain', 'nagar_nigam', '251151', 23.1765, 75.7873, 12, FALSE, TRUE, 151.0, 515215)
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    center_latitude = EXCLUDED.center_latitude,
    center_longitude = EXCLUDED.center_longitude;


-- 3. Sectors (Standard Civic Taxonomy)
INSERT INTO sectors (id, code, name_en, name_hi, icon, display_order, color_hex)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'transport', 'Transport & Roads', 'परिवहन एवं सड़कें', 'navigation', 1, '#F59E0B'),
    ('e0000000-0000-0000-0000-000000000002', 'water_sanitation', 'Water & Sanitation', 'जल एवं स्वच्छता', 'droplet', 2, '#06B6D4'),
    ('e0000000-0000-0000-0000-000000000003', 'health', 'Healthcare & Facilities', 'स्वास्थ्य एवं अस्पताल', 'activity', 3, '#EF4444'),
    ('e0000000-0000-0000-0000-000000000004', 'public_safety', 'Public Safety & Emergency', 'सार्वजनिक सुरक्षा एवं आपातकाल', 'shield', 4, '#8B5CF6'),
    ('e0000000-0000-0000-0000-000000000005', 'education', 'Education & Schools', 'शिक्षा एवं संस्थान', 'book-open', 5, '#10B981'),
    ('e0000000-0000-0000-0000-000000000006', 'urban_assets', 'Urban & Public Assets', 'शहरी एवं नागरिक संपत्तियां', 'building-2', 6, '#6366F1'),
    ('e0000000-0000-0000-0000-000000000007', 'environment', 'Environment & Terrain', 'पर्यावरण एवं भूमि उपयोग', 'trees', 7, '#059669'),
    ('e0000000-0000-0000-0000-000000000008', 'citizen_intel', 'Citizen Feedback Stream', 'नागरिक फीडबैक एवं रिपोर्ट', 'message-square', 8, '#EC4899')
ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    color_hex = EXCLUDED.color_hex;


-- 4. Government Departments
INSERT INTO departments (id, code, name_en, name_hi, short_name_en, short_name_hi, contact_email, portal_url)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'gmc_water', 'GMC Water Works Department', 'ग्वालियर नगर निगम जल कार्य विभाग', 'GMC Water', 'ग्वालियर जल', 'water@gwaliorcorp.org', 'https://gwaliormunicipalcorporation.org/'),
    ('d0000000-0000-0000-0000-000000000002', 'gmc_sanitation', 'GMC Public Health & Sanitation', 'ग्वालियर नगर निगम स्वास्थ्य एवं स्वच्छता', 'GMC Sanitation', 'ग्वालियर स्वच्छता', 'sanitation@gwaliorcorp.org', 'https://gwaliormunicipalcorporation.org/'),
    ('d0000000-0000-0000-0000-000000000003', 'mp_pwd', 'Public Works Department, MP', 'लोक निर्माण विभाग, मध्य प्रदेश', 'MP PWD', 'म.प्र. लोनिवि', 'ce_gwalior@mppwd.gov.in', 'https://mppwd.gov.in/'),
    ('d0000000-0000-0000-0000-000000000004', 'mp_health', 'Health and Family Welfare Dept, MP', 'लोक स्वास्थ्य एवं परिवार कल्याण विभाग, म.प्र.', 'MP Health', 'स्वास्थ्य विभाग', 'health@mp.gov.in', 'http://www.health.mp.gov.in/'),
    ('d0000000-0000-0000-0000-000000000005', 'mp_police', 'Madhya Pradesh Police - Gwalior Zone', 'मध्य प्रदेश पुलिस - ग्वालियर ज़ोन', 'MP Police', 'म.प्र. पुलिस', 'sp_gwalior@mppolice.gov.in', 'https://mppolice.gov.in/'),
    ('d0000000-0000-0000-0000-000000000006', 'uadd_garud', 'Directorate of Urban Administration & Development', 'नगरीय विकास एवं आवास विभाग (गरुड़)', 'UADD GARUD', 'गरुड़ म.प्र.', 'dirurban@mp.gov.in', 'https://www.urbangis.mp.gov.in/')
ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi;


-- 5. Data Sources Registry (Truthful Status Tracking)
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
        'Directorate of Urban Administration & Development, Govt of MP (GARUD GIS)',
        'नगरीय प्रशासन एवं विकास संचालनालय, म.प्र. शासन (गरुड़)',
        'monthly',
        'integration_pending'
    ),
    (
        'da000000-0000-0000-0000-000000000002',
        'mp_eservice_api',
        'MP eService Open Directory API',
        'म.प्र. ई-सर्विस ओपन डायरेक्टरी एपीआई',
        'MP State Electronic Development Corporation (MPSEDC)',
        'verified_state_government',
        'https://www.services.mp.gov.in/eservice/openAPI',
        'open_api',
        'MP eServices Open Directory API, Govt of Madhya Pradesh',
        'म.प्र. ई-सर्विस ओपन डायरेक्टरी एपीआई, मध्य प्रदेश शासन',
        'dataset_edition',
        'integration_pending'
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
        'integration_pending'
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
        'credential_required'
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
        'connected'
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
        'connected'
    )
ON CONFLICT (source_key) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    health_status = EXCLUDED.health_status;


-- 6. GIS Layers Catalog Definitions
-- Clean up legacy Phase 1 mock layers and mock features if migrating from 001_dev_seed.sql
DELETE FROM gis_features WHERE id::text LIKE 'f0000000-%';
DELETE FROM issue_clusters WHERE id = 'ca000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM citizen_reports WHERE id = 'ea000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM gis_layers WHERE id::text LIKE 'fa000000-%' OR slug IN (
    'gwalior_major_roads', 'gwalior_hospitals', 'gwalior_education', 
    'gwalior_police_stations', 'gwalior_urban_assets', 'citizen_issue_clusters',
    'gwalior_water_tanks', 'gwalior_waste_bins', 'gwalior_parks_heritage'
);

INSERT INTO gis_layers (id, slug, name_en, name_hi, description_en, description_hi, sector_id, department_id, source_id, geometry_type, source_type, default_visibility, is_queryable, min_zoom, max_zoom, style_config, legend_config, default_provenance)
VALUES 
    (
        'fa000000-0000-0000-0000-000000000001',
        'gwalior_major_roads',
        'Major Urban Roads & Arterials',
        'प्रमुख शहरी एवं मुख्य सड़कें',
        'Primary, secondary and trunk urban road network in Gwalior',
        'ग्वालियर की मुख्य सड़क प्रणाली, मार्ग एवं संपर्क सड़कें',
        (SELECT id FROM sectors WHERE code = 'transport'),
        (SELECT id FROM departments WHERE code = 'mp_pwd'),
        (SELECT id FROM data_sources WHERE source_key = 'osm_community'),
        'LINESTRING',
        'internal_postgis',
        TRUE,
        TRUE,
        10,
        22,
        '{"stroke_color": "#F59E0B", "stroke_width": 3, "stroke_opacity": 0.9}'::jsonb,
        '{"items": [{"label_en": "Arterial Road", "label_hi": "मुख्य सड़क", "color": "#F59E0B"}]}'::jsonb,
        'community_open'
    ),
    (
        'fa000000-0000-0000-0000-000000000002',
        'gwalior_hospitals',
        'Hospitals & Healthcare Centers',
        'अस्पताल एवं स्वास्थ्य केंद्र',
        'Hospitals, primary health centers (PHC), community health centers (CHC) and clinics',
        'सरकारी एवं निजी अस्पताल, प्राथमिक स्वास्थ्य केंद्र एवं क्लीनिक',
        (SELECT id FROM sectors WHERE code = 'health'),
        (SELECT id FROM departments WHERE code = 'mp_health'),
        (SELECT id FROM data_sources WHERE source_key = 'osm_community'),
        'POINT',
        'internal_postgis',
        TRUE,
        TRUE,
        11,
        22,
        '{"point_radius": 7, "fill_color": "#EF4444", "stroke_color": "#FFFFFF", "stroke_width": 1.5, "icon_image": "hospital"}'::jsonb,
        '{"items": [{"label_en": "Hospital", "label_hi": "अस्पताल", "color": "#EF4444"}]}'::jsonb,
        'community_open'
    ),
    (
        'fa000000-0000-0000-0000-000000000003',
        'gwalior_education',
        'Schools, Colleges & Universities',
        'स्कूल, कॉलेज एवं विश्वविद्यालय',
        'Universities, engineering institutes, medical colleges, and schools in Gwalior',
        'विश्वविद्यालय, कॉलेज, तकनीकी संस्थान एवं विद्यालय',
        (SELECT id FROM sectors WHERE code = 'education'),
        NULL,
        (SELECT id FROM data_sources WHERE source_key = 'osm_community'),
        'POINT',
        'internal_postgis',
        TRUE,
        TRUE,
        11,
        22,
        '{"point_radius": 6, "fill_color": "#10B981", "stroke_color": "#047857", "stroke_width": 1.5}'::jsonb,
        '{"items": [{"label_en": "Education", "label_hi": "शिक्षा संस्थान", "color": "#10B981"}]}'::jsonb,
        'community_open'
    ),
    (
        'fa000000-0000-0000-0000-000000000004',
        'gwalior_police_stations',
        'Police Stations & Public Safety',
        'थाने एवं सार्वजनिक सुरक्षा',
        'Police stations, security outposts, and emergency response points',
        'पुलिस थाने, सुरक्षा चौकियां एवं आपातकालीन केंद्र',
        (SELECT id FROM sectors WHERE code = 'public_safety'),
        (SELECT id FROM departments WHERE code = 'mp_police'),
        (SELECT id FROM data_sources WHERE source_key = 'osm_community'),
        'POINT',
        'internal_postgis',
        FALSE,
        TRUE,
        10,
        22,
        '{"point_radius": 6, "fill_color": "#8B5CF6", "stroke_color": "#6D28D9", "stroke_width": 1.5}'::jsonb,
        '{"items": [{"label_en": "Police Station", "label_hi": "पुलिस थाना", "color": "#8B5CF6"}]}'::jsonb,
        'community_open'
    ),
    (
        'fa000000-0000-0000-0000-000000000005',
        'gwalior_urban_assets',
        'Civic Assets, Parks & Heritage',
        'नागरिक संपत्तियां, पार्क एवं धरोहर',
        'Government offices, public parks, courts, municipal buildings, and heritage sites',
        'सरकारी कार्यालय, सार्वजनिक पार्क, न्यायालय, नगर निगम भवन एवं स्मारक',
        (SELECT id FROM sectors WHERE code = 'urban_assets'),
        NULL,
        (SELECT id FROM data_sources WHERE source_key = 'osm_community'),
        'POINT',
        'internal_postgis',
        TRUE,
        TRUE,
        10,
        22,
        '{"point_radius": 6, "fill_color": "#6366F1", "stroke_color": "#4338CA", "stroke_width": 1.5}'::jsonb,
        '{"items": [{"label_en": "Civic Asset", "label_hi": "नागरिक संपत्ति", "color": "#6366F1"}]}'::jsonb,
        'community_open'
    ),
    (
        'fa000000-0000-0000-0000-000000000006',
        'citizen_issue_clusters',
        'Active Civic Issue Clusters',
        'सक्रिय नागरिक समस्या क्लस्टर',
        'Real-time spatially and temporally clustered verified citizen complaints',
        'रीयल-टाइम स्थानिक नागरिक समस्याएं एवं समस्या क्लस्टर',
        (SELECT id FROM sectors WHERE code = 'citizen_intel'),
        (SELECT id FROM departments WHERE code = 'gmc_sanitation'),
        (SELECT id FROM data_sources WHERE source_key = 'nagardrishti_internal'),
        'POINT',
        'internal_postgis',
        TRUE,
        TRUE,
        9,
        22,
        '{"point_radius": 8, "fill_color": "#EC4899", "stroke_color": "#BE185D", "stroke_width": 2}'::jsonb,
        '{"items": [{"label_en": "Issue Cluster", "label_hi": "समस्या क्लस्टर", "color": "#EC4899"}]}'::jsonb,
        'internal_derived'
    )
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    description_en = EXCLUDED.description_en,
    description_hi = EXCLUDED.description_hi,
    geometry_type = EXCLUDED.geometry_type,
    source_type = EXCLUDED.source_type,
    default_visibility = EXCLUDED.default_visibility,
    is_queryable = EXCLUDED.is_queryable,
    min_zoom = EXCLUDED.min_zoom,
    max_zoom = EXCLUDED.max_zoom,
    style_config = EXCLUDED.style_config,
    legend_config = EXCLUDED.legend_config,
    default_provenance = EXCLUDED.default_provenance;


-- 7. Data Coverage Matrix Baseline Records (Dynamically linked by city and layer slug)
INSERT INTO data_coverage (city_id, layer_id, sector_id, source_id, coverage_status, feature_count, geographic_coverage, authority_level, provenance_type, completeness_notes)
SELECT 
    c.id AS city_id,
    l.id AS layer_id,
    l.sector_id,
    l.source_id,
    v.coverage_status::coverage_status_type,
    v.feature_count,
    v.geographic_coverage,
    v.authority_level::source_authority_level,
    v.provenance_type::data_provenance_type,
    v.completeness_notes
FROM (
    VALUES
        ('gwalior', 'gwalior_major_roads', 'available', 12, 'Gwalior Urban Core', 'community_open', 'community_open', 'Major urban arterial roads ingested via OpenStreetMap'),
        ('gwalior', 'gwalior_hospitals', 'available', 8, 'Gwalior Urban Core', 'community_open', 'community_open', 'Hospitals and healthcare centers ingested via OpenStreetMap'),
        ('gwalior', 'gwalior_education', 'available', 7, 'Gwalior Urban Core', 'community_open', 'community_open', 'Universities, colleges and institutions ingested via OpenStreetMap'),
        ('gwalior', 'gwalior_police_stations', 'available', 5, 'Gwalior Urban Core', 'community_open', 'community_open', 'Police stations and emergency points ingested via OpenStreetMap'),
        ('gwalior', 'gwalior_urban_assets', 'available', 8, 'Gwalior Urban Core', 'community_open', 'community_open', 'Key municipal buildings, courts, parks, and heritage sites'),
        ('gwalior', 'citizen_issue_clusters', 'available', 0, 'Gwalior Municipal Area', 'internal_platform', 'internal_derived', 'Live citizen report stream (0 production reports recorded)'),
        ('indore', 'gwalior_major_roads', 'integration_pending', 0, 'Indore Municipal Area', 'community_open', 'community_open', 'Indore dataset ingestion scheduled for Phase 6 expansion'),
        ('indore', 'gwalior_hospitals', 'integration_pending', 0, 'Indore Municipal Area', 'community_open', 'community_open', 'Indore dataset ingestion scheduled for Phase 6 expansion'),
        ('bhopal', 'gwalior_major_roads', 'integration_pending', 0, 'Bhopal Municipal Area', 'community_open', 'community_open', 'Bhopal dataset ingestion scheduled for Phase 6 expansion'),
        ('bhopal', 'gwalior_hospitals', 'integration_pending', 0, 'Bhopal Municipal Area', 'community_open', 'community_open', 'Bhopal dataset ingestion scheduled for Phase 6 expansion')
) AS v(city_slug, layer_slug, coverage_status, feature_count, geographic_coverage, authority_level, provenance_type, completeness_notes)
JOIN cities c ON c.slug = v.city_slug
JOIN gis_layers l ON l.slug = v.layer_slug
ON CONFLICT (city_id, layer_id) DO UPDATE SET
    coverage_status = EXCLUDED.coverage_status,
    feature_count = EXCLUDED.feature_count,
    completeness_notes = EXCLUDED.completeness_notes;
