import sys
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_citizen_reports_is_demo ON citizen_reports(is_demo)"))
    conn.commit()
    print("Column is_demo checked/added successfully to citizen_reports.")

