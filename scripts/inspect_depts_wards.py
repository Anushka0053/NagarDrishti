import sys
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    depts = conn.execute(text("SELECT id, name_en, code FROM departments")).fetchall()
    print("Departments in DB:")
    for d in depts:
        print(f"  {d[0]} | {d[1]} | {d[2]}")

    wards = conn.execute(text("SELECT id, city_id, ward_number, name_en FROM wards LIMIT 10")).fetchall()
    print("\nWards in DB:")
    for w in wards:
        print(f"  {w[0]} | city={w[1]} | ward_no={w[2]} | {w[3]}")

