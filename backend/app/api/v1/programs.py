from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import List, Optional

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_permissions
from app.models.program import Program
from app.models.student import Student
from app.models.user import User
from app.schemas.programs import ProgramCreate, ProgramUpdate, ProgramResponse, ProgramWithStudents
from app.services.audit_service import AuditService

router = APIRouter(prefix="", tags=["Programas"])

@router.get("/", response_model=List[ProgramResponse])
async def list_programs(
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """
    Lista programas académicos.
    Por defecto solo activos (para formulario de registro).
    Con include_inactive=true muestra todos (para gestión admin).
    """
    query = db.query(Program)
    if not include_inactive:
        query = query.filter(Program.is_active == True)
    programs = query.order_by(Program.name).all()
    return programs


@router.get("/with-stats", response_model=List[ProgramWithStudents])
async def list_programs_with_stats(
    include_inactive: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["user:read:all"]))
):
    """
    Lista todos los programas con conteo de estudiantes.
    Solo para administradores.
    """
    query = db.query(
        Program,
        sql_func.count(Student.id).label("student_count")
    ).outerjoin(Student, Student.program_id == Program.id)

    if not include_inactive:
        query = query.filter(Program.is_active == True)

    results = query.group_by(Program.id).order_by(Program.name).all()

    programs_with_stats = []
    for program, count in results:
        prog_dict = {
            "id": program.id,
            "name": program.name,
            "is_active": program.is_active,
            "created_at": program.created_at,
            "updated_at": program.updated_at,
            "student_count": count
        }
        programs_with_stats.append(prog_dict)

    return programs_with_stats


@router.post("/", response_model=ProgramResponse, status_code=201)
async def create_program(
    program_in: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["user:read:all"]))
):
    """
    Crear un nuevo programa académico.
    Solo administradores.
    """
    # Verificar que no exista con el mismo nombre
    existing = db.query(Program).filter(
        sql_func.lower(Program.name) == program_in.name.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un programa con ese nombre")

    program = Program(
        name=program_in.name.strip(),
        is_active=program_in.is_active
    )
    db.add(program)
    db.commit()
    db.refresh(program)

    AuditService.log_action(
        db, action="PROGRAM_CREATED", entity_type="program", entity_id=program.id,
        user_id=current_user.id,
        details={"name": program.name}
    )

    return program


@router.put("/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: int,
    program_in: ProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["user:read:all"]))
):
    """
    Actualizar un programa existente.
    Solo administradores.
    """
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Programa no encontrado")

    # Si se cambia el nombre, verificar unicidad
    if program_in.name is not None:
        existing = db.query(Program).filter(
            sql_func.lower(Program.name) == program_in.name.strip().lower(),
            Program.id != program_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otro programa con ese nombre")
        program.name = program_in.name.strip()

    if program_in.is_active is not None:
        program.is_active = program_in.is_active

    db.commit()
    db.refresh(program)

    AuditService.log_action(
        db, action="PROGRAM_UPDATED", entity_type="program", entity_id=program.id,
        user_id=current_user.id,
        details={"name": program.name, "is_active": program.is_active}
    )

    return program


@router.delete("/{program_id}", response_model=ProgramResponse)
async def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["user:read:all"]))
):
    """
    Eliminar un programa (soft delete: se marca como inactivo).
    Si tiene estudiantes asociados, solo se inhabilita.
    Solo administradores.
    """
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Programa no encontrado")

    # Check if program has students
    student_count = db.query(sql_func.count(Student.id)).filter(
        Student.program_id == program_id
    ).scalar()

    if student_count > 0:
        # Soft delete — just deactivate
        program.is_active = False
        db.commit()
        db.refresh(program)
        AuditService.log_action(
            db, action="PROGRAM_DEACTIVATED", entity_type="program", entity_id=program.id,
            user_id=current_user.id,
            details={"name": program.name, "reason": f"Tiene {student_count} estudiante(s) asociados"}
        )
    else:
        # Hard delete — no students
        db.delete(program)
        db.commit()
        AuditService.log_action(
            db, action="PROGRAM_DELETED", entity_type="program", entity_id=program.id,
            user_id=current_user.id,
            details={"name": program.name}
        )

    return program
