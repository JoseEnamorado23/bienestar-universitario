#!/usr/bin/env python
# scripts/seed.py

import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.constants import PERMISSIONS, ROLES
from app.core.security import get_password_hash
from app.models.role import Role
from app.models.permission import Permission, RolePermission
from app.models.user import User, UserPermission
from app.models.program import Program
from app.models.settings import SystemSetting, SocialHoursConfig
from app.core.constants import UserStatus

def seed_permissions(db):
    """Crear todos los permisos del sistema"""
    print("🌱 Creando permisos...")
    
    permissions_created = 0
    for code, description in PERMISSIONS.items():
        # Verificar si ya existe
        existing = db.query(Permission).filter(Permission.code == code).first()
        if not existing:
            permission = Permission(
                code=code,
                description=description
            )
            db.add(permission)
            permissions_created += 1
            print(f"  ✅ Permiso creado: {code}")
        else:
            print(f"  ⏩ Permiso ya existe: {code}")
    
    db.commit()
    print(f"✅ {permissions_created} permisos creados\n")
    return permissions_created

def seed_roles(db):
    """Crear todos los roles y asignarles sus permisos base"""
    print("🌱 Creando roles y asignando permisos...")
    
    # Obtener todos los permisos para referencia
    all_permissions = {p.code: p for p in db.query(Permission).all()}
    
    roles_created = 0
    for role_name, role_data in ROLES.items():
        # Verificar si el rol ya existe
        existing_role = db.query(Role).filter(Role.name == role_name).first()
        
        if not existing_role:
            role = Role(
                name=role_name,
                description=role_data["description"],
                is_system_role=True
            )
            db.add(role)
            db.flush()  # Para obtener el ID
            print(f"  ✅ Rol creado: {role_name}")
            roles_created += 1
        else:
            role = existing_role
            print(f"  ⏩ Rol ya existe: {role_name}")
        
        # Asignar permisos al rol
        permissions_assigned = 0
        for perm_code in role_data["permissions"]:
            if perm_code in all_permissions:
                # Verificar si ya tiene el permiso
                existing = db.query(RolePermission).filter(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == all_permissions[perm_code].id
                ).first()
                
                if not existing:
                    role_perm = RolePermission(
                        role_id=role.id,
                        permission_id=all_permissions[perm_code].id
                    )
                    db.add(role_perm)
                    permissions_assigned += 1
        
        if permissions_assigned > 0:
            print(f"     📌 {permissions_assigned} permisos asignados a {role_name}")
    
    db.commit()
    print(f"✅ {roles_created} roles creados\n")

def seed_super_admin(db):
    """Crear el usuario Super Admin inicial"""
    print("🌱 Creando Super Admin...")
    
    # Buscar el rol Super Admin
    super_admin_role = db.query(Role).filter(Role.name == "super_administrador").first()
    if not super_admin_role:
        print("❌ Error: No se encontró el rol Super Admin")
        return
    
    # Datos del Super Admin
    email = "admin@bienestar.edu.co"
    password = "admin123"  # Contraseña simple temporal
    
    # Verificar si ya existe
    existing_user = db.query(User).filter(User.email == email).first()
    if not existing_user:
        # Crear usuario
        user = User(
            email=email,
            password=get_password_hash(password),
            status=UserStatus.ACTIVE,
            role_id=super_admin_role.id
        )
        db.add(user)
        db.commit()
        print(f"  ✅ Super Admin creado: {email}")
        print(f"  🔐 Contraseña temporal: {password}")
        print(f"  ⚠️  ¡CAMBIA ESTA CONTRASEÑA EN PRODUCCIÓN!")
    else:
        print(f"  ⏩ Super Admin ya existe: {email}")
    
    print()

def seed_programs(db):
    """Crear programas académicos"""
    print("🌱 Creando programas académicos...")
    
    programs = [
        "Ingeniería de Sistemas",
        "Psicología",
        "Administración de Empresas",
        "Derecho",
        "Medicina",
        "Arquitectura",
        "Comunicación Social",
        "Ingeniería Civil",
        "Contaduría Pública",
        "Enfermería",
        "Ingeniería Industrial",
        "Economía",
        "Odontología",
        "Biología",
        "Química Farmacéutica"
    ]
    
    programs_created = 0
    for program_name in programs:
        existing = db.query(Program).filter(Program.name == program_name).first()
        if not existing:
            program = Program(
                name=program_name,
                is_active=True
            )
            db.add(program)
            programs_created += 1
            print(f"  ✅ Programa creado: {program_name}")
        else:
            print(f"  ⏩ Programa ya existe: {program_name}")
    
    db.commit()
    print(f"✅ {programs_created} programas creados\n")

def seed_settings(db):
    """Crear configuraciones del sistema"""
    print("🌱 Creando configuraciones del sistema...")
    
    settings = [
        {
            "key": "SOCIAL_HOURS_REQUIRED",
            "value": "120",
            "description": "Horas sociales requeridas para graduación",
            "is_public": True
        },
        {
            "key": "MAX_LOAN_DAYS",
            "value": "7",
            "description": "Máximo de días para préstamos",
            "is_public": True
        },
        {
            "key": "MAX_CONCURRENT_LOANS",
            "value": "3",
            "description": "Máximo de préstamos simultáneos por estudiante",
            "is_public": True
        },
        {
            "key": "MAINTENANCE_MODE",
            "value": "false",
            "description": "Modo mantenimiento del sistema",
            "is_public": False
        },
        {
            "key": "ALLOW_STUDENT_REGISTRATION",
            "value": "true",
            "description": "Permitir registro de estudiantes",
            "is_public": False
        },
        {
            "key": "MAX_LOGIN_ATTEMPTS",
            "value": "3",
            "description": "Intentos máximos de login antes de bloqueo",
            "is_public": False
        }
    ]
    
    settings_created = 0
    for setting_data in settings:
        existing = db.query(SystemSetting).filter(
            SystemSetting.key == setting_data["key"]
        ).first()
        
        if not existing:
            setting = SystemSetting(**setting_data)
            db.add(setting)
            settings_created += 1
            print(f"  ✅ Configuración creada: {setting_data['key']}")
        else:
            print(f"  ⏩ Configuración ya existe: {setting_data['key']}")
    
    db.commit()
    print(f"✅ {settings_created} configuraciones creadas\n")

def seed_social_hours_config(db):
    """Crear configuración inicial de horas sociales"""
    print("🌱 Creando configuración de horas sociales...")
    
    # Verificar si ya existe una configuración activa
    existing = db.query(SocialHoursConfig).filter(
        SocialHoursConfig.is_active == True
    ).first()
    
    if not existing:
        config = SocialHoursConfig(
            required_hours=120,
            description="Configuración inicial de horas sociales",
            is_active=True
        )
        db.add(config)
        db.commit()
        print(f"  ✅ Configuración de horas sociales creada: 120 horas")
    else:
        print(f"  ⏩ Configuración de horas sociales ya existe: {existing.required_hours} horas")
    
    print()

def verify_seed(db):
    """Verificar que todo se creó correctamente"""
    print("🔍 Verificando datos creados...")
    
    total_permissions = db.query(Permission).count()
    total_roles = db.query(Role).count()
    total_users = db.query(User).count()
    total_programs = db.query(Program).count()
    total_settings = db.query(SystemSetting).count()
    
    print(f"  📊 Permisos: {total_permissions}")
    print(f"  📊 Roles: {total_roles}")
    print(f"  📊 Usuarios: {total_users}")
    print(f"  📊 Programas: {total_programs}")
    print(f"  📊 Configuraciones: {total_settings}")
    
    # Verificar Super Admin
    super_admin = db.query(User).join(Role).filter(Role.name == "super_administrador").first()
    if super_admin:
        print(f"  ✅ Super Admin encontrado: {super_admin.email}")
    else:
        print(f"  ❌ No se encontró Super Admin")
    
    print()

def main():
    """Función principal"""
    print("=" * 50)
    print("🌱 INICIANDO SEMILLADO DE LA BASE DE DATOS")
    print("=" * 50)
    print()
    
    # Crear sesión de base de datos
    db = SessionLocal()
    
    try:
        # Ejecutar seeds en orden
        seed_permissions(db)
        seed_roles(db)
        seed_super_admin(db)
        seed_programs(db)
        seed_settings(db)
        seed_social_hours_config(db)
        verify_seed(db)
        
        print("=" * 50)
        print("✅ ¡SEMILLADO COMPLETADO EXITOSAMENTE!")
        print("=" * 50)
        print()
        print("📝 Resumen:")
        print("  - Sistema de permisos listo")
        print("  - Roles configurados")
        print(f"  - Super Admin: admin@bienestar.edu.co / Admin123!")
        print("  - Programas académicos creados")
        print("  - Configuraciones del sistema establecidas")
        print()
        print("⚠️  IMPORTANTE:")
        print("  - Cambia la contraseña del Super Admin en producción")
        print("  - Revisa las configuraciones en system_settings")
        print()
        
    except Exception as e:
        print(f"❌ Error durante el semillado: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()