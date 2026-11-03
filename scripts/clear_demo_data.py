"""
NagarDrishti — Demonstration Data Teardown Script
Safely removes seeded demonstration records without affecting any authentic citizen complaints.
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.core.database import engine

def clear_demo_data():
    with engine.connect() as conn:
        print("=" * 65)
        print("NAGARDRISHTI — TEARDOWN DEMONSTRATION DATA")
        print("=" * 65)

        # Count demo records before deleting
        demo_count = conn.execute(text("SELECT count(*) FROM citizen_reports WHERE is_demo = TRUE;")).scalar()
        print(f"Found {demo_count} demonstration reports in the database.")

        if demo_count == 0:
            print("No demonstration data found. Database is clean.")
            return

        # Delete dependent status history
        conn.execute(text("""
            DELETE FROM report_status_history 
            WHERE report_id IN (SELECT id FROM citizen_reports WHERE is_demo = TRUE);
        """))

        # Delete demo citizen reports
        conn.execute(text("DELETE FROM citizen_reports WHERE is_demo = TRUE;"))
        conn.commit()

        print(f"✓ Successfully deleted {demo_count} demo records and their associated audit history.")
        print("✓ Zero production or real citizen complaints were modified.")

if __name__ == "__main__":
    clear_demo_data()
