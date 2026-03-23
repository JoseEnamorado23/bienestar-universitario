from app.core.database import SessionLocal
from app.models.role import Role
from app.models.permission import Permission, RolePermission

db = SessionLocal()
try:
    # Intenta primero con 'super_admin' (nombre técnico)
    role = db.query(Role).filter(Role.name == "super_admin").first()
    # Si no, intenta con 'super_administrador' (nombre que veo en constantes del frontend)
    if not role:
        role = db.query(Role).filter(Role.name == "super_administrador").first()
        
    perm = db.query(Permission).filter(Permission.code == "report:generate").first()
    
    if role and perm:
        exists = db.query(RolePermission).filter(
            RolePermission.role_id == role.id,
            RolePermission.permission_id == perm.id
        ).first()
        
        if not exists:
            rp = RolePermission(role_id=role.id, permission_id=perm.id)
            db.add(rp)
            db.commit()
            print(f"Permiso {perm.code} asignado al rol {role.name}")
        else:
            print(f"El rol {role.name} ya tiene el permiso {perm.code}")
    else:
        print(f"Error: Rol ({role}) o Permiso ({perm}) no encontrado")
finally:
    db.close()
