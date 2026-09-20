-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 004: CIVIC GEOGRAPHIC FEATURES MODEL
-- Unified, Scalable PostGIS Civic Asset & Feature Store (SRS Section 9)
-- ==============================================================================

-- Master GIS Features Table
CREATE TABLE IF NOT EXISTS gis_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_id UUID NOT NULL REFERENCES gis_layers(id) ON DELETE CASCADE,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    locality_id UUID REFERENCES localities(id) ON DELETE SET NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    external_id VARCHAR(150),                   -- ID in upstream system (e.g., GARUD road_id, OSM way_id)
    name_en VARCHAR(250),
    name_hi VARCHAR(250),
    category VARCHAR(100),                      -- e.g. 'arterial_road', 'phc', 'water_tank', 'police_station'
    subcategory VARCHAR(100),
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL, -- Point, LineString, Polygon, MultiPolygon
    properties JSONB DEFAULT '{}'::jsonb NOT NULL, -- Flexible attribute store (e.g. width, material, capacity, condition, bed_count)
    observed_at TIMESTAMPTZ,                    -- Date of physical survey / observation
    source_updated_at TIMESTAMPTZ,              -- Date upstream source last modified record
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Essential Spatial and B-tree Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_gis_features_geometry ON gis_features USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_gis_features_layer_id ON gis_features(layer_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_city_id ON gis_features(city_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_ward_id ON gis_features(ward_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_source_id ON gis_features(source_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_category ON gis_features(category);

-- Composite Indexes for Map Bounding Box + Filter Queries
CREATE INDEX IF NOT EXISTS idx_gis_features_city_layer ON gis_features(city_id, layer_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_layer_active ON gis_features(layer_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gis_features_external_source ON gis_features(source_id, external_id);

-- JSONB GIN index for arbitrary property filtering
CREATE INDEX IF NOT EXISTS idx_gis_features_properties ON gis_features USING GIN(properties);

-- Full-Text Search Index for place and asset names (English + Hindi text)
CREATE INDEX IF NOT EXISTS idx_gis_features_name_en_trgm ON gis_features USING GIN(name_en gin_trgm_ops);

CREATE TRIGGER trg_gis_features_updated_at
BEFORE UPDATE ON gis_features
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
