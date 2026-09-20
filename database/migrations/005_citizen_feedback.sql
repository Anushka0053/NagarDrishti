-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 005: CITIZEN FEEDBACK & REPORTING SCHEMA
-- Full Production Citizen Feedback, Multilingual Input, Media, Moderation & Audit (SRS Section 4.4, 11, 21.3)
-- ==============================================================================

-- 1. User Profiles Table (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'citizen' NOT NULL,
    full_name VARCHAR(150),
    phone_number VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'hi' NOT NULL, -- 'hi' (Hindi), 'en' (English), etc.
    preferred_city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL, -- For Department Users
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    avatar_url VARCHAR(500),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_city ON user_profiles(preferred_city_id);

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. Citizen Reports Table (Master Feedback Record)
CREATE TABLE IF NOT EXISTS citizen_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number VARCHAR(30) UNIQUE NOT NULL, -- Human-readable identifier (e.g. 'ND-GWL-2026-001042')
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for guest/anonymous
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    locality_id UUID REFERENCES localities(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,            -- e.g., 'road_pothole', 'water_leakage', 'garbage_dump', 'street_light'
    subcategory VARCHAR(100),
    title VARCHAR(200),
    description TEXT NOT NULL,
    normalized_text TEXT,                      -- Cleaned / normalized text from Sarvam STT or NLP
    input_language VARCHAR(10) DEFAULT 'hi',   -- Detected language of user input
    location_geometry GEOMETRY(POINT, 4326) NOT NULL, -- Specific map point of issue
    location_address TEXT,
    severity_input VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status report_status DEFAULT 'submitted' NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    is_public BOOLEAN DEFAULT TRUE NOT NULL,   -- Publicly visible on map / analytics
    corroboration_count INTEGER DEFAULT 0 NOT NULL,
    ai_metadata JSONB DEFAULT '{
        "sarvam_stt_transcription": null,
        "suggested_category": null,
        "sentiment_urgency_score": null,
        "extracted_entities": []
    }'::jsonb NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_officer_name VARCHAR(150),
    resolution_summary TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for citizen_reports
CREATE INDEX IF NOT EXISTS idx_citizen_reports_geometry ON citizen_reports USING GIST(location_geometry);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_city_id ON citizen_reports(city_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_ward_id ON citizen_reports(ward_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_reporter_id ON citizen_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_status ON citizen_reports(status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_category ON citizen_reports(category);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_created_at ON citizen_reports(created_at DESC);

-- Composite Indexes for Dashboard Filtering
CREATE INDEX IF NOT EXISTS idx_citizen_reports_city_status ON citizen_reports(city_id, status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_city_category ON citizen_reports(city_id, category);

CREATE TRIGGER trg_citizen_reports_updated_at
BEFORE UPDATE ON citizen_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3. Report Media Table (Images, Voice Clips, Video Evidence)
CREATE TABLE IF NOT EXISTS report_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,        -- Supabase Storage bucket path
    bucket_name VARCHAR(100) DEFAULT 'report-media' NOT NULL,
    media_type media_type NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    moderation_state VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'flagged_nsfw', 'rejected'
    exif_metadata JSONB DEFAULT '{}'::jsonb,   -- Stripped of private metadata before public exposure
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_media_report_id ON report_media(report_id);
CREATE INDEX IF NOT EXISTS idx_report_media_type ON report_media(media_type);


-- 4. Report Status History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS report_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    previous_status report_status,
    new_status report_status NOT NULL,
    changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role user_role DEFAULT 'citizen',
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_status_history_report ON report_status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_status_history_created ON report_status_history(created_at DESC);


-- 5. Report Evidence Graph Table (Cross-linking reports to official sources / records)
CREATE TABLE IF NOT EXISTS report_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    evidence_type evidence_type NOT NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    external_record_id VARCHAR(150),
    title VARCHAR(250) NOT NULL,
    evidence_url VARCHAR(500),
    confidence_score DOUBLE PRECISION DEFAULT 1.0,
    evidence_details JSONB DEFAULT '{}'::jsonb,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_evidence_report_id ON report_evidence(report_id);
CREATE INDEX IF NOT EXISTS idx_report_evidence_type ON report_evidence(evidence_type);


-- 6. Citizen Report Corroborations Table (Upvoting / "I also face this issue")
CREATE TABLE IF NOT EXISTS report_corroborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    corroboration_type VARCHAR(50) DEFAULT 'confirm_issue', -- 'confirm_issue', 'still_unresolved', 'resolved'
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_report_user_corroboration UNIQUE (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_report_corroborations_report ON report_corroborations(report_id);


-- 7. Moderation Actions Table
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    action_type VARCHAR(50) NOT NULL, -- 'approve', 'flag_duplicate', 'mark_spam', 'redact_pii', 'escalate'
    justification TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON moderation_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
