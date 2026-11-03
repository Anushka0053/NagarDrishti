import sys
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        CREATE OR REPLACE FUNCTION enforce_append_only()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_TABLE_NAME = 'report_status_history' THEN
                IF EXISTS (SELECT 1 FROM citizen_reports WHERE id = OLD.report_id AND is_demo = TRUE) THEN
                    RETURN OLD;
                END IF;
            END IF;
            RAISE EXCEPTION 'Audit records are strictly append-only and cannot be modified or deleted.';
        END;
        $$ LANGUAGE plpgsql;
    """))
    conn.commit()
    print("Updated enforce_append_only() trigger to allow clean demo teardown safely.")

