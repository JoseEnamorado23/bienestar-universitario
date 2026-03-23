from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.permission import Permission
from app.models.role import Role, RolePermission

def check_permissions():
    db = SessionLocal()
    try:
        print("--- Permisos en la DB ---")
        perms = db.query(Permission).all()
        for p in perms:
            print(f"- {p.code}: {p.name}")
        
        print("\n--- Roles y sus permisos ---")
        roles = db.query(Role).all()
        for r in roles:
            rp_codes = [rp.permission.code for rp in r.role_permissions]
            print(f"Role: {r.name}")
            print(f"  Permissions: {', '.join(rp_codes)}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_permissions()
