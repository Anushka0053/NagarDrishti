-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 012: PHASE 5 PRODUCTION SECURITY & AUDIT IMMUTABILITY
-- Role-Based Privacy, Departmental Scoping, Append-Only Audits & Query Optimization
-- ==============================================================================

-- 1. Ensure Append-Only Security for Audit Tables
-- Prevents tampering or deletion of system and report audit records
CREATE OR REPLACE FUNCTION enforce_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit records are strictly append-only and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_mutation ON audit_logs;
CREATE TRIGGER trg_prevent_audit_logs_mutation
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

DROP TRIGGER IF EXISTS trg_prevent_report_history_mutation ON report_status_history;
CREATE TRIGGER trg_prevent_report_history_mutation
BEFORE UPDATE OR DELETE ON report_status_history
FOR EACH ROW EXECUTE FUNCTION enforce_append_only();


-- 2. Enhanced Row-Level Security (RLS) for User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (
        id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'gis_admin')
        )
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Super Admin can manage all profiles" ON user_profiles;
CREATE POLICY "Super Admin can manage all profiles"
    ON user_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );


-- 3. Departmental & City Scoping for Operational Report Updates
-- Department officers can only update reports routed to their department
DROP POLICY IF EXISTS "Department officers can update assigned department reports" ON citizen_reports;
CREATE POLICY "Department officers can update assigned department reports"
    ON citizen_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
              AND (
                  up.role = 'super_admin'
                  OR (up.role = 'gis_admin' AND up.preferred_city_id = citizen_reports.city_id)
                  OR (up.role IN ('analyst', 'verifier') AND up.department_id = citizen_reports.department_id)
              )
        )
    )
    WITH CHECK (TRUE);


-- 4. High-Performance Multi-City Spatial & Filtering Indexes
-- Drastically accelerates city-scoped queries across large PostGIS feature tables
CREATE INDEX IF NOT EXISTS idx_gis_features_city_layer 
    ON gis_features(city_id, layer_id) 
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_gis_features_city_category 
    ON gis_features(city_id, category) 
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_wards_city_ward_number 
    ON wards(city_id, ward_number);

CREATE INDEX IF NOT EXISTS idx_localities_city_name 
    ON localities(city_id, name_en);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created 
    ON audit_logs(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source_started 
    ON ingestion_runs(source_id, started_at DESC);

