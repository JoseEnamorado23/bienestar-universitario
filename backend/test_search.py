import sys
from app.core.database import SessionLocal
from app.services.admin_service import AdminService

db = SessionLocal()
try:
    service = AdminService(db)
    students = service.get_students(0, 100, "123456789")
    print(f"Found {len(students)} students")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
