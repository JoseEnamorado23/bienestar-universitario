from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.program import Program
from app.schemas.programs import ProgramResponse

router = APIRouter(prefix="", tags=["Programas"])

@router.get("/", response_model=List[ProgramResponse])
async def list_programs(db: Session = Depends(get_db)):
    """
    Lista todos los programas académicos activos.
    Ruta pública para el formulario de registro.
    """
    programs = db.query(Program).filter(Program.is_active == True).order_by(Program.name).all()
    return programs
