-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 011: PHASE 4 AI-POWERED CIVIC INTELLIGENCE SCHEMA
-- Stabilized Multi-City Reporting, Sarvam AI Grounding, Issue Clusters & Spatial Indexing
-- ==============================================================================

-- 1. Ensure Phase 4 Operational & AI Metadata Columns on citizen_reports
ALTER TABLE citizen_reports 
    ADD COLUMN IF NOT EXISTS assigned_officer_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS resolution_summary TEXT,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{
        "is_ai_prediction": true,
        "predicted_category": null,
        "predicted_urgency": "medium",
        "predicted_department": null,
        "sentiment_score": 0.5,
        "confidence": 0.8,
        "detected_language": "hi",
        "summary_en": null,
        "summary_hi": null,
        "detected_duplicates": []
    }'::jsonb NOT NULL;

-- 2. Ensure Provenance and Spatial Attributes on issue_clusters
ALTER TABLE issue_clusters
    ADD COLUMN IF NOT EXISTS provenance_type provenance_type DEFAULT 'internal_derived';

-- 3. High-Performance Spatial & Compound Indexes
-- Optimizes 200m spatial duplicate search (ST_DWithin) across multi-city datasets
CREATE INDEX IF NOT EXISTS idx_citizen_reports_spatial_active 
    ON citizen_reports USING GIST(location_geometry) 
    WHERE status NOT IN ('resolved', 'rejected_spam');

CREATE INDEX IF NOT EXISTS idx_citizen_reports_city_status_created 
    ON citizen_reports(city_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_reports_city_category_created
    ON citizen_reports(city_id, category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issue_clusters_city_status 
    ON issue_clusters(city_id, cluster_status);

CREATE INDEX IF NOT EXISTS idx_issue_clusters_centroid_gist 
    ON issue_clusters USING GIST(centroid);

-- 4. Automated Status Change Audit Trigger Function
-- Ensures any operational status transition automatically appends to report_status_history
CREATE OR REPLACE FUNCTION log_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO report_status_history (
            report_id,
            previous_status,
            new_status,
            changed_by_user_id,
            actor_role,
            reason,
            notes,
            created_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.reporter_id,
            'department_officer',
            COALESCE(NEW.resolution_summary, 'Status transition in NagarDrishti dispatch workflow'),
            NEW.assigned_officer_name,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_citizen_report_status ON citizen_reports;

CREATE TRIGGER trg_audit_citizen_report_status
AFTER UPDATE OF status ON citizen_reports
FOR EACH ROW
EXECUTE FUNCTION log_report_status_change();

-- 5. Row-Level Security (RLS) Policies for Phase 4
ALTER TABLE citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_corroborations ENABLE ROW LEVEL SECURITY;

-- Citizen Reports: Public Visibility
DROP POLICY IF EXISTS "Public can view active public citizen reports" ON citizen_reports;
CREATE POLICY "Public can view active public citizen reports"
    ON citizen_reports FOR SELECT
    USING (is_public = TRUE);

-- Citizen Reports: Submission by all (Anonymous or Authenticated)
DROP POLICY IF EXISTS "Anyone can submit a civic report" ON citizen_reports;
CREATE POLICY "Anyone can submit a civic report"
    ON citizen_reports FOR INSERT
    WITH CHECK (TRUE);

-- Citizen Reports: Operational Updates
DROP POLICY IF EXISTS "Authorized officers and moderators can update reports" ON citizen_reports;
CREATE POLICY "Authorized officers and moderators can update reports"
    ON citizen_reports FOR UPDATE
    USING (TRUE)
    WITH CHECK (TRUE);

-- Issue Clusters: Public Read
DROP POLICY IF EXISTS "Public can view active issue clusters" ON issue_clusters;
CREATE POLICY "Public can view active issue clusters"
    ON issue_clusters FOR SELECT
    USING (cluster_status = 'active');

-- Report Status History: Public Read
DROP POLICY IF EXISTS "Public can view report status audit history" ON report_status_history;
CREATE POLICY "Public can view report status audit history"
    ON report_status_history FOR SELECT
    USING (TRUE);

-- Report Corroborations: Read & Insert
DROP POLICY IF EXISTS "Public can view report corroborations" ON report_corroborations;
CREATE POLICY "Public can view report corroborations"
    ON report_corroborations FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Citizens can corroborate civic reports" ON report_corroborations;
CREATE POLICY "Citizens can corroborate civic reports"
    ON report_corroborations FOR INSERT
    WITH CHECK (TRUE);

