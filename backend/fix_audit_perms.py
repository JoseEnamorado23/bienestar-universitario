from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.permission import Permission, RolePermission
from app.models.role import Role

def sync_audit_permission():
    db = SessionLocal()
    try:
        # 1. Asegurar que el permiso existe (con guión bajo)
        perm_code = "system:audit_logs"
        perm = db.query(Permission).filter(Permission.code == perm_code).first()
        
        if not perm:
            print(f"Creando permiso faltante: {perm_code}")
            perm = Permission(code=perm_code, description="Ver logs de auditoría")
            db.add(perm)
            db.flush()
        else:
            print(f"El permiso {perm_code} ya existe.")

        # 2. Asignar a Super Administrador y Administrador General
        roles_to_assign = ["super_administrador", "administrador_general"]
        for role_name in roles_to_assign:
            role = db.query(Role).filter(Role.name == role_name).first()
            if role:
                # Verificar si ya lo tiene
                has_perm = db.query(RolePermission).filter(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == perm.id
                ).first()
                
                if not has_perm:
                    print(f"Asignando {perm_code} al rol {role_name}")
                    rp = RolePermission(role_id=role.id, permission_id=perm.id)
                    db.add(rp)
                else:
                    print(f"El rol {role_name} ya tiene el permiso {perm_code}.")
            else:
                print(f"ADVERTENCIA: Rol {role_name} no encontrado.")

        db.commit()
        print("Sincronización completada exitosamente.")
            
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_audit_permission()
