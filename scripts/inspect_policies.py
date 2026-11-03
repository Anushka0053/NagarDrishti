import sys
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    policies = conn.execute(text("""
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    """)).mappings().fetchall()
    print("Database RLS policies:")
    for p in policies:
        print(f"  [{p['tablename']}] {p['policyname']} ({p['cmd']})")
        print(f"     qual: {p['qual']}")
        print(f"     with_check: {p['with_check']}")

