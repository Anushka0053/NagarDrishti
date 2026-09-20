-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 003: SECTORS, DEPARTMENTS, DATA SOURCES & GIS LAYERS
-- Dynamic Metadata-Driven GIS Layer Architecture (SRS Section 4.2, 6, 8, 9)
-- ==============================================================================

-- 1. Sectors Taxonomy Table
CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,       -- e.g., 'transport', 'water_sanitation', 'health', 'public_safety'
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'layers',       -- Lucide icon name
    display_order INTEGER DEFAULT 0 NOT NULL,
    color_hex VARCHAR(10) DEFAULT '#2563EB', -- Primary theme color for sector
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sectors_code ON sectors(code);
CREATE TRIGGER trg_sectors_updated_at
BEFORE UPDATE ON sectors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. Government Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,          -- e.g., 'gmc_water', 'mp_pwd', 'uadd_garud', 'mp_police'
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200) NOT NULL,
    short_name_en VARCHAR(50),
    short_name_hi VARCHAR(50),
    nodal_officer_name VARCHAR(150),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(50),
    portal_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3. Authoritative / External Data Source Registry (SRS Section 6 & 6.1)
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_key VARCHAR(100) NOT NULL UNIQUE,    -- e.g., 'garud_mp_uadd', 'isro_bhuvan_wms', 'mp_eservice_api', 'data_gov_in_gwalior', 'osm_community'
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200) NOT NULL,
    provider VARCHAR(200) NOT NULL,             -- e.g., 'Directorate of Urban Administration & Development, MP'
    authority_level source_authority_level DEFAULT 'conditional_official' NOT NULL,
    homepage_url VARCHAR(255),
    api_docs_url VARCHAR(255),
    service_endpoint_url VARCHAR(255),          -- Server-side only URL / proxy base
    access_type VARCHAR(50) DEFAULT 'open_api', -- 'open_api', 'wms', 'wmts', 'authenticated_api', 'manual_file', 'internal'
    license_type VARCHAR(100) DEFAULT 'Government Open Data (GODL-India)',
    attribution_text_en VARCHAR(255) NOT NULL,
    attribution_text_hi VARCHAR(255) NOT NULL,
    geographic_coverage VARCHAR(100) DEFAULT 'Madhya Pradesh',
    expected_refresh_interval VARCHAR(50) DEFAULT 'monthly', -- 'realtime', 'hourly', 'daily', 'weekly', 'monthly', 'dataset_edition'
    schema_version VARCHAR(20) DEFAULT '1.0',
    last_source_update TIMESTAMPTZ,             -- Timestamp published by upstream provider
    last_successful_sync TIMESTAMPTZ,           -- Last timestamp NagarDrishti synced
    health_status VARCHAR(50) DEFAULT 'healthy',-- 'healthy', 'degraded', 'unavailable', 'pending_credentials'
    notes TEXT,                                 -- Integration notes, API limitations, required headers
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_sources_source_key ON data_sources(source_key);
CREATE INDEX IF NOT EXISTS idx_data_sources_authority ON data_sources(authority_level);
CREATE INDEX IF NOT EXISTS idx_data_sources_health ON data_sources(health_status);

CREATE TRIGGER trg_data_sources_updated_at
BEFORE UPDATE ON data_sources
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 4. Dynamic GIS Layer Catalog Table (SRS Section 4.2 & 8)
CREATE TABLE IF NOT EXISTS gis_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,          -- e.g., 'gwalior_roads', 'gwalior_water_pipelines', 'mp_hospitals'
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200) NOT NULL,
    description_en TEXT,
    description_hi TEXT,
    sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    geometry_type gis_geometry_type NOT NULL,
    source_type layer_source_type DEFAULT 'internal_postgis' NOT NULL,
    external_layer_name VARCHAR(150),           -- WMS/WMTS layer identifier (e.g. 'bhuvan:lulc_50k')
    service_url_template VARCHAR(500),          -- Tile URL template or WMS GetMap endpoint
    city_ids UUID[] DEFAULT '{}',               -- Array of city UUIDs this layer applies to (empty = MP-wide)
    min_zoom INTEGER DEFAULT 0 NOT NULL,
    max_zoom INTEGER DEFAULT 22 NOT NULL,
    default_visibility BOOLEAN DEFAULT FALSE NOT NULL,
    is_queryable BOOLEAN DEFAULT TRUE NOT NULL,  -- Can features in this layer be identified on map click?
    is_clusterable BOOLEAN DEFAULT FALSE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    style_config JSONB DEFAULT '{
        "fill_color": "#3B82F6",
        "fill_opacity": 0.4,
        "stroke_color": "#1D4ED8",
        "stroke_width": 2,
        "point_radius": 6,
        "icon_image": "marker"
    }'::jsonb NOT NULL,
    legend_config JSONB DEFAULT '{
        "items": [
            {"label_en": "Default Feature", "label_hi": "डिफ़ॉल्ट सुविधा", "color": "#3B82F6"}
        ]
    }'::jsonb NOT NULL,
    filter_config JSONB DEFAULT '{}'::jsonb,    -- Dynamic filter definitions for frontend UI
    freshness_sla_days INTEGER DEFAULT 30,      -- Alert if last sync older than N days
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gis_layers_slug ON gis_layers(slug);
CREATE INDEX IF NOT EXISTS idx_gis_layers_sector_id ON gis_layers(sector_id);
CREATE INDEX IF NOT EXISTS idx_gis_layers_department_id ON gis_layers(department_id);
CREATE INDEX IF NOT EXISTS idx_gis_layers_source_id ON gis_layers(source_id);
CREATE INDEX IF NOT EXISTS idx_gis_layers_is_active ON gis_layers(is_active);

CREATE TRIGGER trg_gis_layers_updated_at
BEFORE UPDATE ON gis_layers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
