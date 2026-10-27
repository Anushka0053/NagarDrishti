from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
for col in ["data_coverage.provenance_type", "gis_layers.default_provenance", "gis_features.provenance_type"]:
    table, column = col.split(".")
    res = db.execute(text(f"SELECT data_type, udt_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'")).fetchone()
    print(f"{col}: data_type={res[0]}, udt_name={res[1]}")
db.close()
