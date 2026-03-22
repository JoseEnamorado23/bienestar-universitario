import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.api.v1.admin import list_students
from app.models.user import User

async def main():
    db = SessionLocal()
    # Mock current_user (just needs some permissions for the dependency check, but list_students doesn't use it directly inside the function body aside from DB query)
    # the function definition: async def list_students(skip: int = Query(0, ge=0), limit... current_user... db)
    # The actual business logic:
    # service = AdminService(db)
    # students = service.get_students(skip, limit, search)
    
    # Let's just run what's in list_students manually
    from app.services.admin_service import AdminService
    from app.models.settings import SystemSetting
    
    service = AdminService(db)
    students = service.get_students(0, 100, None)
    
    # Get required hours setting once
    setting = db.query(SystemSetting).filter(SystemSetting.key == "HORAS_SOCIALES_REQUERIDAS").first()
    required_hours = 120
    if setting and setting.value.isdigit():
        required_hours = int(setting.value)
    
    print("REQUIRED HOURS SCALAR:", required_hours)
    
    for user in students:
        student_data = user.student
        print({
            "email": user.email,
            "social_hours_completed": student_data.social_hours_completed if student_data else 0,
            "social_hours_required": required_hours
        })

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
