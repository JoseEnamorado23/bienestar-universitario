import sys
import os
from pathlib import Path

# Fix path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.core.security import verify_password

def check_passwords():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "estudiante1@test.com").first()
        if not user:
            print("Student not found")
            return
        
        passwords_to_try = [
            "admin123",
            "Admin123!",
            "1234567890",
            "password",
            "estudiante123",
            "bienestar123"
        ]
        
        for p in passwords_to_try:
            if verify_password(p, user.password):
                print(f"✅ Found password: {p}")
                return
        
        print("❌ None of the common passwords worked.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_passwords()
