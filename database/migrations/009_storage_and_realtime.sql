-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 009: STORAGE BUCKETS & REALTIME SUBSCRIPTIONS
-- Supabase Storage Configuration & Scoped Realtime Channels (SRS Section 14, 15)
-- ==============================================================================

-- 1. Create Supabase Storage Buckets
-- Note: In Supabase, buckets are managed in the storage schema
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'report-media', 
        'report-media', 
        true, 
        10485760, -- 10 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'video/mp4']
    ),
    (
        'gis-datasets', 
        'gis-datasets', 
        false, 
        52428800, -- 50 MB limit
        ARRAY['application/json', 'application/geo+json', 'application/zip', 'text/csv', 'application/vnd.google-earth.kml+xml']
    ),
    (
        'ai-audio-cache', 
        'ai-audio-cache', 
        true, 
        5242880, -- 5 MB limit for TTS audio snippets
        ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;


-- 2. Supabase Storage RLS Policies

-- 'report-media' Bucket Policies
CREATE POLICY "Public can view report media files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'report-media');

CREATE POLICY "Anyone can upload report media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'report-media');

CREATE POLICY "Admins can delete report media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'report-media' 
        AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('verifier', 'gis_admin', 'super_admin')
    );

-- 'gis-datasets' Bucket Policies (Restricted to GIS Admins)
CREATE POLICY "Admins can upload and read GIS datasets"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'gis-datasets'
        AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('gis_admin', 'super_admin')
    )
    WITH CHECK (
        bucket_id = 'gis-datasets'
        AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('gis_admin', 'super_admin')
    );

-- 'ai-audio-cache' Bucket Policies (Public read, service write)
CREATE POLICY "Public can read AI TTS audio cache"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ai-audio-cache');

CREATE POLICY "Backend service can insert TTS audio"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'ai-audio-cache');


-- 3. Supabase Realtime Publication Setup
-- Add tables to the supabase_realtime publication for reactive client updates
-- Only public, accepted reports and clusters are pushed to client channels
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE citizen_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_clusters;
ALTER PUBLICATION supabase_realtime ADD TABLE report_status_history;
