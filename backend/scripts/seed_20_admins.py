import sys
import os
import random

# Ajustar path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User, UserPermission
from app.models.role import Role
from app.models.student import Student
from app.models.session import Session
from app.models.audit import AuditLog
from app.models.token import AuthToken
from app.models.permission import Permission, RolePermission
from app.models.additional_hours import AdditionalHours
from app.core.constants import UserStatus
from app.core.security import get_password_hash

def seed_admins():
    db = SessionLocal()
    try:
        # Buscar roles administrativos (excluir 'estudiante')
        admin_roles = db.query(Role).filter(Role.name != 'estudiante').all()
        if not admin_roles:
            print("No se encontraron roles administrativos.")
            return

        first_names = ["Carlos", "Marta", "Ricardo", "Adriana", "Luis", "Beatriz", "Jorge", "Patricia", "Fernando", "Clara", "Mario", "Teresa", "Enrique", "Rosa", "Hugo", "Isabel", "Oscar", "Carmen", "Raúl", "Silvia"]
        last_names = ["Morales", "Castillo", "Vargas", "Mendoza", "Ortega", "Flores", "Ríos", "Aguilar", "Soto", "Navarro", "Guerrero", "Pereda", "Hidalgo", "Reyes", "Fuentes", "Guzmán", "Méndez", "Palacios", "Cortez", "Salazar"]

        for i in range(20):
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            email = f"admin_{i+100}@universidad.edu.co"
            
            # Verificar si ya existe
            if db.query(User).filter(User.email == email).first():
                continue
                
            role = random.choice(admin_roles)
            
            user = User(
                email=email,
                password=get_password_hash("admin123"), # Contraseña por defecto
                first_name=fname,
                last_name=lname,
                national_id=f"202{random.randint(1000000, 9999999)}",
                role_id=role.id,
                status=UserStatus.ACTIVE,
                is_verified=True
            )
            db.add(user)
            
        db.commit()
        print("Se agregaron 20 administradores de prueba exitosamente.")
    except Exception as e:
        print(f"Error seeding admins: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admins()
