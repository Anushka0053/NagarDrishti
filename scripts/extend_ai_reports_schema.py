import sys
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS report_number VARCHAR(50)"))
    conn.execute(text("ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS title VARCHAR(250)"))
    conn.execute(text("ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft'"))
    conn.execute(text("ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS approved_by VARCHAR(150)"))
    conn.execute(text("ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS structured_data JSONB DEFAULT '{}'::jsonb"))
    conn.commit()
    print("ai_reports schema extended with report_number, title, status, approved_by, structured_data.")

