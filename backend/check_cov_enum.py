from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text("SELECT enum_range(NULL::coverage_status_type)")).scalar()
print("coverage_status_type enum values:", res)
db.close()
