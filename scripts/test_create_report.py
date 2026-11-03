import sys
sys.path.insert(0, 'backend')
from uuid import UUID
from app.core.database import SessionLocal
from app.schemas.feedback import CitizenReportCreate
from app.services.feedback_service import FeedbackService

db = SessionLocal()
try:
    report_in = CitizenReportCreate(
        city_id=UUID('c0000000-0000-0000-0000-000000000001'),
        category='road_pothole',
        title='Deep pothole test',
        description='Test pothole on main road near Phoolbagh',
        latitude=26.2205,
        longitude=78.1750,
        severity_input='high',
        input_language='en'
    )
    rep = FeedbackService.create_report(db, report_in)
    print(f"Created report: id={rep.id}, number={rep.report_number}, status={rep.status}")
except Exception as e:
    print(f"Error creating report: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

