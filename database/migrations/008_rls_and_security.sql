-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 008: ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- Role-Based Access Control and Privacy Enforcement (SRS Section 3, 12, 13)
-- ==============================================================================

-- 1. Helper Function: Get current authenticated user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    u_role user_role;
BEGIN
    SELECT role INTO u_role
    FROM user_profiles
    WHERE id = auth.uid();
    
    IF u_role IS NULL THEN
        RETURN 'guest'::user_role;
    END IF;
    
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Enable RLS on ALL tables
ALTER TABLE admin_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE localities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_corroborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;


-- 3. Public Read Policies (Accessible to Guests, Citizens, and all users)

-- Administrative Boundaries & Master Data
CREATE POLICY "Public can view active admin_units"
    ON admin_units FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view enabled cities"
    ON cities FOR SELECT
    USING (is_enabled = TRUE);

CREATE POLICY "Public can view active wards"
    ON wards FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view active localities"
    ON localities FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view active sectors"
    ON sectors FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view active departments"
    ON departments FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view enabled data_sources"
    ON data_sources FOR SELECT
    USING (is_enabled = TRUE);

CREATE POLICY "Public can view active gis_layers"
    ON gis_layers FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view active gis_features"
    ON gis_features FOR SELECT
    USING (is_active = TRUE);

-- Civic Intelligence & Public Records
CREATE POLICY "Public can view active issue_clusters"
    ON issue_clusters FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view risk_scores"
    ON risk_scores FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view verified public_records"
    ON public_records FOR SELECT
    USING (is_verified = TRUE);

CREATE POLICY "Public can view approved news_mentions"
    ON news_mentions FOR SELECT
    USING (is_approved = TRUE);

CREATE POLICY "Public can view current ai_reports"
    ON ai_reports FOR SELECT
    USING (is_current = TRUE);

CREATE POLICY "Public can view translations"
    ON translations FOR SELECT
    USING (TRUE);


-- 4. Citizen Reports & Feedback Policies

-- Public can view accepted, non-spam public reports (Reporter personal ID masked at API level)
CREATE POLICY "Public can view public accepted citizen reports"
    ON citizen_reports FOR SELECT
    USING (is_public = TRUE AND status != 'rejected_spam');

-- Authenticated users can view their own reports regardless of status
CREATE POLICY "Users can view own reports"
    ON citizen_reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id);

-- Authenticated or anonymous users can insert new reports
CREATE POLICY "Anyone can submit a citizen report"
    ON citizen_reports FOR INSERT
    WITH CHECK (TRUE);

-- Only reporter can update their own report while still in 'submitted' state
CREATE POLICY "Reporters can update own submitted report"
    ON citizen_reports FOR UPDATE
    TO authenticated
    USING (auth.uid() = reporter_id AND status = 'submitted')
    WITH CHECK (auth.uid() = reporter_id AND status = 'submitted');


-- Report Media Policies
CREATE POLICY "Public can view approved report media"
    ON report_media FOR SELECT
    USING (moderation_state = 'approved');

CREATE POLICY "Reporters can view own report media"
    ON report_media FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM citizen_reports
            WHERE citizen_reports.id = report_media.report_id
            AND citizen_reports.reporter_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can attach media to report during submission"
    ON report_media FOR INSERT
    WITH CHECK (TRUE);


-- Report Status History Policies
CREATE POLICY "Public can view status history of public reports"
    ON report_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM citizen_reports
            WHERE citizen_reports.id = report_status_history.report_id
            AND citizen_reports.is_public = TRUE
        )
    );


-- Report Evidence Policies
CREATE POLICY "Public can view evidence for public reports"
    ON report_evidence FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM citizen_reports
            WHERE citizen_reports.id = report_evidence.report_id
            AND citizen_reports.is_public = TRUE
        )
    );


-- Report Corroboration Policies
CREATE POLICY "Public can view corroborations"
    ON report_corroborations FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated citizens can corroborate reports"
    ON report_corroborations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own corroboration"
    ON report_corroborations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- 5. User Profiles Policies
CREATE POLICY "Public can view basic public profile info"
    ON user_profiles FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile upon signup"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);


-- 6. Saved Places & Routes Policies
CREATE POLICY "Users can view and manage own saved places"
    ON saved_places_routes FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 7. Staff & Administrative Policies (Analysts, Verifiers, GIS Admins, Super Admins)

-- Verifiers / Department Users can update reports & create moderation actions
CREATE POLICY "Staff can view and moderate all reports"
    ON citizen_reports FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('verifier', 'analyst', 'gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('verifier', 'analyst', 'gis_admin', 'super_admin'));

CREATE POLICY "Staff can view all report media"
    ON report_media FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('verifier', 'analyst', 'gis_admin', 'super_admin'));

CREATE POLICY "Staff can insert status history"
    ON report_status_history FOR INSERT
    TO authenticated
    WITH CHECK (get_current_user_role() IN ('verifier', 'analyst', 'gis_admin', 'super_admin'));

CREATE POLICY "Staff can manage moderation actions"
    ON moderation_actions FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('verifier', 'gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('verifier', 'gis_admin', 'super_admin'));


-- GIS Admin & Super Admin Full CRUD on Spatial & Core Master Data
CREATE POLICY "Admins have full access to admin_units"
    ON admin_units FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));

CREATE POLICY "Admins have full access to cities"
    ON cities FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));

CREATE POLICY "Admins have full access to wards"
    ON wards FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));

CREATE POLICY "Admins have full access to gis_layers"
    ON gis_layers FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));

CREATE POLICY "Admins have full access to gis_features"
    ON gis_features FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));

CREATE POLICY "Admins have full access to data_sources"
    ON data_sources FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));

CREATE POLICY "Admins can manage dataset_uploads"
    ON dataset_uploads FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'))
    WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));

CREATE POLICY "Admins can view ingestion_runs"
    ON ingestion_runs FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'));

CREATE POLICY "Admins can view audit_logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('gis_admin', 'super_admin'));
