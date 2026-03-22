import sys
import os
import random

# Ajustar path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.role import Role
from app.models.program import Program
from app.models.additional_hours import AdditionalHours
from app.core.constants import UserStatus

def seed_students():
    db = SessionLocal()
    try:
        # Buscar el rol de estudiante
        student_role = db.query(Role).filter(Role.name.ilike('%estudiante%')).first()
        if not student_role:
            print("No se encontró un rol de estudiante. Verifique los roles existentes.")
            return

        # Buscar programas disponibles
        programs = db.query(Program).all()
        if not programs:
            print("No hay programas registrados. No se puede asignar estudiantes.")
            return

        first_names = ["Mateo", "Valentina", "Sebastián", "Isabella", "Andrés", "Camila", "Nicolás", "Mariana", "Samuel", "Daniela", "Diego", "Lucía", "Gabriel", "Paula", "Felipe", "Elena", "Lucas", "Sara", "Julián", "Sofía"]
        last_names = ["García", "Martínez", "López", "González", "Rodríguez", "Pérez", "Sánchez", "Ramírez", "Cruz", "Gómez", "Torres", "Hernández", "Díaz", "Morales", "Vásquez", "Castro", "Jiménez", "Rojas", "Muñoz", "Silva"]

        for i in range(20):
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            email = f"estudiante_{i+100}@universidad.edu.co"
            
            # Verificar si ya existe
            if db.query(User).filter(User.email == email).first():
                continue
                
            user = User(
                email=email,
                password="hashed_password_here", # En un sistema real esto debería estar hasheado
                first_name=fname,
                last_name=lname,
                role_id=student_role.id,
                status=UserStatus.ACTIVE,
                is_verified=True
            )
            db.add(user)
            db.flush() # Para obtener el ID del usuario
            
            student = Student(
                user_id=user.id,
                national_id=f"109{random.randint(1000000, 9999999)}",
                program_id=random.choice(programs).id,
                social_hours_completed=round(random.uniform(0, 30), 2)
            )
            db.add(student)
            
        db.commit()
        print("Se agregaron 20 estudiantes de prueba exitosamente.")
    except Exception as e:
        print(f"Error seeding students: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_students()
