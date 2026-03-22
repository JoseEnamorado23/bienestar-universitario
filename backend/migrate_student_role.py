"""
Script de migración: consolida el rol 'student' en 'estudiante'.
- Mueve todos los usuarios con rol 'student' al rol 'estudiante'
- Elimina el rol 'student' de la base de datos

Ejecutar una sola vez:
    cd backend
    venv\Scripts\python migrate_student_role.py
"""
import sys
import os

# Asegura que el directorio raíz esté en el path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.role import Role
from app.models.user import User


def migrate():
    db = SessionLocal()
    try:
        # 1. Buscar los dos roles
        role_student = db.query(Role).filter(Role.name == "student").first()
        role_estudiante = db.query(Role).filter(Role.name == "estudiante").first()

        if not role_student:
            print("✅ El rol 'student' no existe — nada que migrar.")
            return

        if not role_estudiante:
            print("❌ ERROR: El rol 'estudiante' no existe en la BD. Verifica el seed.")
            return

        print(f"🔍 Rol 'student'   → ID={role_student.id}")
        print(f"🔍 Rol 'estudiante' → ID={role_estudiante.id}")

        # 2. Contar usuarios con rol 'student'
        users_with_student = db.query(User).filter(User.role_id == role_student.id).all()
        count = len(users_with_student)
        print(f"\n👥 Usuarios con rol 'student': {count}")

        if count == 0:
            print("✅ No hay usuarios con rol 'student'.")
        else:
            for user in users_with_student:
                print(f"   → Migrando: {user.email} (ID={user.id})")
                user.role_id = role_estudiante.id
            db.flush()
            print(f"\n✅ {count} usuario(s) migrado(s) al rol 'estudiante'.")

        # 3. Eliminar rol 'student'
        db.delete(role_student)
        db.commit()
        print("✅ Rol 'student' eliminado de la base de datos.")
        print("\n🎉 Migración completada exitosamente.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error durante la migración: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
