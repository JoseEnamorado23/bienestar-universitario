from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_datetime: Optional[datetime] = None
    hours_reward: float = 1.0
    qr_type: str = "MANUAL"          # STATIC | DYNAMIC | MANUAL
    qr_static_expiry: Optional[datetime] = None  # Solo para STATIC
    require_location: bool = False
    image_url: Optional[str] = None
    status: str = "DRAFT"            # DRAFT | PUBLISHED | FINISHED


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    event_datetime: Optional[datetime] = None
    hours_reward: Optional[float] = None
    qr_type: Optional[str] = None
    qr_static_expiry: Optional[datetime] = None
    require_location: Optional[bool] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class ActivityCreatorResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    model_config = ConfigDict(from_attributes=True)


# Respuesta pública (para estudiantes) — sin qr_token
class ActivityPublicResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_datetime: Optional[datetime] = None
    hours_reward: float
    qr_type: str
    require_location: bool
    image_url: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    created_by: Optional[ActivityCreatorResponse] = None
    model_config = ConfigDict(from_attributes=True)


# Respuesta admin — incluye qr_token y expiración
class ActivityAdminResponse(ActivityPublicResponse):
    qr_token: Optional[str] = None
    qr_token_expires_at: Optional[datetime] = None
    attendance_count: int = 0


class AttendRequest(BaseModel):
    token: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AttendanceStudentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    document_id: str
    model_config = ConfigDict(from_attributes=True)


class AttendanceResponse(BaseModel):
    id: int
    activity_id: int
    student_id: int
    hours_earned: float
    scan_latitude: Optional[float] = None
    scan_longitude: Optional[float] = None
    scanned_at: datetime
    student: Optional[AttendanceStudentResponse] = None
    model_config = ConfigDict(from_attributes=True)


class QRRotateResponse(BaseModel):
    qr_token: str
    qr_token_expires_at: Optional[datetime] = None
