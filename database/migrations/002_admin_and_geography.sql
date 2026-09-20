-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 002: ADMINISTRATIVE GEOGRAPHY & HIERARCHY
-- Madhya Pradesh State -> Division -> District -> ULB/City -> Tehsil -> Ward -> Locality
-- ==============================================================================

-- 1. Master Administrative Units Table (Normalized MP hierarchy)
CREATE TABLE IF NOT EXISTS admin_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES admin_units(id) ON DELETE SET NULL,
    unit_type admin_unit_type NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    lgd_code VARCHAR(50),               -- Local Government Directory code (Govt of India)
    census_code VARCHAR(50),            -- Census 2011/2021 code
    state_code VARCHAR(10) DEFAULT 'MP',-- Madhya Pradesh (23)
    geometry GEOMETRY(GEOMETRY, 4326),  -- Canonical boundary polygon / multipolygon
    centroid GEOMETRY(POINT, 4326),     -- Administrative centroid for labeling/zooming
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional authoritative codes/stats
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for admin_units
CREATE INDEX IF NOT EXISTS idx_admin_units_parent_id ON admin_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_units_unit_type ON admin_units(unit_type);
CREATE INDEX IF NOT EXISTS idx_admin_units_lgd_code ON admin_units(lgd_code);
CREATE INDEX IF NOT EXISTS idx_admin_units_slug ON admin_units(slug);
CREATE INDEX IF NOT EXISTS idx_admin_units_geometry ON admin_units USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_admin_units_centroid ON admin_units USING GIST(centroid);

-- Trigger for admin_units updated_at
CREATE TRIGGER trg_admin_units_updated_at
BEFORE UPDATE ON admin_units
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. Cities / Urban Local Bodies (ULBs) Table
-- Dedicated entity table for fast city selector, zoom extents, and multi-city scaling
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID REFERENCES admin_units(id) ON DELETE RESTRICT,
    district_id UUID REFERENCES admin_units(id) ON DELETE SET NULL,
    name_en VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    ulb_type ulb_type DEFAULT 'nagar_nigam' NOT NULL,
    lgd_code VARCHAR(50),
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    default_zoom INTEGER DEFAULT 12 NOT NULL,
    min_zoom INTEGER DEFAULT 9 NOT NULL,
    max_zoom INTEGER DEFAULT 19 NOT NULL,
    bbox_southwest GEOMETRY(POINT, 4326),
    bbox_northeast GEOMETRY(POINT, 4326),
    boundary_geometry GEOMETRY(MULTIPOLYGON, 4326),
    population_census INTEGER,
    area_sq_km DOUBLE PRECISION,
    is_reference_city BOOLEAN DEFAULT FALSE NOT NULL, -- True for Gwalior (first reference implementation)
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    settings JSONB DEFAULT '{
        "weather_enabled": true,
        "routing_enabled": true,
        "ai_summary_enabled": true,
        "realtime_enabled": true
    }'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for cities
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_district_id ON cities(district_id);
CREATE INDEX IF NOT EXISTS idx_cities_is_enabled ON cities(is_enabled);
CREATE INDEX IF NOT EXISTS idx_cities_boundary_geometry ON cities USING GIST(boundary_geometry);

CREATE TRIGGER trg_cities_updated_at
BEFORE UPDATE ON cities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3. Wards Table (Municipal Wards within Cities/ULBs)
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    admin_unit_id UUID REFERENCES admin_units(id) ON DELETE SET NULL,
    ward_number INTEGER NOT NULL,
    ward_code VARCHAR(50),
    name_en VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    zone_number INTEGER,
    zone_name_en VARCHAR(100),
    zone_name_hi VARCHAR(100),
    corporator_name VARCHAR(150),
    corporator_contact VARCHAR(50),
    sanitation_inspector_contact VARCHAR(50),
    population INTEGER,
    area_sq_km DOUBLE PRECISION,
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    centroid GEOMETRY(POINT, 4326),
    properties JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_city_ward_number UNIQUE (city_id, ward_number)
);

-- Indexes for wards
CREATE INDEX IF NOT EXISTS idx_wards_city_id ON wards(city_id);
CREATE INDEX IF NOT EXISTS idx_wards_ward_number ON wards(ward_number);
CREATE INDEX IF NOT EXISTS idx_wards_geometry ON wards USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_wards_centroid ON wards USING GIST(centroid);

CREATE TRIGGER trg_wards_updated_at
BEFORE UPDATE ON wards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 4. Localities / Villages / Mohallas Table
CREATE TABLE IF NOT EXISTS localities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    admin_unit_id UUID REFERENCES admin_units(id) ON DELETE SET NULL,
    name_en VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    pincode VARCHAR(10),
    locality_type VARCHAR(50) DEFAULT 'mohalla', -- mohalla, colony, village, landmark_area
    geometry GEOMETRY(GEOMETRY, 4326),
    centroid GEOMETRY(POINT, 4326),
    properties JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for localities
CREATE INDEX IF NOT EXISTS idx_localities_city_id ON localities(city_id);
CREATE INDEX IF NOT EXISTS idx_localities_ward_id ON localities(ward_id);
CREATE INDEX IF NOT EXISTS idx_localities_pincode ON localities(pincode);
CREATE INDEX IF NOT EXISTS idx_localities_geometry ON localities USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_localities_centroid ON localities USING GIST(centroid);

CREATE TRIGGER trg_localities_updated_at
BEFORE UPDATE ON localities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
