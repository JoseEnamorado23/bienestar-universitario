import sys
import os

# Añadir el backend al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.permission import Permission, RolePermission
from app.models.role import Role

def seed_permissions():
    db = SessionLocal()
    try:
        # Check if permission exists
        perm = db.query(Permission).filter(Permission.code == "report:generate").first()
        if not perm:
            perm = Permission(code="report:generate", description="Generar y descargar reportes del sistema")
            db.add(perm)
            db.commit()
            db.refresh(perm)
            print("Permiso report:generate creado.")
        else:
            print("Permiso report:generate ya existe.")
            
        # Add to super admin
        super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
        if super_admin_role:
            rp = db.query(RolePermission).filter(
                RolePermission.role_id == super_admin_role.id,
                RolePermission.permission_id == perm.id
            ).first()
            if not rp:
                rp = RolePermission(role_id=super_admin_role.id, permission_id=perm.id)
                db.add(rp)
                db.commit()
                print("Permiso asignado a super_admin.")
            else:
                print("super_admin ya tiene el permiso.")
                
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_permissions()
