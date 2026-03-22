import sys
import os
from pathlib import Path

# Fix path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.student import Student

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users: {len(users)}")
        for u in users:
            role_name = u.role.name if u.role else "No Role"
            student_info = f", Student ID: {u.student.national_id}" if u.student else ""
            print(f"ID: {u.id}, Email: {u.email}, Name: {u.first_name} {u.last_name}, Role: {role_name}{student_info}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
