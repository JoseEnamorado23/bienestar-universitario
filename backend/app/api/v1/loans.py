from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user, require_permissions, require_any_permissions
from app.models.user import User
from app.models.student import Student
from app.schemas.loan import LoanResponse, LoanCreate, LoanAdminCreate, LoanRejectRequest, LoanListResponse
from app.services.loan_service import LoanService
from app.core.websockets import manager

router = APIRouter()

@router.get("/", response_model=LoanListResponse)
def get_all_loans(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    time_filter: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["loan:read:all"]))
) -> Any:
    """Obtener todos los préstamos con paginación y filtros."""
    result = LoanService.get_loans(
        db, 
        skip=skip, 
        limit=limit, 
        status_filter=status,
        search=search,
        program_id=program_id,
        time_filter=time_filter,
        sort_by=sort_by,
        order=order
    )
    return result

@router.post("/direct", response_model=LoanResponse)
def create_loan_direct(
    *,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks,
    loan_in: dict,
    current_user: User = Depends(require_permissions(["loan:create"]))
) -> Any:
    """Admin crea un préstamo directamente."""
    loan = LoanService.create_loan_direct(
        db=db, 
        admin_id=current_user.id, 
        student_doc=loan_in["student_document"], 
        item_id=loan_in["item_id"]
    )
    background_tasks.add_task(manager.broadcast, {"type": "loan_created", "loan_id": loan.id})
    return loan

@router.put("/{loan_id}/approve", response_model=LoanResponse)
def approve_loan(
    *,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks,
    loan_id: int,
    current_user: User = Depends(require_permissions(["loan:approve"]))
) -> Any:
    """Aprobar una solicitud de préstamo."""
    loan = LoanService.approve_loan(db=db, loan_id=loan_id, admin_id=current_user.id)
    background_tasks.add_task(manager.broadcast, {"type": "loan_updated", "loan_id": loan.id, "status": loan.status})
    return loan

@router.put("/{loan_id}/return", response_model=LoanResponse)
def return_loan(
    *,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks,
    loan_id: int,
    current_user: User = Depends(require_permissions(["loan:return"]))
) -> Any:
    """Registrar devolución y calcular horas."""
    loan = LoanService.return_loan(db=db, loan_id=loan_id)
    background_tasks.add_task(manager.broadcast, {"type": "loan_updated", "loan_id": loan.id, "status": loan.status})
    return loan

@router.get("/my-loans", response_model=List[LoanResponse])
def get_my_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permissions(["loan:read:own", "loan:read:all"]))
) -> Any:
    """Estudiante obtiene sus propios préstamos."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado.")
    loans = LoanService.get_student_loans(db, student_id=student.id)
    return loans

@router.post("/request", response_model=LoanResponse)
def request_loan(
    *,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks,
    loan_in: LoanCreate,
    current_user: User = Depends(require_any_permissions(["loan:create", "loan:read:own"]))
) -> Any:
    """Estudiante solicita un préstamo."""
    # ...
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student:
        effective_student_id = student.id
    else:
        effective_student_id = loan_in.student_id
        
    loan = LoanService.request_loan(db=db, student_id=effective_student_id, item_id=loan_in.item_id)
    background_tasks.add_task(manager.broadcast, {"type": "loan_created", "loan_id": loan.id})
    return loan

@router.put("/{loan_id}/reject", response_model=LoanResponse)
def reject_loan(
    *,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks,
    loan_id: int,
    req: LoanRejectRequest,
    current_user: User = Depends(require_permissions(["loan:approve"]))
) -> Any:
    """Rechazar una solicitud de préstamo."""
    loan = LoanService.reject_loan(db=db, loan_id=loan_id, admin_id=current_user.id, reason=req.reason)
    background_tasks.add_task(manager.broadcast, {"type": "loan_updated", "loan_id": loan.id, "status": loan.status})
    return loan
