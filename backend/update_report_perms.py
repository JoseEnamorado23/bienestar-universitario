from app.core.database import SessionLocal
from app.models.role import Role
from app.models.permission import Permission, RolePermission

db = SessionLocal()

try:
    print("Iniciando actualización de permisos de reportes...")

    # 1. Eliminar permiso antiguo si existe
    old_perm = db.query(Permission).filter(Permission.code == "report:generate").first()
    if old_perm:
        # Eliminar las relaciones en role_permissions primero
        db.query(RolePermission).filter(RolePermission.permission_id == old_perm.id).delete()
        db.delete(old_perm)
        db.commit()
        print("- Permiso 'report:generate' y sus relaciones eliminados.")

    # 2. Asegurar que los nuevos permisos existan
    new_perms_data = [
        {"code": "report:students", "desc": "Generar reportes de estudiantes"},
        {"code": "report:loans", "desc": "Generar reportes de préstamos"},
        {"code": "report:activities", "desc": "Generar reportes de actividades"}
    ]
    
    new_perms = []
    for pd in new_perms_data:
        perm = db.query(Permission).filter(Permission.code == pd["code"]).first()
        if not perm:
            perm = Permission(code=pd["code"], description=pd["desc"])
            db.add(perm)
            db.flush() # Para obtener ID
            print(f"- Permiso '{pd['code']}' creado.")
        new_perms.append(perm)
        
    db.commit()

    # 3. Asignar todos a super_admin y administrador_general
    target_roles = ["super_admin", "super_administrador", "administrador_general"]
    for role_name in target_roles:
        role = db.query(Role).filter(Role.name == role_name).first()
        if role:
            for perm in new_perms:
                exists = db.query(RolePermission).filter(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == perm.id
                ).first()
                if not exists:
                    rp = RolePermission(role_id=role.id, permission_id=perm.id)
                    db.add(rp)
            print(f"- Permisos asignados al rol '{role_name}'.")

    # 4. Asignar report:loans a administrador_prestamos
    role_loans = db.query(Role).filter(Role.name == "administrador_prestamos").first()
    perm_loans = db.query(Permission).filter(Permission.code == "report:loans").first()
    if role_loans and perm_loans:
        exists = db.query(RolePermission).filter(
            RolePermission.role_id == role_loans.id,
            RolePermission.permission_id == perm_loans.id
        ).first()
        if not exists:
            db.add(RolePermission(role_id=role_loans.id, permission_id=perm_loans.id))
            print("- Permiso 'report:loans' asignado a administrador_prestamos.")
            
    # 5. Asignar report:activities a administrador_actividades
    role_act = db.query(Role).filter(Role.name == "administrador_actividades").first()
    perm_act = db.query(Permission).filter(Permission.code == "report:activities").first()
    if role_act and perm_act:
        exists = db.query(RolePermission).filter(
            RolePermission.role_id == role_act.id,
            RolePermission.permission_id == perm_act.id
        ).first()
        if not exists:
            db.add(RolePermission(role_id=role_act.id, permission_id=perm_act.id))
            print("- Permiso 'report:activities' asignado a administrador_actividades.")

    db.commit()
    print("Actualización completada con éxito.")

except Exception as e:
    db.rollback()
    print(f"Error durante la actualización: {e}")
finally:
    db.close()
