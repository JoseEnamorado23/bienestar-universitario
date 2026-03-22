from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, computed_field
from app.schemas.inventory import ItemResponse

class StudentMiniResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    document_id: str
    program_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class UserMiniResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    model_config = ConfigDict(from_attributes=True)

class LoanBase(BaseModel):
    item_id: int
    student_id: int

class LoanCreate(LoanBase):
    pass

# When an admin creates it directly, they only supply item & student_id (like LoanBase)
class LoanAdminCreate(LoanBase):
    pass

class LoanRejectRequest(BaseModel):
    reason: str

# When returning a Loan in the API
class LoanResponse(LoanBase):
    id: int
    issued_by_id: Optional[int]
    status: str
    rejection_reason: Optional[str] = None
    start_time: Optional[datetime]
    expected_return_time: Optional[datetime]
    returned_time: Optional[datetime]
    hours_earned: float
    created_at: datetime
    
    # Nested relations for frontend tables
    item: ItemResponse
    student: StudentMiniResponse
    issuer: Optional[UserMiniResponse] = None

    @computed_field
    @property
    def formatted_hours_earned(self) -> str:
        if self.hours_earned <= 0:
            return ""
        
        hours = int(self.hours_earned)
        minutes = int(round((self.hours_earned - hours) * 60))
        
        return f"{hours:02d}:{minutes:02d}"

    model_config = ConfigDict(from_attributes=True)

class LoanListResponse(BaseModel):
    items: List[LoanResponse]
    total: int
