import sys
import os
import random
from sqlalchemy.orm import Session

# Ajustar path para importar desde app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.role import Role
from app.models.program import Program
from app.models.additional_hours import AdditionalHours
from app.core.constants import UserStatus
from app.core.security import get_password_hash

def seed_3_students():
    db = SessionLocal()
    try:
        # Buscar el rol de estudiante
        student_role = db.query(Role).filter(Role.name.ilike('%estudiante%')).first()
        if not student_role:
            print("No se encontró un rol de estudiante.")
            return

        # Buscar programas disponibles
        programs = db.query(Program).all()
        if not programs:
            print("No hay programas registrados.")
            return

        test_students = [
            {
                "fname": "Juan",
                "lname": "Pérez",
                "email": "juan.perez@universidad.edu.co",
                "phone": "3001234567",
                "id": "1001001001"
            },
            {
                "fname": "Maria",
                "lname": "García",
                "email": "maria.garcia@universidad.edu.co",
                "phone": "3119876543",
                "id": "1002002002"
            },
            {
                "fname": "Carlos",
                "lname": "Rodriguez",
                "email": "carlos.rod@universidad.edu.co",
                "phone": "3225556677",
                "id": "1003003003"
            }
        ]

        for s in test_students:
            # Verificar si ya existe
            if db.query(User).filter(User.email == s["email"]).first():
                print(f"Estudiante {s['email']} ya existe, saltando...")
                continue
                
            user = User(
                email=s["email"],
                password=get_password_hash("password123"),
                first_name=s["fname"],
                last_name=s["lname"],
                phone=s["phone"],
                role_id=student_role.id,
                status=UserStatus.ACTIVE,
                is_verified=True
            )
            db.add(user)
            db.flush()
            
            student = Student(
                user_id=user.id,
                national_id=s["id"],
                program_id=random.choice(programs).id,
                social_hours_completed=round(random.uniform(0, 10), 2)
            )
            db.add(student)
            
        db.commit()
        print("✅ Se agregaron 3 estudiantes de prueba exitosamente.")
    except Exception as e:
        print(f"❌ Error seeding students: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_3_students()
